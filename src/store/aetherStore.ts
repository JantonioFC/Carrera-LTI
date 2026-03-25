import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { findSimilarNotes, generateEmbedding } from "../utils/embeddings";
import { idbStorage } from "../utils/idbStorage";
import { logger } from "../utils/logger";

export type AetherNoteId = `note_${string}`;
export type ChatMessageId = `msg_${string}`;

export interface AetherNote {
	id: AetherNoteId;
	title: string;
	content: string;
	createdAt: number;
	updatedAt: number;
	tags: string[];
	embedding?: number[];
}

export interface GraphLink {
	source: AetherNoteId;
	target: AetherNoteId;
}

export interface GraphData {
	nodes: { id: AetherNoteId; name: string; val: number }[];
	links: GraphLink[];
}

export interface ChatMessage {
	id: ChatMessageId;
	role: "user" | "model";
	text: string;
	timestamp: number;
}

interface AetherState {
	notes: AetherNote[];
	geminiApiKey: string;
	gmailClientId: string;
	gmailApiKey: string;
	chatHistory: ChatMessage[];
}

interface AetherActions {
	addNote: (title?: string) => AetherNote;
	updateNote: (id: AetherNoteId, updates: Partial<AetherNote>) => void;
	deleteNote: (id: AetherNoteId) => void;
	getNote: (id: AetherNoteId) => AetherNote | undefined;
	getGraphData: () => GraphData;
	findBacklinks: (nodeId: AetherNoteId) => AetherNote[];
	setGeminiApiKey: (key: string) => void;
	setGmailClientId: (id: string) => void;
	setGmailApiKey: (key: string) => void;
	ingestNote: (id: AetherNoteId) => Promise<void>;
	semanticSearch: (query: string, limit?: number) => Promise<AetherNote[]>;
	addChatMessage: (
		msg: Omit<ChatMessage, "id" | "timestamp"> | ChatMessage,
	) => ChatMessageId;
	appendChatMessage: (id: ChatMessageId, textChunk: string) => void;
	clearChatHistory: () => void;
	importNotes: (json: string) => void;
}

const extractLinks = (text: string): string[] => {
	const links = Array.from(text.matchAll(/\[\[(.*?)\]\]/g), (match) =>
		match[1]?.trim(),
	).filter(Boolean);
	return [...new Set(links)];
};

export const useAetherStore = create<AetherState & AetherActions>()(
	persist(
		immer((set, get) => {
			// Empty notes by default for new users
			const defaultNotes: AetherNote[] = [];

			return {
				notes: defaultNotes,
				geminiApiKey: "",
				gmailClientId: "",
				gmailApiKey: "",
				chatHistory: [],

				addNote: (title = "Nueva Nota") => {
					const newNote: AetherNote = {
						id: `note_${uuidv4()}` as AetherNoteId,
						title,
						content: "",
						createdAt: Date.now(),
						updatedAt: Date.now(),
						tags: [],
					};
					set((state) => {
						state.notes.unshift(newNote);
					});
					return newNote;
				},

				updateNote: (id, updates) => {
					set((state) => {
						const note = state.notes.find((n) => n.id === id);
						if (note) {
							Object.assign(note, updates);
							note.updatedAt = Date.now();
						}
					});
				},

				deleteNote: (id) => {
					set((state) => {
						state.notes = state.notes.filter((note) => note.id !== id);
					});
				},

				getNote: (id) => {
					return get().notes.find((n) => n.id === id);
				},

				getGraphData: () => {
					const { notes } = get();
					const nodes = notes.map((n) => ({ id: n.id, name: n.title, val: 1 }));
					// O(n) index: title → id para evitar notes.find() dentro del bucle (#67)
					const titleMap = new Map(
						notes.map((n) => [n.title.toLowerCase(), n.id]),
					);
					const links: GraphLink[] = [];

					for (const note of notes) {
						for (const targetTitle of extractLinks(note.content)) {
							const targetId = titleMap.get(targetTitle.toLowerCase());
							if (targetId) links.push({ source: note.id, target: targetId });
						}
					}

					return { nodes, links };
				},

				findBacklinks: (nodeId) => {
					const { notes, getNote } = get();
					const currentNote = getNote(nodeId);
					if (!currentNote) return [];

					const titleLower = currentNote.title.toLowerCase();
					return notes.filter((n) => {
						if (n.id === nodeId) return false;
						return extractLinks(n.content).some(
							(ref) => ref.toLowerCase() === titleLower,
						);
					});
				},

				setGeminiApiKey: (key) => {
					set((state) => {
						state.geminiApiKey = key;
					});
					window.cortexAPI?.config.set("gemini_api_key", key);
				},
				setGmailClientId: (id) => {
					set((state) => {
						state.gmailClientId = id;
					});
					window.cortexAPI?.config.set("gmail_client_id", id);
				},
				setGmailApiKey: (key) => {
					set((state) => {
						state.gmailApiKey = key;
					});
					window.cortexAPI?.config.set("gmail_api_key", key);
				},

				ingestNote: async (id) => {
					const { notes, geminiApiKey } = get();
					const note = notes.find((n) => n.id === id);
					if (!note || !geminiApiKey) return;

					const textToEmbed = `${note.title}\n\n${note.content}`;
					const embedding = await generateEmbedding(geminiApiKey, textToEmbed);

					if (embedding) {
						set((state) => {
							const n = state.notes.find((n) => n.id === id);
							if (n) {
								n.embedding = embedding;
								n.updatedAt = Date.now();
							}
						});
					}
				},

				semanticSearch: async (query, limit = 3) => {
					const { notes, geminiApiKey } = get();
					if (!geminiApiKey || !query) return [];

					const queryVector = await generateEmbedding(geminiApiKey, query);
					if (!queryVector) return [];

					return findSimilarNotes(queryVector, notes, limit);
				},

				addChatMessage: (msg) => {
					const fullMsg: ChatMessage =
						"id" in msg
							? (msg as ChatMessage)
							: {
									...msg,
									id: `msg_${uuidv4()}` as ChatMessageId,
									timestamp: Date.now(),
								};
					set((state) => {
						state.chatHistory.push(fullMsg);
					});
					return fullMsg.id;
				},

				appendChatMessage: (id, textChunk) => {
					set((state) => {
						const msg = state.chatHistory.find((m) => m.id === id);
						if (msg) {
							msg.text += textChunk;
						}
					});
				},

				clearChatHistory: () => {
					set((state) => {
						state.chatHistory = [];
					});
				},

				importNotes: (json: string) => {
					try {
						const data = JSON.parse(json);
						const importedNotes = Array.isArray(data) ? data : data.notes;

						if (!Array.isArray(importedNotes)) return;

						set((state) => {
							importedNotes.forEach((newNote: any) => {
								if (!newNote.id || !newNote.title) return;
								const exists = state.notes.find((n) => n.id === newNote.id);
								if (!exists) {
									state.notes.push(newNote);
								} else {
									Object.assign(exists, newNote);
								}
							});
						});
					} catch (e) {
						logger.error("AetherStore", "Failed to import notes", e);
					}
				},
			};
		}),
		{
			name: "aether-storage",
			storage: createJSONStorage(() => idbStorage),
			// API keys no se persisten en IDB — van al OS Keychain vía cortexAPI (#109)
			partialize: (state) => ({
				notes: state.notes,
				chatHistory: state.chatHistory,
			}),
			onRehydrateStorage: () => async () => {
				const api = window.cortexAPI;
				if (!api) return;
				const [geminiKey, gmailId, gmailKey] = await Promise.all([
					api.config.get("gemini_api_key"),
					api.config.get("gmail_client_id"),
					api.config.get("gmail_api_key"),
				]);
				useAetherStore.setState({
					geminiApiKey: geminiKey ?? "",
					gmailClientId: gmailId ?? "",
					gmailApiKey: gmailKey ?? "",
				});
			},
		},
	),
);

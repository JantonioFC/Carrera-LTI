import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { idbStorage } from "../utils/idbStorage";

export type AetherNoteId = `note_${string}`;
export type ChatMessageId = `msg_${string}`;

export interface AetherNote {
	id: AetherNoteId;
	title: string;
	content: string;
	createdAt: number;
	updatedAt: number;
	tags: string[];
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
	addChatMessage: (
		msg: Omit<ChatMessage, "id" | "timestamp"> | ChatMessage,
	) => ChatMessageId;
	appendChatMessage: (id: ChatMessageId, textChunk: string) => void;
	clearChatHistory: () => void;
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
					const links: GraphLink[] = [];

					notes.forEach((note) => {
						const referencedTitles = extractLinks(note.content);
						referencedTitles.forEach((targetTitle) => {
							const targetNote = notes.find(
								(n) => n.title.toLowerCase() === targetTitle.toLowerCase(),
							);
							if (targetNote) {
								links.push({ source: note.id, target: targetNote.id });
							}
						});
					});

					return { nodes, links };
				},

				findBacklinks: (nodeId) => {
					const { notes, getNote } = get();
					const currentNote = getNote(nodeId);
					if (!currentNote) return [];

					return notes.filter((n) => {
						if (n.id === nodeId) return false;
						const refs = extractLinks(n.content);
						return refs.some(
							(ref) => ref.toLowerCase() === currentNote.title.toLowerCase(),
						);
					});
				},

				setGeminiApiKey: (key) => {
					set((state) => {
						state.geminiApiKey = key;
					});
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
			};
		}),
		{
			name: "aether-storage",
			storage: createJSONStorage(() => idbStorage),
		},
	),
);

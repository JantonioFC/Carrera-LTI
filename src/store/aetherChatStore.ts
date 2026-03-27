// AR-04 (#269): Chat extraído de aetherStore para reducir las responsabilidades
// del God Store. aetherStore conserva: notas, embeddings, grafo, backlinks, import.
// Este store maneja exclusivamente el historial de conversación con Aether AI.
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChatMessageId } from "../utils/schemas";

export type { ChatMessageId };

export interface ChatMessage {
	id: ChatMessageId;
	role: "user" | "model";
	text: string;
	timestamp: number;
}

interface AetherChatState {
	chatHistory: ChatMessage[];
}

interface AetherChatActions {
	addChatMessage: (
		msg: Omit<ChatMessage, "id" | "timestamp"> | ChatMessage,
	) => ChatMessageId;
	appendChatMessage: (id: ChatMessageId, textChunk: string) => void;
	clearChatHistory: () => void;
}

export const useAetherChatStore = create<AetherChatState & AetherChatActions>()(
	immer((set) => ({
		chatHistory: [],

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
	})),
);

import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";
import { logger } from "./logger";
import { deobfuscate, obfuscate } from "./security";

export const idbStorage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		const rawVal = await get(name);
		let val = await deobfuscate(rawVal);

		// Auto-migration from legacy synchronous storage for Aether
		if (!val && name === "aether-storage") {
			const oldVault = localStorage.getItem("lti_aether_vault");
			const oldChat = localStorage.getItem("lti_aether_chat");
			const oldKey = sessionStorage.getItem("lti_gemini_api_key");

			if (oldVault || oldChat || oldKey) {
				try {
					const migratedState = {
						state: {
							notes: oldVault ? JSON.parse(oldVault) : [],
							geminiApiKey: oldKey || "",
							chatHistory: oldChat ? JSON.parse(oldChat) : [],
						},
						version: 0,
					};
					val = JSON.stringify(migratedState);
					// Clean up legacy keys
					localStorage.removeItem("lti_aether_vault");
					localStorage.removeItem("lti_aether_chat");
				} catch (e) {
					logger.error("idbStorage", "Failed to migrate legacy Aether data", e);
				}
			}
		}

		return val || null;
	},
	setItem: async (name: string, value: string): Promise<void> => {
		const obfuscatedValue = await obfuscate(value);
		await set(name, obfuscatedValue);
	},
	removeItem: async (name: string): Promise<void> => {
		await del(name);
	},
};

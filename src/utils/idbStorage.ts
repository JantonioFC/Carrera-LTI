import { get, set, del } from "idb-keyval";
import { StateStorage } from "zustand/middleware";

export const idbStorage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		let val = await get(name);
		
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
						version: 0
					};
					val = JSON.stringify(migratedState);
					// Clean up legacy keys
					localStorage.removeItem("lti_aether_vault");
					localStorage.removeItem("lti_aether_chat");
				} catch (e) {
					console.error("Failed to migrate legacy Aether data", e);
				}
			}
		}
		
		return val || null;
	},
	setItem: async (name: string, value: string): Promise<void> => {
		await set(name, value);
	},
	removeItem: async (name: string): Promise<void> => {
		await del(name);
	},
};

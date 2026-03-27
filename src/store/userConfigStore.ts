/**
 * Store de configuración del usuario (API keys de servicios externos).
 *
 * AR-03 (#234): extraído de aetherStore para eliminar la responsabilidad
 * mixta de notas + embeddings + configuración global.
 *
 * Las API keys NO se persisten en localStorage/IDB — se almacenan en el
 * OS Keychain vía cortexAPI (#109). Este store es el punto de acceso
 * reactivo a esos valores en el renderer.
 */
import { create } from "zustand";

/**
 * Adaptador para persistir API keys en el OS Keychain vía cortexAPI (#109).
 * Inyectable en tests para evitar side-effects de IPC directos en los setters.
 * AR-03 (#267)
 */
export interface ConfigPersistAdapter {
	set(key: string, value: string): void;
}

const electronAdapter: ConfigPersistAdapter = {
	set: (key, value) => void window.cortexAPI?.config.set(key, value),
};

let _persistAdapter: ConfigPersistAdapter = electronAdapter;

/** Permite reemplazar el adaptador de persistencia. Solo para tests. */
export function setConfigPersistAdapter(adapter: ConfigPersistAdapter): void {
	_persistAdapter = adapter;
}

import { immer } from "zustand/middleware/immer";

interface UserConfigState {
	geminiApiKey: string;
	gmailClientId: string;
	gmailApiKey: string;
}

interface UserConfigActions {
	setGeminiApiKey: (key: string) => void;
	setGmailClientId: (id: string) => void;
	setGmailApiKey: (key: string) => void;
}

export const useUserConfigStore = create<UserConfigState & UserConfigActions>()(
	immer((set) => ({
		geminiApiKey: "",
		gmailClientId: "",
		gmailApiKey: "",

		setGeminiApiKey: (key) => {
			set((state) => {
				state.geminiApiKey = key;
			});
			_persistAdapter.set("gemini_api_key", key);
		},

		setGmailClientId: (id) => {
			set((state) => {
				state.gmailClientId = id;
			});
			_persistAdapter.set("gmail_client_id", id);
		},

		setGmailApiKey: (key) => {
			set((state) => {
				state.gmailApiKey = key;
			});
			_persistAdapter.set("gmail_api_key", key);
		},
	})),
);

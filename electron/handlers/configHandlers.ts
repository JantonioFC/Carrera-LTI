/**
 * Handlers de configuración para ipcMain.
 *
 * Extraídos como funciones puras para permitir testing sin dependencia
 * de Electron. El store se inyecta como dependencia.
 *
 * Uso en main.ts:
 *   const store = await initStore();
 *   initConfig(store);   // registra config:set y config:get en ipcMain
 */

import { z } from "zod";

const ConfigSetSchema = z.object({
	key: z.string().min(1),
	value: z.string(),
});

const ConfigGetSchema = z.object({
	key: z.string().min(1),
});

export interface ConfigStore {
	set(key: string, value: string): void;
	get(key: string): string | undefined;
}

/** Claves permitidas en el store de configuración cifrado. */
export const ALLOWED_CONFIG_KEYS = new Set([
	"gemini_api_key",
	"gmail_client_id",
	"gmail_api_key",
	"cortex_update_channel",
	"llm_api_key",
]);

export interface ConfigHandlers {
	configSet(key: string, value: string): void;
	configGet(key: string): string | null;
}

/** Registra los canales config:set y config:get en ipcMain. (#129) */
export function initConfig(
	store: ConfigStore,
	ipcMain: {
		handle(channel: string, listener: (...args: unknown[]) => unknown): void;
	},
): void {
	const handlers = makeConfigHandlers(store);
	ipcMain.handle("config:set", ((...args: unknown[]) => {
		const { key, value } = ConfigSetSchema.parse({
			key: args[1],
			value: args[2],
		});
		return handlers.configSet(key, value);
	}) as (...args: unknown[]) => unknown);
	ipcMain.handle("config:get", ((...args: unknown[]) => {
		const { key } = ConfigGetSchema.parse({ key: args[1] });
		return handlers.configGet(key);
	}) as (...args: unknown[]) => unknown);
}

export function makeConfigHandlers(store: ConfigStore): ConfigHandlers {
	return {
		configSet(key: string, value: string): void {
			if (!ALLOWED_CONFIG_KEYS.has(key)) {
				throw new Error(`config:set — clave no permitida: "${key}"`);
			}
			store.set(key, value);
		},

		configGet(key: string): string | null {
			if (!ALLOWED_CONFIG_KEYS.has(key)) {
				throw new Error(`config:get — clave no permitida: "${key}"`);
			}
			return store.get(key) ?? null;
		},
	};
}

/**
 * Handlers de configuración para ipcMain.
 *
 * Extraídos como funciones puras para permitir testing sin dependencia
 * de Electron. El store se inyecta como dependencia.
 *
 * Uso en main.ts:
 *   const handlers = makeConfigHandlers(store)
 *   ipcMain.handle("config:set", (_e, key, value) => handlers.configSet(key, value))
 *   ipcMain.handle("config:get", (_e, key) => handlers.configGet(key))
 */

export interface ConfigStore {
	set(key: string, value: string): void;
	get(key: string): string | undefined;
}

export interface ConfigHandlers {
	configSet(key: string, value: string): void;
	configGet(key: string): string | null;
}

export function makeConfigHandlers(store: ConfigStore): ConfigHandlers {
	return {
		configSet(key: string, value: string): void {
			store.set(key, value);
		},

		configGet(key: string): string | null {
			return store.get(key) ?? null;
		},
	};
}

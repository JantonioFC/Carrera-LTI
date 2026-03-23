/**
 * Tipos del contextBridge expuestos al Renderer Process.
 * Se extiende en cada fase de la migración Electron.
 *
 * Fase A: base vacía
 * Fase B: config.set / config.get ← actual
 * Fase C: index, query
 * Fase D: processDocument, transcribe
 * Fase E: observer
 */

export interface ConfigAPI {
	/** Persiste una clave de configuración (API key, token, etc.) de forma cifrada. */
	set(key: string, value: string): Promise<void>;
	/** Recupera una clave de configuración. Retorna null si no existe. */
	get(key: string): Promise<string | null>;
}

export interface CortexAPI {
	config: ConfigAPI;
}

declare global {
	interface Window {
		/** Disponible solo en modo Electron. Verificar con: typeof window.cortexAPI !== 'undefined' */
		cortexAPI?: CortexAPI;
	}
}

/**
 * Tipos del contextBridge expuestos al Renderer Process.
 * Se extiende en cada fase de la migración Electron.
 *
 * Fase A: API vacía — solo permite detectar si la app corre en Electron.
 * Fase B: agrega cortexAPI.config
 * Fase C: agrega cortexAPI.index, cortexAPI.query
 * Fase D: agrega cortexAPI.processDocument, cortexAPI.transcribe
 * Fase E: agrega cortexAPI.observer
 */
export interface CortexAPI {
	// Extender en fases B-E
}

declare global {
	interface Window {
		/** Disponible solo en modo Electron. Verificar con: typeof window.cortexAPI !== 'undefined' */
		cortexAPI?: CortexAPI;
	}
}

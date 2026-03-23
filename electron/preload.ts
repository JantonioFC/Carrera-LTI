import { contextBridge, ipcRenderer } from "electron";

/**
 * API expuesta al Renderer Process vía contextBridge.
 *
 * Fase A: base vacía
 * Fase B: config.set / config.get
 * Fase C: cortex.index / cortex.query
 * Fase D: cortex.processDocument / cortex.ocr / cortex.transcribe ← actual
 * Fase E: observer
 *
 * Regla de seguridad: nunca exponer ipcRenderer directamente.
 * Solo wrappers explícitos de ipcRenderer.invoke().
 */
contextBridge.exposeInMainWorld("cortexAPI", {
	config: {
		set: (key: string, value: string): Promise<void> =>
			ipcRenderer.invoke("config:set", key, value),
		get: (key: string): Promise<string | null> =>
			ipcRenderer.invoke("config:get", key),
	},
	cortex: {
		index: (docPath: string): Promise<{ chunks: number }> =>
			ipcRenderer.invoke("cortex:index", docPath),
		query: (text: string, topK?: number): Promise<unknown[]> =>
			ipcRenderer.invoke("cortex:query", text, topK),
		processDocument: (
			docPath: string,
		): Promise<{ chunks: number; text: string }> =>
			ipcRenderer.invoke("cortex:process-document", docPath),
		ocr: (imagePath: string): Promise<{ text: string }> =>
			ipcRenderer.invoke("cortex:ocr", imagePath),
		transcribe: (
			wavPath: string,
			model?: string,
		): Promise<{ text: string; language: string }> =>
			ipcRenderer.invoke("cortex:transcribe", wavPath, model),
	},
});

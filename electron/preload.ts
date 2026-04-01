import { contextBridge, ipcRenderer } from "electron";
import type { CortexChunk } from "./types.d.ts";

/**
 * API expuesta al Renderer Process vía contextBridge.
 *
 * Fase A: base vacía
 * Fase B: config.set / config.get
 * Fase C: cortex.index / cortex.query
 * Fase D: cortex.processDocument / cortex.ocr
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
		query: (text: string, topK?: number): Promise<CortexChunk[]> =>
			ipcRenderer.invoke("cortex:query", text, topK) as Promise<CortexChunk[]>,
		processDocument: (
			docPath: string,
		): Promise<{ chunks: number; text: string }> =>
			ipcRenderer.invoke("cortex:process-document", docPath),
		ocr: (imagePath: string): Promise<{ text: string }> =>
			ipcRenderer.invoke("cortex:ocr", imagePath),
	},
});

import { contextBridge, ipcRenderer } from "electron";

/**
 * API expuesta al Renderer Process vía contextBridge.
 *
 * Fase A: base vacía
 * Fase B: agrega config.set / config.get
 * Fase C: agrega cortex.index / cortex.query
 * Fase D+: agrega transcribe, observer
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
	},
});

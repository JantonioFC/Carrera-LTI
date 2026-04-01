/**
 * Tipos del contextBridge expuestos al Renderer Process.
 * Se extiende en cada fase de la migración Electron.
 *
 * Fase A: base vacía
 * Fase B: config.set / config.get
 * Fase C: cortex.index / cortex.query
 * Fase D: cortex.processDocument / cortex.ocr
 */

export interface ConfigAPI {
	/** Persiste una clave de configuración (API key, token, etc.) de forma cifrada. */
	set(key: string, value: string): Promise<void>;
	/** Recupera una clave de configuración. Retorna null si no existe. */
	get(key: string): Promise<string | null>;
}

export interface CortexChunk {
	chunkId: string;
	score: number;
	content: string;
	docId: string;
}

export interface CortexIPC {
	/** Indexa un documento en RuVector. Devuelve el número de chunks generados. */
	index(docPath: string): Promise<{ chunks: number }>;
	/** Ejecuta una consulta semántica. Devuelve chunks relevantes ordenados por score. */
	query(text: string, topK?: number): Promise<CortexChunk[]>;
	/** Convierte un PDF/DOCX a texto estructurado via Docling. */
	processDocument(docPath: string): Promise<{ chunks: number; text: string }>;
	/** Extrae texto de una imagen via Docling OCR. */
	ocr(imagePath: string): Promise<{ text: string }>;
}

export interface CortexAPI {
	config: ConfigAPI;
	cortex: CortexIPC;
}

declare global {
	interface Window {
		/** Disponible solo en modo Electron. Verificar con: typeof window.cortexAPI !== 'undefined' */
		cortexAPI?: CortexAPI;
	}
}

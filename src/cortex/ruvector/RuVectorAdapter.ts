import { randomUUID } from "node:crypto";

// Interfaces mínimas para aislar RuVectorAdapter del proceso principal.
// El tipo completo vive en electron/subprocess/SubprocessAdapter.ts — no
// accesible desde src/ (ver tsconfig.app.json). (#142)
interface AdapterResponse {
	data: unknown;
}

interface RequestOptions {
	timeoutMs?: number;
}

interface SubprocessAdapter {
	request(
		req: { id: string; action: string; payload: Record<string, unknown> },
		opts?: RequestOptions,
	): Promise<AdapterResponse>;
}

export interface RuVectorChunk {
	chunkId: string;
	score: number;
	content: string;
	docId: string;
}

export interface IndexDocumentRequest {
	docId: string;
	path: string;
	mimeType: string;
}

export interface QueryRequest {
	text: string;
	topK: number;
}

interface RuVectorAdapterOptions {
	subprocess: SubprocessAdapter;
}

/**
 * Adaptador de alto nivel para el binario RuVector (Rust).
 *
 * Traduce operaciones semánticas (index, query, delete) a llamadas
 * IPC via SubprocessAdapter, aislando al resto del sistema del
 * protocolo de bajo nivel.
 */
export class RuVectorAdapter {
	private readonly subprocess: SubprocessAdapter;

	constructor({ subprocess }: RuVectorAdapterOptions) {
		this.subprocess = subprocess;
	}

	async indexDocument(
		req: IndexDocumentRequest,
		opts?: RequestOptions,
	): Promise<{ chunks: number }> {
		const response = await this.subprocess.request(
			{ id: randomUUID(), action: "index_document", payload: { ...req } },
			opts,
		);
		return { chunks: (response.data as Record<string, number>).chunks };
	}

	async query(
		req: QueryRequest,
		opts?: RequestOptions,
	): Promise<RuVectorChunk[]> {
		const response = await this.subprocess.request(
			{ id: randomUUID(), action: "query", payload: { ...req } },
			opts,
		);
		return ((response.data as Record<string, unknown>).results ??
			[]) as RuVectorChunk[];
	}

	async deleteDocument(
		req: { docId: string },
		opts?: RequestOptions,
	): Promise<void> {
		await this.subprocess.request(
			{
				id: randomUUID(),
				action: "delete_document",
				payload: { docId: req.docId },
			},
			opts,
		);
	}
}

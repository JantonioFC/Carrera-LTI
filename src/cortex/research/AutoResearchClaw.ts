export type PaperStatus = "pending" | "approved" | "rejected";

export interface PaperResult {
	id: string;
	title: string;
	abstract: string;
	url: string;
	status: PaperStatus;
}

export interface PaperSearchClient {
	search(query: string): Promise<Omit<PaperResult, "status">[]>;
}

export interface PaperIndexer {
	indexDocument(req: {
		docId: string;
		path: string;
		mimeType: string;
	}): Promise<{ chunks: number }>;
}

interface AutoResearchClawOptions {
	client: PaperSearchClient;
	indexer: PaperIndexer;
}

/**
 * Módulo de investigación automática de papers académicos.
 *
 * REQ-08: Ningún resultado se importa al índice sin aprobación
 * explícita del usuario. El flujo es:
 *   1. search() → devuelve resultados con status="pending"
 *   2. Usuario aprueba o rechaza cada resultado individualmente
 *   3. approve(id) → indexa el paper aprobado
 *   4. reject(id) → descarta sin indexar
 *
 * Nota: Esta es la única operación de Cortex que requiere internet.
 */
export class AutoResearchClaw {
	private readonly client: PaperSearchClient;
	private readonly indexer: PaperIndexer;
	private results: Map<string, PaperResult> = new Map();

	constructor({ client, indexer }: AutoResearchClawOptions) {
		this.client = client;
		this.indexer = indexer;
	}

	/** Busca papers y devuelve todos en estado "pending". No indexa nada. */
	async search(query: string): Promise<PaperResult[]> {
		const raw = await this.client.search(query);
		this.results = new Map(
			raw.map((p) => [p.id, { ...p, status: "pending" as PaperStatus }]),
		);
		return [...this.results.values()];
	}

	/** Aprueba e indexa un paper individual. Lanza si el id no existe. */
	async approve(id: string): Promise<void> {
		const paper = this.results.get(id);
		if (!paper) throw new Error(`AutoResearchClaw: paper "${id}" not found`);

		paper.status = "approved";
		await this.indexer.indexDocument({
			docId: paper.id,
			path: paper.url,
			mimeType: "text/html",
		});
	}

	/** Rechaza un paper — no lo indexa. */
	reject(id: string): void {
		const paper = this.results.get(id);
		if (paper) paper.status = "rejected";
	}

	/** Retorna todos los resultados de la última búsqueda con su estado actual. */
	getPendingResults(): PaperResult[] {
		return [...this.results.values()];
	}
}

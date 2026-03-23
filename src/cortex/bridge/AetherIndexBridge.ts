export interface IndexRequest {
  docId: string;
  path: string;
  mimeType: string;
}

export interface IndexResult {
  status: 'ok' | 'not_found' | 'error';
  chunks?: number;
}

export interface DocumentIndexer {
  indexDocument(req: IndexRequest): Promise<IndexResult>;
  deleteDocument(req: { docId: string }): Promise<IndexResult>;
}

export interface DocumentSavedEvent {
  type: string;
  docId: string;
  path: string;
  mimeType: string;
}

interface AetherIndexBridgeOptions {
  indexer: DocumentIndexer;
}

/**
 * Puente entre los eventos de Aether (notas/documentos) y el indexador RuVector.
 *
 * Escucha eventos del sistema de archivos de Aether y delega en el indexador
 * para mantener el índice vectorial sincronizado con los documentos del usuario.
 */
export class AetherIndexBridge {
  private readonly indexer: DocumentIndexer;

  constructor({ indexer }: AetherIndexBridgeOptions) {
    this.indexer = indexer;
  }

  /**
   * Maneja el evento "documento guardado" en Aether.
   * Solo indexa si el tipo de evento es "saved".
   */
  async onDocumentSaved(event: DocumentSavedEvent): Promise<IndexResult> {
    if (event.type !== 'saved') {
      return { status: 'ok' };
    }

    return this.indexer.indexDocument({
      docId: event.docId,
      path: event.path,
      mimeType: event.mimeType,
    });
  }

  /**
   * Maneja el evento "documento eliminado" en Aether.
   * Elimina el documento del índice vectorial.
   */
  async onDocumentDeleted(event: { docId: string }): Promise<void> {
    await this.indexer.deleteDocument({ docId: event.docId });
  }
}

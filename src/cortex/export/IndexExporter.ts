export interface StorageUploadRequest {
	uid: string;
	localPath: string;
	remotePath: string;
}

export interface StorageUploadResult {
	url: string;
}

export interface CloudStorage {
	upload(req: StorageUploadRequest): Promise<StorageUploadResult>;
}

interface IndexExporterOptions {
	storage: CloudStorage;
}

/**
 * Exporta el índice RuVector a Firebase Storage bajo la ruta:
 *   users/{uid}/cortex/backup_{timestamp}.zip
 *
 * En producción, CloudStorage es el cliente real de Firebase.
 * En tests se inyecta un mock para no depender de Firebase real.
 */
export class IndexExporter {
	private readonly storage: CloudStorage;

	constructor({ storage }: IndexExporterOptions) {
		this.storage = storage;
	}

	async exportToFirebase(req: {
		uid: string;
		indexPath: string;
	}): Promise<StorageUploadResult> {
		const timestamp = Date.now();
		const remotePath = `users/${req.uid}/cortex/backup_${timestamp}.zip`;

		return this.storage.upload({
			uid: req.uid,
			localPath: req.indexPath,
			remotePath,
		});
	}
}

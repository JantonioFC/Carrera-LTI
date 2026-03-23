import type { IFs } from "memfs";

export interface QueueOperation {
	id: string;
	type: string;
	payload: Record<string, unknown>;
	enqueuedAt: number;
}

interface QueueManagerOptions {
	/** Sistema de archivos (real o memfs para tests) */
	fs: IFs;
	/** Ruta del archivo donde se persiste la cola */
	queuePath: string;
}

/**
 * Cola FIFO para operaciones de Cortex (indexado, transcripción, OCR, etc.).
 *
 * Soporta persistencia en disco para recovery tras reinicios del orquestador.
 * En tests se usa memfs para no tocar el sistema de archivos real.
 */
export class QueueManager {
	private items: QueueOperation[] = [];
	private readonly fs: IFs;
	private readonly queuePath: string;

	constructor({ fs, queuePath }: QueueManagerOptions) {
		this.fs = fs;
		this.queuePath = queuePath;
	}

	/** Agrega una operación al final de la cola. Ignora duplicados por id. */
	enqueue(op: QueueOperation): void {
		const exists = this.items.some((item) => item.id === op.id);
		if (!exists) {
			this.items.push(op);
		}
	}

	/** Extrae la primera operación de la cola (FIFO). Retorna null si está vacía. */
	dequeue(): QueueOperation | null {
		return this.items.shift() ?? null;
	}

	/** Número de operaciones pendientes. */
	size(): number {
		return this.items.length;
	}

	/** Serializa la cola al archivo configurado. */
	persistQueue(): void {
		this.fs.writeFileSync(this.queuePath, JSON.stringify(this.items), "utf8");
	}

	/**
	 * Lee el archivo de cola y restaura el estado en memoria.
	 * Si el archivo no existe, la cola queda vacía (comportamiento de primera vez).
	 */
	restoreQueue(): void {
		try {
			const raw = this.fs.readFileSync(this.queuePath, "utf8") as string;
			this.items = JSON.parse(raw) as QueueOperation[];
		} catch {
			// Archivo inexistente o corrupto → arrancar con cola vacía
			this.items = [];
		}
	}
}

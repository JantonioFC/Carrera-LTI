import type { IPCMessage } from "../ipc/IPCProtocol";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface AdapterRequest {
	id: string;
	action: string;
	payload: Record<string, unknown>;
}

export interface RequestOptions {
	timeoutMs?: number;
}

export interface SubprocessTransport {
	send(msg: IPCMessage): Promise<IPCMessage>;
	onReady(): Promise<void>;
}

interface SubprocessAdapterOptions {
	name: string;
	transport: SubprocessTransport;
	/** Timeouts específicos por acción (e.g. { transcribe: 120_000 }). (#78)
	 *  Si una acción no tiene entrada aquí, se usa DEFAULT_TIMEOUT_MS. */
	actionTimeouts?: Record<string, number>;
}

/**
 * Adaptador genérico para subprocesos IPC (Docling, Whisper, RuVector).
 *
 * Encapsula el protocolo de request/response con timeout configurable.
 * Los tests unitarios inyectan un transport mock; en producción se usa
 * el transport real que gestiona el stdio del subproceso.
 */
export class SubprocessAdapter {
	private readonly name: string;
	private readonly transport: SubprocessTransport;
	private readonly actionTimeouts: Record<string, number>;

	constructor({ name, transport, actionTimeouts = {} }: SubprocessAdapterOptions) {
		this.name = name;
		this.transport = transport;
		this.actionTimeouts = actionTimeouts;
	}

	/**
	 * Envía una operación al subproceso y espera la respuesta.
	 * Lanza si el status es "error" o si se supera el timeout.
	 */
	async request(
		req: AdapterRequest,
		opts: RequestOptions = {},
	): Promise<IPCMessage> {
		const timeoutMs =
			opts.timeoutMs ?? this.actionTimeouts[req.action] ?? DEFAULT_TIMEOUT_MS;

		const msg: IPCMessage = {
			id: req.id,
			status: "ok", // campo requerido por IPCMessage; el subproceso lo sobrescribe en la respuesta
			data: { action: req.action, ...req.payload },
		};

		const timeoutPromise = new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error(`[${this.name}] timeout after ${timeoutMs}ms`)),
				timeoutMs,
			),
		);

		const response = await Promise.race([
			this.transport.send(msg),
			timeoutPromise,
		]);

		if (response.status === "error") {
			throw new Error(response.error ?? `[${this.name}] unknown error`);
		}

		return response;
	}
}

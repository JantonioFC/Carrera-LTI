// AR-02 (#233): módulo movido de src/cortex/ipc/ a electron/ipc/ — pertenece al Main Process.

/** Valores válidos para el campo status según el RFC-001 */
const VALID_STATUSES = ["ok", "error", "progress"] as const;
type IPCStatus = (typeof VALID_STATUSES)[number];

export interface IPCMessage {
	id: string;
	status: IPCStatus;
	data?: unknown;
	error?: string | null;
}

export class IPCParseError extends Error {
	constructor(message: string) {
		super(`IPCParseError: ${message}`);
		this.name = "IPCParseError";
	}
}

export class IPCValidationError extends Error {
	constructor(message: string) {
		super(`IPCValidationError: ${message}`);
		this.name = "IPCValidationError";
	}
}

/** Límite de tamaño para prevenir DoS por mensajes NDJSON gigantes (#149). */
const MAX_IPC_MESSAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Parsea y valida una línea NDJSON recibida por stdio desde un subproceso.
 *
 * Protocolo (RFC-001):
 *   { "id": "<uuid>", "status": "ok"|"error"|"progress", "data": {...}, "error": null }
 *
 * @throws IPCParseError   — si el string no es JSON válido, está vacío o supera el límite.
 * @throws IPCValidationError — si faltan campos obligatorios o tienen valores inválidos.
 */
export function parseIPCMessage(rawLine: string): IPCMessage {
	const trimmed = rawLine.trim();

	if (!trimmed) {
		throw new IPCParseError("empty input");
	}

	if (trimmed.length > MAX_IPC_MESSAGE_BYTES) {
		throw new IPCParseError(
			`message too large: ${trimmed.length} bytes (max ${MAX_IPC_MESSAGE_BYTES})`,
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		throw new IPCParseError(`invalid JSON: ${trimmed.slice(0, 80)}`);
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new IPCParseError("message must be a JSON object");
	}

	const obj = parsed as Record<string, unknown>;

	// Validar campo id
	if (!("id" in obj) || typeof obj.id !== "string" || obj.id === "") {
		throw new IPCValidationError("missing or empty field: id");
	}

	// Validar campo status
	if (!("status" in obj)) {
		throw new IPCValidationError("missing field: status");
	}
	if (!VALID_STATUSES.includes(obj.status as IPCStatus)) {
		throw new IPCValidationError(`invalid status value: "${obj.status}"`);
	}

	return {
		id: obj.id as string,
		status: obj.status as IPCStatus,
		data: obj.data,
		error: typeof obj.error === "string" ? obj.error : null,
	};
}

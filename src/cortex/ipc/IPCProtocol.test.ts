import { describe, expect, it } from "vitest";
import { parseIPCMessage } from "./IPCProtocol";

describe("IPCProtocol.parseIPCMessage", () => {
	// Happy path
	it("should_parse_valid_json_line", () => {
		const result = parseIPCMessage('{"id":"abc","status":"ok","data":{}}\n');
		expect(result.id).toBe("abc");
		expect(result.status).toBe("ok");
	});

	// Happy path con status progress
	it("should_parse_progress_status", () => {
		const result = parseIPCMessage(
			'{"id":"xyz","status":"progress","data":{"pct":50}}',
		);
		expect(result.status).toBe("progress");
		expect(result.data).toEqual({ pct: 50 });
	});

	// JSON malformado
	it("should_throw_IPCParseError_on_malformed_json", () => {
		expect(() => parseIPCMessage("not json")).toThrow("IPCParseError");
	});

	// String vacío
	it("should_throw_IPCParseError_on_empty_string", () => {
		expect(() => parseIPCMessage("")).toThrow("IPCParseError");
	});

	// Solo whitespace
	it("should_throw_IPCParseError_on_whitespace_only", () => {
		expect(() => parseIPCMessage("   \n")).toThrow("IPCParseError");
	});

	// Falta campo id
	it("should_throw_IPCValidationError_on_missing_id_field", () => {
		expect(() => parseIPCMessage('{"status":"ok"}')).toThrow(
			"IPCValidationError",
		);
	});

	// Falta campo status
	it("should_throw_IPCValidationError_on_missing_status_field", () => {
		expect(() => parseIPCMessage('{"id":"abc"}')).toThrow("IPCValidationError");
	});

	// status inválido
	it("should_throw_IPCValidationError_on_invalid_status_value", () => {
		expect(() => parseIPCMessage('{"id":"abc","status":"unknown"}')).toThrow(
			"IPCValidationError",
		);
	});

	// Payload muy grande — no debe lanzar
	it("should_handle_extremely_large_payload", () => {
		const large = JSON.stringify({
			id: "big",
			status: "ok",
			data: { content: "a".repeat(1_000_000) },
		});
		expect(() => parseIPCMessage(large)).not.toThrow();
	});

	// id vacío debe fallar
	it("should_throw_IPCValidationError_on_empty_id", () => {
		expect(() => parseIPCMessage('{"id":"","status":"ok"}')).toThrow(
			"IPCValidationError",
		);
	});
});

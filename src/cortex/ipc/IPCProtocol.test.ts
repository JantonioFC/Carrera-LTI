// TS-03 (#271): cobertura del parser crítico parseIPCMessage.
// Protocolo RFC-001 NDJSON — el parser es la primera línea de defensa contra
// mensajes malformados de subprocesos Python (ruvector, docling, whisper).
import { describe, expect, it } from "vitest";
import {
	IPCParseError,
	IPCValidationError,
	parseIPCMessage,
} from "./IPCProtocol";

describe("parseIPCMessage — RFC-001 NDJSON parser", () => {
	// ─── Casos válidos ──────────────────────────────────────────────────────────
	describe("mensajes válidos", () => {
		it("parsea un mensaje ok sin data ni error", () => {
			const msg = parseIPCMessage('{"id":"abc","status":"ok"}');
			expect(msg.id).toBe("abc");
			expect(msg.status).toBe("ok");
			expect(msg.data).toBeUndefined();
			expect(msg.error).toBeNull();
		});

		it("parsea un mensaje ok con data", () => {
			const msg = parseIPCMessage(
				'{"id":"x1","status":"ok","data":{"chunks":3}}',
			);
			expect(msg.id).toBe("x1");
			expect(msg.status).toBe("ok");
			expect(msg.data).toEqual({ chunks: 3 });
		});

		it("parsea un mensaje error con campo error string", () => {
			const msg = parseIPCMessage(
				'{"id":"e1","status":"error","error":"timeout"}',
			);
			expect(msg.status).toBe("error");
			expect(msg.error).toBe("timeout");
		});

		it("parsea un mensaje progress", () => {
			const msg = parseIPCMessage(
				'{"id":"p1","status":"progress","data":{"pct":50}}',
			);
			expect(msg.status).toBe("progress");
			expect(msg.data).toEqual({ pct: 50 });
		});

		it("normaliza error no-string a null", () => {
			const msg = parseIPCMessage('{"id":"n1","status":"ok","error":42}');
			expect(msg.error).toBeNull();
		});

		it("normaliza error null a null", () => {
			const msg = parseIPCMessage('{"id":"n2","status":"ok","error":null}');
			expect(msg.error).toBeNull();
		});

		it("ignora campos adicionales (forward compatibility)", () => {
			const msg = parseIPCMessage(
				'{"id":"f1","status":"ok","extra":"ignored"}',
			);
			expect(msg.id).toBe("f1");
		});

		it("acepta línea con whitespace alrededor (trim)", () => {
			const msg = parseIPCMessage('  {"id":"ws","status":"ok"}  ');
			expect(msg.id).toBe("ws");
		});
	});

	// ─── IPCParseError ──────────────────────────────────────────────────────────
	describe("IPCParseError — entrada inválida", () => {
		it("lanza IPCParseError para string vacío", () => {
			expect(() => parseIPCMessage("")).toThrow(IPCParseError);
			expect(() => parseIPCMessage("")).toThrow("empty input");
		});

		it("lanza IPCParseError para whitespace puro", () => {
			expect(() => parseIPCMessage("   ")).toThrow(IPCParseError);
		});

		it("lanza IPCParseError para JSON inválido", () => {
			expect(() => parseIPCMessage("{invalid}")).toThrow(IPCParseError);
			expect(() => parseIPCMessage("{invalid}")).toThrow("invalid JSON");
		});

		it("lanza IPCParseError para JSON que es un array", () => {
			expect(() => parseIPCMessage("[1,2,3]")).toThrow(IPCParseError);
			expect(() => parseIPCMessage("[1,2,3]")).toThrow("JSON object");
		});

		it("lanza IPCParseError para JSON que es un string literal", () => {
			expect(() => parseIPCMessage('"hello"')).toThrow(IPCParseError);
		});

		it("lanza IPCParseError para JSON que es null literal", () => {
			expect(() => parseIPCMessage("null")).toThrow(IPCParseError);
		});

		it("lanza IPCParseError para mensaje que supera el límite de 10MB", () => {
			// Construir un string > 10MB
			const bigValue = "x".repeat(10 * 1024 * 1024 + 1);
			// El string ya es mayor al límite, pero necesita ser JSON válido al ser evaluado
			// Creamos un string suficientemente largo antes del parsing
			const bigLine = `{"id":"big","status":"ok","data":"${bigValue}"`;
			expect(() => parseIPCMessage(bigLine)).toThrow(IPCParseError);
			expect(() => parseIPCMessage(bigLine)).toThrow("too large");
		});
	});

	// ─── IPCValidationError ─────────────────────────────────────────────────────
	describe("IPCValidationError — campos obligatorios ausentes o inválidos", () => {
		it("lanza IPCValidationError si falta campo id", () => {
			expect(() => parseIPCMessage('{"status":"ok"}')).toThrow(
				IPCValidationError,
			);
			expect(() => parseIPCMessage('{"status":"ok"}')).toThrow("id");
		});

		it("lanza IPCValidationError si id es string vacío", () => {
			expect(() => parseIPCMessage('{"id":"","status":"ok"}')).toThrow(
				IPCValidationError,
			);
		});

		it("lanza IPCValidationError si id no es string (número)", () => {
			expect(() => parseIPCMessage('{"id":123,"status":"ok"}')).toThrow(
				IPCValidationError,
			);
		});

		it("lanza IPCValidationError si falta campo status", () => {
			expect(() => parseIPCMessage('{"id":"x"}')).toThrow(IPCValidationError);
			expect(() => parseIPCMessage('{"id":"x"}')).toThrow("status");
		});

		it("lanza IPCValidationError para status desconocido", () => {
			expect(() => parseIPCMessage('{"id":"x","status":"unknown"}')).toThrow(
				IPCValidationError,
			);
			expect(() => parseIPCMessage('{"id":"x","status":"unknown"}')).toThrow(
				"invalid status",
			);
		});

		it("lanza IPCValidationError para status vacío", () => {
			expect(() => parseIPCMessage('{"id":"x","status":""}')).toThrow(
				IPCValidationError,
			);
		});
	});

	// ─── Clases de error ────────────────────────────────────────────────────────
	describe("instancias de error", () => {
		it("IPCParseError es instancia de Error", () => {
			const e = new IPCParseError("test");
			expect(e).toBeInstanceOf(Error);
			expect(e.name).toBe("IPCParseError");
			expect(e.message).toContain("test");
		});

		it("IPCValidationError es instancia de Error", () => {
			const e = new IPCValidationError("test");
			expect(e).toBeInstanceOf(Error);
			expect(e.name).toBe("IPCValidationError");
			expect(e.message).toContain("test");
		});
	});
});

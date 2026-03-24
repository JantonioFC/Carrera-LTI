import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IPCMessage } from "../../src/cortex/ipc/IPCProtocol";
import { SubprocessAdapter } from "./SubprocessAdapter";

/** Stub mínimo de un subproceso IPC */
function makeMockTransport() {
	const handlers = new Map<string, (msg: IPCMessage) => IPCMessage>();
	return {
		send: vi.fn(async (msg: IPCMessage): Promise<IPCMessage> => {
			const h = handlers.get(msg.id);
			return h ? h(msg) : { id: msg.id, status: "error", error: "no handler" };
		}),
		onReady: vi.fn().mockResolvedValue(undefined),
		onExit: vi.fn(),
		registerHandler: (id: string, fn: (m: IPCMessage) => IPCMessage) =>
			handlers.set(id, fn),
	};
}

describe("SubprocessAdapter — Docling (OCR)", () => {
	let transport: ReturnType<typeof makeMockTransport>;
	let adapter: SubprocessAdapter;

	beforeEach(() => {
		transport = makeMockTransport();
		adapter = new SubprocessAdapter({
			name: "docling",
			transport: transport as never,
		});
	});

	it("should_send_ocr_request_and_return_chunks", async () => {
		transport.send.mockResolvedValueOnce({
			id: "req-1",
			status: "ok",
			data: { chunks: ["Texto extraído del PDF"] },
		});

		const result = await adapter.request({
			id: "req-1",
			action: "ocr",
			payload: { path: "/doc.pdf" },
		});
		expect(result.status).toBe("ok");
		expect((result.data as Record<string, unknown>).chunks).toHaveLength(1);
	});

	it("should_throw_on_error_response", async () => {
		transport.send.mockResolvedValueOnce({
			id: "req-2",
			status: "error",
			error: "file not found",
		});

		await expect(
			adapter.request({
				id: "req-2",
				action: "ocr",
				payload: { path: "/missing.pdf" },
			}),
		).rejects.toThrow("file not found");
	});

	it("should_throw_on_timeout", async () => {
		transport.send.mockImplementationOnce(() => new Promise(() => {})); // nunca resuelve

		await expect(
			adapter.request(
				{ id: "req-3", action: "ocr", payload: {} },
				{ timeoutMs: 50 },
			),
		).rejects.toThrow("timeout");
	});
});

describe("SubprocessAdapter — Whisper (transcripción)", () => {
	let transport: ReturnType<typeof makeMockTransport>;
	let adapter: SubprocessAdapter;

	beforeEach(() => {
		transport = makeMockTransport();
		adapter = new SubprocessAdapter({
			name: "whisper",
			transport: transport as never,
		});
	});

	it("should_send_transcribe_request_and_return_text", async () => {
		transport.send.mockResolvedValueOnce({
			id: "req-4",
			status: "ok",
			data: { text: "El teorema de Bayes establece..." },
		});

		const result = await adapter.request({
			id: "req-4",
			action: "transcribe",
			payload: { path: "/tmp/audio.wav" },
		});
		expect(result.status).toBe("ok");
		expect((result.data as Record<string, unknown>).text).toContain("Bayes");
	});

	it("should_include_subprocess_name_in_timeout_error", async () => {
		transport.send.mockImplementationOnce(() => new Promise(() => {}));

		await expect(
			adapter.request(
				{ id: "req-5", action: "transcribe", payload: {} },
				{ timeoutMs: 50 },
			),
		).rejects.toThrow("whisper");
	});
});

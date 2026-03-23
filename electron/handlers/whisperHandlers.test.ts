import { describe, expect, it, vi } from "vitest";
import type { SubprocessAdapter } from "../../src/cortex/subprocess/SubprocessAdapter";
import { makeWhisperHandlers } from "./whisperHandlers";

/**
 * Tests unitarios de makeWhisperHandlers.
 * Se inyecta un mock de SubprocessAdapter para aislar la lógica de mapeo.
 * Ref: Issue #56 — Fase D
 */

function makeMockAdapter(responseData: Record<string, unknown>) {
	return {
		request: vi
			.fn()
			.mockResolvedValue({ id: "x", status: "ok", data: responseData }),
	} as unknown as SubprocessAdapter;
}

describe("whisperHandlers — transcribe", () => {
	it("should_send_transcribe_action", async () => {
		const adapter = makeMockAdapter({ text: "hola mundo", language: "es" });
		const handlers = makeWhisperHandlers(adapter);

		await handlers.transcribe("/audio/clase.wav");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.action).toBe("transcribe");
		expect(call.payload.path).toBe("/audio/clase.wav");
	});

	it("should_return_transcription_text", async () => {
		const adapter = makeMockAdapter({
			text: "el profesor explica álgebra lineal",
			language: "es",
		});
		const handlers = makeWhisperHandlers(adapter);

		const result = await handlers.transcribe("/audio/clase.wav");
		expect(result.text).toBe("el profesor explica álgebra lineal");
	});

	it("should_return_detected_language", async () => {
		const adapter = makeMockAdapter({ text: "hello world", language: "en" });
		const handlers = makeWhisperHandlers(adapter);

		const result = await handlers.transcribe("/audio/talk.wav");
		expect(result.language).toBe("en");
	});

	it("should_use_small_model_by_default", async () => {
		const adapter = makeMockAdapter({ text: "texto", language: "es" });
		const handlers = makeWhisperHandlers(adapter);

		await handlers.transcribe("/audio/clase.wav");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.model).toBe("small");
	});
});

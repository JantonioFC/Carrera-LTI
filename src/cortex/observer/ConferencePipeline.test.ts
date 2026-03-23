import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConferencePipeline } from "./ConferencePipeline";

// ── Mocks de las capas del pipeline ─────────────────────────────────────────

function makeWhisper() {
	return {
		transcribe: vi
			.fn()
			.mockResolvedValue({ text: "Contenido de la conferencia transcripto." }),
	};
}

function makeAether() {
	return {
		createNote: vi
			.fn()
			.mockResolvedValue({ id: "note_abc", title: "Conferencia 2026-03-22" }),
	};
}

function makeBridge() {
	return {
		onDocumentSaved: vi.fn().mockResolvedValue({ status: "ok", chunks: 4 }),
	};
}

function makeWav() {
	return {
		deleteAfterTranscription: vi.fn().mockResolvedValue(undefined),
		handleTranscriptionFailed: vi.fn().mockResolvedValue(undefined),
	};
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ConferencePipeline — flujo feliz", () => {
	let whisper: ReturnType<typeof makeWhisper>;
	let aether: ReturnType<typeof makeAether>;
	let bridge: ReturnType<typeof makeBridge>;
	let wav: ReturnType<typeof makeWav>;
	let pipeline: ConferencePipeline;

	beforeEach(() => {
		whisper = makeWhisper();
		aether = makeAether();
		bridge = makeBridge();
		wav = makeWav();
		pipeline = new ConferencePipeline({
			whisper,
			aether,
			bridge,
			wav,
		} as never);
	});

	it("should_call_whisper_with_wav_path", async () => {
		await pipeline.process("/tmp/clase-01.wav");
		expect(whisper.transcribe).toHaveBeenCalledWith("/tmp/clase-01.wav");
	});

	it("should_create_aether_note_with_transcription", async () => {
		await pipeline.process("/tmp/clase-01.wav");
		expect(aether.createNote).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "Contenido de la conferencia transcripto.",
			}),
		);
	});

	it("should_call_bridge_onDocumentSaved_with_note_info", async () => {
		await pipeline.process("/tmp/clase-01.wav");
		expect(bridge.onDocumentSaved).toHaveBeenCalledWith(
			expect.objectContaining({ type: "saved", docId: "note_abc" }),
		);
	});

	it("should_delete_wav_after_successful_transcription", async () => {
		await pipeline.process("/tmp/clase-01.wav");
		expect(wav.deleteAfterTranscription).toHaveBeenCalledWith(
			"/tmp/clase-01.wav",
		);
	});

	it("should_return_pipeline_result_with_all_steps", async () => {
		const result = await pipeline.process("/tmp/clase-01.wav");
		expect(result.transcription).toBe(
			"Contenido de la conferencia transcripto.",
		);
		expect(result.noteId).toBe("note_abc");
		expect(result.chunks).toBe(4);
	});

	it("should_not_send_data_to_internet", async () => {
		// Todos los pasos son mocks locales — ninguno debería llamar a fetch/network
		const fetchSpy = vi.spyOn(globalThis, "fetch");
		await pipeline.process("/tmp/clase-01.wav");
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});
});

describe("ConferencePipeline — manejo de errores", () => {
	it("should_call_handleTranscriptionFailed_if_whisper_throws", async () => {
		const whisper = {
			transcribe: vi.fn().mockRejectedValue(new Error("Whisper timeout")),
		};
		const aether = makeAether();
		const bridge = makeBridge();
		const wav = makeWav();
		const pipeline = new ConferencePipeline({
			whisper,
			aether,
			bridge,
			wav,
		} as never);

		await expect(pipeline.process("/tmp/clase-01.wav")).rejects.toThrow(
			"Whisper timeout",
		);
		expect(wav.handleTranscriptionFailed).toHaveBeenCalledWith(
			"/tmp/clase-01.wav",
		);
		expect(aether.createNote).not.toHaveBeenCalled();
	});

	it("should_not_delete_wav_if_transcription_failed", async () => {
		const whisper = {
			transcribe: vi.fn().mockRejectedValue(new Error("crashed")),
		};
		const wav = makeWav();
		const pipeline = new ConferencePipeline({
			whisper,
			aether: makeAether(),
			bridge: makeBridge(),
			wav,
		} as never);

		await expect(pipeline.process("/tmp/clase-01.wav")).rejects.toThrow();
		expect(wav.deleteAfterTranscription).not.toHaveBeenCalled();
	});

	it("should_propagate_bridge_error_without_losing_note", async () => {
		const bridge = {
			onDocumentSaved: vi.fn().mockRejectedValue(new Error("RuVector down")),
		};
		const wav = makeWav();
		const pipeline = new ConferencePipeline({
			whisper: makeWhisper(),
			aether: makeAether(),
			bridge,
			wav,
		} as never);

		// La nota se creó pero la indexación falló — error debe propagarse
		await expect(pipeline.process("/tmp/clase-01.wav")).rejects.toThrow(
			"RuVector down",
		);
		// El wav sí se elimina (la transcripción fue exitosa)
		expect(wav.deleteAfterTranscription).toHaveBeenCalled();
	});
});

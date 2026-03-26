// TODO AR-05 (#206): ConferencePipeline está bien diseñado pero no se usa en
// producción (useObserverIPC llama a Whisper + Aether directamente). Ver issue #206.
import type { DocumentSavedEvent } from "../bridge/AetherIndexBridge";

// ── Puertos (interfaces inyectables) ────────────────────────────────────────

export interface WhisperPort {
	transcribe(wavPath: string): Promise<{ text: string }>;
}

export interface AetherNote {
	id: string;
	title: string;
}

export interface AetherPort {
	createNote(req: { title: string; content: string }): Promise<AetherNote>;
}

export interface BridgePort {
	onDocumentSaved(
		event: DocumentSavedEvent,
	): Promise<{ status: string; chunks: number }>;
}

export interface WavPort {
	deleteAfterTranscription(path: string): Promise<void>;
	handleTranscriptionFailed(path: string): Promise<void>;
}

export interface PipelineResult {
	transcription: string;
	noteId: string;
	chunks: number;
}

interface ConferencePipelineOptions {
	whisper: WhisperPort;
	aether: AetherPort;
	bridge: BridgePort;
	wav: WavPort;
}

/**
 * Orquestador del pipeline de conferencia:
 *   Audio .wav → Whisper (transcripción local) → Aether (nota) → RuVector (índice)
 *
 * Invariantes de privacidad:
 * - Ningún dato sale a internet (todo es local).
 * - El .wav se elimina tras transcripción exitosa.
 * - Si Whisper falla, el .wav se conserva para re-intentos.
 *
 * Orden de pasos:
 *   1. Transcribir con Whisper
 *   2. Crear nota en Aether con el texto
 *   3. Indexar en RuVector via AetherIndexBridge
 *   4. Eliminar el .wav
 */
export class ConferencePipeline {
	private readonly whisper: WhisperPort;
	private readonly aether: AetherPort;
	private readonly bridge: BridgePort;
	private readonly wav: WavPort;

	constructor({ whisper, aether, bridge, wav }: ConferencePipelineOptions) {
		this.whisper = whisper;
		this.aether = aether;
		this.bridge = bridge;
		this.wav = wav;
	}

	async process(wavPath: string): Promise<PipelineResult> {
		// Paso 1 — Transcripción local (Whisper)
		let transcription: string;
		try {
			const result = await this.whisper.transcribe(wavPath);
			transcription = result.text;
		} catch (err) {
			await this.wav.handleTranscriptionFailed(wavPath);
			throw err;
		}

		// Paso 2 — Crear nota en Aether
		const title = `Conferencia ${new Date().toISOString().slice(0, 10)}`;
		const note = await this.aether.createNote({
			title,
			content: transcription,
		});

		// Paso 3 — Eliminar el .wav (transcripción exitosa, ya no se necesita)
		await this.wav.deleteAfterTranscription(wavPath);

		// Paso 4 — Indexar en RuVector via bridge
		const indexResult = await this.bridge.onDocumentSaved({
			type: "saved",
			docId: note.id,
			path: `aether://${note.id}`,
			mimeType: "text/plain",
		});

		return {
			transcription,
			noteId: note.id,
			chunks: indexResult.chunks,
		};
	}
}

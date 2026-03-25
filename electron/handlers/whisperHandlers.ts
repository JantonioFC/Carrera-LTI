import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";
import { assertSafePath } from "./pathSecurity";

const WHISPER_MODELS = ["tiny", "base", "small", "medium", "large"] as const;
const TranscribeInputSchema = z.object({
	model: z.enum(WHISPER_MODELS).optional(),
});

/**
 * Handlers de Whisper para ipcMain.
 *
 * Traduce la llamada IPC cortex:transcribe a una operación del
 * SubprocessAdapter. Usa el modelo "small" por defecto (~500 MB,
 * balance calidad/velocidad en CPU).
 *
 * Nota: la eliminación del WAV tras transcripción exitosa (ADR-003)
 * ocurre en el Python runner (whisper_runner.py), no aquí.
 *
 * Ref: RFC-002 §4.4 Fase D — Issue #56
 */

export interface WhisperHandlers {
	/** Transcribe un archivo WAV 16kHz mono. Devuelve texto e idioma detectado. */
	transcribe(
		wavPath: string,
		model?: string,
	): Promise<{ text: string; language: string }>;
}

export function makeWhisperHandlers(
	adapter: SubprocessAdapter,
): WhisperHandlers {
	return {
		async transcribe(
			wavPath: string,
			model = "small",
		): Promise<{ text: string; language: string }> {
			assertSafePath(wavPath);
			const { model: safeModel } = TranscribeInputSchema.parse({ model });
			const response = await adapter.request({
				id: randomUUID(),
				action: "transcribe",
				payload: { path: wavPath, model: safeModel ?? "small" },
			});
			const data = response.data as Record<string, unknown>;
			return {
				text: (data.text as string) ?? "",
				language: (data.language as string) ?? "unknown",
			};
		},
	};
}

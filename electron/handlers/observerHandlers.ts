import type { ChildProcess, SpawnOptions } from "node:child_process";
import { spawn as nodeSpawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Handlers del Observer AI para ipcMain.
 *
 * Observer es un proceso long-running (diferente al patrón request-response
 * de Docling/Whisper). Se inicia con toggle(true) y se detiene con toggle(false).
 *
 * Al detenerse (SIGTERM), el runner Python flushea el buffer de audio y guarda
 * el WAV en recordingsDir. El handler devuelve la ruta para que el Renderer
 * orqueste la transcripción vía cortex:transcribe.
 *
 * Ref: RFC-002 §4.4 Fase E — Issue #58
 */

type SpawnFn = (
	cmd: string,
	args: string[],
	opts: SpawnOptions,
) => ChildProcess;

export interface ObserverToggleResult {
	active: boolean;
	/** Presente solo al desactivar si se grabó audio. */
	wavPath?: string;
}

export interface ObserverHandlers {
	toggle(active: boolean): Promise<ObserverToggleResult>;
	status(): { active: boolean };
}

export interface ObserverHandlersOptions {
	spawnFn?: SpawnFn;
	mkdirFn?: (path: string, opts: { recursive: boolean }) => void;
	existsFn?: (path: string) => boolean;
	recordingsDir: string;
}

export function makeObserverHandlers(
	pythonBin: string,
	scriptPath: string,
	opts: ObserverHandlersOptions,
): ObserverHandlers {
	const spawnFn = opts.spawnFn ?? nodeSpawn;
	const mkdirFn = opts.mkdirFn ?? ((p, o) => mkdirSync(p, o));
	const existsFn = opts.existsFn ?? existsSync;

	let proc: ChildProcess | null = null;
	let currentWavPath: string | null = null;

	return {
		async toggle(active: boolean): Promise<ObserverToggleResult> {
			if (active) {
				if (proc) return { active: true };

				mkdirFn(opts.recordingsDir, { recursive: true });
				const wavPath = join(opts.recordingsDir, `recording_${Date.now()}.wav`);
				currentWavPath = wavPath;

				proc = spawnFn(pythonBin, [scriptPath, wavPath], {
					stdio: ["ignore", "ignore", "inherit"],
				});

				proc.once("exit", () => {
					proc = null;
				});

				return { active: true };
			}

			// toggle(false): SIGTERM + esperar salida limpia
			if (!proc) return { active: false };

			const wavPath = currentWavPath;

			await new Promise<void>((resolve) => {
				proc!.once("exit", () => resolve());
				proc!.kill("SIGTERM");
			});

			proc = null;
			currentWavPath = null;

			const result: ObserverToggleResult = { active: false };
			if (wavPath && existsFn(wavPath)) {
				result.wavPath = wavPath;
			}
			return result;
		},

		status(): { active: boolean } {
			return { active: proc !== null };
		},
	};
}

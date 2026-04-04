import { spawnSync } from "node:child_process";
import { dialog } from "electron";

interface PrereqResult {
	ok: boolean;
	missing: string[];
}

const IS_WIN = process.platform === "win32";
const PYTHON_CMD = IS_WIN ? "python" : "python3";

function checkPython(): string | null {
	// Pide a Python que imprima "ok" si la versión es >= 3.10
	const result = spawnSync(
		PYTHON_CMD,
		["-c", "import sys; print('ok' if sys.version_info >= (3, 10) else 'old')"],
		{ encoding: "utf8", timeout: 5000 },
	);

	if (result.error || result.status !== 0) {
		return "Python 3.10+ no encontrado en el sistema.\nInstálalo desde https://python.org y asegurate de marcarlo en el PATH.";
	}

	if (result.stdout.trim() === "old") {
		// Obtener versión exacta para el mensaje
		const ver = spawnSync(PYTHON_CMD, ["--version"], {
			encoding: "utf8",
			timeout: 5000,
		});
		const raw = (ver.stdout || ver.stderr || "").trim();
		return `${raw} detectado. Carrera LTI requiere Python 3.10 o superior.\nInstálalo desde https://python.org`;
	}

	return null; // ok
}

function checkFFmpeg(): string | null {
	const result = spawnSync("ffmpeg", ["-version"], {
		encoding: "utf8",
		timeout: 5000,
	});

	if (result.error || result.status !== 0) {
		return "FFmpeg no encontrado en el sistema.\nEs necesario para el procesamiento de audio (Whisper).\nInstálalo desde https://ffmpeg.org/download.html y agrégalo al PATH.";
	}

	return null; // ok
}

/**
 * Verifica los prerequisitos del sistema al arrancar la app.
 * Si falta alguno, muestra un diálogo de error y devuelve { ok: false }.
 * El caller debe llamar app.quit() si ok === false.
 */
export function checkPrereqs(): PrereqResult {
	const missing: string[] = [];

	const pythonError = checkPython();
	if (pythonError) missing.push(pythonError);

	const ffmpegError = checkFFmpeg();
	if (ffmpegError) missing.push(ffmpegError);

	if (missing.length > 0) {
		const detail = missing.join("\n\n");
		dialog.showErrorBox(
			"Prerequisitos faltantes — Carrera LTI",
			`La aplicación no puede iniciarse porque faltan dependencias del sistema:\n\n${detail}`,
		);
		return { ok: false, missing };
	}

	return { ok: true, missing: [] };
}

/**
 * Validación de paths para prevenir path traversal en handlers IPC.
 *
 * Los handlers reciben rutas del renderer que podrían ser manipuladas
 * por un atacante. Este módulo las valida antes de pasarlas a subprocesos.
 *
 * Reglas:
 *  1. El path debe ser absoluto.
 *  2. El path resuelto debe estar dentro de un directorio de la allowlist.
 *
 * Ref: Issue #118
 */

import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { app } from "electron";

/**
 * Lanza un error si el path no es seguro.
 * Usar antes de pasar cualquier ruta del renderer a un subproceso.
 */
export function assertSafePath(inputPath: string): void {
	if (!isAbsolute(inputPath)) {
		throw new Error(
			`path traversal: se requiere ruta absoluta — "${inputPath}"`,
		);
	}

	// resolve() normaliza ../.. pero no sigue symlinks; realpathSync los resuelve.
	// Si el archivo aún no existe usamos resolve() como fallback (#150).
	let resolved: string;
	try {
		resolved = realpathSync(inputPath);
	} catch {
		resolved = resolve(inputPath);
	}

	const allowedRoots = [
		homedir(),
		app.getPath("userData"),
		app.getPath("documents"),
		app.getPath("temp"),
	];

	const isAllowed = allowedRoots.some((root) => resolved.startsWith(root));
	if (!isAllowed) {
		throw new Error(
			`path traversal: ruta fuera de directorios permitidos — "${resolved}"`,
		);
	}
}

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

import { lstatSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
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

	// Usar sep para evitar bypass de prefijo: "/home/juan" no debe aceptar
	// "/home/juanmalicious/file.pdf". Se requiere separador o igualdad exacta. (#177)
	const isAllowed = allowedRoots.some(
		(root) => resolved === root || resolved.startsWith(root + sep),
	);
	if (!isAllowed) {
		throw new Error(
			`path traversal: ruta fuera de directorios permitidos — "${resolved}"`,
		);
	}

	// SC-04 (#266): verificar que ningún componente intermedio del path resuelto
	// sea un symlink. realpathSync resuelve el destino final pero no protege contra
	// symlinks en subdirectorios intermedios dentro de allowedRoots.
	const components = resolved.split(sep).filter(Boolean);
	let current: string = sep;
	for (const component of components) {
		current = join(current, component);
		try {
			const stat = lstatSync(current); // lstat NO sigue symlinks
			if (stat.isSymbolicLink()) {
				throw new Error(
					`path traversal: symlink detectado en componente intermedio — "${current}"`,
				);
			}
		} catch (e) {
			if (e instanceof Error && e.message.includes("symlink detectado"))
				throw e;
			// El archivo aún no existe (nuevo archivo) — aceptar sin validar
			break;
		}
	}
}

/**
 * Logger mínimo para el Main Process de Electron.
 *
 * Duplica la interfaz pública de src/utils/logger para que los módulos
 * de electron/ no importen desde src/ (inversión de capas #193).
 * En producción se puede sustituir por electron-log sin cambiar los call-sites.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

class ElectronLogger {
	private level: LogLevel = "info";

	setLevel(level: LogLevel) {
		this.level = level;
	}

	private shouldLog(msgLevel: LogLevel): boolean {
		const levels: LogLevel[] = ["debug", "info", "warn", "error"];
		return levels.indexOf(msgLevel) >= levels.indexOf(this.level);
	}

	private fmt(level: string, mod: string, msg: string): string {
		const ts = new Date().toISOString().substring(11, 19);
		return `[${ts}] [${level.toUpperCase()}] [${mod}] ${msg}`;
	}

	debug(mod: string, msg: string, ...args: unknown[]) {
		if (this.shouldLog("debug"))
			console.debug(this.fmt("debug", mod, msg), ...args);
	}

	info(mod: string, msg: string, ...args: unknown[]) {
		if (this.shouldLog("info"))
			console.info(this.fmt("info", mod, msg), ...args);
	}

	warn(mod: string, msg: string, ...args: unknown[]) {
		if (this.shouldLog("warn"))
			console.warn(this.fmt("warn", mod, msg), ...args);
	}

	error(mod: string, msg: string, error?: unknown, ...args: unknown[]) {
		if (this.shouldLog("error"))
			console.error(this.fmt("error", mod, msg), error, ...args);
	}
}

export const logger = new ElectronLogger();

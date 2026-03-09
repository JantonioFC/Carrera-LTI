/**
 * Simple Logger para entornos Frontend
 * Provee niveles de logging y prefijos estandarizados, útil para debugging preventivo
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class StandardLogger {
	private level: LogLevel = "debug";

	setLevel(level: LogLevel) {
		this.level = level;
	}

	private shouldLog(msgLevel: LogLevel): boolean {
		const levels: LogLevel[] = ["debug", "info", "warn", "error"];
		return levels.indexOf(msgLevel) >= levels.indexOf(this.level);
	}

	private formatMessage(level: string, moduleName: string, message: string) {
		const timestamp = new Date().toISOString().substring(11, 19);
		return `[${timestamp}] [${level.toUpperCase()}] [${moduleName}] ${message}`;
	}

	debug(moduleName: string, message: string, ...args: any[]) {
		if (this.shouldLog("debug")) {
			console.debug(this.formatMessage("debug", moduleName, message), ...args);
		}
	}

	info(moduleName: string, message: string, ...args: any[]) {
		if (this.shouldLog("info")) {
			console.info(this.formatMessage("info", moduleName, message), ...args);
		}
	}

	warn(moduleName: string, message: string, ...args: any[]) {
		if (this.shouldLog("warn")) {
			console.warn(this.formatMessage("warn", moduleName, message), ...args);
		}
	}

	error(moduleName: string, message: string, error?: unknown, ...args: any[]) {
		if (this.shouldLog("error")) {
			console.error(
				this.formatMessage("error", moduleName, message),
				error,
				...args,
			);
		}
	}
}

export const logger = new StandardLogger();

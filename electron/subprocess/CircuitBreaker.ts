/**
 * Circuit Breaker para subprocesos que crashean — Issue #91
 *
 * Protege al proceso principal de Electron contra subprocesos que fallan
 * repetidamente. Implementa el patrón clásico de tres estados:
 *
 *   CLOSED   → operación normal. Cada fallo incrementa el contador.
 *              Si se alcanza failureThreshold, pasa a OPEN.
 *
 *   OPEN     → falla rápido (fast-fail) sin llamar al subproceso.
 *              Tras recoveryTimeMs, pasa a HALF_OPEN para probar.
 *
 *   HALF_OPEN → permite una sola llamada de prueba.
 *               Si tiene éxito → CLOSED (con contador reseteado).
 *               Si falla       → OPEN de nuevo (con timer reiniciado).
 *
 * Uso:
 *   const cb = new CircuitBreaker({ name: "docling", failureThreshold: 3 });
 *   const result = await cb.call(() => adapter.request(...));
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
	/** Nombre del subproceso — aparece en los mensajes de error. */
	name: string;
	/** Fallos consecutivos antes de abrir el circuito. Default: 3 */
	failureThreshold?: number;
	/** Milisegundos en OPEN antes de intentar HALF_OPEN. Default: 30 000 */
	recoveryTimeMs?: number;
}

export class CircuitBreaker {
	private readonly name: string;
	private readonly failureThreshold: number;
	private readonly recoveryTimeMs: number;

	private state: CircuitState = "CLOSED";
	private failureCount = 0;
	private openedAt: number | null = null;

	constructor({
		name,
		failureThreshold = 3,
		recoveryTimeMs = 30_000,
	}: CircuitBreakerOptions) {
		this.name = name;
		this.failureThreshold = failureThreshold;
		this.recoveryTimeMs = recoveryTimeMs;
	}

	getState(): CircuitState {
		return this.state;
	}

	getFailureCount(): number {
		return this.failureCount;
	}

	/** Fuerza el cierre del circuito y resetea contadores (útil tras reiniciar el subproceso). */
	reset(): void {
		this.state = "CLOSED";
		this.failureCount = 0;
		this.openedAt = null;
	}

	/**
	 * Ejecuta `fn` bajo la protección del circuit breaker.
	 * Lanza si el circuito está OPEN y no ha pasado el tiempo de recuperación.
	 */
	async call<T>(fn: () => Promise<T>): Promise<T> {
		if (this.state === "OPEN") {
			const elapsed = Date.now() - (this.openedAt ?? 0);
			if (elapsed < this.recoveryTimeMs) {
				throw new Error(
					`[CircuitBreaker:${this.name}] circuito abierto — ` +
						`reintentando en ${Math.ceil((this.recoveryTimeMs - elapsed) / 1000)}s`,
				);
			}
			// Ha pasado suficiente tiempo → probar con HALF_OPEN
			this.state = "HALF_OPEN";
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (err) {
			this.onFailure();
			throw err;
		}
	}

	private onSuccess(): void {
		this.failureCount = 0;
		this.openedAt = null;
		this.state = "CLOSED";
	}

	private onFailure(): void {
		this.failureCount++;
		if (
			this.state === "HALF_OPEN" ||
			this.failureCount >= this.failureThreshold
		) {
			this.state = "OPEN";
			this.openedAt = Date.now();
		}
	}
}

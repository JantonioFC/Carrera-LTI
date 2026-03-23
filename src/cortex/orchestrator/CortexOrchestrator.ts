/** Número máximo de crashes antes de detener reinicios automáticos */
const MAX_CRASH_COUNT = 3;

/** Tiempo mínimo de estabilidad para resetear el contador (ms) */
const STABILITY_RESET_MS = 60_000;

export interface RestartState {
	crashCount: number;
	lastStableAt: number | null;
}

/**
 * Decide si el orquestador debe reintentar lanzar un subproceso caído.
 *
 * Reglas:
 * - Si crashCount < MAX_CRASH_COUNT → reiniciar siempre.
 * - Si crashCount >= MAX_CRASH_COUNT y el proceso estuvo estable ≥ 60s
 *   antes del último crash → resetear y reiniciar (el crash fue puntual).
 * - En cualquier otro caso → no reiniciar (bucle de crashes detectado).
 */
export function shouldRestart(state: RestartState): boolean {
	const count = state.crashCount ?? 0;

	if (count < MAX_CRASH_COUNT) {
		return true;
	}

	// Verificar si hubo un período de estabilidad suficiente
	if (state.lastStableAt !== null) {
		const stableFor = Date.now() - state.lastStableAt;
		if (stableFor >= STABILITY_RESET_MS) {
			return true;
		}
	}

	return false;
}

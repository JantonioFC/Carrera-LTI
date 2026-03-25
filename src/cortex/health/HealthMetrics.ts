const INDEX_SIZE_ALERT_BYTES = 2 * 1024 ** 3; // 2 GB
const LATENCY_ALERT_MS = 5_000;
const SUCCESS_RATE_ALERT = 0.9;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

export type OverallStatus = "healthy" | "degraded";
export type AlertType = "index_size" | "low_success_rate" | "high_latency";

export interface HealthAlert {
	type: AlertType;
	message: string;
}

export interface HealthStatus {
	overall: OverallStatus;
	alerts: HealthAlert[];
}

export interface HealthSnapshot {
	avgLatencyMs: number;
	successRate: number;
	indexedDocCount: number;
	indexSizeBytes: number;
	sampledAt: number;
}

interface LatencySample {
	value: number;
	ts: number;
}
interface OpSample {
	success: boolean;
	ts: number;
}

/**
 * Recopila y evalúa métricas de salud de Cortex en tiempo real.
 *
 * Umbrales:
 * - índice > 2 GB → alerta index_size
 * - tasa de éxito < 90% → degraded + alerta low_success_rate
 * - latencia promedio > 5000ms → degraded + alerta high_latency
 *
 * Las muestras de latencia y operaciones solo consideran las últimas 24h.
 */
export class HealthMetrics {
	private latencies: LatencySample[] = [];
	private operations: OpSample[] = [];

	/** Registra una muestra de latencia en ms con timestamp opcional. */
	recordLatency(ms: number, ts = Date.now()): void {
		this.latencies.push({ value: ms, ts });
	}

	/** Registra el resultado (éxito/fallo) de una operación con timestamp opcional. */
	recordOperation(op: { success: boolean }, ts = Date.now()): void {
		this.operations.push({ success: op.success, ts });
	}

	/** Latencia promedio de las muestras de las últimas 24h. Retorna 0 si no hay muestras. */
	getAvgLatencyMs(): number {
		const recent = this.recentLatencies();
		if (recent.length === 0) return 0;
		return recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
	}

	/** Tasa de éxito de las últimas 24h. Retorna 1 si no hay operaciones registradas. */
	getSuccessRate(): number {
		const recent = this.recentOps();
		if (recent.length === 0) return 1;
		return recent.filter((o) => o.success).length / recent.length;
	}

	/** Evalúa un snapshot de métricas contra los umbrales y retorna el estado general con alertas. */
	computeStatus(snapshot: HealthSnapshot): HealthStatus {
		const alerts: HealthAlert[] = [];

		if (snapshot.indexSizeBytes > INDEX_SIZE_ALERT_BYTES) {
			const gb = (snapshot.indexSizeBytes / 1024 ** 3).toFixed(1);
			alerts.push({
				type: "index_size",
				message: `Índice ocupa ${gb} GB (límite: 2 GB)`,
			});
		}

		if (snapshot.successRate < SUCCESS_RATE_ALERT) {
			const pct = (snapshot.successRate * 100).toFixed(0);
			alerts.push({
				type: "low_success_rate",
				message: `Tasa de éxito: ${pct}% (mínimo: 90%)`,
			});
		}

		if (snapshot.avgLatencyMs > LATENCY_ALERT_MS) {
			alerts.push({
				type: "high_latency",
				message: `Latencia promedio: ${snapshot.avgLatencyMs}ms (límite: 5000ms)`,
			});
		}

		const overall: OverallStatus = alerts.length > 0 ? "degraded" : "healthy";
		return { overall, alerts };
	}

	private recentLatencies(): LatencySample[] {
		const cutoff = Date.now() - WINDOW_MS;
		return this.latencies.filter((s) => s.ts >= cutoff);
	}

	private recentOps(): OpSample[] {
		const cutoff = Date.now() - WINDOW_MS;
		return this.operations.filter((s) => s.ts >= cutoff);
	}
}

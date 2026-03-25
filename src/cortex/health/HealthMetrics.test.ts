import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthMetrics, type HealthSnapshot } from "./HealthMetrics";

const FIXED_NOW = 1_700_000_000_000; // 2023-11-14 22:13:20 UTC (determinístico)

function makeSnapshot(overrides: Partial<HealthSnapshot> = {}): HealthSnapshot {
	return {
		avgLatencyMs: 120,
		successRate: 0.98,
		indexedDocCount: 200,
		indexSizeBytes: 500 * 1024 * 1024, // 500 MB
		sampledAt: FIXED_NOW,
		...overrides,
	};
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("HealthMetrics — computeStatus", () => {
	it("should_return_healthy_when_all_metrics_are_nominal", () => {
		const m = new HealthMetrics();
		const status = m.computeStatus(makeSnapshot());
		expect(status.overall).toBe("healthy");
		expect(status.alerts).toHaveLength(0);
	});

	it("should_alert_when_index_exceeds_2GB", () => {
		const m = new HealthMetrics();
		const snapshot = makeSnapshot({ indexSizeBytes: 2.1 * 1024 ** 3 });
		const status = m.computeStatus(snapshot);
		expect(status.alerts.some((a) => a.type === "index_size")).toBe(true);
	});

	it("should_return_degraded_when_success_rate_below_90_percent", () => {
		const m = new HealthMetrics();
		const status = m.computeStatus(makeSnapshot({ successRate: 0.85 }));
		expect(status.overall).toBe("degraded");
		expect(status.alerts.some((a) => a.type === "low_success_rate")).toBe(true);
	});

	it("should_return_degraded_when_avg_latency_exceeds_5000ms", () => {
		const m = new HealthMetrics();
		const status = m.computeStatus(makeSnapshot({ avgLatencyMs: 6000 }));
		expect(status.overall).toBe("degraded");
		expect(status.alerts.some((a) => a.type === "high_latency")).toBe(true);
	});

	it("should_return_healthy_at_exactly_2GB_index", () => {
		const m = new HealthMetrics();
		const status = m.computeStatus(
			makeSnapshot({ indexSizeBytes: 2 * 1024 ** 3 }),
		);
		expect(status.alerts.some((a) => a.type === "index_size")).toBe(false);
	});

	it("should_accumulate_multiple_alerts", () => {
		const m = new HealthMetrics();
		const status = m.computeStatus(
			makeSnapshot({
				successRate: 0.8,
				avgLatencyMs: 7000,
				indexSizeBytes: 3 * 1024 ** 3,
			}),
		);
		expect(status.alerts).toHaveLength(3);
		expect(status.overall).toBe("degraded");
	});
});

describe("HealthMetrics — record y avgLatency", () => {
	it("should_compute_avg_latency_from_recorded_samples", () => {
		const m = new HealthMetrics();
		m.recordLatency(100);
		m.recordLatency(200);
		m.recordLatency(300);
		expect(m.getAvgLatencyMs()).toBe(200);
	});

	it("should_return_zero_avg_when_no_samples", () => {
		const m = new HealthMetrics();
		expect(m.getAvgLatencyMs()).toBe(0);
	});

	it("should_compute_success_rate_from_recorded_operations", () => {
		const m = new HealthMetrics();
		m.recordOperation({ success: true });
		m.recordOperation({ success: true });
		m.recordOperation({ success: false });
		expect(m.getSuccessRate()).toBeCloseTo(0.6667, 2);
	});

	it("should_return_1_when_no_operations_recorded", () => {
		const m = new HealthMetrics();
		expect(m.getSuccessRate()).toBe(1);
	});

	it("should_only_keep_last_24h_of_samples", () => {
		const m = new HealthMetrics();
		// Muestra antigua (>24h respecto a FIXED_NOW)
		m.recordLatency(9999, FIXED_NOW - 25 * 3_600_000);
		m.recordLatency(100, FIXED_NOW); // reciente
		expect(m.getAvgLatencyMs()).toBe(100);
	});
});

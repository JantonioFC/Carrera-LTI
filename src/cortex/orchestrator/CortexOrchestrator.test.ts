import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXED_NOW = 1_700_000_000_000; // 2023-11-14 22:13:20 UTC (determinístico)

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

import { shouldRestart } from "./CortexOrchestrator";

describe("CortexOrchestrator.shouldRestart", () => {
	// Happy path — por debajo del límite
	it("should_return_true_when_crash_count_below_limit", () => {
		expect(shouldRestart({ crashCount: 2, lastStableAt: null })).toBe(true);
	});

	// Límite exacto — 3 crashes sin estabilidad → no reiniciar
	it("should_return_false_when_crash_count_equals_limit", () => {
		expect(shouldRestart({ crashCount: 3, lastStableAt: null })).toBe(false);
	});

	// Supera límite
	it("should_return_false_when_crash_count_exceeds_limit", () => {
		expect(shouldRestart({ crashCount: 10, lastStableAt: null })).toBe(false);
	});

	// Reset tras 60s de estabilidad — incluso con crashCount en el límite
	it("should_reset_counter_when_stable_for_60_seconds", () => {
		const lastStableAt = FIXED_NOW - 61_000;
		expect(shouldRestart({ crashCount: 3, lastStableAt })).toBe(true);
	});

	// Estabilidad reciente (55s) — NO alcanza el umbral
	it("should_not_reset_counter_when_stable_for_less_than_60_seconds", () => {
		const lastStableAt = FIXED_NOW - 55_000;
		expect(shouldRestart({ crashCount: 3, lastStableAt })).toBe(false);
	});

	// Null safety
	it("should_handle_null_crash_count_gracefully", () => {
		expect(() =>
			shouldRestart({
				crashCount: null as unknown as number,
				lastStableAt: null,
			}),
		).not.toThrow();
	});

	// crashCount 0 siempre puede reiniciar
	it("should_return_true_when_crash_count_is_zero", () => {
		expect(shouldRestart({ crashCount: 0, lastStableAt: null })).toBe(true);
	});
});

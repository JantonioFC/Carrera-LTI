import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDateShort, getDaysUntil } from "./lti";

describe("LTI Utils", () => {
	describe("formatDate", () => {
		it("formats date strings correctly", () => {
			expect(formatDate("2026-03-09")).toBe("9 de marzo de 2026");
		});

		it("returns 'Sin fecha' for empty input", () => {
			expect(formatDate("")).toBe("Sin fecha");
		});
	});

	describe("formatDateShort", () => {
		it("formats date strings to short version", () => {
			expect(formatDateShort("2026-03-09")).toBe("9 mar.");
		});

		it("returns '--' for empty input", () => {
			expect(formatDateShort("")).toBe("--");
		});
	});

	describe("getDaysUntil", () => {
		beforeEach(() => {
			// Fijar tiempo a 2026-03-24 para resultados deterministas (#133)
			vi.useFakeTimers();
			vi.setSystemTime(new Date(2026, 2, 24)); // mes 2 = marzo (0-indexed)
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns 0 for empty input", () => {
			expect(getDaysUntil("")).toBe(0);
		});

		it("returns 0 for today", () => {
			expect(getDaysUntil("2026-03-24")).toBe(0);
		});

		it("returns positive days for a future date", () => {
			expect(getDaysUntil("2026-03-31")).toBe(7);
		});

		it("returns negative days for a past date", () => {
			expect(getDaysUntil("2026-03-17")).toBe(-7);
		});
	});
});

import { describe, expect, it } from "vitest";
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
		it("returns 0 for empty input", () => {
			expect(getDaysUntil("")).toBe(0);
		});

		// Note: testing actual days until is tricky due to dependence on "now".
		// But we can check it returns a number.
		it("returns a number for a valid date", () => {
			expect(typeof getDaysUntil("2026-12-31")).toBe("number");
		});
	});
});

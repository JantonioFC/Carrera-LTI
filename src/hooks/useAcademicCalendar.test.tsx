import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicDates } from "./useAcademicCalendar";
import { useAcademicCalendar } from "./useAcademicCalendar";

const STORAGE_KEY = "lti_academic_dates";

const DEFAULT_DATES: AcademicDates = {
	semesterStart: "2026-03-09",
	semesterEnd: "2026-06-26",
	examStart: "2026-06-29",
	examEnd: "2026-07-10",
	currentYear: 2026,
};

describe("useAcademicCalendar", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("returns default academic dates when localStorage is empty", () => {
		const { result } = renderHook(() => useAcademicCalendar());
		expect(result.current.academicDates).toEqual(DEFAULT_DATES);
	});

	it("loads academic dates from localStorage on init", () => {
		const customDates: AcademicDates = {
			semesterStart: "2026-04-01",
			semesterEnd: "2026-07-31",
			examStart: "2026-08-01",
			examEnd: "2026-08-15",
			currentYear: 2026,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(customDates));

		const { result } = renderHook(() => useAcademicCalendar());
		expect(result.current.academicDates).toEqual(customDates);
	});

	it("updateAcademicDates merges partial updates into existing dates", () => {
		const { result } = renderHook(() => useAcademicCalendar());

		act(() => {
			result.current.updateAcademicDates({ semesterStart: "2026-04-01" });
		});

		expect(result.current.academicDates.semesterStart).toBe("2026-04-01");
		// Other fields remain unchanged
		expect(result.current.academicDates.semesterEnd).toBe(
			DEFAULT_DATES.semesterEnd,
		);
		expect(result.current.academicDates.examStart).toBe(
			DEFAULT_DATES.examStart,
		);
		expect(result.current.academicDates.examEnd).toBe(DEFAULT_DATES.examEnd);
		expect(result.current.academicDates.currentYear).toBe(
			DEFAULT_DATES.currentYear,
		);
	});

	it("updateAcademicDates persists the merged result to localStorage", () => {
		const { result } = renderHook(() => useAcademicCalendar());

		act(() => {
			result.current.updateAcademicDates({ currentYear: 2027 });
		});

		const stored: AcademicDates = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? "{}",
		);
		expect(stored.currentYear).toBe(2027);
		expect(stored.semesterStart).toBe(DEFAULT_DATES.semesterStart);
	});

	it("updateAcademicDates can update multiple fields at once", () => {
		const { result } = renderHook(() => useAcademicCalendar());

		const partialUpdate: Partial<AcademicDates> = {
			examStart: "2026-07-01",
			examEnd: "2026-07-20",
		};

		act(() => {
			result.current.updateAcademicDates(partialUpdate);
		});

		expect(result.current.academicDates.examStart).toBe("2026-07-01");
		expect(result.current.academicDates.examEnd).toBe("2026-07-20");
	});

	it("updateAcademicDates does not overwrite unrelated fields", () => {
		const stored: AcademicDates = {
			...DEFAULT_DATES,
			semesterStart: "2026-03-15",
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

		const { result } = renderHook(() => useAcademicCalendar());

		act(() => {
			result.current.updateAcademicDates({ currentYear: 2027 });
		});

		expect(result.current.academicDates.semesterStart).toBe("2026-03-15");
		expect(result.current.academicDates.currentYear).toBe(2027);
	});

	it("falls back to defaults when localStorage contains invalid JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

		const { result } = renderHook(() => useAcademicCalendar());
		expect(result.current.academicDates).toEqual(DEFAULT_DATES);
	});

	it("exposes updateAcademicDates as a function", () => {
		const { result } = renderHook(() => useAcademicCalendar());
		expect(typeof result.current.updateAcademicDates).toBe("function");
	});
});

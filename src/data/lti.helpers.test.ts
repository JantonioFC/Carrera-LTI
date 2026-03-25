import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_ACADEMIC_DATES,
	EXAM_END,
	EXAM_START,
	SEMESTER_END,
	SEMESTER_START,
	TOTAL_CREDITS,
	WEEKDAY_SHORT,
	formatDate,
	formatDateShort,
	getDaysUntil,
	isDatePast,
} from "./lti.helpers";

// -----------------------------------------------------------------------
// TOTAL_CREDITS
// -----------------------------------------------------------------------
describe("TOTAL_CREDITS", () => {
	it("es igual a 356 (suma de todos los créditos del currículo Plan 2024)", () => {
		expect(TOTAL_CREDITS).toBe(356);
	});

	it("es un número positivo mayor que 0", () => {
		expect(TOTAL_CREDITS).toBeGreaterThan(0);
	});
});

// -----------------------------------------------------------------------
// DEFAULT_ACADEMIC_DATES y constantes exportadas
// -----------------------------------------------------------------------
describe("DEFAULT_ACADEMIC_DATES", () => {
	it("semesterStart es '2026-03-09'", () => {
		expect(DEFAULT_ACADEMIC_DATES.semesterStart).toBe("2026-03-09");
	});

	it("semesterEnd es '2026-06-26'", () => {
		expect(DEFAULT_ACADEMIC_DATES.semesterEnd).toBe("2026-06-26");
	});

	it("examStart es '2026-06-29'", () => {
		expect(DEFAULT_ACADEMIC_DATES.examStart).toBe("2026-06-29");
	});

	it("examEnd es '2026-07-10'", () => {
		expect(DEFAULT_ACADEMIC_DATES.examEnd).toBe("2026-07-10");
	});

	it("currentYear es 2026", () => {
		expect(DEFAULT_ACADEMIC_DATES.currentYear).toBe(2026);
	});
});

describe("Constantes de fechas exportadas", () => {
	it("SEMESTER_START coincide con DEFAULT_ACADEMIC_DATES.semesterStart", () => {
		expect(SEMESTER_START).toBe(DEFAULT_ACADEMIC_DATES.semesterStart);
	});

	it("SEMESTER_END coincide con DEFAULT_ACADEMIC_DATES.semesterEnd", () => {
		expect(SEMESTER_END).toBe(DEFAULT_ACADEMIC_DATES.semesterEnd);
	});

	it("EXAM_START coincide con DEFAULT_ACADEMIC_DATES.examStart", () => {
		expect(EXAM_START).toBe(DEFAULT_ACADEMIC_DATES.examStart);
	});

	it("EXAM_END coincide con DEFAULT_ACADEMIC_DATES.examEnd", () => {
		expect(EXAM_END).toBe(DEFAULT_ACADEMIC_DATES.examEnd);
	});
});

// -----------------------------------------------------------------------
// WEEKDAY_SHORT
// -----------------------------------------------------------------------
describe("WEEKDAY_SHORT", () => {
	it("contiene exactamente 7 entradas (0–6)", () => {
		expect(Object.keys(WEEKDAY_SHORT)).toHaveLength(7);
	});

	it("mapea domingo (0) → 'Dom'", () => {
		expect(WEEKDAY_SHORT[0]).toBe("Dom");
	});

	it("mapea lunes (1) → 'Lun'", () => {
		expect(WEEKDAY_SHORT[1]).toBe("Lun");
	});

	it("mapea viernes (5) → 'Vie'", () => {
		expect(WEEKDAY_SHORT[5]).toBe("Vie");
	});

	it("mapea sábado (6) → 'Sáb'", () => {
		expect(WEEKDAY_SHORT[6]).toBe("Sáb");
	});
});

// -----------------------------------------------------------------------
// formatDate
// -----------------------------------------------------------------------
describe("formatDate", () => {
	it("devuelve 'Sin fecha' cuando se le pasa string vacío", () => {
		expect(formatDate("")).toBe("Sin fecha");
	});

	it("formatea '2026-03-09' en español (contiene 'marzo' y '2026')", () => {
		const result = formatDate("2026-03-09");
		expect(result).toContain("2026");
		expect(result.toLowerCase()).toContain("marzo");
	});

	it("formatea '2026-01-01' y contiene 'enero'", () => {
		const result = formatDate("2026-01-01");
		expect(result.toLowerCase()).toContain("enero");
	});
});

// -----------------------------------------------------------------------
// formatDateShort
// -----------------------------------------------------------------------
describe("formatDateShort", () => {
	it("devuelve '--' cuando se le pasa string vacío", () => {
		expect(formatDateShort("")).toBe("--");
	});

	it("formatea '2026-06-26' y contiene 'jun' (forma corta)", () => {
		const result = formatDateShort("2026-06-26");
		expect(result.toLowerCase()).toMatch(/jun/);
	});

	it("formatea '2026-03-09' y contiene '9'", () => {
		const result = formatDateShort("2026-03-09");
		expect(result).toContain("9");
	});
});

// -----------------------------------------------------------------------
// getDaysUntil  (determinista con vi.setSystemTime)
// -----------------------------------------------------------------------
describe("getDaysUntil", () => {
	beforeEach(() => {
		// Fijar la fecha del sistema al 2026-03-24 (medianoche local)
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 24, 0, 0, 0)); // mes 2 = marzo
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("devuelve 0 cuando se le pasa string vacío", () => {
		expect(getDaysUntil("")).toBe(0);
	});

	it("devuelve 0 para la fecha de hoy", () => {
		expect(getDaysUntil("2026-03-24")).toBe(0);
	});

	it("devuelve 1 para mañana", () => {
		expect(getDaysUntil("2026-03-25")).toBe(1);
	});

	it("devuelve -1 para ayer", () => {
		expect(getDaysUntil("2026-03-23")).toBe(-1);
	});

	it("devuelve 7 para exactamente una semana en el futuro", () => {
		expect(getDaysUntil("2026-03-31")).toBe(7);
	});

	it("devuelve un número positivo para SEMESTER_END (2026-06-26 es posterior al 2026-03-24)", () => {
		expect(getDaysUntil("2026-06-26")).toBeGreaterThan(0);
	});
});

// -----------------------------------------------------------------------
// isDatePast
// -----------------------------------------------------------------------
describe("isDatePast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 24, 0, 0, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("devuelve true para una fecha pasada", () => {
		expect(isDatePast("2026-03-23")).toBe(true);
	});

	it("devuelve false para la fecha de hoy", () => {
		expect(isDatePast("2026-03-24")).toBe(false);
	});

	it("devuelve false para una fecha futura", () => {
		expect(isDatePast("2026-03-25")).toBe(false);
	});

	it("devuelve false para el fin del semestre (2026-06-26)", () => {
		expect(isDatePast("2026-06-26")).toBe(false);
	});
});

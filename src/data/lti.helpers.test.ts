import { describe, expect, it } from "vitest";
import {
	CURRENT_SEMESTER,
	DEFAULT_ACADEMIC_DATES,
	EXAM_END,
	EXAM_START,
	formatDate,
	formatDateShort,
	getDaysUntil,
	isDatePast,
	SEDE,
	SEMESTER_END,
	SEMESTER_START,
	TOTAL_CREDITS,
	WEEKDAY_SHORT,
} from "./lti.helpers";

// ---------------------------------------------------------------------------
// Helpers locales para construir fechas relativas al día de hoy
// ---------------------------------------------------------------------------
function todayStr(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function offsetDateStr(deltaDays: number): string {
	const d = new Date();
	d.setDate(d.getDate() + deltaDays);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// TOTAL_CREDITS
// ---------------------------------------------------------------------------
describe("TOTAL_CREDITS", () => {
	it("es un número positivo", () => {
		expect(TOTAL_CREDITS).toBeGreaterThan(0);
	});

	it("es igual a 356 (suma de créditos del Plan 2024 — 8 semestres)", () => {
		expect(TOTAL_CREDITS).toBe(356);
	});
});

// ---------------------------------------------------------------------------
// DEFAULT_ACADEMIC_DATES
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Constantes exportadas
// ---------------------------------------------------------------------------
describe("Constantes exportadas de fechas", () => {
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

	it("CURRENT_SEMESTER es 1", () => {
		expect(CURRENT_SEMESTER).toBe(1);
	});

	it("SEDE es 'Minas'", () => {
		expect(SEDE).toBe("Minas");
	});
});

// ---------------------------------------------------------------------------
// WEEKDAY_SHORT
// ---------------------------------------------------------------------------
describe("WEEKDAY_SHORT", () => {
	it("tiene exactamente 7 entradas (0–6)", () => {
		expect(Object.keys(WEEKDAY_SHORT)).toHaveLength(7);
	});

	it("domingo (0) → 'Dom'", () => {
		expect(WEEKDAY_SHORT[0]).toBe("Dom");
	});

	it("lunes (1) → 'Lun'", () => {
		expect(WEEKDAY_SHORT[1]).toBe("Lun");
	});

	it("martes (2) → 'Mar'", () => {
		expect(WEEKDAY_SHORT[2]).toBe("Mar");
	});

	it("miércoles (3) → 'Mié'", () => {
		expect(WEEKDAY_SHORT[3]).toBe("Mié");
	});

	it("jueves (4) → 'Jue'", () => {
		expect(WEEKDAY_SHORT[4]).toBe("Jue");
	});

	it("viernes (5) → 'Vie'", () => {
		expect(WEEKDAY_SHORT[5]).toBe("Vie");
	});

	it("sábado (6) → 'Sáb'", () => {
		expect(WEEKDAY_SHORT[6]).toBe("Sáb");
	});
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
	it("devuelve 'Sin fecha' para string vacío", () => {
		expect(formatDate("")).toBe("Sin fecha");
	});

	it("formatea '2026-03-09': contiene '2026' y 'marzo'", () => {
		const r = formatDate("2026-03-09");
		expect(r).toContain("2026");
		expect(r.toLowerCase()).toContain("marzo");
	});

	it("formatea '2026-01-01': contiene 'enero'", () => {
		expect(formatDate("2026-01-01").toLowerCase()).toContain("enero");
	});

	it("formatea '2026-12-31': contiene 'diciembre'", () => {
		expect(formatDate("2026-12-31").toLowerCase()).toContain("diciembre");
	});

	it("formatea '2000-07-04' (fecha pasada): contiene 'julio' y '2000'", () => {
		const r = formatDate("2000-07-04");
		expect(r.toLowerCase()).toContain("julio");
		expect(r).toContain("2000");
	});

	it("formatea '2099-06-15' (fecha futura lejana): contiene 'junio' y '2099'", () => {
		const r = formatDate("2099-06-15");
		expect(r.toLowerCase()).toContain("junio");
		expect(r).toContain("2099");
	});

	it("el resultado es más largo que formatDateShort para la misma fecha", () => {
		const date = "2026-03-09";
		expect(formatDate(date).length).toBeGreaterThan(
			formatDateShort(date).length,
		);
	});
});

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------
describe("formatDateShort", () => {
	it("devuelve '--' para string vacío", () => {
		expect(formatDateShort("")).toBe("--");
	});

	it("formatea '2026-03-09': contiene '9' y no el año '2026'", () => {
		const r = formatDateShort("2026-03-09");
		expect(r).toContain("9");
		expect(r).not.toContain("2026");
	});

	it("formatea '2026-06-26': contiene 'jun'", () => {
		expect(formatDateShort("2026-06-26").toLowerCase()).toMatch(/jun/);
	});

	it("formatea '2020-12-25': contiene 'dic'", () => {
		expect(formatDateShort("2020-12-25").toLowerCase()).toMatch(/dic/);
	});

	it("formatea '2026-01-01': contiene 'ene'", () => {
		expect(formatDateShort("2026-01-01").toLowerCase()).toMatch(/ene/);
	});
});

// ---------------------------------------------------------------------------
// getDaysUntil  (sin mocks — fechas construidas dinámicamente)
// ---------------------------------------------------------------------------
describe("getDaysUntil", () => {
	it("devuelve 0 para string vacío", () => {
		expect(getDaysUntil("")).toBe(0);
	});

	it("devuelve 0 para la fecha de hoy", () => {
		expect(getDaysUntil(todayStr())).toBe(0);
	});

	it("devuelve 1 para mañana", () => {
		expect(getDaysUntil(offsetDateStr(1))).toBe(1);
	});

	it("devuelve -1 para ayer", () => {
		expect(getDaysUntil(offsetDateStr(-1))).toBe(-1);
	});

	it("devuelve 7 para exactamente una semana en el futuro", () => {
		expect(getDaysUntil(offsetDateStr(7))).toBe(7);
	});

	it("devuelve -30 para hace 30 días", () => {
		expect(getDaysUntil(offsetDateStr(-30))).toBe(-30);
	});

	it("devuelve un entero (no fracción)", () => {
		expect(Number.isInteger(getDaysUntil(offsetDateStr(3)))).toBe(true);
	});

	it("devuelve un número positivo para una fecha futura lejana (2099-01-01)", () => {
		expect(getDaysUntil("2099-01-01")).toBeGreaterThan(0);
	});

	it("devuelve un número negativo para una fecha pasada lejana (2000-01-01)", () => {
		expect(getDaysUntil("2000-01-01")).toBeLessThan(0);
	});
});

// ---------------------------------------------------------------------------
// isDatePast
// ---------------------------------------------------------------------------
describe("isDatePast", () => {
	it("devuelve false para string vacío (getDaysUntil retorna 0, que no es < 0)", () => {
		expect(isDatePast("")).toBe(false);
	});

	it("devuelve false para la fecha de hoy", () => {
		expect(isDatePast(todayStr())).toBe(false);
	});

	it("devuelve false para mañana", () => {
		expect(isDatePast(offsetDateStr(1))).toBe(false);
	});

	it("devuelve true para ayer", () => {
		expect(isDatePast(offsetDateStr(-1))).toBe(true);
	});

	it("devuelve true para una fecha pasada lejana (2000-01-01)", () => {
		expect(isDatePast("2000-01-01")).toBe(true);
	});

	it("devuelve false para una fecha futura lejana (2099-12-31)", () => {
		expect(isDatePast("2099-12-31")).toBe(false);
	});

	it("isDatePast es consistente con getDaysUntil < 0 para ayer", () => {
		const date = offsetDateStr(-5);
		expect(isDatePast(date)).toBe(getDaysUntil(date) < 0);
	});

	it("isDatePast es consistente con getDaysUntil < 0 para mañana", () => {
		const date = offsetDateStr(5);
		expect(isDatePast(date)).toBe(getDaysUntil(date) < 0);
	});
});

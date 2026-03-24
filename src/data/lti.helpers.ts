// Helpers de fechas y constantes académicas — split from lti.ts (#76)

import { CURRICULUM } from "./lti.curriculum";

// ---- HELPERS ----
export const TOTAL_CREDITS = CURRICULUM.reduce(
	(acc, sem) => acc + sem.subjects.reduce((a, s) => a + s.credits, 0),
	0,
);

// ---- FECHAS ACADÉMICAS PREDETERMINADAS ----
export const DEFAULT_ACADEMIC_DATES = {
	semesterStart: "2026-03-09",
	semesterEnd: "2026-06-26",
	examStart: "2026-06-29",
	examEnd: "2026-07-10",
	currentYear: 2026,
};

export const SEMESTER_START = DEFAULT_ACADEMIC_DATES.semesterStart;
export const SEMESTER_END = DEFAULT_ACADEMIC_DATES.semesterEnd;
export const EXAM_START = DEFAULT_ACADEMIC_DATES.examStart;
export const EXAM_END = DEFAULT_ACADEMIC_DATES.examEnd;
export const CURRENT_SEMESTER = 1;
export const SEDE = "Minas";

export function formatDate(dateStr: string): string {
	if (!dateStr) return "Sin fecha";
	const [year, month, day] = dateStr.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	return date.toLocaleDateString("es-UY", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function formatDateShort(dateStr: string): string {
	if (!dateStr) return "--";
	const [year, month, day] = dateStr.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	return date.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

export function getDaysUntil(dateStr: string): number {
	if (!dateStr) return 0;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const [year, month, day] = dateStr.split("-").map(Number);
	const target = new Date(year, month - 1, day);
	return Math.ceil(
		(target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);
}

export function isDatePast(dateStr: string): boolean {
	return getDaysUntil(dateStr) < 0;
}

export const WEEKDAY_SHORT: Record<number, string> = {
	0: "Dom",
	1: "Lun",
	2: "Mar",
	3: "Mié",
	4: "Jue",
	5: "Vie",
	6: "Sáb",
};

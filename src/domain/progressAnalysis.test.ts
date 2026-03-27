import { describe, expect, it } from "vitest";
import { CURRICULUM, TOTAL_CREDITS } from "../data/lti";
import type { SubjectData } from "../hooks/useSubjectData";
import {
	calculateProgressStats,
	calculateSemesterAverages,
} from "./progressAnalysis";

// Construir un mapa vacío (todas las materias en estado por defecto)
function emptyData(): Record<string, SubjectData> {
	return {};
}

// Construir un mapa con todas las materias aprobadas con nota
function approveAll(grade = 8): Record<string, SubjectData> {
	const data: Record<string, SubjectData> = {};
	for (const sem of CURRICULUM) {
		for (const sub of sem.subjects) {
			data[sub.id] = { status: "aprobada", grade, resources: [] };
		}
	}
	return data;
}

// Construir un mapa con algunas materias en curso
function someInProgress(ids: string[]): Record<string, SubjectData> {
	const data: Record<string, SubjectData> = {};
	for (const id of ids) {
		data[id] = { status: "en_curso", resources: [] };
	}
	return data;
}

describe("calculateProgressStats", () => {
	it("data vacía → 0 aprobados, 0 en curso, totalMissing = TOTAL_CREDITS", () => {
		const stats = calculateProgressStats(emptyData());
		expect(stats.totalApproved).toBe(0);
		expect(stats.totalInProgress).toBe(0);
		expect(stats.totalMissing).toBe(TOTAL_CREDITS);
	});

	it("todas aprobadas → totalApproved = TOTAL_CREDITS, missing = 0", () => {
		const stats = calculateProgressStats(approveAll());
		expect(stats.totalApproved).toBe(TOTAL_CREDITS);
		expect(stats.totalMissing).toBe(0);
		expect(stats.totalInProgress).toBe(0);
	});

	it("totalApproved + totalInProgress + totalMissing siempre = TOTAL_CREDITS", () => {
		const firstSubject = CURRICULUM[0]!.subjects[0]!;
		const data = someInProgress([firstSubject.id]);
		const stats = calculateProgressStats(data);
		expect(
			stats.totalApproved + stats.totalInProgress + stats.totalMissing,
		).toBe(TOTAL_CREDITS);
	});

	it("materias en curso suman créditos correctamente", () => {
		const firstTwoSubs = CURRICULUM[0]!.subjects.slice(0, 2);
		const expectedCredits = firstTwoSubs.reduce((acc, s) => acc + s.credits, 0);
		const data = someInProgress(firstTwoSubs.map((s) => s.id));
		const stats = calculateProgressStats(data);
		expect(stats.totalInProgress).toBe(expectedCredits);
	});

	it("status desconocido no cuenta como aprobada ni en_curso", () => {
		const id = CURRICULUM[0]!.subjects[0]!.id;
		const data: Record<string, SubjectData> = {
			[id]: { status: "pendiente", resources: [] },
		};
		const stats = calculateProgressStats(data);
		expect(stats.totalApproved).toBe(0);
		expect(stats.totalInProgress).toBe(0);
	});
});

describe("calculateSemesterAverages", () => {
	it("data vacía → todos los semestres con Promedio 0", () => {
		const averages = calculateSemesterAverages(emptyData());
		expect(averages).toHaveLength(CURRICULUM.length);
		for (const avg of averages) {
			expect(avg.Promedio).toBe(0);
		}
	});

	it("nombres siguen el formato S1, S2, ..., S8", () => {
		const averages = calculateSemesterAverages(emptyData());
		averages.forEach((avg, i) => {
			expect(avg.name).toBe(`S${CURRICULUM[i]!.number}`);
		});
	});

	it("promedio correcto cuando todas las materias del semestre tienen nota", () => {
		const sem = CURRICULUM[0]!;
		const data: Record<string, SubjectData> = {};
		for (const sub of sem.subjects) {
			data[sub.id] = { status: "aprobada", grade: 10, resources: [] };
		}
		const averages = calculateSemesterAverages(data);
		expect(averages[0]!.Promedio).toBe(10);
	});

	it("ignora materias aprobadas sin grade en el cálculo", () => {
		const sem = CURRICULUM[0]!;
		const data: Record<string, SubjectData> = {};
		for (const sub of sem.subjects) {
			data[sub.id] = { status: "aprobada", resources: [] }; // sin grade
		}
		const averages = calculateSemesterAverages(data);
		// Sin notas, el filtro excluye todas → Promedio 0
		expect(averages[0]!.Promedio).toBe(0);
	});

	it("Promedio tiene como máximo 1 decimal", () => {
		const sem = CURRICULUM[0]!;
		const data: Record<string, SubjectData> = {};
		sem.subjects.forEach((sub, i) => {
			data[sub.id] = {
				status: "aprobada",
				grade: i % 2 === 0 ? 7 : 8,
				resources: [],
			};
		});
		const averages = calculateSemesterAverages(data);
		const promedioStr = averages[0]!.Promedio.toString();
		const decimals = promedioStr.includes(".")
			? promedioStr.split(".")[1]!.length
			: 0;
		expect(decimals).toBeLessThanOrEqual(1);
	});
});

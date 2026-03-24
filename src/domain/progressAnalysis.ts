import { CURRICULUM, TOTAL_CREDITS } from "../data/lti";
import type { SubjectData } from "../hooks/useSubjectData";

// Calculado una sola vez al cargar el módulo para evitar flatMap repetido (#69)
const ALL_SUBJECTS = CURRICULUM.flatMap((s) => s.subjects);

export interface ProgressStats {
	totalApproved: number;
	totalInProgress: number;
	totalMissing: number;
}

export interface SemesterAverage {
	name: string;
	Promedio: number;
}

export function calculateProgressStats(
	data: Record<string, SubjectData>,
): ProgressStats {
	const totalApproved = ALL_SUBJECTS.filter(
		(s) => data[s.id]?.status === "aprobada",
	).reduce((acc, s) => acc + s.credits, 0);

	const totalInProgress = ALL_SUBJECTS.filter(
		(s) => data[s.id]?.status === "en_curso",
	).reduce((acc, s) => acc + s.credits, 0);

	const totalMissing = TOTAL_CREDITS - totalApproved - totalInProgress;

	return { totalApproved, totalInProgress, totalMissing };
}

export function calculateSemesterAverages(
	data: Record<string, SubjectData>,
): SemesterAverage[] {
	return CURRICULUM.map((sem) => {
		const semSubjects = sem.subjects.filter(
			(s) =>
				data[s.id]?.status === "aprobada" && data[s.id]?.grade !== undefined,
		);
		const avg =
			semSubjects.length > 0
				? semSubjects.reduce((acc, s) => acc + (data[s.id]?.grade || 0), 0) /
					semSubjects.length
				: 0;
		return {
			name: `S${sem.number}`,
			Promedio: Number(avg.toFixed(1)),
		};
	});
}

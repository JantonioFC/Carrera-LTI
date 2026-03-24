// ============================================================
// DATOS COMPLETOS: Licenciatura en Tecnologías de la Información
// UTEC Uruguay — Plan 2024 (Res. 127-24)
// ============================================================

export type SubjectStatus = "en_curso" | "pendiente" | "aprobada" | "reprobada";

export interface Subject {
	id: string;
	name: string;
	credits: number;
	semester: number;
	color: string;
	area: string;
	status: SubjectStatus;
	startDate?: string;
	endDate?: string;
	grade?: number;
}

export interface PresencialEvent {
	id: string;
	date: string;
	activity: string;
	area: string;
	includesEval: boolean;
	sede: string;
	hours: string;
}

export interface Semester {
	number: number;
	label: string;
	subjects: Subject[];
}

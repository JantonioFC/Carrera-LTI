import { AlertCircle } from "lucide-react";
import {
	EXAM_END,
	EXAM_START,
	formatDate,
	formatDateShort,
	getDaysUntil,
	type PresencialEvent,
	SEMESTER_START,
} from "../../data/lti";

interface DashboardSummaryProps {
	average: number;
	approved: number;
	upcomingPresenciales: PresencialEvent[];
}

export function DashboardSummary({
	average,
	approved,
	upcomingPresenciales,
}: DashboardSummaryProps) {
	const daysToStart = getDaysUntil(SEMESTER_START);

	return (
		<div className="@container">
			<div className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4 gap-4">
				<div className="card @container p-5 col-span-1 border-l-4 border-lti-blue/50">
					<p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
						Promedio General
					</p>
					<div className="flex items-end gap-2 mt-1">
						<p className="text-white text-2xl font-bold">
							{average > 0 ? average.toFixed(1) : "--"}
						</p>
						<p className="text-lti-blue text-sm mb-1 font-medium @[200px]:block hidden">
							{approved > 0 ? `${approved} UC aprobadas` : "Sin notas"}
						</p>
					</div>
				</div>
				<div className="card @container p-5 col-span-1 border-l-4 border-lti-blue">
					<p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
						Inicio del Semestre
					</p>
					<p className="text-white text-xl font-bold mt-1">
						{formatDate(SEMESTER_START)}
					</p>
					<p
						className={`text-sm mt-1 font-medium flex items-center gap-1 ${daysToStart > 0 ? "text-lti-blue" : "text-green-400"}`}
					>
						{daysToStart <= 0 && <AlertCircle size={12} />}
						{daysToStart > 0 ? `En ${daysToStart} días` : "En curso"}
					</p>
				</div>
				<div className="card @container p-5 border-l-4 border-lti-orange">
					<p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
						Período de Exámenes
					</p>
					<p className="text-white text-sm font-bold mt-1">
						{formatDateShort(EXAM_START)} — {formatDateShort(EXAM_END)}
					</p>
					<p className="text-lti-orange text-sm mt-1 font-medium">
						En {getDaysUntil(EXAM_START)} días
					</p>
				</div>
				<div className="card @container p-5 border-l-4 border-purple-500 flex flex-col justify-between">
					<p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
						Instancias Presenciales
					</p>
					<div className="flex items-baseline gap-2 mt-1">
						<p className="text-white text-2xl font-bold">
							{upcomingPresenciales.length}
						</p>
						<p className="text-purple-400 text-sm font-medium @[150px]:block hidden">
							pendientes
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

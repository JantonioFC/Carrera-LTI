import { AlertCircle } from "lucide-react";
import {
	formatDate,
	formatDateShort,
	getDaysUntil,
	type PresencialEvent,
} from "../../data/lti";
import { useAcademicCalendar } from "../../hooks/useAcademicCalendar";

interface DashboardSummaryProps {
	average: number;
	approved: number;
	approvedCount: number;
	upcomingPresenciales: PresencialEvent[];
}

export function DashboardSummary({
	average,
	approved,
	approvedCount,
	upcomingPresenciales,
}: DashboardSummaryProps) {
	const { academicDates } = useAcademicCalendar();
	const daysToStart = getDaysUntil(academicDates.semesterStart);

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
							{approvedCount > 0 ? `${approvedCount} UC | ${approved} Cr.` : "Sin notas"}
						</p>
					</div>
				</div>
				<div className="card @container p-5 col-span-1 border-l-4 border-lti-blue">
					<p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
						Inicio del Semestre
					</p>
					<p className="text-white text-xl font-bold mt-1">
						{formatDate(academicDates.semesterStart)}
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
						{formatDateShort(academicDates.examStart)} — {formatDateShort(academicDates.examEnd)}
					</p>
					<p className="text-lti-orange text-sm mt-1 font-medium">
						En {getDaysUntil(academicDates.examStart)} días
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

import { useMemo, useState } from "react";
import { AnalyticsCharts } from "../components/dashboard/AnalyticsCharts";
import { DashboardSummary } from "../components/dashboard/DashboardSummary";
import { EditPresencialModal } from "../components/dashboard/EditPresencialModal";
import { PresencialesList } from "../components/dashboard/PresencialesList";
import { SemesterSubjects } from "../components/dashboard/SemesterSubjects";
import {
	CURRICULUM,
	getDaysUntil,
	type PresencialEvent,
	SEMESTER_START,
} from "../data/lti";
import {
	calculateProgressStats,
	calculateSemesterAverages,
} from "../domain/progressAnalysis";
import { useSubjectData } from "../hooks/useSubjectData";

interface DashboardProps {
	presenciales: PresencialEvent[];
	onUpdatePresenciales: (p: PresencialEvent[]) => void;
}

export default function Dashboard({
	presenciales,
	onUpdatePresenciales,
}: DashboardProps) {
	const [editingEvent, setEditingEvent] = useState<PresencialEvent | null>(
		null,
	);
	const daysToStart = getDaysUntil(SEMESTER_START);
	const sem1 = CURRICULUM[0].subjects;

	const { data, getAverage, getApprovedCredits } = useSubjectData();
	const average = getAverage();
	const approved = getApprovedCredits();

	const upcomingPresenciales = useMemo(() => {
		return presenciales
			.filter((p) => getDaysUntil(p.date) >= 0)
			.sort((a, b) => a.date.localeCompare(b.date));
	}, [presenciales]);

	const handleSaveEvent = (updated: PresencialEvent) => {
		const newList = presenciales.map((p) =>
			p.id === updated.id ? updated : p,
		);
		onUpdatePresenciales(newList);
		setEditingEvent(null);
	};

	const handleDeleteEvent = (id: string) => {
		onUpdatePresenciales(presenciales.filter((p) => p.id !== id));
		setEditingEvent(null);
	};

	// Charts Data
	const { totalApproved, totalInProgress, totalMissing } = useMemo(
		() => calculateProgressStats(data),
		[data],
	);

	const pieData = useMemo(
		() => [
			{ name: "Aprobados", value: totalApproved, color: "#10b981" },
			{ name: "En curso", value: totalInProgress, color: "#3b82f6" },
			{ name: "Pendientes", value: totalMissing, color: "#475569" },
		],
		[totalApproved, totalInProgress, totalMissing],
	);

	const barData = useMemo(() => calculateSemesterAverages(data), [data]);

	return (
		<div className="p-6 space-y-6 animate-fade-in">
			{/* Header */}
			<header className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Dashboard</h1>
					<p className="text-slate-400 text-sm mt-0.5">
						{new Date().toLocaleDateString("es-UY", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</p>
				</div>
				<div
					className={`px-4 py-2 rounded-xl text-sm font-semibold ${
						daysToStart > 0
							? "bg-lti-blue/10 text-lti-blue border border-lti-blue/20"
							: "bg-green-500/10 text-green-400 border border-green-500/20"
					}`}
				>
					{daysToStart > 0
						? `🎓 El semestre comienza en ${daysToStart} día${daysToStart !== 1 ? "s" : ""}`
						: "🎓 Semestre en curso"}
				</div>
			</header>

			{/* Countdown + Stats */}
			<DashboardSummary
				average={average}
				approved={approved}
				upcomingPresenciales={upcomingPresenciales}
			/>

			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
					<PresencialesList
						presenciales={presenciales}
						onEdit={setEditingEvent}
					/>
					<SemesterSubjects subjects={sem1} />
				</div>
			</div>

			<AnalyticsCharts
				pieData={pieData}
				barData={barData}
				totalApproved={totalApproved}
			/>

			{/* Edit modal */}
			{editingEvent && (
				<EditPresencialModal
					event={editingEvent}
					onSave={handleSaveEvent}
					onDelete={handleDeleteEvent}
					onClose={() => setEditingEvent(null)}
				/>
			)}
		</div>
	);
}

import {
	AlertCircle,
	ExternalLink,
	FolderRoot,
	History,
	Layers,
	LogIn,
	Mail,
	Minus,
	RefreshCw,
	Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	const [isCreating, setIsCreating] = useState(false);
	const daysToStart = getDaysUntil(SEMESTER_START);
	const sem1 = CURRICULUM[0].subjects;

	const { data, getAverage, getApprovedCredits, getApprovedCount } =
		useSubjectData();
	const average = getAverage();
	const approved = getApprovedCredits();
	const approvedCount = getApprovedCount();

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
				<div className="flex items-center gap-4">
					<button
						onClick={() => setIsCreating(true)}
						className="px-4 py-2 rounded-xl text-sm font-semibold bg-lti-blue/10 text-lti-blue border border-lti-blue/20 hover:bg-lti-blue/20 transition-colors"
					>
						Añadir Instancia
					</button>
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
				</div>
			</header>

			{/* Countdown + Stats */}
			<DashboardSummary
				average={average}
				approved={approved}
				approvedCount={approvedCount}
				upcomingPresenciales={upcomingPresenciales}
			/>

			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
					<PresencialesList
						presenciales={presenciales}
						onEdit={setEditingEvent}
					/>
					<div className="space-y-6">
						<SemesterSubjects subjects={sem1} />
						
						{/* Automated Infrastructure (Eje 2.2) */}
						<div className="card p-5 space-y-4 border-t-2 border-lti-blue/30 overflow-hidden relative">
							<div className="absolute top-0 right-0 p-4 opacity-5">
								<FolderRoot size={80} />
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Layers size={18} className="text-lti-blue" />
									<h2 className="text-white font-bold text-sm uppercase tracking-tight">Infraestructura de Datos</h2>
								</div>
								<span className="text-[10px] text-slate-500 font-mono bg-navy-900 px-2 py-1 rounded border border-navy-800">
									SYSTEM_ORCHESTRATOR_V1
								</span>
							</div>
							
							<div className="space-y-2">
								{Object.entries(data).filter(([_, d]) => d.status === "en_curso").length === 0 ? (
									<div className="py-8 text-center border-2 border-dashed border-navy-800 rounded-xl">
										<p className="text-xs text-slate-500 italic">No hay materias activas para orquestar infraestructura.</p>
									</div>
								) : (
									Object.entries(data)
										.filter(([_, d]) => d.status === "en_curso")
										.map(([id, d]) => {
											const subject = CURRICULUM.flatMap(s => s.subjects).find(s => s.id === id);
											return (
												<div key={id} className="flex items-center justify-between p-3 bg-navy-900/40 rounded-xl border border-navy-700/30 group hover:border-lti-blue/30 transition-all">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-lg bg-lti-blue/10 flex items-center justify-center text-lti-blue">
															<FolderRoot size={16} />
														</div>
														<div>
															<p className="text-xs font-bold text-white leading-none mb-1">{subject?.name}</p>
															<p className="text-[10px] text-slate-500 font-mono">/mnt/nexus/knowledge/{id}</p>
														</div>
													</div>
													<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
														<button className="p-1.5 hover:bg-navy-800 rounded text-slate-400"><History size={12} /></button>
														<button className="p-1.5 hover:bg-navy-800 rounded text-slate-400"><ExternalLink size={12} /></button>
													</div>
												</div>
											);
										})
								)}
							</div>
							
							<div className="flex items-center gap-2 pt-2">
								<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
								<p className="text-[10px] text-slate-500 font-medium">Grafo de sincronización activo y sincronizado</p>
							</div>
						</div>
					</div>
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

			{isCreating && (
				<EditPresencialModal
					onSave={(newEvent) => {
						onUpdatePresenciales([...presenciales, newEvent]);
						setIsCreating(false);
					}}
					onClose={() => setIsCreating(false)}
				/>
			)}
		</div>
	);
}

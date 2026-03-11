import {
	BookMarked,
	BotMessageSquare,
	BrainCircuit,
	Calendar,
	CheckSquare,
	Cloud,
	CloudOff,
	Database,
	LayoutDashboard,
	LayoutTemplate,
	Map,
	Maximize,
	RefreshCw,
	Sparkles,
	X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { PresencialEvent } from "../data/lti";
import { useCloudSync } from "../hooks/useCloudSync";
import type { ScheduleItem } from "../pages/Horarios";
import type { Task } from "../pages/Tareas";

interface SidebarProps {
	presenciales: PresencialEvent[];
	onUpdatePresenciales: (events: PresencialEvent[]) => void;
	calendarEvents: Record<string, any[]>;
	onUpdateCalendarEvents: (events: Record<string, any[]>) => void;
	tasks: Task[];
	onUpdateTasks: (tasks: Task[]) => void;
	schedule: ScheduleItem[];
	onUpdateSchedule: (schedule: ScheduleItem[]) => void;
	onCloseMobile?: () => void;
}

const navItems: { path: string; label: string; icon: React.ReactNode }[] = [
	{ path: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
	{ path: "/materias", label: "U.C.", icon: <BookMarked size={20} /> },
	{ path: "/calendario", label: "Calendario", icon: <Calendar size={20} /> },
	{ path: "/malla", label: "Malla Curricular", icon: <Map size={20} /> },
	{ path: "/tareas", label: "Tareas", icon: <CheckSquare size={20} /> },
	{ path: "/horarios", label: "Horarios", icon: <LayoutTemplate size={20} /> },
	{
		path: "/aether",
		label: "Aether (Segundo Cerebro)",
		icon: <BrainCircuit size={20} className="text-lti-coral" />,
	},
	{
		path: "/aether/canvas",
		label: "Canvas Espacial",
		icon: <Maximize size={20} className="text-lti-blue" />,
	},
	{
		path: "/aether/chat",
		label: "Asistente Aether",
		icon: <BotMessageSquare size={20} className="text-purple-400" />,
	},
	{
		path: "/nexus",
		label: "Nexus Editor (Bloques)",
		icon: <Database size={20} className="text-emerald-400" />,
	},
	{
		path: "/nexus/db",
		label: "Nexus Tables (DB)",
		icon: <LayoutTemplate size={20} className="text-emerald-500" />,
	},
	{
		path: "/nexus/ai",
		label: "Nexus AI",
		icon: <Sparkles size={20} className="text-purple-400" />,
	},
];

export default function Sidebar({
	presenciales,
	onUpdatePresenciales,
	calendarEvents,
	onUpdateCalendarEvents,
	tasks,
	onUpdateTasks,
	schedule,
	onUpdateSchedule,
	onCloseMobile,
}: SidebarProps) {
	const { syncNow, restoreFromCloud, syncStatus, isConfigured } = useCloudSync(
		presenciales,
		onUpdatePresenciales,
		calendarEvents,
		onUpdateCalendarEvents,
		tasks,
		onUpdateTasks,
		schedule,
		onUpdateSchedule,
	);

	return (
		<aside className="w-64 md:w-56 h-full bg-navy-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl md:shadow-none">
			{/* Logo */}
			<div className="p-5 border-b border-navy-700/50 flex items-center justify-between">
				<img
					src="/logo.jpg"
					alt="URU/IA.LABS Marca"
					className="max-w-[140px] h-auto object-contain"
					style={{ mixBlendMode: "lighten" }}
				/>
				{onCloseMobile && (
					<button
						onClick={onCloseMobile}
						className="md:hidden text-slate-400 hover:text-white p-1"
						aria-label="Cerrar menú de navegación"
					>
						<X size={20} />
					</button>
				)}
			</div>

			{/* Nav */}
			<nav className="flex-1 p-3 space-y-1">
				<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
					Navegación
				</p>
				{navItems.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						end={item.path === "/"}
						onClick={() => onCloseMobile?.()}
						className={({ isActive }) =>
							`w-full sidebar-item text-left text-sm font-medium flex items-center gap-2 ${
								isActive ? "sidebar-item-active text-white" : ""
							}`
						}
					>
						{item.icon}
						<span>{item.label}</span>
					</NavLink>
				))}
			</nav>

			{/* Sync */}
			<div className="p-3 border-t border-navy-700/50 space-y-2">
				{isConfigured ? (
					<div className="flex gap-2">
						<button
							onClick={syncNow}
							disabled={syncStatus === "syncing"}
							className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-navy-900 border border-navy-600 rounded hover:bg-navy-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
							title="Sincronizar hacia la nube"
						>
							<Cloud
								size={14}
								className={syncStatus === "syncing" ? "animate-bounce" : ""}
							/>
							<span>Subir</span>
						</button>
						<button
							onClick={restoreFromCloud}
							disabled={syncStatus === "syncing"}
							className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-navy-900 border border-navy-600 rounded hover:bg-navy-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
							title="Restaurar desde la nube"
						>
							<RefreshCw
								size={14}
								className={syncStatus === "syncing" ? "animate-spin" : ""}
							/>
							<span>Bajar</span>
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
						<CloudOff size={14} />
						<span>Nube Desactivada</span>
					</div>
				)}
				{(syncStatus === "success" || syncStatus === "error") && (
					<p
						className={`text-[10px] text-center ${syncStatus === "success" ? "text-green-400" : "text-red-400"}`}
					>
						{syncStatus === "success"
							? "✓ Sincronizado"
							: "✕ Error al sincronizar"}
					</p>
				)}
			</div>

			{/* Footer */}
			<div className="p-3 border-t border-navy-700/50">
				<div className="px-3 py-2">
					<p className="text-xs text-slate-400">Generación 2026</p>
					<p className="text-xs text-slate-600">Plan 2024 — Res. 127-24</p>
				</div>
			</div>
		</aside>
	);
}

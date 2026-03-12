import { AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CommandPalette } from "./components/CommandPalette";
import { GmailWidget } from "./components/dashboard/GmailWidget";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { PageTransition } from "./components/PageTransition";
import Pomodoro from "./components/Pomodoro";
import Sidebar from "./components/Sidebar";
import {
	CURRICULUM,
	DEFAULT_PRESENCIALES,
	type PresencialEvent,
} from "./data/lti";
import { useSubjectData } from "./hooks/useSubjectData";
import type { ScheduleItem } from "./pages/Horarios";
import type { Task } from "./pages/Tareas";
import { safeParseJSON } from "./utils/safeStorage";

// ─── Lazy-loaded pages (code splitting) ───────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Materias = lazy(() => import("./pages/Materias"));
const Calendario = lazy(() => import("./pages/Calendario"));
const MallaCurricular = lazy(() => import("./pages/MallaCurricular"));
const Tareas = lazy(() => import("./pages/Tareas"));
const Examenes = lazy(() => import("./pages/Examenes"));
const Horarios = lazy(() => import("./pages/Horarios"));
const AetherVault = lazy(() => import("./pages/AetherVault"));
const AetherCanvas = lazy(() => import("./pages/AetherCanvas"));
const AetherChat = lazy(() => import("./pages/AetherChat"));
const NexusWorkspace = lazy(() => import("./pages/NexusWorkspace"));
const NexusDatabaseView = lazy(() => import("./pages/NexusDatabase"));
const NexusAI = lazy(() => import("./pages/NexusAI"));

function App() {
	const location = useLocation();
	const { allSubjects, data } = useSubjectData();

	// Presenciales editables — guardadas en localStorage
	const [presenciales, setPresenciales] = useState<PresencialEvent[]>(() => {
		return safeParseJSON<PresencialEvent[]>(
			"lti_eventos_presenciales",
			DEFAULT_PRESENCIALES,
		);
	});

	const [calendarEvents, setCalendarEvents] = useState<Record<string, any[]>>(
		() => {
			return safeParseJSON<Record<string, any[]>>("cal2026_events", {});
		},
	);

	// Tareas
	const [tasks, setTasks] = useState<Task[]>(() =>
		safeParseJSON<Task[]>("lti_tasks", []),
	);

	// Horarios (Precarga dinámica si está vacío)
	const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
		const saved = safeParseJSON<ScheduleItem[]>("lti_schedule", []);
		if (saved.length > 0) return saved;
		return (
			CURRICULUM.find((s) => s.number === 1)?.subjects.map((s) => ({
				id: s.id as any,
				subjectId: s.id,
				name: s.name,
				day: 1,
				startTime: "18:00",
				endTime: "22:00",
				type: "Teórico",
			})) || []
		);
	});

	const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const updatePresenciales = (updated: PresencialEvent[]) => {
		setPresenciales(updated);
		localStorage.setItem("lti_eventos_presenciales", JSON.stringify(updated));
	};

	const updateCalendarEvents = (updated: Record<string, any[]>) => {
		setCalendarEvents(updated);
		localStorage.setItem("cal2026_events", JSON.stringify(updated));
	};

	const updateTasks = (updated: Task[]) => {
		setTasks(updated);
		localStorage.setItem("lti_tasks", JSON.stringify(updated));
	};

	const updateSchedule = (updated: ScheduleItem[]) => {
		setSchedule(updated);
		localStorage.setItem("lti_schedule", JSON.stringify(updated));
	};

	// Sincronizar banco de materias de horarios con materias activas
	useEffect(() => {
		const existingIds = new Set(schedule.map((s) => s.subjectId));

		// 1. Agregar las "en_curso" que falten
		const missing = allSubjects.filter((s) => {
			const status = data[s.id]?.status || s.status;
			return status === "en_curso" && !existingIds.has(s.id);
		});

		// 2. Opcional: Limpiar el banco de las que ya no están "en curso"
		const invalidBankItems = schedule.filter((item) => {
			if (item.day !== null) return false; // No tocar las ya agendadas
			const subject = allSubjects.find((s) => s.id === item.subjectId);
			const status = data[item.subjectId]?.status || subject?.status;
			return status !== "en_curso";
		});

		if (missing.length > 0 || invalidBankItems.length > 0) {
			let updatedSchedule = [...schedule];

			if (missing.length > 0) {
				const newItems = missing.map((s) => ({
					id: `blk-${s.id}`,
					subjectId: s.id,
					day: null,
				}));
				updatedSchedule = [...updatedSchedule, ...newItems];
			}

			if (invalidBankItems.length > 0) {
				const invalidIds = new Set(invalidBankItems.map((i) => i.id));
				updatedSchedule = updatedSchedule.filter((i) => !invalidIds.has(i.id));
			}

			updateSchedule(updatedSchedule);
		}
	}, [allSubjects, schedule, data]);

	return (
		<>
			<CommandPalette
				isOpen={isCommandPaletteOpen}
				onClose={() => setIsCommandPaletteOpen(false)}
			/>
			<div className="flex flex-col md:flex-row h-screen bg-navy-900 overflow-hidden relative">
				{/* Mobile Top Bar */}
				<div className="md:hidden flex items-center justify-between bg-navy-950/80 backdrop-blur-md p-4 border-b border-white/5 shrink-0 relative z-20">
					<div className="flex items-center gap-2">
						<img
							src="/logo.jpg"
							alt="Logo"
							className="h-6"
							style={{ mixBlendMode: "lighten" }}
						/>
						<span className="text-white font-bold text-sm">Carrera LTI</span>
					</div>
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="text-white p-1 bg-navy-800 rounded-md"
						aria-label="Abrir menú de navegación"
					>
						<Menu size={20} />
					</button>
				</div>

				{/* Overlay para móvil */}
				{isSidebarOpen && (
					<div
						className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
						onClick={() => setIsSidebarOpen(false)}
					/>
				)}

				{/* Contenedor del Sidebar */}
				<div
					className={`
          absolute inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
				>
					<Sidebar
						presenciales={presenciales}
						onUpdatePresenciales={updatePresenciales}
						calendarEvents={calendarEvents}
						onUpdateCalendarEvents={updateCalendarEvents}
						tasks={tasks}
						onUpdateTasks={updateTasks}
						schedule={schedule}
						onUpdateSchedule={updateSchedule}
						onCloseMobile={() => setIsSidebarOpen(false)}
					/>
				</div>

				<main className="flex-1 overflow-y-auto overflow-x-hidden relative">
					<ErrorBoundary>
						<Suspense fallback={<LoadingSpinner />}>
							<AnimatePresence mode="wait">
								<Routes location={location} key={location.pathname}>
									<Route
										path="/"
										element={
											<PageTransition>
												<Dashboard
													presenciales={presenciales}
													onUpdatePresenciales={updatePresenciales}
												/>
											</PageTransition>
										}
									/>
									<Route
										path="/materias"
										element={
											<PageTransition>
												<Materias />
											</PageTransition>
										}
									/>
									<Route
										path="/calendario"
										element={
											<PageTransition>
												<Calendario
													presenciales={presenciales}
													onUpdatePresenciales={updatePresenciales}
													calendarEvents={calendarEvents}
													onUpdateCalendarEvents={updateCalendarEvents}
												/>
											</PageTransition>
										}
									/>
									<Route
										path="/malla"
										element={
											<PageTransition>
												<MallaCurricular />
											</PageTransition>
										}
									/>
									<Route
										path="/tareas"
										element={
											<PageTransition>
												<Tareas tasks={tasks} onUpdateTasks={updateTasks} />
											</PageTransition>
										}
									/>
									<Route
										path="/examenes"
										element={
											<PageTransition>
												<Examenes
													calendarEvents={calendarEvents}
													onUpdateCalendarEvents={updateCalendarEvents}
												/>
											</PageTransition>
										}
									/>
									<Route
										path="/horarios"
										element={
											<PageTransition>
												<Horarios
													schedule={schedule}
													onUpdateSchedule={updateSchedule}
												/>
											</PageTransition>
										}
									/>
									<Route
										path="/aether"
										element={
											<PageTransition>
												<AetherVault />
											</PageTransition>
										}
									/>
									<Route
										path="/aether/canvas"
										element={
											<PageTransition>
												<AetherCanvas />
											</PageTransition>
										}
									/>
									<Route
										path="/aether/chat"
										element={
											<PageTransition>
												<AetherChat />
											</PageTransition>
										}
									/>
									<Route
										path="/nexus"
										element={
											<PageTransition>
												<NexusWorkspace />
											</PageTransition>
										}
									/>
									<Route
										path="/nexus/db"
										element={
											<PageTransition>
												<NexusDatabaseView />
											</PageTransition>
										}
									/>
									<Route
										path="/nexus/ai"
										element={
											<PageTransition>
												<NexusAI />
											</PageTransition>
										}
									/>
									{/* Catch-all: redirect to dashboard */}
									<Route path="*" element={<Navigate to="/" replace />} />
								</Routes>
							</AnimatePresence>
						</Suspense>
					</ErrorBoundary>
				</main>
				<Pomodoro />
				<GmailWidget />
			</div>
		</>
	);
}

export default App;

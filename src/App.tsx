import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { safeParseJSON } from "./utils/safeStorage";
import LoadingSpinner from "./components/LoadingSpinner";
import Sidebar from "./components/Sidebar";
import { CommandPalette } from "./components/CommandPalette";
import Pomodoro from "./components/Pomodoro";
import { PageTransition } from "./components/PageTransition";
import { DEFAULT_PRESENCIALES, type PresencialEvent } from "./data/lti";

// ─── Lazy-loaded pages (code splitting) ───────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Materias = lazy(() => import("./pages/Materias"));
const Calendario = lazy(() => import("./pages/Calendario"));
const MallaCurricular = lazy(() => import("./pages/MallaCurricular"));
const Tareas = lazy(() => import("./pages/Tareas"));
const Horarios = lazy(() => import("./pages/Horarios"));
const AetherVault = lazy(() => import("./pages/AetherVault"));
const AetherCanvas = lazy(() => import("./pages/AetherCanvas"));
const AetherChat = lazy(() => import("./pages/AetherChat"));
const NexusWorkspace = lazy(() => import("./pages/NexusWorkspace"));
const NexusDatabaseView = lazy(() => import("./pages/NexusDatabase"));
const NexusAI = lazy(() => import("./pages/NexusAI"));

function App() {
	const location = useLocation();

	// Presenciales editables — guardadas en localStorage
	const [presenciales, setPresenciales] = useState<PresencialEvent[]>(() => {
		return safeParseJSON<PresencialEvent[]>(
			"lti_eventos_presenciales",
			DEFAULT_PRESENCIALES,
		);
	});

	const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const updatePresenciales = (updated: PresencialEvent[]) => {
		setPresenciales(updated);
		localStorage.setItem("lti_eventos_presenciales", JSON.stringify(updated));
	};

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
									<Route path="/materias" element={<PageTransition><Materias /></PageTransition>} />
									<Route
										path="/calendario"
										element={
											<PageTransition>
												<Calendario
													presenciales={presenciales}
													onUpdatePresenciales={updatePresenciales}
												/>
											</PageTransition>
										}
									/>
									<Route path="/malla" element={<PageTransition><MallaCurricular /></PageTransition>} />
									<Route path="/tareas" element={<PageTransition><Tareas /></PageTransition>} />
									<Route path="/horarios" element={<PageTransition><Horarios /></PageTransition>} />
									<Route path="/aether" element={<PageTransition><AetherVault /></PageTransition>} />
									<Route path="/aether/canvas" element={<PageTransition><AetherCanvas /></PageTransition>} />
									<Route path="/aether/chat" element={<PageTransition><AetherChat /></PageTransition>} />
									<Route path="/nexus" element={<PageTransition><NexusWorkspace /></PageTransition>} />
									<Route path="/nexus/db" element={<PageTransition><NexusDatabaseView /></PageTransition>} />
									<Route path="/nexus/ai" element={<PageTransition><NexusAI /></PageTransition>} />
									{/* Catch-all: redirect to dashboard */}
									<Route path="*" element={<Navigate to="/" replace />} />
								</Routes>
							</AnimatePresence>
						</Suspense>
					</ErrorBoundary>
				</main>
				<Pomodoro />
			</div>
		</>
	);
}

export default App;

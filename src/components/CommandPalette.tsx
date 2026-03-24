import { BrainCircuit, Database, FileText, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_DEBOUNCE_MS } from "../config/app.config";
import { useNexusDB } from "../hooks/useNexusDB";
import { useNexusStore } from "../store/nexusStore";

export function CommandPalette({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const { documents } = useNexusStore();
	const { allDatabases } = useNexusDB();
	const navigate = useNavigate();

	// Debounce para evitar filtrados en cada keystroke (#70)
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	const navigateTo = (path: string) => {
		navigate(path);
		onClose();
	};

	// Escuchar Cmd+K o Ctrl+K
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				onClose(); // Toggle: si está abierto lo cierra, App maneja el reopen
			}
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const filteredDocs = documents
		.filter((d) => d.title.toLowerCase().includes(debouncedQuery.toLowerCase()))
		.slice(0, 5);
	const filteredDbs = allDatabases
		.filter((d) => d.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
		.slice(0, 5);

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Palette Modal */}
			<div className="relative w-full max-w-2xl bg-navy-900 border border-navy-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
				{/* Input */}
				<div className="flex items-center px-4 py-4 border-b border-navy-700">
					<Search size={20} className="text-slate-400 mr-3" />
					<input
						type="text"
						placeholder="Buscar documentos, bases de datos o comandos..."
						className="flex-1 bg-transparent text-lg text-white focus:outline-none placeholder-slate-500"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-navy-800 text-slate-400 text-xs font-mono border border-navy-700">
						ESC
					</kbd>
				</div>

				{/* Results Body */}
				<div className="max-h-[60vh] overflow-y-auto p-2">
					{/* Section: Acciones Rápidas */}
					{debouncedQuery.length === 0 && (
						<div className="mb-4">
							<div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
								Acciones Rápidas
							</div>
							<button
								onClick={() => navigateTo("/nexus")}
								className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-navy-800 text-left transition-colors group"
							>
								<FileText size={18} className="text-emerald-400 mr-3" />
								<div>
									<div className="text-sm font-medium text-slate-200 group-hover:text-white">
										Nuevo Documento (Blocks)
									</div>
									<div className="text-xs text-slate-400">
										Crear una página de edición libre
									</div>
								</div>
							</button>
							<button
								onClick={() => navigateTo("/aether/chat")}
								className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-navy-800 text-left transition-colors group"
							>
								<BrainCircuit size={18} className="text-purple-400 mr-3" />
								<div>
									<div className="text-sm font-medium text-slate-200 group-hover:text-white">
										Consultar IA (Nexus AI)
									</div>
									<div className="text-xs text-slate-400">
										Hazle una pregunta a tu base de conocimiento
									</div>
								</div>
							</button>
							<button
								onClick={() => navigateTo("/nexus/db")}
								className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-navy-800 text-left transition-colors group"
							>
								<Database size={18} className="text-lti-coral mr-3" />
								<div>
									<div className="text-sm font-medium text-slate-200 group-hover:text-white">
										Explorar Bases de Datos
									</div>
									<div className="text-xs text-slate-400">
										Ir al visor estructurado
									</div>
								</div>
							</button>
						</div>
					)}

					{/* Section: Documentos */}
					{(debouncedQuery.length > 0 || documents.length > 0) && (
						<div className="mb-4">
							<div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
								Documentos Blocks
							</div>
							{filteredDocs.map((doc) => (
								<button
									key={doc.id}
									onClick={() => navigateTo("/nexus")}
									className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-navy-800 text-left transition-colors group"
								>
									<FileText
										size={16}
										className="text-slate-400 mr-3 group-hover:text-white"
									/>
									<span className="text-sm text-slate-300 group-hover:text-white">
										{doc.title}
									</span>
								</button>
							))}
							{filteredDocs.length === 0 && (
								<div className="px-3 py-2 text-sm text-slate-400 italic">
									No hay resultados de texto
								</div>
							)}
						</div>
					)}

					{/* Section: Bases de Datos */}
					{(debouncedQuery.length > 0 || allDatabases.length > 0) && (
						<div className="mb-4">
							<div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
								Tablas / Bases de Datos
							</div>
							{filteredDbs.map((db) => (
								<button
									key={db.id}
									onClick={() => navigateTo("/nexus/db")}
									className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-navy-800 text-left transition-colors group"
								>
									<span className="mr-3">{db.icon}</span>
									<span className="text-sm text-slate-300 group-hover:text-white">
										{db.name}
									</span>
								</button>
							))}
						</div>
					)}

					{/* Section: Sistema */}
					<div className="mt-2 pt-2 border-t border-navy-700/50">
						<div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
							Sistema
						</div>
						<button
							onClick={() => {
								if (
									confirm(
										"¿Estás seguro de que deseas limpiar TODOS los datos locales? Se perderán notas, tareas y configuraciones no sincronizadas.",
									)
								) {
									localStorage.clear();
									sessionStorage.clear();
									window.location.href = "/";
								}
							}}
							className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-500/10 text-left transition-colors group"
						>
							<Trash2 size={16} className="text-red-400 mr-3" />
							<span className="text-sm text-red-400 group-hover:text-red-300">
								Limpieza Total (Factory Reset)
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

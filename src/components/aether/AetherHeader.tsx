import {
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Network,
	Plus,
	Upload,
} from "lucide-react";

interface AetherHeaderProps {
	sidebarOpen: boolean;
	viewMode: "editor" | "graph";
	onToggleSidebar: () => void;
	onSetViewMode: (mode: "editor" | "graph") => void;
	onImport: () => void;
	onExportMarkdown: () => void;
	onExportJSON: () => void;
	onCreateNote: () => void;
}

export function AetherHeader({
	sidebarOpen,
	viewMode,
	onToggleSidebar,
	onSetViewMode,
	onImport,
	onExportMarkdown,
	onExportJSON,
	onCreateNote,
}: AetherHeaderProps) {
	return (
		<div className="h-14 flex items-center justify-between px-4 border-b border-navy-700/50 bg-navy-950/80">
			<div className="flex items-center gap-3">
				<button
					onClick={onToggleSidebar}
					className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-navy-800 transition-colors"
				>
					{sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
				</button>
				<div className="flex p-0.5 bg-navy-900 rounded-lg border border-navy-700/50">
					<button
						onClick={() => onSetViewMode("editor")}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "editor" ? "bg-lti-blue text-white" : "text-slate-400 hover:text-white"}`}
					>
						<FileText size={16} />
						Editor
					</button>
					<button
						onClick={() => onSetViewMode("graph")}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "graph" ? "bg-lti-coral text-white" : "text-slate-400 hover:text-white"}`}
					>
						<Network size={16} />
						Red Geométrica
					</button>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					onClick={onImport}
					className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors"
					title="Importar notas JSON"
				>
					<Upload size={16} />
					<span className="hidden sm:inline">Importar</span>
				</button>
				<button
					onClick={onExportMarkdown}
					className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-navy-700"
					title="Descargar notas como Markdown"
				>
					<FileText size={16} />
					<span className="hidden xl:inline">Exportar MD</span>
				</button>
				<button
					onClick={onExportJSON}
					className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-navy-700"
					title="Exportar respaldo técnico (JSON)"
				>
					<Download size={16} />
					<span className="hidden xl:inline">Backup JSON</span>
				</button>
				<button
					onClick={onCreateNote}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-lti-blue hover:bg-lti-blue-dark text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-lti-blue/20"
				>
					<Plus size={16} />
					<span>Nueva Nota</span>
				</button>
			</div>
		</div>
	);
}

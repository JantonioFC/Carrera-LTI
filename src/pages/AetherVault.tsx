import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));
const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

import {
	Brain,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Loader2,
	Network,
	Plus,
	Search,
	Sparkles,
	Upload,
} from "lucide-react";
import {
	type AetherNote,
	type AetherNoteId,
	useAetherStore,
} from "../store/aetherStore";

export default function AetherVault() {
	const {
		notes,
		addNote,
		updateNote,
		deleteNote,
		getGraphData,
		findBacklinks,
		semanticSearch,
		importNotes,
		ingestNote,
	} = useAetherStore();
	const [activeNoteId, setActiveNoteId] = useState<AetherNoteId | null>(
		notes[0]?.id || null,
	);
	const [viewMode, setViewMode] = useState<"editor" | "graph">("editor");
	const [searchQuery, setSearchQuery] = useState("");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [similarNotes, setSimilarNotes] = useState<AetherNote[]>([]);
	const [isIngesting, setIsIngesting] = useState(false);

	// Sync active note with hook
	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId),
		[notes, activeNoteId],
	);

	useEffect(() => {
		const fetchSimilar = async () => {
			if (activeNote?.embedding && activeNote.content.length > 10) {
				const results = await semanticSearch(activeNote.content, 5);
				setSimilarNotes(results.filter((n) => n.id !== activeNoteId));
			} else {
				setSimilarNotes([]);
			}
		};
		fetchSimilar();
	}, [
		activeNoteId,
		activeNote?.embedding,
		semanticSearch,
		activeNote?.content,
	]);

	const handleIngest = async () => {
		if (!activeNoteId) return;
		setIsIngesting(true);
		await ingestNote(activeNoteId);
		setIsIngesting(false);
	};
	const graphData = useMemo(() => getGraphData(), [getGraphData]);
	const backlinks = activeNoteId ? findBacklinks(activeNoteId) : [];

	const filteredNotes = notes.filter(
		(n) =>
			n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			n.content.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleCreateNote = () => {
		const newNote = addNote("Sin Título");
		setActiveNoteId(newNote.id);
		setViewMode("editor");
	};

	const handleExportJSON = () => {
		const data = { notes };
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `aether_backup_${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleExportMarkdown = () => {
		let content = "# Aether - Exportación de Notas\n\n";
		notes.forEach((note) => {
			content += `---\n\n# ${note.title}\n\n${note.content}\n\n`;
			content += `*Metadatos: Creado el ${new Date(note.createdAt).toLocaleDateString()}, Modificado el ${new Date(note.updatedAt).toLocaleDateString()}*\n\n`;
		});

		const blob = new Blob([content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `aether_notes_${new Date().toISOString().slice(0, 10)}.md`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,.md";
		input.onchange = (e: any) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					const content = event.target?.result as string;

					if (file.name.toLowerCase().endsWith(".json")) {
						importNotes(content);
					} else {
						// Procesar Markdown
						// 1. Intentar dividir por exportación (---)
						const sections = content
							.split(/\n---\n/)
							.filter((s) => s.trim().length > 10);
						const newNotes: any[] = [];

						if (sections.length > 1) {
							// Es un archivo de exportación combinado
							sections.forEach((section) => {
								if (section.includes("# Aether - Exportación")) return;

								const lines = section.trim().split("\n");
								const titleLine = lines.find((l) => l.startsWith("# "));
								const title = titleLine
									? titleLine.replace("# ", "").trim()
									: "Nota Importada";
								const noteContent = section.replace(titleLine || "", "").trim();

								newNotes.push({
									id: `note_${uuidv4()}`,
									title,
									content: noteContent,
									createdAt: Date.now(),
									updatedAt: Date.now(),
									tags: [],
								});
							});
						} else {
							// Es una nota individual
							const lines = content.trim().split("\n");
							const titleLine = lines.find((l) => l.startsWith("# "));
							const title = titleLine
								? titleLine.replace("# ", "").trim()
								: file.name.replace(".md", "");
							const noteContent = content.replace(titleLine || "", "").trim();

							newNotes.push({
								id: `note_${uuidv4()}`,
								title,
								content: noteContent,
								createdAt: Date.now(),
								updatedAt: Date.now(),
								tags: [],
							});
						}

						if (newNotes.length > 0) {
							importNotes(JSON.stringify({ notes: newNotes }));
						}
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	};

	// Prevent hydration mismatch or layout thrashing for the force graph width
	const [graphDimensions, setGraphDimensions] = useState({
		width: 800,
		height: 600,
	});
	useEffect(() => {
		const updateDimensions = () => {
			const container = document.getElementById("aether-graph-container");
			if (container) {
				setGraphDimensions({
					width: container.clientWidth,
					height: container.clientHeight,
				});
			}
		};
		window.addEventListener("resize", updateDimensions);
		setTimeout(updateDimensions, 100);
		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

	return (
		<div
			className="h-full flex flex-col bg-navy-900 border-l border-navy-700/50"
			data-color-mode="dark"
		>
			{/* Top Header */}
			<div className="h-14 flex items-center justify-between px-4 border-b border-navy-700/50 bg-navy-950/80">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-navy-800 transition-colors"
					>
						{sidebarOpen ? (
							<ChevronLeft size={20} />
						) : (
							<ChevronRight size={20} />
						)}
					</button>
					<div className="flex p-0.5 bg-navy-900 rounded-lg border border-navy-700/50">
						<button
							onClick={() => setViewMode("editor")}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "editor" ? "bg-lti-blue text-white" : "text-slate-400 hover:text-white"}`}
						>
							<FileText size={16} />
							Editor
						</button>
						<button
							onClick={() => setViewMode("graph")}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "graph" ? "bg-lti-coral text-white" : "text-slate-400 hover:text-white"}`}
						>
							<Network size={16} />
							Red Geométrica
						</button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={handleImport}
						className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors"
						title="Importar notas JSON"
					>
						<Upload size={16} />
						<span className="hidden sm:inline">Importar</span>
					</button>
					<button
						onClick={handleExportMarkdown}
						className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-navy-700"
						title="Descargar notas como Markdown"
					>
						<FileText size={16} />
						<span className="hidden xl:inline">Exportar MD</span>
					</button>
					<button
						onClick={handleExportJSON}
						className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-navy-700"
						title="Exportar respaldo técnico (JSON)"
					>
						<Download size={16} />
						<span className="hidden xl:inline">Backup JSON</span>
					</button>
					<button
						onClick={handleCreateNote}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-lti-blue hover:bg-lti-blue-dark text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-lti-blue/20"
					>
						<Plus size={16} />
						<span>Nueva Nota</span>
					</button>
				</div>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Left Sidebar (Notes List) */}
				{sidebarOpen && (
					<div className="w-72 flex-shrink-0 flex flex-col bg-navy-950/40 border-r border-navy-700/50 transition-all">
						<div className="p-4 border-b border-navy-700/50">
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
									size={16}
								/>
								<input
									type="text"
									placeholder="Buscar notas..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-lti-blue transition-colors"
								/>
							</div>
						</div>
						<div className="flex-1 overflow-y-auto p-2 space-y-1">
							{filteredNotes.map((note) => (
								<button
									key={note.id}
									onClick={() => {
										setActiveNoteId(note.id);
										setViewMode("editor");
									}}
									className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${activeNoteId === note.id && viewMode === "editor" ? "bg-lti-blue/20 text-white" : "text-slate-400 hover:bg-navy-800 hover:text-white"}`}
								>
									<p className="font-medium text-sm truncate">{note.title}</p>
									<p className="text-xs text-slate-400 truncate mt-0.5">
										{new Date(note.updatedAt).toLocaleDateString()}
									</p>
								</button>
							))}
							{filteredNotes.length === 0 && (
								<p className="text-center text-slate-400 text-sm py-4">
									No se encontraron notas.
								</p>
							)}
						</div>
					</div>
				)}

				{/* Main Workspace */}
				<div
					className="flex-1 flex flex-col overflow-hidden relative"
					id="aether-graph-container"
				>
					{viewMode === "editor" && activeNote && (
						<div className="flex-1 flex bg-[#0d1117] overflow-hidden">
							{/* Markdown Editor Zone */}
							<div className="flex-1 flex flex-col">
								<div className="px-6 py-4 border-b border-navy-700/50">
									<input
										type="text"
										value={activeNote.title}
										onChange={(e) =>
											updateNote(activeNote.id, { title: e.target.value })
										}
										className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder-slate-600"
										placeholder="Título de la nota"
									/>
								</div>
								<div className="flex-1 overflow-y-auto">
									<Suspense
										fallback={
											<div className="h-full flex items-center justify-center text-slate-500">
												Cargando editor...
											</div>
										}
									>
										<MDEditor
											value={activeNote.content}
											onChange={(val) =>
												updateNote(activeNote.id, { content: val || "" })
											}
											preview="live"
											height="100%"
											visibleDragbar={false}
											className="border-none w-full !bg-transparent"
										/>
									</Suspense>
								</div>
							</div>

							{/* Right Context Panel (Backlinks) */}
							<div className="w-64 border-l border-navy-700/50 bg-navy-950/20 p-4 overflow-y-auto hidden lg:block">
								<div className="mb-6">
									<button
										onClick={handleIngest}
										disabled={isIngesting || !activeNote?.content}
										className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${activeNote?.embedding ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-lti-blue/30 bg-lti-blue/10 text-lti-blue hover:bg-lti-blue/20"}`}
									>
										{isIngesting ? (
											<Loader2 size={14} className="animate-spin" />
										) : activeNote?.embedding ? (
											<Brain size={14} />
										) : (
											<Sparkles size={14} />
										)}
										{isIngesting
											? "Ingestando..."
											: activeNote?.embedding
												? "Analizada por IA"
												: "Analizar con IA"}
									</button>
								</div>

								<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
									Relacionado por IA ({similarNotes.length})
								</h3>
								{similarNotes.length > 0 ? (
									<div className="space-y-3 mb-8">
										{similarNotes.map((bl) => (
											<div
												key={bl.id}
												onClick={() => setActiveNoteId(bl.id)}
												className="p-3 bg-lti-blue/5 rounded-lg border border-lti-blue/20 cursor-pointer hover:border-lti-blue transition-colors group"
											>
												<p className="text-sm font-medium text-lti-blue group-hover:underline">
													{bl.title}
												</p>
												<p className="text-xs text-slate-400 mt-1 line-clamp-2">
													{bl.content.slice(0, 100)}...
												</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-400 mb-8">
										No hay relaciones detectadas.
									</p>
								)}

								<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
									Backlinks ({backlinks.length})
								</h3>
								{backlinks.length > 0 ? (
									<div className="space-y-3">
										{backlinks.map((bl) => (
											<div
												key={bl.id}
												onClick={() => setActiveNoteId(bl.id)}
												className="p-3 bg-navy-800/40 rounded-lg border border-navy-700/50 cursor-pointer hover:border-lti-blue transition-colors group"
											>
												<p className="text-sm font-medium text-lti-blue group-hover:underline">
													{bl.title}
												</p>
												<p className="text-xs text-slate-400 mt-1 line-clamp-2">
													{bl.content.slice(0, 100)}...
												</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-400">
										Ninguna otra nota enlaza hacia aquí todavía.
									</p>
								)}

								<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-4">
									Metadatos
								</h3>
								<div className="text-xs text-slate-400 space-y-2">
									<p>
										Creado:{" "}
										{new Date(activeNote.createdAt).toLocaleDateString()}
									</p>
									<p>
										Modificado:{" "}
										{new Date(activeNote.updatedAt).toLocaleTimeString()}
									</p>
									<button
										onClick={() => {
											if (confirm("¿Eliminar esta nota para siempre?"))
												deleteNote(activeNote.id);
										}}
										className="text-red-400 hover:text-red-300 mt-4 font-medium"
									>
										Eliminar nota
									</button>
								</div>
							</div>
						</div>
					)}

					{viewMode === "graph" && (
						<div className="flex-1 bg-[#090b10]">
							<Suspense
								fallback={
									<div className="h-full flex items-center justify-center text-slate-500">
										Iniciando motor gráfico...
									</div>
								}
							>
								<ForceGraph2D
									width={graphDimensions.width}
									height={graphDimensions.height}
									graphData={graphData}
									nodeAutoColorBy="id"
									nodeLabel="name"
									nodeRelSize={6}
									linkColor={() => "rgba(255,255,255,0.2)"}
									backgroundColor="#0d1117"
									onNodeClick={(node) => {
										setActiveNoteId(node.id as AetherNoteId);
										setViewMode("editor");
									}}
									nodeCanvasObject={(node, ctx, globalScale) => {
										const label = node.name as string;
										const fontSize = 12 / globalScale;
										ctx.font = `${fontSize}px Sans-Serif`;
										const textWidth = ctx.measureText(label).width;
										const bckgDimensions = [textWidth, fontSize].map(
											(n) => n + fontSize * 0.2,
										);

										ctx.fillStyle = "rgba(13, 17, 23, 0.8)";
										ctx.fillRect(
											node.x! - bckgDimensions[0] / 2,
											node.y! - bckgDimensions[1] / 2,
											bckgDimensions[0],
											bckgDimensions[1],
										);

										ctx.textAlign = "center";
										ctx.textBaseline = "middle";
										ctx.fillStyle = node.color as string;
										ctx.fillText(label, node.x!, node.y!);
									}}
								/>
							</Suspense>
							<div className="absolute bottom-6 right-6 bg-navy-900/90 border border-navy-700/50 p-4 rounded-xl backdrop-blur-sm max-w-xs shadow-2xl">
								<h4 className="text-sm font-semibold text-white mb-2">
									Red de Conocimiento
								</h4>
								<p className="text-xs text-slate-400">
									Total de Nodos: {graphData.nodes.length}
								</p>
								<p className="text-xs text-slate-400">
									Conexiones: {graphData.links.length}
								</p>
								<p className="text-[10px] text-slate-400 mt-3 italic">
									Tip: Haz click en un nodo para viajar térmicamente a esa nota.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

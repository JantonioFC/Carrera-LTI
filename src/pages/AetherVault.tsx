import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AetherContextPanel } from "../components/aether/AetherContextPanel";
import { AetherGraphView } from "../components/aether/AetherGraphView";
import { AetherHeader } from "../components/aether/AetherHeader";
import { AetherSidebar } from "../components/aether/AetherSidebar";
import {
	type AetherNote,
	type AetherNoteId,
	useAetherStore,
} from "../store/aetherStore";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

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
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [similarNotes, setSimilarNotes] = useState<AetherNote[]>([]);
	const [isIngesting, setIsIngesting] = useState(false);

	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId),
		[notes, activeNoteId],
	);

	useEffect(() => {
		let cancelled = false;
		const fetchSimilar = async () => {
			if (activeNote?.embedding && activeNote.content.length > 10) {
				const results = await semanticSearch(activeNote.content, 5);
				if (!cancelled)
					setSimilarNotes(results.filter((n) => n.id !== activeNoteId));
			} else {
				if (!cancelled) setSimilarNotes([]);
			}
		};
		fetchSimilar();
		return () => {
			cancelled = true;
		};
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

	const handleCreateNote = () => {
		const newNote = addNote("Sin Título");
		setActiveNoteId(newNote.id);
		setViewMode("editor");
	};

	const handleExportJSON = () => {
		const blob = new Blob([JSON.stringify({ notes }, null, 2)], {
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
		input.onchange = (e: Event) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (event) => {
				const content = event.target?.result as string;
				if (file.name.toLowerCase().endsWith(".json")) {
					importNotes(content);
				} else {
					const sections = content
						.split(/\n---\n/)
						.filter((s) => s.trim().length > 10);
					const newNotes: AetherNote[] = [];
					if (sections.length > 1) {
						sections.forEach((section) => {
							if (section.includes("# Aether - Exportación")) return;
							const lines = section.trim().split("\n");
							const titleLine = lines.find((l) => l.startsWith("# "));
							const title = titleLine
								? titleLine.replace("# ", "").trim()
								: "Nota Importada";
							newNotes.push({
								id: `note_${uuidv4()}` as AetherNoteId,
								title,
								content: section.replace(titleLine || "", "").trim(),
								createdAt: Date.now(),
								updatedAt: Date.now(),
								tags: [],
							});
						});
					} else {
						const lines = content.trim().split("\n");
						const titleLine = lines.find((l) => l.startsWith("# "));
						const title = titleLine
							? titleLine.replace("# ", "").trim()
							: file.name.replace(".md", "");
						newNotes.push({
							id: `note_${uuidv4()}` as AetherNoteId,
							title,
							content: content.replace(titleLine || "", "").trim(),
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
		};
		input.click();
	};

	return (
		<div
			className="h-full flex flex-col bg-navy-900 border-l border-navy-700/50"
			data-color-mode="dark"
		>
			<AetherHeader
				sidebarOpen={sidebarOpen}
				viewMode={viewMode}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onSetViewMode={setViewMode}
				onImport={handleImport}
				onExportMarkdown={handleExportMarkdown}
				onExportJSON={handleExportJSON}
				onCreateNote={handleCreateNote}
			/>

			<div className="flex-1 flex overflow-hidden">
				{sidebarOpen && (
					<AetherSidebar
						notes={notes}
						activeNoteId={activeNoteId}
						onSelectNote={(id) => {
							setActiveNoteId(id);
							setViewMode("editor");
						}}
					/>
				)}

				<div
					className="flex-1 flex flex-col overflow-hidden relative"
					id="aether-graph-container"
				>
					{viewMode === "editor" && activeNote && (
						<div className="flex-1 flex bg-[#0d1117] overflow-hidden">
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
							<AetherContextPanel
								activeNote={activeNote}
								similarNotes={similarNotes}
								backlinks={backlinks}
								isIngesting={isIngesting}
								onIngest={handleIngest}
								onSelectNote={setActiveNoteId}
								onDeleteNote={deleteNote}
							/>
						</div>
					)}

					{viewMode === "graph" && (
						<AetherGraphView
							graphData={graphData}
							onNodeClick={(id) => {
								setActiveNoteId(id);
								setViewMode("editor");
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

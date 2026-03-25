import { Brain, Loader2, Sparkles } from "lucide-react";
import { memo } from "react";
import type { AetherNote, AetherNoteId } from "../../store/aetherStore";

interface AetherContextPanelProps {
	activeNote: AetherNote;
	similarNotes: AetherNote[];
	backlinks: AetherNote[];
	isIngesting: boolean;
	onIngest: () => void;
	onSelectNote: (id: AetherNoteId) => void;
	onDeleteNote: (id: AetherNoteId) => void;
}

function AetherContextPanelInner({
	activeNote,
	similarNotes,
	backlinks,
	isIngesting,
	onIngest,
	onSelectNote,
	onDeleteNote,
}: AetherContextPanelProps) {
	return (
		<div className="w-64 border-l border-navy-700/50 bg-navy-950/20 p-4 overflow-y-auto hidden lg:block">
			<div className="mb-6">
				<button
					onClick={onIngest}
					disabled={isIngesting || !activeNote.content}
					className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${activeNote.embedding ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-lti-blue/30 bg-lti-blue/10 text-lti-blue hover:bg-lti-blue/20"}`}
				>
					{isIngesting ? (
						<Loader2 size={14} className="animate-spin" />
					) : activeNote.embedding ? (
						<Brain size={14} />
					) : (
						<Sparkles size={14} />
					)}
					{isIngesting
						? "Ingestando..."
						: activeNote.embedding
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
							onClick={() => onSelectNote(bl.id)}
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
							onClick={() => onSelectNote(bl.id)}
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
				<p>Creado: {new Date(activeNote.createdAt).toLocaleDateString()}</p>
				<p>Modificado: {new Date(activeNote.updatedAt).toLocaleTimeString()}</p>
				<button
					onClick={() => {
						if (confirm("¿Eliminar esta nota para siempre?"))
							onDeleteNote(activeNote.id);
					}}
					className="text-red-400 hover:text-red-300 mt-4 font-medium"
				>
					Eliminar nota
				</button>
			</div>
		</div>
	);
}

export const AetherContextPanel = memo(AetherContextPanelInner);

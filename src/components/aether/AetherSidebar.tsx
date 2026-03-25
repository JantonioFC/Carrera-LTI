import { Search } from "lucide-react";
import { useState } from "react";
import type { AetherNote, AetherNoteId } from "../../store/aetherStore";

interface AetherSidebarProps {
	notes: AetherNote[];
	activeNoteId: AetherNoteId | null;
	onSelectNote: (id: AetherNoteId) => void;
}

export function AetherSidebar({
	notes,
	activeNoteId,
	onSelectNote,
}: AetherSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filtered = notes.filter(
		(n) =>
			n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			n.content.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
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
				{filtered.map((note) => (
					<button
						key={note.id}
						onClick={() => onSelectNote(note.id)}
						className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${activeNoteId === note.id ? "bg-lti-blue/20 text-white" : "text-slate-400 hover:bg-navy-800 hover:text-white"}`}
					>
						<p className="font-medium text-sm truncate">{note.title}</p>
						<p className="text-xs text-slate-400 truncate mt-0.5">
							{new Date(note.updatedAt).toLocaleDateString()}
						</p>
					</button>
				))}
				{filtered.length === 0 && (
					<p className="text-center text-slate-400 text-sm py-4">
						No se encontraron notas.
					</p>
				)}
			</div>
		</div>
	);
}

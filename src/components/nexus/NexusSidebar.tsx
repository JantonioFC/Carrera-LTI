import { Database, Plus } from "lucide-react";

interface NexusDB {
	id: string;
	name: string;
	icon: string;
}

interface NexusSidebarProps {
	databases: NexusDB[];
	activeDbId: string | null;
	onSelect: (id: string) => void;
	onCreate: () => void;
}

export function NexusSidebar({
	databases,
	activeDbId,
	onSelect,
	onCreate,
}: NexusSidebarProps) {
	return (
		<div className="w-64 flex-shrink-0 flex flex-col bg-navy-950/80 border-r border-navy-700/50">
			<div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
				<h2 className="text-white font-bold tracking-wide flex items-center gap-2">
					<Database size={18} className="text-emerald-400" />
					Bases de Datos
				</h2>
				<button
					onClick={onCreate}
					className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-md transition-colors"
				>
					<Plus size={16} />
				</button>
			</div>
			<div className="flex-1 overflow-y-auto p-2 space-y-0.5">
				{databases.map((database) => (
					<button
						key={database.id}
						onClick={() => onSelect(database.id)}
						className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${activeDbId === database.id ? "bg-navy-800 text-white font-medium" : "text-slate-400 hover:bg-navy-800/50 hover:text-white"}`}
					>
						<span>{database.icon}</span>
						<span className="truncate">{database.name}</span>
					</button>
				))}
				{databases.length === 0 && (
					<p className="text-xs text-slate-400 text-center py-4">
						No hay tablas todavía.
					</p>
				)}
			</div>
		</div>
	);
}

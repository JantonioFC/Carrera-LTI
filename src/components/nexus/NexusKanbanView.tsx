import { LayoutDashboard, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../hooks/useNexusDB";

interface NexusField {
	id: string;
	name: string;
	type: string;
}

interface NexusRow {
	id: string;
	data: Record<string, unknown>;
}

const KANBAN_STATUSES = ["Pendiente", "En Progreso", "Completado"] as const;

interface NexusKanbanViewProps {
	fields: NexusField[];
	rows: NexusRow[];
	activeDbId: string;
	onAddField: (type: "select") => void;
	onUpdateRowData: (rowId: string, fieldId: string, value: unknown) => void;
}

export function NexusKanbanView({
	fields,
	rows,
	activeDbId,
	onAddField,
	onUpdateRowData,
}: NexusKanbanViewProps) {
	const selectField = fields.find((f) => f.type === "select");

	if (!selectField) {
		return (
			<div className="flex-1 flex items-center justify-center text-slate-400 text-center">
				<div>
					<LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" />
					<h3 className="text-lg font-bold text-white mb-2">Vista Kanban</h3>
					<p className="max-w-sm text-sm">
						Para usar el Kanban, añade un campo de tipo <b>Select</b> llamado
						"Estado" (por ejemplo).
					</p>
					<button
						onClick={() => onAddField("select")}
						className="mt-6 px-4 py-2 bg-lti-blue hover:bg-lti-blue-dark text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-lti-blue/20"
					>
						Añadir Campo Select
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-x-auto p-6 flex gap-6">
			{KANBAN_STATUSES.map((status) => {
				const columnRows = rows.filter(
					(r) => (r.data[selectField.id] || "Pendiente") === status,
				);

				return (
					<div key={status} className="w-80 shrink-0 flex flex-col gap-4">
						<div className="flex items-center justify-between px-2">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${status === "Completado" ? "bg-emerald-500" : status === "En Progreso" ? "bg-lti-blue" : "bg-slate-500"}`}
								/>
								<h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
									{status}
								</h3>
								<span className="text-xs text-slate-500 font-mono">
									{columnRows.length}
								</span>
							</div>
						</div>

						<div className="flex-1 space-y-3">
							{columnRows.map((row) => (
								<div
									key={row.id}
									className="bg-navy-800/50 border border-navy-700/50 p-4 rounded-xl hover:border-navy-600 transition-all cursor-grab active:cursor-grabbing"
								>
									<input
										className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none mb-2"
										value={(row.data[fields[0].id] as string) || ""}
										onChange={(e) =>
											onUpdateRowData(row.id, fields[0].id, e.target.value)
										}
										placeholder="Título de la fila"
									/>
									<div className="space-y-1">
										{fields.slice(1).map((f) => {
											if (f.type === "select") return null;
											return (
												<div
													key={f.id}
													className="flex items-center gap-2 text-[10px] text-slate-500"
												>
													<span className="truncate w-16">{f.name}:</span>
													<span className="truncate text-slate-400">
														{(row.data[f.id] as string) || "-"}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							))}
							<button
								onClick={() =>
									db.rows.add({
										id: uuidv4(),
										databaseId: activeDbId,
										createdAt: Date.now(),
										data: { [selectField.id]: status },
									})
								}
								className="w-full py-2 border border-dashed border-navy-700 rounded-xl text-slate-500 hover:text-white hover:border-navy-600 hover:bg-navy-800/30 transition-all text-xs flex items-center justify-center gap-2"
							>
								<Plus size={14} /> Añadir
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

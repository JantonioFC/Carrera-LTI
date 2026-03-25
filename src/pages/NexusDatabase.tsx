import { Database, LayoutDashboard, Table2 } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { NexusKanbanView } from "../components/nexus/NexusKanbanView";
import { NexusSidebar } from "../components/nexus/NexusSidebar";
import { NexusTableView } from "../components/nexus/NexusTableView";
import { db, useNexusDB } from "../hooks/useNexusDB";

export default function NexusDatabaseView() {
	const { allDatabases } = useNexusDB();
	const [activeDbId, setActiveDbId] = useState<string | null>(null);
	const [view, setView] = useState<"table" | "kanban">("table");

	const { currentDB, fields, rows } = useNexusDB(activeDbId || undefined);

	const handleCreateDB = async () => {
		const newDbId = uuidv4();
		await db.databases.add({
			id: newDbId,
			name: "Nueva Base de Datos",
			icon: "📁",
		});
		await db.fields.add({
			id: uuidv4(),
			databaseId: newDbId,
			name: "Nombre",
			type: "text",
		});
		setActiveDbId(newDbId);
	};

	const addField = async (
		type: "text" | "number" | "date" | "select" | "relation",
	) => {
		if (!activeDbId) return;
		await db.fields.add({
			id: uuidv4(),
			databaseId: activeDbId,
			name: `Campo ${fields.length + 1}`,
			type,
		});
	};

	const addRow = async () => {
		if (!activeDbId) return;
		await db.rows.add({
			id: uuidv4(),
			databaseId: activeDbId,
			createdAt: Date.now(),
			data: {},
		});
	};

	const updateRowData = async (
		rowId: string,
		fieldId: string,
		value: unknown,
	) => {
		const row = await db.rows.get(rowId);
		if (row) {
			row.data[fieldId] = value;
			await db.rows.put(row);
		}
	};

	const updateFieldName = async (fieldId: string, newName: string) => {
		await db.fields.update(fieldId, { name: newName });
	};

	return (
		<div className="h-full flex bg-navy-900 border-l border-navy-700/50 text-white overflow-hidden">
			<NexusSidebar
				databases={allDatabases}
				activeDbId={activeDbId}
				onSelect={setActiveDbId}
				onCreate={handleCreateDB}
			/>

			<div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
				{currentDB ? (
					<div className="flex-1 flex flex-col">
						<div className="px-8 py-6 border-b border-navy-700/50">
							<input
								type="text"
								value={currentDB.name}
								onChange={(e) =>
									db.databases.update(currentDB.id, { name: e.target.value })
								}
								className="w-full bg-transparent text-3xl font-extrabold focus:outline-none placeholder-slate-600 border-none"
							/>
							<div className="flex items-center gap-4 mt-6">
								<div className="flex bg-navy-800 p-0.5 rounded-lg border border-navy-700">
									<button
										onClick={() => setView("table")}
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "table" ? "bg-navy-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
									>
										<Table2 size={16} /> Tabla
									</button>
									<button
										onClick={() => setView("kanban")}
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "kanban" ? "bg-navy-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
									>
										<LayoutDashboard size={16} /> Kanban
									</button>
								</div>
							</div>
						</div>

						{view === "table" ? (
							<NexusTableView
								fields={fields}
								rows={rows}
								onAddField={addField}
								onAddRow={addRow}
								onUpdateFieldName={updateFieldName}
								onUpdateRowData={updateRowData}
							/>
						) : (
							<NexusKanbanView
								fields={fields}
								rows={rows}
								activeDbId={activeDbId!}
								onAddField={addField}
								onUpdateRowData={updateRowData}
							/>
						)}
					</div>
				) : (
					<div className="h-full flex flex-col items-center justify-center text-slate-400">
						<Database size={48} className="mb-4 text-slate-700" />
						<p>
							Crea o selecciona una Base de Datos para iniciar conectando tu
							información.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

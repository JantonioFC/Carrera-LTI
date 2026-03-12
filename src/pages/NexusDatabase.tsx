import {
	Calendar as CalendarIcon,
	Database,
	Hash,
	LayoutDashboard,
	Link2,
	ListFilter,
	Plus,
	Table2,
	Type,
} from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
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

		// Add default Name field
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

	const renderFieldIcon = (type: string) => {
		switch (type) {
			case "text":
				return <Type size={14} className="text-slate-400" />;
			case "number":
				return <Hash size={14} className="text-lti-coral" />;
			case "date":
				return <CalendarIcon size={14} className="text-lti-blue" />;
			case "select":
				return <ListFilter size={14} className="text-emerald-400" />;
			case "relation":
				return <Link2 size={14} className="text-purple-400" />;
			default:
				return <Type size={14} />;
		}
	};

	return (
		<div className="h-full flex bg-navy-900 border-l border-navy-700/50 text-white overflow-hidden">
			{/* Sidebar de Bases de Datos */}
			<div className="w-64 flex-shrink-0 flex flex-col bg-navy-950/80 border-r border-navy-700/50">
				<div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
					<h2 className="text-white font-bold tracking-wide flex items-center gap-2">
						<Database size={18} className="text-emerald-400" />
						Bases de Datos
					</h2>
					<button
						onClick={handleCreateDB}
						className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-md transition-colors"
					>
						<Plus size={16} />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-2 space-y-0.5">
					{allDatabases.map((database) => (
						<button
							key={database.id}
							onClick={() => setActiveDbId(database.id)}
							className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${activeDbId === database.id ? "bg-navy-800 text-white font-medium" : "text-slate-400 hover:bg-navy-800/50 hover:text-white"}`}
						>
							<span>{database.icon}</span>
							<span className="truncate">{database.name}</span>
						</button>
					))}
					{allDatabases.length === 0 && (
						<p className="text-xs text-slate-400 text-center py-4">
							No hay tablas todavía.
						</p>
					)}
				</div>
			</div>

			{/* Main Database Canvas */}
			<div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
				{currentDB ? (
					<div className="flex-1 flex flex-col">
						{/* Main Header */}
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
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
											view === "table"
												? "bg-navy-700 text-white shadow-sm"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<Table2 size={16} /> Tabla
									</button>
									<button
										onClick={() => setView("kanban")}
										className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
											view === "kanban"
												? "bg-navy-700 text-white shadow-sm"
												: "text-slate-400 hover:text-white"
										}`}
									>
										<LayoutDashboard size={16} /> Kanban
									</button>
								</div>
							</div>
						</div>

						{/* Table View */}
						{view === "table" ? (
							<div className="flex-1 overflow-auto p-6">
								<div className="min-w-max inline-block align-top border border-navy-700 rounded-lg overflow-hidden bg-navy-900/50 shadow-xl">
									{/* Table Header Row */}
									<div className="flex border-b border-navy-700 bg-navy-800/80">
										{fields.map((field) => (
											<div
												key={field.id}
												className="w-48 px-3 py-2 border-r border-navy-700 last:border-r-0 flex items-center gap-2 shrink-0 group"
											>
												{renderFieldIcon(field.type)}
												<input
													type="text"
													value={field.name}
													onChange={(e) =>
														updateFieldName(field.id, e.target.value)
													}
													className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none w-full group-hover:bg-navy-700/50 px-1 rounded transition-colors"
												/>
											</div>
										))}
										<div className="w-12 flex items-center justify-center shrink-0">
											<button
												onClick={() => addField("text")}
												className="p-1 hover:bg-navy-700 rounded text-slate-400 hover:text-white transition-colors"
											>
												<Plus size={16} />
											</button>
										</div>
									</div>

									{/* Table Rows */}
									{rows.map((row) => (
										<div
											key={row.id}
											className="flex border-b border-navy-700 last:border-b-0 hover:bg-navy-800/30 transition-colors"
										>
											{fields.map((field) => (
												<div
													key={field.id}
													className="w-48 px-3 py-2 border-r border-navy-700 last:border-r-0 shrink-0 flex items-center"
												>
													{field.type === "text" && (
														<input
															className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors"
															value={row.data[field.id] || ""}
															onChange={(e) =>
																updateRowData(row.id, field.id, e.target.value)
															}
															placeholder="Vacío"
														/>
													)}
													{field.type === "number" && (
														<input
															type="number"
															className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors"
															value={row.data[field.id] || ""}
															onChange={(e) =>
																updateRowData(
																	row.id,
																	field.id,
																	Number(e.target.value),
																)
															}
															placeholder="0"
														/>
													)}
													{field.type === "select" && (
														<select
															className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors cursor-pointer"
															value={row.data[field.id] || ""}
															onChange={(e) =>
																updateRowData(row.id, field.id, e.target.value)
															}
														>
															<option value="" className="bg-navy-900">
																Seleccionar...
															</option>
															<option value="Pendiente" className="bg-navy-900">
																Pendiente
															</option>
															<option
																value="En Progreso"
																className="bg-navy-900"
															>
																En Progreso
															</option>
															<option
																value="Completado"
																className="bg-navy-900"
															>
																Completado
															</option>
														</select>
													)}
													{field.type === "date" && (
														<input
															type="date"
															className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors [color-scheme:dark]"
															value={row.data[field.id] || ""}
															onChange={(e) =>
																updateRowData(row.id, field.id, e.target.value)
															}
														/>
													)}
													{field.type !== "text" &&
														field.type !== "number" &&
														field.type !== "select" &&
														field.type !== "date" && (
															<span className="text-sm text-slate-400 italic">
																No impl.
															</span>
														)}
												</div>
											))}
											<div className="w-12 shrink-0"></div>
										</div>
									))}

									{/* Add Row Button */}
									<div className="flex">
										<button
											onClick={addRow}
											className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-navy-800/50 transition-colors text-left"
										>
											<Plus size={16} /> Nueva Fila
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex-1 overflow-x-auto p-6 flex gap-6">
								{fields.find((f) => f.type === "select") ? (
									["Pendiente", "En Progreso", "Completado"].map((status) => {
										const columnField = fields.find(
											(f) => f.type === "select",
										)!;
										const columnRows = rows.filter(
											(r) => (r.data[columnField.id] || "Pendiente") === status,
										);

										return (
											<div
												key={status}
												className="w-80 shrink-0 flex flex-col gap-4"
											>
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
															className="bg-navy-800/50 border border-navy-700/50 p-4 rounded-xl hover:border-navy-600 transition-all cursor-grab active:cursor-grabbing group"
														>
															<input
																className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none mb-2"
																value={row.data[fields[0].id] || ""}
																onChange={(e) =>
																	updateRowData(
																		row.id,
																		fields[0].id,
																		e.target.value,
																	)
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
																			<span className="truncate w-16">
																				{f.name}:
																			</span>
																			<span className="truncate text-slate-400">
																				{row.data[f.id] || "-"}
																			</span>
																		</div>
																	);
																})}
															</div>
														</div>
													))}
													<button
														onClick={() => {
															const columnField = fields.find(
																(f) => f.type === "select",
															)!;
															db.rows.add({
																id: uuidv4(),
																databaseId: activeDbId!,
																createdAt: Date.now(),
																data: { [columnField.id]: status },
															});
														}}
														className="w-full py-2 border border-dashed border-navy-700 rounded-xl text-slate-500 hover:text-white hover:border-navy-600 hover:bg-navy-800/30 transition-all text-xs flex items-center justify-center gap-2"
													>
														<Plus size={14} /> Añadir
													</button>
												</div>
											</div>
										);
									})
								) : (
									<div className="flex-1 flex items-center justify-center text-slate-400 text-center">
										<div>
											<LayoutDashboard
												size={48}
												className="mx-auto mb-4 opacity-20"
											/>
											<h3 className="text-lg font-bold text-white mb-2">
												Vista Kanban
											</h3>
											<p className="max-w-sm text-sm">
												Para usar el Kanban, añade un campo de tipo{" "}
												<b>Select</b> llamado "Estado" (por ejemplo).
											</p>
											<button
												onClick={() => addField("select")}
												className="mt-6 px-4 py-2 bg-lti-blue hover:bg-lti-blue-dark text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-lti-blue/20"
											>
												Añadir Campo Select
											</button>
										</div>
									</div>
								)}
							</div>
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

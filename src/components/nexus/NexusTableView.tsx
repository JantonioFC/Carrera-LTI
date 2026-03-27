import {
	Calendar as CalendarIcon,
	Hash,
	Link2,
	ListFilter,
	Plus,
	Type,
} from "lucide-react";
import { memo } from "react";
import type { NexusFieldValue } from "../../hooks/useNexusDB";

interface NexusField {
	id: string;
	name: string;
	type: string;
}

interface NexusRow {
	id: string;
	data: Record<string, unknown>;
}

interface NexusTableViewProps {
	fields: NexusField[];
	rows: NexusRow[];
	onAddField: (
		type: "text" | "number" | "date" | "select" | "relation",
	) => void;
	onAddRow: () => void;
	onUpdateFieldName: (fieldId: string, name: string) => void;
	onUpdateRowData: (
		rowId: string,
		fieldId: string,
		value: NexusFieldValue,
	) => void;
}

function FieldIcon({ type }: { type: string }) {
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
}

function NexusTableViewInner({
	fields,
	rows,
	onAddField,
	onAddRow,
	onUpdateFieldName,
	onUpdateRowData,
}: NexusTableViewProps) {
	return (
		<div className="flex-1 overflow-auto p-6">
			<div className="min-w-max inline-block align-top border border-navy-700 rounded-lg overflow-hidden bg-navy-900/50 shadow-xl">
				{/* Header Row */}
				<div className="flex border-b border-navy-700 bg-navy-800/80">
					{fields.map((field) => (
						<div
							key={field.id}
							className="w-48 px-3 py-2 border-r border-navy-700 last:border-r-0 flex items-center gap-2 shrink-0 group"
						>
							<FieldIcon type={field.type} />
							<input
								type="text"
								value={field.name}
								onChange={(e) => onUpdateFieldName(field.id, e.target.value)}
								className="bg-transparent text-sm font-semibold text-slate-300 focus:outline-none w-full group-hover:bg-navy-700/50 px-1 rounded transition-colors"
							/>
						</div>
					))}
					<div className="w-12 flex items-center justify-center shrink-0">
						<button
							onClick={() => onAddField("text")}
							className="p-1 hover:bg-navy-700 rounded text-slate-400 hover:text-white transition-colors"
						>
							<Plus size={16} />
						</button>
					</div>
				</div>

				{/* Rows */}
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
										value={(row.data[field.id] as string) || ""}
										onChange={(e) =>
											onUpdateRowData(row.id, field.id, e.target.value)
										}
										placeholder="Vacío"
									/>
								)}
								{field.type === "number" && (
									<input
										type="number"
										className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors"
										value={(row.data[field.id] as number) || ""}
										onChange={(e) =>
											onUpdateRowData(row.id, field.id, Number(e.target.value))
										}
										placeholder="0"
									/>
								)}
								{field.type === "select" && (
									<select
										className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors cursor-pointer"
										value={(row.data[field.id] as string) || ""}
										onChange={(e) =>
											onUpdateRowData(row.id, field.id, e.target.value)
										}
									>
										<option value="" className="bg-navy-900">
											Seleccionar...
										</option>
										<option value="Pendiente" className="bg-navy-900">
											Pendiente
										</option>
										<option value="En Progreso" className="bg-navy-900">
											En Progreso
										</option>
										<option value="Completado" className="bg-navy-900">
											Completado
										</option>
									</select>
								)}
								{field.type === "date" && (
									<input
										type="date"
										className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-navy-800 px-1 py-0.5 rounded transition-colors [color-scheme:dark]"
										value={(row.data[field.id] as string) || ""}
										onChange={(e) =>
											onUpdateRowData(row.id, field.id, e.target.value)
										}
									/>
								)}
								{!["text", "number", "select", "date"].includes(field.type) && (
									<span className="text-sm text-slate-400 italic">
										No impl.
									</span>
								)}
							</div>
						))}
						<div className="w-12 shrink-0" />
					</div>
				))}

				{/* Add Row */}
				<div className="flex">
					<button
						onClick={onAddRow}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-navy-800/50 transition-colors text-left"
					>
						<Plus size={16} /> Nueva Fila
					</button>
				</div>
			</div>
		</div>
	);
}

export const NexusTableView = memo(NexusTableViewInner);

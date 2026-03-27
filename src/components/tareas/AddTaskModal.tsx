import { useState } from "react";
import { useSubjectData } from "../../hooks/useSubjectData";
import type {
	DueDate,
	KanbanStatus,
	Priority,
	SubjectId,
	Task,
} from "../../pages/Tareas";

export function AddTaskModal({
	onAdd,
	onClose,
}: {
	onAdd: (t: Omit<Task, "id">) => void;
	onClose: () => void;
}) {
	const { allSubjects } = useSubjectData();
	const [form, setForm] = useState<Omit<Task, "id">>({
		title: "",
		subjectId: "" as SubjectId,
		dueDate: "" as DueDate,
		priority: "media",
		status: "todo",
		subtasks: [],
	});

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
			<div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-md">
				<div className="p-5 border-b border-navy-700/50 flex justify-between items-center">
					<h3 className="text-white font-semibold">Nueva Tarea</h3>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white text-xl"
					>
						×
					</button>
				</div>
				<div className="p-5 space-y-4">
					<p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest px-1">
						Detalles de la tarea
					</p>
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
							Título
						</label>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
							placeholder="Descripción de la tarea"
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
							U.C.
						</label>
						<select
							value={form.subjectId}
							onChange={(e) =>
								setForm({ ...form, subjectId: e.target.value as SubjectId })
							}
							className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
						>
							<option value="">Seleccionar U.C.</option>
							{allSubjects.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Fecha límite
							</label>
							<input
								type="date"
								value={form.dueDate}
								onChange={(e) =>
									setForm({ ...form, dueDate: e.target.value as DueDate })
								}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Prioridad
							</label>
							<select
								value={form.priority}
								onChange={(e) =>
									setForm({ ...form, priority: e.target.value as Priority })
								}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
							>
								<option value="alta">Alta</option>
								<option value="media">Media</option>
								<option value="baja">Baja</option>
							</select>
						</div>
					</div>
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
							Columna
						</label>
						<select
							value={form.status}
							onChange={(e) =>
								setForm({ ...form, status: e.target.value as KanbanStatus })
							}
							className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
						>
							<option value="todo">Por hacer</option>
							<option value="inProgress">En proceso</option>
							<option value="done">Hecho</option>
						</select>
					</div>
				</div>
				<div className="p-5 border-t border-navy-700/50 flex gap-3 justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-slate-400 hover:text-white"
					>
						Cancelar
					</button>
					<button
						onClick={() => form.title && onAdd(form)}
						disabled={!form.title}
						className="px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium disabled:opacity-40"
					>
						Crear tarea
					</button>
				</div>
			</div>
		</div>
	);
}

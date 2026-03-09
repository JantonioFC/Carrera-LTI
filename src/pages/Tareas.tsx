import { useState, useEffect } from "react";
import {
	Plus,
	X,
	GripVertical,
	Calendar,
	Flag,
	CheckCircle2,
	Circle,
} from "lucide-react";
import { CURRICULUM } from "../data/lti";
import { safeParseJSON } from "../utils/safeStorage";

type KanbanStatus = "todo" | "inProgress" | "done";
type Priority = "alta" | "media" | "baja";

interface Subtask {
	id: string;
	text: string;
	completed: boolean;
}

interface Task {
	id: string;
	title: string;
	subjectId: string;
	dueDate: string;
	priority: Priority;
	status: KanbanStatus;
	subtasks: Subtask[];
}

const INITIAL_TASKS: Task[] = [];

const PRIORITY_STYLES: Record<Priority, string> = {
	alta: "text-red-400 bg-red-500/10 border-red-500/20",
	media: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
	baja: "text-green-400 bg-green-500/10 border-green-500/20",
};

const COLUMNS: { id: KanbanStatus; label: string; accent: string }[] = [
	{ id: "todo", label: "Por hacer", accent: "border-slate-600" },
	{ id: "inProgress", label: "En proceso", accent: "border-lti-blue" },
	{ id: "done", label: "Hecho", accent: "border-green-500" },
];

const sem1Subjects = CURRICULUM[0].subjects;

function AddTaskModal({
	onAdd,
	onClose,
}: {
	onAdd: (t: Omit<Task, "id">) => void;
	onClose: () => void;
}) {
	const [form, setForm] = useState<Omit<Task, "id">>({
		title: "",
		subjectId: sem1Subjects[0].id,
		dueDate: "",
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
							onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
							className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
						>
							{sem1Subjects.map((s) => (
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
								onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
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

export default function Tareas() {
	const [tasks, setTasks] = useState<Task[]>(() => {
		return safeParseJSON<Task[]>("lti_tasks", INITIAL_TASKS);
	});
	const [showAdd, setShowAdd] = useState(false);

	useEffect(() => {
		// Check and request for notification permission
		if (
			"Notification" in window &&
			Notification.permission !== "granted" &&
			Notification.permission !== "denied"
		) {
			Notification.requestPermission();
		}

		// Check for due tasks and notify
		if ("Notification" in window && Notification.permission === "granted") {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const dueTasks = tasks.filter(
				(t) =>
					t.status !== "done" &&
					t.dueDate &&
					new Date(t.dueDate).getTime() <= tomorrow.getTime(),
			);

			const hasSent = sessionStorage.getItem("lti_notified");

			if (dueTasks.length > 0 && !hasSent) {
				new Notification("Carrera LTI - Tareas Pendientes", {
					body: `Tienes ${dueTasks.length} tarea(s) que vencen pronto.`,
					icon: "/pwa-192x192.png",
				});
				sessionStorage.setItem("lti_notified", "true");
			}
		}
	}, [tasks]);

	const saveTasks = (t: Task[]) => {
		setTasks(t);
		localStorage.setItem("lti_tasks", JSON.stringify(t));
	};

	const addTask = (task: Omit<Task, "id">) => {
		saveTasks([...tasks, { ...task, id: `t${Date.now()}` }]);
		setShowAdd(false);
	};

	const deleteTask = (id: string) =>
		saveTasks(tasks.filter((t) => t.id !== id));

	const moveTask = (id: string, status: KanbanStatus) =>
		saveTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));

	const toggleSubtask = (taskId: string, subtaskId: string) => {
		saveTasks(
			tasks.map((t) => {
				if (t.id !== taskId) return t;
				return {
					...t,
					subtasks: t.subtasks.map((st) =>
						st.id === subtaskId ? { ...st, completed: !st.completed } : st,
					),
				};
			}),
		);
	};

	const addSubtask = (taskId: string, text: string) => {
		if (!text.trim()) return;
		saveTasks(
			tasks.map((t) => {
				if (t.id !== taskId) return t;
				return {
					...t,
					subtasks: [
						...t.subtasks,
						{ id: `st${Date.now()}`, text: text.trim(), completed: false },
					],
				};
			}),
		);
	};

	return (
		<div className="p-6 space-y-5 animate-fade-in">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Tareas</h1>
					<p className="text-slate-400 text-sm mt-0.5">
						Tablero de organización del semestre
					</p>
				</div>
				<button
					onClick={() => setShowAdd(true)}
					className="flex items-center gap-2 px-4 py-2 gradient-blue text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
				>
					<Plus size={16} /> Agregar tarea
				</button>
			</div>

			<div className="grid grid-cols-3 gap-5 h-full">
				{COLUMNS.map((col) => {
					const colTasks = tasks.filter((t) => t.status === col.id);
					return (
						<div
							key={col.id}
							className={`card border-t-2 ${col.accent} p-4 space-y-3 min-h-[400px]`}
						>
							<div className="flex items-center justify-between">
								<h3 className="text-white font-semibold text-sm">
									{col.label}
								</h3>
								<span className="px-2 py-0.5 bg-navy-700 text-slate-300 text-xs rounded-full font-bold">
									{colTasks.length}
								</span>
							</div>
							<div className="space-y-2">
								{colTasks.map((task) => {
									const subject = sem1Subjects.find(
										(s) => s.id === task.subjectId,
									);
									return (
										<div
											key={task.id}
											className="bg-navy-900/60 border border-navy-700/50 rounded-xl p-3 space-y-2 hover:border-navy-600/70 transition-all group"
										>
											<div className="flex items-start gap-2">
												<GripVertical
													size={14}
													className="text-navy-600 mt-0.5 flex-shrink-0 cursor-grab"
												/>
												<p className="text-sm text-white font-medium flex-1 leading-snug">
													{task.title}
												</p>
												<button
													onClick={() => deleteTask(task.id)}
													className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
												>
													<X size={13} />
												</button>
											</div>
											<div className="flex items-center gap-2 ml-5 flex-wrap">
												{subject && (
													<span
														className="text-xs px-2 py-0.5 rounded-full font-medium"
														style={{
															backgroundColor: subject.color + "20",
															color: subject.color,
														}}
													>
														{subject.name.split(" ").slice(0, 3).join(" ")}
													</span>
												)}
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority]}`}
												>
													<Flag size={9} className="inline mr-1" />
													{task.priority}
												</span>
											</div>
											{task.dueDate && (
												<p
													className={`text-xs ml-5 flex items-center gap-1 ${new Date(task.dueDate).getTime() < Date.now() && task.status !== "done" ? "text-red-400 font-bold" : "text-slate-400"}`}
												>
													<Calendar size={10} />
													{new Date(
														task.dueDate + "T12:00:00",
													).toLocaleDateString("es-UY", {
														day: "numeric",
														month: "short",
													})}
												</p>
											)}

											{/* Subtasks */}
											<div className="ml-5 space-y-1.5 pt-1">
												{task.subtasks.map((st) => (
													<div
														key={st.id}
														className="flex items-start gap-2 group/st"
													>
														<button
															onClick={() => toggleSubtask(task.id, st.id)}
															className="mt-0.5 text-slate-400 hover:text-lti-blue transition-colors"
														>
															{st.completed ? (
																<CheckCircle2
																	size={12}
																	className="text-lti-blue"
																/>
															) : (
																<Circle size={12} />
															)}
														</button>
														<span
															className={`text-xs flex-1 ${st.completed ? "text-slate-600 line-through" : "text-slate-300"}`}
														>
															{st.text}
														</span>
													</div>
												))}
												<input
													type="text"
													placeholder="+ Agregar subtarea"
													className="w-full bg-transparent border-none text-xs text-slate-400 focus:outline-none focus:text-white placeholder-slate-600"
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															addSubtask(task.id, e.currentTarget.value);
															e.currentTarget.value = "";
														}
													}}
												/>
											</div>

											{/* Move buttons */}
											<div className="flex gap-1 ml-5">
												{COLUMNS.filter((c) => c.id !== col.id).map((c) => (
													<button
														key={c.id}
														onClick={() => moveTask(task.id, c.id)}
														className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-700 transition-colors"
													>
														→ {c.label}
													</button>
												))}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			{showAdd && (
				<AddTaskModal onAdd={addTask} onClose={() => setShowAdd(false)} />
			)}
		</div>
	);
}

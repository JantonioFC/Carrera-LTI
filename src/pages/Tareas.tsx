import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AddTaskModal } from "../components/tareas/AddTaskModal";
import { KanbanColumn } from "../components/tareas/KanbanColumn";
import type { SubtaskId, TaskId } from "../utils/schemas";

export type { SubtaskId, TaskId };
export type KanbanStatus = "todo" | "inProgress" | "done";
export type Priority = "alta" | "media" | "baja";

export interface Subtask {
	id: SubtaskId;
	text: string;
	completed: boolean;
}

export interface Task {
	id: TaskId;
	title: string;
	subjectId: string;
	dueDate: string;
	priority: Priority;
	status: KanbanStatus;
	subtasks: Subtask[];
}

const COLUMNS: { id: KanbanStatus; label: string; accent: string }[] = [
	{ id: "todo", label: "Por hacer", accent: "border-slate-600" },
	{ id: "inProgress", label: "En proceso", accent: "border-lti-blue" },
	{ id: "done", label: "Hecho", accent: "border-green-500" },
];

interface TareasProps {
	tasks: Task[];
	onUpdateTasks: (tasks: Task[]) => void;
}

export default function Tareas({ tasks, onUpdateTasks }: TareasProps) {
	const [showAdd, setShowAdd] = useState(false);

	useEffect(() => {
		if (
			"Notification" in window &&
			Notification.permission !== "granted" &&
			Notification.permission !== "denied"
		) {
			Notification.requestPermission();
		}

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

	const addTask = (task: Omit<Task, "id">) => {
		onUpdateTasks([...tasks, { ...task, id: `t${Date.now()}` as TaskId }]);
		setShowAdd(false);
	};

	const deleteTask = (id: TaskId) =>
		onUpdateTasks(tasks.filter((t) => t.id !== id));

	const moveTask = (id: TaskId, status: KanbanStatus) =>
		onUpdateTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));

	const toggleSubtask = (taskId: TaskId, subtaskId: SubtaskId) => {
		onUpdateTasks(
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

	const addSubtask = (taskId: TaskId, text: string) => {
		if (!text.trim()) return;
		onUpdateTasks(
			tasks.map((t) => {
				if (t.id !== taskId) return t;
				return {
					...t,
					subtasks: [
						...t.subtasks,
						{
							id: `st${Date.now()}` as SubtaskId,
							text: text.trim(),
							completed: false,
						},
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
				{COLUMNS.map((col) => (
					<KanbanColumn
						key={col.id}
						columnId={col.id}
						label={col.label}
						accent={col.accent}
						tasks={tasks.filter((t) => t.status === col.id)}
						onDelete={deleteTask}
						onMove={moveTask}
						onToggleSubtask={toggleSubtask}
						onAddSubtask={addSubtask}
					/>
				))}
			</div>

			{showAdd && (
				<AddTaskModal onAdd={addTask} onClose={() => setShowAdd(false)} />
			)}
		</div>
	);
}

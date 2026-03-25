import {
	Calendar,
	CheckCircle2,
	Circle,
	Flag,
	GripVertical,
	X,
} from "lucide-react";
import { useSubjectData } from "../../hooks/useSubjectData";
import type {
	KanbanStatus,
	Subtask,
	SubtaskId,
	Task,
	TaskId,
} from "../../pages/Tareas";

const PRIORITY_STYLES: Record<string, string> = {
	alta: "text-red-400 bg-red-500/10 border-red-500/20",
	media: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
	baja: "text-green-400 bg-green-500/10 border-green-500/20",
};

const OTHER_COLUMNS: { id: KanbanStatus; label: string }[] = [
	{ id: "todo", label: "Por hacer" },
	{ id: "inProgress", label: "En proceso" },
	{ id: "done", label: "Hecho" },
];

interface KanbanColumnProps {
	columnId: KanbanStatus;
	label: string;
	accent: string;
	tasks: Task[];
	onDelete: (id: TaskId) => void;
	onMove: (id: TaskId, status: KanbanStatus) => void;
	onToggleSubtask: (taskId: TaskId, subtaskId: SubtaskId) => void;
	onAddSubtask: (taskId: TaskId, text: string) => void;
}

function TaskCard({
	task,
	columnId,
	onDelete,
	onMove,
	onToggleSubtask,
	onAddSubtask,
}: {
	task: Task;
	columnId: KanbanStatus;
	onDelete: (id: TaskId) => void;
	onMove: (id: TaskId, status: KanbanStatus) => void;
	onToggleSubtask: (taskId: TaskId, subtaskId: SubtaskId) => void;
	onAddSubtask: (taskId: TaskId, text: string) => void;
}) {
	const { allSubjects } = useSubjectData();
	const subject = allSubjects.find((s) => s.id === task.subjectId);

	return (
		<div className="bg-navy-900/60 border border-navy-700/50 rounded-xl p-3 space-y-2 hover:border-navy-600/70 transition-all group">
			<div className="flex items-start gap-2">
				<GripVertical
					size={14}
					className="text-navy-600 mt-0.5 flex-shrink-0 cursor-grab"
				/>
				<p className="text-sm text-white font-medium flex-1 leading-snug">
					{task.title}
				</p>
				<button
					onClick={() => onDelete(task.id)}
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
							backgroundColor: `${subject.color}20`,
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
					{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("es-UY", {
						day: "numeric",
						month: "short",
					})}
				</p>
			)}
			<div className="ml-5 space-y-1.5 pt-1">
				{task.subtasks.map((st: Subtask) => (
					<div key={st.id} className="flex items-start gap-2 group/st">
						<button
							onClick={() => onToggleSubtask(task.id, st.id)}
							className="mt-0.5 text-slate-400 hover:text-lti-blue transition-colors"
						>
							{st.completed ? (
								<CheckCircle2 size={12} className="text-lti-blue" />
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
							onAddSubtask(task.id, e.currentTarget.value);
							e.currentTarget.value = "";
						}
					}}
				/>
			</div>
			<div className="flex gap-1 ml-5">
				{OTHER_COLUMNS.filter((c) => c.id !== columnId).map((c) => (
					<button
						key={c.id}
						onClick={() => onMove(task.id, c.id)}
						className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-700 transition-colors"
					>
						→ {c.label}
					</button>
				))}
			</div>
		</div>
	);
}

export function KanbanColumn({
	columnId,
	label,
	accent,
	tasks,
	onDelete,
	onMove,
	onToggleSubtask,
	onAddSubtask,
}: KanbanColumnProps) {
	return (
		<div className={`card border-t-2 ${accent} p-4 space-y-3 min-h-[400px]`}>
			<div className="flex items-center justify-between">
				<h3 className="text-white font-semibold text-sm">{label}</h3>
				<span className="px-2 py-0.5 bg-navy-700 text-slate-300 text-xs rounded-full font-bold">
					{tasks.length}
				</span>
			</div>
			<div className="space-y-2">
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
						columnId={columnId}
						onDelete={onDelete}
						onMove={onMove}
						onToggleSubtask={onToggleSubtask}
						onAddSubtask={onAddSubtask}
					/>
				))}
			</div>
		</div>
	);
}

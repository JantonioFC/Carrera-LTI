import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Subject } from "../../data/lti";
import { WEEKDAY_SHORT } from "../../data/lti";
import type { ScheduleItem } from "../../pages/Horarios";
import { SortableItem } from "./SortableItem";

interface DroppableColumnProps {
	day: number | null;
	items: ScheduleItem[];
	allSubjects: Subject[];
	onAdd?: () => void;
	onUpdateTime: (id: string, start: string, end: string) => void;
	onRemove: (id: string) => void;
}

export function DroppableColumn({
	day,
	items,
	allSubjects,
	onAdd,
	onUpdateTime,
	onRemove,
}: DroppableColumnProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: day === null ? "bank" : `day-${day}`,
		data: {
			type: "Column",
			day,
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={`flex flex-col flex-1 min-w-[200px] bg-navy-800/50 rounded-xl p-3 border h-full transition-all duration-200 z-10 ${
				isOver
					? "border-lti-coral bg-navy-800 shadow-lg shadow-lti-coral/10"
					: day === null
						? "border-lti-coral/30"
						: "border-navy-700/50 shadow-sm"
			}`}
		>
			<div className="flex items-center justify-between mb-3 px-1">
				<h3
					className={`text-xs font-bold uppercase tracking-wider ${day === null ? "text-lti-coral" : "text-slate-400"}`}
				>
					{day === null ? "Banco de U.C." : WEEKDAY_SHORT[day]}
				</h3>
				{day === null && onAdd && (
					<button
						onClick={onAdd}
						title="Gestionar materias activas"
						className="p-1 hover:bg-lti-blue/20 text-lti-blue rounded-md transition-colors border border-transparent hover:border-lti-blue/30"
					>
						<Plus size={14} />
					</button>
				)}
			</div>
			<div className="flex-1 min-h-[500px]">
				<SortableContext
					items={items.map((i) => i.id)}
					strategy={verticalListSortingStrategy}
				>
					{items.map((item) => {
						const subject = allSubjects.find((s) => s.id === item.subjectId);
						return (
							<SortableItem
								key={item.id}
								id={item.id}
								item={item}
								subject={subject}
								onUpdateTime={onUpdateTime}
								onRemove={onRemove}
							/>
						);
					})}
				</SortableContext>
			</div>
		</div>
	);
}

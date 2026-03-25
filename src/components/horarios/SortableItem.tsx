import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Subject } from "../../data/lti";
import type { ScheduleItem } from "../../pages/Horarios";

interface SortableItemProps {
	id: string;
	item: ScheduleItem;
	subject: Subject | undefined;
	onUpdateTime: (id: string, start: string, end: string) => void;
	onRemove: (id: string) => void;
}

export function SortableItem({
	id,
	item,
	subject,
	onUpdateTime,
	onRemove,
}: SortableItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [tempStart, setTempStart] = useState(item.startTime || "18:00");
	const [tempEnd, setTempEnd] = useState(item.endTime || "22:00");

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		data: {
			type: "Task",
			item,
		},
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="bg-navy-900/80 border border-navy-700/50 rounded-lg p-2.5 mb-2 group touch-none hover:border-lti-blue/30 transition-all shadow-lg"
		>
			<div className="flex items-start gap-2">
				<div
					{...attributes}
					{...listeners}
					className="cursor-grab p-1 mt-0.5 text-slate-500 hover:text-white transition-colors"
				>
					<GripVertical size={14} />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-xs text-white font-bold truncate mb-1">
						{subject?.name}
					</p>

					{isEditing ? (
						<div className="space-y-2 mt-2">
							<div className="flex items-center gap-1">
								<input
									type="time"
									value={tempStart}
									onChange={(e) => setTempStart(e.target.value)}
									className="bg-navy-950 border border-navy-700 rounded px-1.5 py-0.5 text-[10px] text-white w-full outline-none focus:border-lti-blue"
								/>
								<span className="text-slate-600">-</span>
								<input
									type="time"
									value={tempEnd}
									onChange={(e) => setTempEnd(e.target.value)}
									className="bg-navy-950 border border-navy-700 rounded px-1.5 py-0.5 text-[10px] text-white w-full outline-none focus:border-lti-blue"
								/>
							</div>
							<div className="flex gap-1">
								<button
									onClick={() => {
										onUpdateTime(id, tempStart, tempEnd);
										setIsEditing(false);
									}}
									className="flex-1 bg-lti-blue text-white text-[10px] py-1 rounded font-bold hover:bg-lti-blue/80"
								>
									OK
								</button>
								<button
									onClick={() => setIsEditing(false)}
									className="bg-navy-700 text-slate-400 text-[10px] px-2 py-1 rounded hover:text-white"
								>
									X
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<div
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-1 text-[10px] text-slate-400 font-medium hover:text-lti-blue transition-colors cursor-pointer"
							>
								<Clock size={10} />
								<span>
									{item.startTime || "00:00"} - {item.endTime || "00:00"}
								</span>
							</div>
							<button
								onClick={() => onRemove(id)}
								className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-lti-coral p-1 transition-all"
							>
								<Trash2 size={12} />
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

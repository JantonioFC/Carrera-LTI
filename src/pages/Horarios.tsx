import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	defaultDropAnimationSideEffects,
	KeyboardSensor,
	PointerSensor,
	rectIntersection,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { DroppableColumn } from "../components/horarios/DroppableColumn";
import { SelectSubjectModal } from "../components/horarios/SelectSubjectModal";
import { useSubjectData } from "../hooks/useSubjectData";
import { logger } from "../utils/logger";

const DAYS = [1, 2, 3, 4, 5, 6]; // Lun a Sáb

export interface ScheduleItem {
	id: string; // The specific scheduled block id
	subjectId: string;
	day: number | null; // null means in the "bank"
	startTime?: string;
	endTime?: string;
}

interface HorariosProps {
	schedule: ScheduleItem[];
	onUpdateSchedule: (schedule: ScheduleItem[]) => void;
}

export default function Horarios({
	schedule,
	onUpdateSchedule,
}: HorariosProps) {
	const { allSubjects, data } = useSubjectData();

	// QP-09 (#204): memoizar para evitar find() en cada render
	const subjectStatusById = useMemo(() => {
		const m = new Map<string, string | undefined>();
		for (const s of allSubjects) m.set(s.id, s.status);
		return m;
	}, [allSubjects]);

	const items = useMemo(
		() =>
			schedule.filter((item) => {
				const status =
					data[item.subjectId]?.status ?? subjectStatusById.get(item.subjectId);
				return status === "en_curso";
			}),
		[schedule, data, subjectStatusById],
	);
	const [isSelecting, setIsSelecting] = useState(false);

	const setItems = (
		newItems: ScheduleItem[] | ((prev: ScheduleItem[]) => ScheduleItem[]),
	) => {
		if (typeof newItems === "function") {
			onUpdateSchedule(newItems(schedule));
		} else {
			onUpdateSchedule(newItems);
		}
	};

	const [activeId, setActiveId] = useState<string | null>(null);

	const handleUpdateTime = (id: string, start: string, end: string) => {
		setItems((prev) =>
			prev.map((i) =>
				i.id === id ? { ...i, startTime: start, endTime: end } : i,
			),
		);
	};

	const handleRemove = (id: string) => {
		setItems((prev) => prev.filter((i) => i.id !== id));
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) return;

		const activeId = active.id.toString();
		const overId = over.id.toString();

		if (activeId === overId) return;

		const activeData = active.data.current;
		const overData = over.data.current;

		if (activeData?.type !== "Task") return;

		let overDay: number | null = null;

		if (overData?.type === "Column") {
			overDay = overData.day;
		} else if (overData?.type === "Task") {
			overDay = overData.item.day;
		} else if (overId.startsWith("day-")) {
			const dayStr = overId.replace("day-", "");
			overDay = dayStr === "null" ? null : Number.parseInt(dayStr, 10);
		} else if (overId === "bank") {
			overDay = null;
		}

		if (overDay !== undefined) {
			setItems((prev) => {
				const activeIndex = prev.findIndex((i) => i.id === activeId);
				if (activeIndex === -1) return prev;

				const item = { ...prev[activeIndex] };
				if (item.day === overDay) {
					// Reorder within same day if over another task
					if (overData?.type === "Task") {
						const overIndex = prev.findIndex((i) => i.id === overId);
						return arrayMove(prev, activeIndex, overIndex);
					}
					return prev;
				}

				// Preview moving item to new day
				item.day = overDay;
				const newItems = [...prev];
				newItems[activeIndex] = item;

				// If over a task in another day, move to that position
				if (overData?.type === "Task") {
					const overIndex = prev.findIndex((i) => i.id === overId);
					return arrayMove(newItems, activeIndex, overIndex);
				}

				return newItems;
			});
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		const activeId = active.id.toString();

		if (!over) {
			logger.debug("Horarios", "[DND] DragEnd: No drop target found");
			// If it's a bank item, move it back to the bank if it was left in a day during DragOver
			if (activeId.startsWith("bank-")) {
				setItems((prev) =>
					prev.map((i) => (i.id === activeId ? { ...i, day: null } : i)),
				);
			}
			return;
		}

		const overId = over.id.toString();
		logger.debug(
			"Horarios",
			`[DND] DragEnd: active=${activeId} over=${overId}`,
		);

		setItems((prev) => {
			const activeIndex = prev.findIndex((i) => i.id === activeId);
			if (activeIndex === -1) return prev;

			const overData = over.data.current;
			let overDay: number | null | undefined;

			if (overData?.type === "Column") {
				overDay = overData.day;
			} else if (overData?.type === "Task") {
				overDay = overData.item.day;
			} else if (overId.startsWith("day-")) {
				const dayStr = overId.replace("day-", "");
				overDay = dayStr === "null" ? null : Number.parseInt(dayStr, 10);
			} else if (overId === "bank") {
				overDay = null;
			}

			// Case 1: Dropped on bank -> Delete if it's an instance
			if (overDay === null) {
				if (!activeId.startsWith("bank-")) {
					logger.debug("Horarios", `[DND] Removing instance ${activeId}`);
					return prev.filter((i) => i.id !== activeId);
				}
				// If it's the master bank item, just ensure it stays in bank
				const newItems = [...prev];
				newItems[activeIndex] = { ...prev[activeIndex], day: null };
				return newItems;
			}

			// Case 2: Dropped on a day
			if (overDay !== undefined && overDay !== null) {
				const originalItem = prev[activeIndex];
				const newItem = { ...originalItem, day: overDay };

				// If it's a bank master, clone it by giving it a new instance ID
				if (activeId.startsWith("bank-")) {
					logger.debug(
						"Horarios",
						`[DND] Cloning master ${activeId} to day ${overDay}`,
					);
					const instanceId = `inst-${newItem.subjectId}-${Math.random().toString(36).substring(2, 9)}`;

					// IMPORTANT: The master stays in the bank (day null)
					// We insert the new instance at the same position or reordered
					const newItems = [...prev];
					const instanceItem = { ...newItem, id: instanceId };

					if (overData?.type === "Task") {
						const overIndex = newItems.findIndex((i) => i.id === overId);
						// Remove nothing, add instance at overIndex
						newItems.splice(overIndex, 0, instanceItem);
					} else {
						newItems.push(instanceItem);
					}

					// The master block remains at its index but definitely as day: null
					newItems[activeIndex] = { ...originalItem, day: null };
					return newItems;
				}

				const newItems = [...prev];
				newItems[activeIndex] = newItem;

				// Handle reordering if dropped over another task
				if (overData?.type === "Task") {
					const overIndex = newItems.findIndex((i) => i.id === overId);
					return arrayMove(newItems, activeIndex, overIndex);
				}

				return newItems;
			}

			// Case 3: Reordering within same list (handled by overDay logic above or fallback)
			const overIndex = prev.findIndex((i) => i.id === overId);
			if (overIndex !== -1 && activeIndex !== overIndex) {
				return arrayMove(prev, activeIndex, overIndex);
			}

			return prev;
		});
	};

	const activeItem = activeId ? items.find((i) => i.id === activeId) : null;
	const activeSubject = activeItem
		? allSubjects.find((s) => s.id === activeItem.subjectId)
		: null;

	return (
		<div className="p-6 space-y-6 animate-fade-in flex flex-col h-full">
			<div>
				<h1 className="text-2xl font-bold text-white">
					Generador Visual de Horarios
				</h1>
				<p className="text-slate-400 text-sm mt-0.5">
					Arrastra tus materias a los días de la semana para planificar tu
					estudio
				</p>
			</div>

			<div className="flex-1 flex gap-4 overflow-x-auto pb-4">
				<DndContext
					sensors={sensors}
					collisionDetection={rectIntersection}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
				>
					{/* Subject Bank */}
					<div className="w-64 flex-shrink-0 flex flex-col">
						<DroppableColumn
							day={null}
							items={items.filter((i) => i.day === null)}
							allSubjects={allSubjects}
							onAdd={() => setIsSelecting(true)}
							onUpdateTime={handleUpdateTime}
							onRemove={handleRemove}
						/>
					</div>

					{/* Days Grid */}
					<div className="flex-1 flex gap-3 min-w-[1000px] overflow-x-auto">
						{DAYS.map((day) => (
							<DroppableColumn
								key={day}
								day={day}
								items={items.filter((i) => i.day === day)}
								allSubjects={allSubjects}
								onUpdateTime={handleUpdateTime}
								onRemove={handleRemove}
							/>
						))}
					</div>

					<DragOverlay
						dropAnimation={{
							sideEffects: defaultDropAnimationSideEffects({
								styles: { active: { opacity: "0.4" } },
							}),
						}}
					>
						{activeId && activeItem ? (
							<div className="bg-navy-700 border-2 border-lti-blue rounded-lg p-2 flex items-center gap-2 rotate-2 shadow-2xl opacity-90">
								<GripVertical size={14} className="text-lti-blue" />
								<div className="flex-1 min-w-0">
									<p className="text-xs text-white font-bold truncate">
										{activeSubject?.name}
									</p>
								</div>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>
			{isSelecting && (
				<SelectSubjectModal onClose={() => setIsSelecting(false)} />
			)}
		</div>
	);
}

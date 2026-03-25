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
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { type Subject, WEEKDAY_SHORT } from "../data/lti";
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

function SortableItem({
	id,
	item,
	subject,
	onUpdateTime,
	onRemove,
}: {
	id: string;
	item: ScheduleItem;
	subject: Subject | undefined;
	onUpdateTime: (id: string, start: string, end: string) => void;
	onRemove: (id: string) => void;
}) {
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

function DroppableColumn({
	day,
	items,
	allSubjects,
	onAdd,
	onUpdateTime,
	onRemove,
}: {
	day: number | null;
	items: ScheduleItem[];
	allSubjects: Subject[];
	onAdd?: () => void;
	onUpdateTime: (id: string, start: string, end: string) => void;
	onRemove: (id: string) => void;
}) {
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

interface HorariosProps {
	schedule: ScheduleItem[];
	onUpdateSchedule: (schedule: ScheduleItem[]) => void;
}

export default function Horarios({
	schedule,
	onUpdateSchedule,
}: HorariosProps) {
	const { allSubjects, data } = useSubjectData();
	// Filtrar items del cronograma: Solo los que están "en curso"
	const items = schedule.filter((item) => {
		const subject = allSubjects.find((s) => s.id === item.subjectId);
		const status = data[item.subjectId]?.status || subject?.status;
		return status === "en_curso";
	});
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
					{/* Subjet Bank */}
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

function SelectSubjectModal({ onClose }: { onClose: () => void }) {
	const { allSubjects, data, updateSubject } = useSubjectData();
	const [search, setSearch] = useState("");

	const available = useMemo(() => {
		return allSubjects.filter((s) => {
			const status = data[s.id]?.status || s.status;
			const isAlreadyActive = status === "en_curso";
			const isApproved = status === "aprobada";
			const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
			return !isAlreadyActive && !isApproved && matchesSearch;
		});
	}, [allSubjects, data, search]);

	const groupedBySemester = useMemo(() => {
		const groups: Record<number, Subject[]> = {};
		available.forEach((s) => {
			const sem = s.semester || 1;
			if (!groups[sem]) groups[sem] = [];
			groups[sem].push(s);
		});
		return groups;
	}, [available]);

	const semesters = Object.keys(groupedBySemester)
		.map(Number)
		.sort((a, b) => a - b);

	const handleAdd = (id: string) => {
		updateSubject(id, { status: "en_curso" });
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
			<div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
				<div className="p-4 border-b border-navy-700/50 flex justify-between items-center bg-navy-800 rounded-t-2xl">
					<h3 className="text-white font-semibold flex items-center gap-2">
						<Plus size={18} className="text-lti-blue" />
						Activar Materias
					</h3>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors"
					>
						<X size={20} />
					</button>
				</div>
				<div className="p-4 bg-navy-900/50 border-b border-navy-700/50">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
							size={16}
						/>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar materia..."
							className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lti-blue transition-colors outline-none"
						/>
					</div>
				</div>
				<div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
					{semesters.length === 0 ? (
						<p className="text-xs text-slate-500 italic text-center py-8">
							No hay más materias para activar
						</p>
					) : (
						semesters.map((sem) => (
							<div key={sem} className="mb-4">
								<div className="px-3 py-1 flex items-center gap-2 mb-1 sticky top-0 bg-navy-800/90 backdrop-blur-sm z-10 rounded-md">
									<div className="h-px flex-1 bg-navy-700"></div>
									<span className="text-[10px] font-bold text-lti-blue uppercase tracking-widest whitespace-nowrap">
										Semestre {sem}
									</span>
									<div className="h-px flex-1 bg-navy-700"></div>
								</div>
								<div className="space-y-0.5">
									{groupedBySemester[sem].map((s) => (
										<button
											key={s.id}
											onClick={() => handleAdd(s.id)}
											className="w-full text-left p-2.5 rounded-lg hover:bg-navy-700 transition-colors group flex items-center justify-between"
										>
											<div>
												<p className="text-sm font-medium text-white group-hover:text-lti-blue">
													{s.name}
												</p>
												<p className="text-[10px] text-slate-400">{s.area}</p>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-[10px] font-bold text-slate-500">
													{s.credits} CR
												</span>
												<Plus
													size={14}
													className="text-lti-blue opacity-0 group-hover:opacity-100"
												/>
											</div>
										</button>
									))}
								</div>
							</div>
						))
					)}
				</div>
				<div className="p-4 border-t border-navy-700/50 bg-navy-800 rounded-b-2xl text-center">
					<p className="text-[10px] text-slate-500">
						Las materias seleccionadas se añadirán al banco de horarios.
					</p>
				</div>
			</div>
		</div>
	);
}

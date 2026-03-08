import { useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CURRICULUM, WEEKDAY_SHORT } from '../data/lti';
import { GripVertical } from 'lucide-react';

const DAYS = [1, 2, 3, 4, 5, 6]; // Lun a Sáb

interface ScheduleItem {
  id: string; // The specific scheduled block id
  subjectId: string;
  day: number | null; // null means in the "bank"
}

function SortableItem({ id, subject }: { id: string, subject: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-navy-900/60 border border-navy-700/50 rounded-lg p-2 flex items-center gap-2 mb-2 group touch-none"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-slate-500 hover:text-white transition-colors">
        <GripVertical size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white font-medium truncate">{subject?.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: subject?.color + '20', color: subject?.color }}>
            {subject?.area}
          </span>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ day, items, allSubjects }: { day: number | null, items: ScheduleItem[], allSubjects: any[] }) {
  const { setNodeRef } = useSortable({
    id: `col-${day}`,
    data: {
      type: 'Column',
      day
    }
  });

  return (
    <div className={`flex flex-col flex-1 min-w-[150px] bg-navy-800/50 rounded-xl p-3 border ${day === null ? 'border-lti-coral/30' : 'border-navy-700/50'}`}>
      <h3 className="text-sm font-semibold text-white mb-3 text-center">
        {day === null ? 'Banco de U.C.' : WEEKDAY_SHORT[day]}
      </h3>
      <div ref={setNodeRef} className="flex-1 min-h-[100px]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => {
            const subject = allSubjects.find(s => s.id === item.subjectId);
            return <SortableItem key={item.id} id={item.id} subject={subject} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Horarios() {
  const sem1 = CURRICULUM[0].subjects; // Mocking current semester
  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('lti_schedule');
    if (saved) return JSON.parse(saved);
    // Initialize bank with 1 block per subject
    return sem1.map(s => ({ id: `blk-${s.id}`, subjectId: s.id, day: null }));
  });
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.sortable;
    const isOverTask = over.data.current?.sortable;
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setItems(prevItems => {
      const activeIndex = prevItems.findIndex(t => t.id === activeId);
      let activeItem = { ...prevItems[activeIndex] };

      if (isOverTask) {
        const overIndex = prevItems.findIndex(t => t.id === overId);
        const overItem = prevItems[overIndex];
        
        if (activeItem.day !== overItem.day) {
          activeItem.day = overItem.day;
          let newItems = [...prevItems];
          newItems[activeIndex] = activeItem;
          return arrayMove(newItems, activeIndex, overIndex);
        }
        return arrayMove(prevItems, activeIndex, overIndex);
      }

      if (isOverColumn) {
        if (activeItem.day !== over.data.current.day) {
          activeItem.day = over.data.current.day;
          let newItems = [...prevItems];
          newItems[activeIndex] = activeItem;
          return arrayMove(newItems, activeIndex, prevItems.length - 1);
        }
      }
      return prevItems;
    });
  };

  const handleDragEnd = () => {
    setActiveId(null);
    localStorage.setItem('lti_schedule', JSON.stringify(items));
  };

  const activeItem = activeId ? items.find(i => i.id === activeId) : null;
  const activeSubject = activeItem ? sem1.find(s => s.id === activeItem.subjectId) : null;

  return (
    <div className="p-6 space-y-6 animate-fade-in flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Generador Visual de Horarios</h1>
        <p className="text-slate-400 text-sm mt-0.5">Arrastra tus materias a los días de la semana para planificar tu estudio</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Subjet Bank */}
          <div className="w-64 flex-shrink-0 flex flex-col">
            <DroppableColumn day={null} items={items.filter(i => i.day === null)} allSubjects={sem1} />
          </div>

          {/* Days Grid */}
          <div className="flex-1 flex gap-3 min-w-[800px] overflow-x-auto">
            {DAYS.map(day => (
              <DroppableColumn key={day} day={day} items={items.filter(i => i.day === day)} allSubjects={sem1} />
            ))}
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeId && activeItem ? (
              <div className="bg-navy-700 border-2 border-lti-blue rounded-lg p-2 flex items-center gap-2 rotate-2 shadow-2xl opacity-90">
                <GripVertical size={14} className="text-lti-blue" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-bold truncate">{activeSubject?.name}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

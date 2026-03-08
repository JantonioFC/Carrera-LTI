import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, AlertCircle, MapPin, Trash2 } from 'lucide-react';
import {
  CURRICULUM, formatDate, getDaysUntil, isDatePast,
  SEMESTER_START, EXAM_START, EXAM_END,
  type PresencialEvent
} from '../data/lti';

interface CalendarioProps {
  presenciales: PresencialEvent[];
  onUpdatePresenciales: (p: PresencialEvent[]) => void;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function EditPresencialModal({
  event, onSave, onDelete, onClose,
}: { event: PresencialEvent; onSave: (u: PresencialEvent) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...event });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-navy-700/50 flex justify-between items-center">
          <h3 className="text-white font-semibold">Editar Instancia Presencial</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Fecha', key: 'date', type: 'date' },
            { label: 'Actividad', key: 'activity', type: 'text' },
            { label: 'Sede', key: 'sede', type: 'text' },
            { label: 'Horario', key: 'hours', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                value={String(form[key as keyof PresencialEvent])}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.includesEval}
              onChange={(e) => setForm({ ...form, includesEval: e.target.checked })}
              className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-slate-300">Incluye evaluación final</span>
          </label>
        </div>
        <div className="p-5 border-t border-navy-700/50 flex items-center justify-between">
          <button onClick={() => onDelete(event.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={14} /> Eliminar
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
            <button onClick={() => onSave(form)} className="px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Calendario({ presenciales, onUpdatePresenciales }: CalendarioProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [editingEvent, setEditingEvent] = useState<PresencialEvent | null>(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // 0=Dom → 6, 1=Lun → 0, 2=Mar → 1 ... (semana inicia en Lunes)
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events: { label: string; type: 'presencial' | 'materia' | 'examen'; color: string; event?: PresencialEvent }[] = [];

    // Presenciales
    presenciales.forEach((p) => { if (p.date === dateStr) events.push({ label: p.activity, type: 'presencial', color: '#f97316', event: p }); });
    // Semester start
    if (dateStr === SEMESTER_START) events.push({ label: 'Inicio Semestre', type: 'materia', color: '#0ea5e9' });
    // Exams
    if (dateStr >= EXAM_START && dateStr <= EXAM_END) events.push({ label: 'Período Exámenes', type: 'examen', color: '#a855f7' });
    // Subject starts
    CURRICULUM[0].subjects.forEach((s) => { if (s.startDate === dateStr) events.push({ label: `Inicio: ${s.name.slice(0, 20)}...`, type: 'materia', color: s.color }); });

    return events;
  };

  const handleSave = (updated: PresencialEvent) => {
    onUpdatePresenciales(presenciales.map((p) => (p.id === updated.id ? updated : p)));
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    onUpdatePresenciales(presenciales.filter((p) => p.id !== id));
    setEditingEvent(null);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <p className="text-slate-400 text-sm mt-0.5">Semestre 1 — 2026</p>
      </div>

      {/* Upcoming presenciales sidebar + calendar */}
      <div className="grid grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="col-span-2 card p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-white font-semibold">{MONTHS_ES[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const events = getEventsForDay(day);
              return (
                <div key={day} className={`min-h-[64px] rounded-lg p-1.5 border transition-colors ${
                  isToday ? 'border-lti-blue/50 bg-lti-blue/5' : 'border-navy-700/30 hover:border-navy-600/50'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-lti-blue' : 'text-slate-400'}`}>
                    {day}
                  </p>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((ev, idx) => (
                      <div key={idx}
                        className="text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium cursor-default"
                        style={{ backgroundColor: ev.color + '25', color: ev.color }}
                        title={ev.label}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <p className="text-[9px] text-slate-500">+{events.length - 2}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-navy-700/50">
            {[
              { label: 'Presencial obligatoria', color: '#f97316' },
              { label: 'Evento académico', color: '#0ea5e9' },
              { label: 'Período de exámenes', color: '#a855f7' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Presenciales list */}
        <div className="card p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <MapPin size={14} className="text-lti-orange" />
            Presenciales — Minas
          </h3>
          <div className="space-y-2">
            {presenciales.map((p) => {
              const past = isDatePast(p.date);
              const days = getDaysUntil(p.date);
              return (
                <div key={p.id} className={`p-3 rounded-lg border text-xs space-y-1 ${
                  past ? 'border-navy-700/20 opacity-50' : 'border-navy-700/40 hover:border-lti-orange/30 transition-colors'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${past ? 'text-slate-500' : 'text-white'}`}>
                      {formatDate(p.date)}
                    </p>
                    <button onClick={() => setEditingEvent(p)} className="text-slate-500 hover:text-lti-blue transition-colors flex-shrink-0">
                      <Pencil size={12} />
                    </button>
                  </div>
                  <p className="text-slate-400">{p.activity}</p>
                  {p.includesEval && !past && (
                    <span className="flex items-center gap-1 text-lti-orange font-medium">
                      <AlertCircle size={10} /> Eval. final
                    </span>
                  )}
                  {!past && <p className="text-slate-500">En {days} días</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingEvent && (
        <EditPresencialModal event={editingEvent} onSave={handleSave} onDelete={handleDelete} onClose={() => setEditingEvent(null)} />
      )}
    </div>
  );
}

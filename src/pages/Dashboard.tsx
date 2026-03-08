import { useState } from 'react';
import { Pencil, Check, X, MapPin, AlertCircle, Clock, Trash2 } from 'lucide-react';
import {
  CURRICULUM, SEMESTER_START, EXAM_START, EXAM_END, TOTAL_CREDITS,
  getDaysUntil, formatDate, formatDateShort, isDatePast,
  type PresencialEvent
} from '../data/lti';
import { useSubjectData } from '../hooks/useSubjectData';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  presenciales: PresencialEvent[];
  onUpdatePresenciales: (p: PresencialEvent[]) => void;
}

function EditPresencialModal({
  event,
  onSave,
  onDelete,
  onClose,
}: {
  event: PresencialEvent;
  onSave: (updated: PresencialEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...event });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-navy-700/50 flex items-center justify-between">
          <h3 className="text-white font-semibold">Editar Instancia Presencial</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Actividad</label>
            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
              placeholder="Nombre de la actividad"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sede</label>
            <input
              type="text"
              value={form.sede}
              onChange={(e) => setForm({ ...form, sede: e.target.value })}
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Horario</label>
            <input
              type="text"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
              placeholder="ej: 9:00 - 17:00"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includesEval"
              checked={form.includesEval}
              onChange={(e) => setForm({ ...form, includesEval: e.target.checked })}
              className="w-4 h-4 accent-lti-orange"
            />
            <label htmlFor="includesEval" className="text-sm text-slate-300">
              Incluye evaluación final
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-navy-700/50 flex items-center justify-between">
          <button
            onClick={() => onDelete(event.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(form)}
              className="flex items-center gap-2 px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Check size={14} />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ presenciales, onUpdatePresenciales }: DashboardProps) {
  const [editingEvent, setEditingEvent] = useState<PresencialEvent | null>(null);
  const daysToStart = getDaysUntil(SEMESTER_START);
  const sem1 = CURRICULUM[0].subjects;
  
  const { getAverage, getApprovedCredits } = useSubjectData();
  const average = getAverage();
  const approved = getApprovedCredits();

  const upcomingPresenciales = presenciales
    .filter((p) => getDaysUntil(p.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleSaveEvent = (updated: PresencialEvent) => {
    const newList = presenciales.map((p) => (p.id === updated.id ? updated : p));
    onUpdatePresenciales(newList);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdatePresenciales(presenciales.filter((p) => p.id !== id));
    setEditingEvent(null);
  };

  const { data } = useSubjectData();

  // Charts Data
  const totalApproved = CURRICULUM.flatMap(s => s.subjects).filter(s => data[s.id]?.status === 'aprobada').reduce((acc, s) => acc + s.credits, 0);
  const totalInProgress = CURRICULUM.flatMap(s => s.subjects).filter(s => data[s.id]?.status === 'en_curso').reduce((acc, s) => acc + s.credits, 0);
  const totalMissing = TOTAL_CREDITS - totalApproved - totalInProgress;

  const pieData = [
    { name: 'Aprobados', value: totalApproved, color: '#10b981' },
    { name: 'En curso', value: totalInProgress, color: '#3b82f6' },
    { name: 'Pendientes', value: totalMissing, color: '#475569' },
  ];

  const barData = CURRICULUM.map(sem => {
    const semSubjects = sem.subjects.filter(s => data[s.id]?.status === 'aprobada' && data[s.id]?.grade !== undefined);
    const avg = semSubjects.length > 0 
      ? semSubjects.reduce((acc, s) => acc + (data[s.id]?.grade || 0), 0) / semSubjects.length
      : 0;
    return {
      name: `S${sem.number}`,
      Promedio: Number(avg.toFixed(1))
    };
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
          daysToStart > 0
            ? 'bg-lti-blue/10 text-lti-blue border border-lti-blue/20'
            : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {daysToStart > 0
            ? `🎓 El semestre comienza en ${daysToStart} día${daysToStart !== 1 ? 's' : ''}`
            : '🎓 Semestre en curso'}
        </div>
      </div>

      {/* Countdown + Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 col-span-1 border-l-4 border-lti-blue/50">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Promedio General</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-white text-2xl font-bold">{average > 0 ? average.toFixed(1) : '--'}</p>
            <p className="text-lti-blue text-sm mb-1 font-medium">{approved > 0 ? `${approved} UC aprobadas` : 'Sin notas'}</p>
          </div>
        </div>
        <div className="card p-5 col-span-1 border-l-4 border-lti-blue">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Inicio del Semestre</p>
          <p className="text-white text-xl font-bold mt-1">{formatDate(SEMESTER_START)}</p>
          <p className={`text-sm mt-1 font-medium ${daysToStart > 0 ? 'text-lti-blue' : 'text-green-400'}`}>
            {daysToStart > 0 ? `En ${daysToStart} días` : 'En curso'}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-lti-orange">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Período de Exámenes</p>
          <p className="text-white text-sm font-bold mt-1">
            {formatDateShort(EXAM_START)} — {formatDateShort(EXAM_END)}
          </p>
          <p className="text-lti-orange text-sm mt-1 font-medium">
            En {getDaysUntil(EXAM_START)} días
          </p>
        </div>
        <div className="card p-5 border-l-4 border-purple-500">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Instancias Presenciales</p>
          <p className="text-white text-2xl font-bold mt-1">{upcomingPresenciales.length}</p>
          <p className="text-purple-400 text-sm mt-1 font-medium">pendientes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Presenciales */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-sm">Instancias Presenciales Obligatorias</h2>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> Sede {presenciales[0]?.sede} — Jornadas 9:00 a 17:00 hs
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {presenciales.map((event) => {
              const past = isDatePast(event.date);
              const days = getDaysUntil(event.date);
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    past
                      ? 'bg-navy-900/50 border-navy-700/30 opacity-50'
                      : days <= 7
                      ? 'bg-lti-blue/5 border-lti-blue/20'
                      : 'bg-navy-900/30 border-navy-700/30'
                  }`}
                >
                  <div className="text-center min-w-[44px]">
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(event.date + 'T12:00:00').toLocaleDateString('es-UY', { month: 'short' }).toUpperCase()}
                    </p>
                    <p className={`text-lg font-bold leading-none ${past ? 'text-slate-500' : 'text-white'}`}>
                      {new Date(event.date + 'T12:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${past ? 'text-slate-400' : 'text-white'}`}>
                      {event.activity}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {event.includesEval && !past && (
                        <span className="flex items-center gap-1 text-xs text-lti-orange font-medium">
                          <AlertCircle size={10} />
                          Eval. final
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={10} />
                        {event.hours}
                      </span>
                    </div>
                  </div>
                  {!past && (
                    <span className="text-xs text-slate-400 shrink-0">
                      {days === 0 ? '¡Hoy!' : `${days}d`}
                    </span>
                  )}
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-lti-blue hover:bg-lti-blue/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Materias Semestre 1 */}
        <div className="card p-5">
          <h2 className="text-white font-semibold text-sm mb-4">
            U.C. — Semestre 1
            <span className="ml-2 text-xs text-slate-400 font-normal">
              {sem1.reduce((a, s) => a + s.credits, 0)} créditos
            </span>
          </h2>
          <div className="space-y-2">
            {sem1.map((subject) => (
              <div key={subject.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-navy-900/40 border border-navy-700/30 hover:border-navy-600/50 transition-colors">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm text-slate-300 flex-1 truncate">{subject.name}</span>
                <span className="text-xs text-slate-500 font-medium shrink-0">{subject.credits} cr</span>
                <span className="px-2 py-0.5 bg-lti-blue/10 text-lti-blue text-xs rounded-full font-medium shrink-0">
                  En curso
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-1 border-t-2 border-lti-coral">
          <h2 className="text-white font-semibold text-sm mb-4">Progreso de la Carrera</h2>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white tracking-tight">{Math.round((totalApproved / TOTAL_CREDITS) * 100)}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Completado</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-xs text-slate-400 font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 col-span-2 border-t-2 border-lti-blue">
          <h2 className="text-white font-semibold text-sm mb-4">Promedio por Semestre</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} width={40} />
                <RechartsTooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Bar dataKey="Promedio" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={36}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Promedio > 0 ? '#3b82f6' : '#334155'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingEvent && (
        <EditPresencialModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}

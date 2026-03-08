import { CURRICULUM, formatDateShort } from '../data/lti';

export default function Materias() {
  const sem1 = CURRICULUM[0];
  const totalCredits = sem1.subjects.reduce((a, s) => a + s.credits, 0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Unidades Curriculares</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Semestre 1 — {totalCredits} créditos totales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sem1.subjects.map((subject) => (
          <div
            key={subject.id}
            className="card card-hover p-5 space-y-3 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: subject.color }}
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {subject.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{subject.area}</p>
              </div>
              <div
                className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: subject.color + '20',
                  color: subject.color,
                  border: `1px solid ${subject.color}40`,
                }}
              >
                {subject.credits} cr
              </div>
            </div>

            {/* Dates */}
            {subject.startDate && subject.endDate && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-1 bg-navy-900/60 rounded-md">
                  {formatDateShort(subject.startDate)}
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2 py-1 bg-navy-900/60 rounded-md">
                  {formatDateShort(subject.endDate)}
                </span>
              </div>
            )}

            {/* Status + Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-lti-blue/10 text-lti-blue text-xs rounded-full font-medium border border-lti-blue/20">
                  En curso
                </span>
                <span className="text-xs text-slate-500">0% completado</span>
              </div>
              <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: '0%',
                    backgroundColor: subject.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

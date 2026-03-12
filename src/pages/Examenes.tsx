import { Calendar, CalendarDays, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Subject } from "../data/lti";
import { useAcademicCalendar } from "../hooks/useAcademicCalendar";
import type { EventsState } from "../hooks/useCalendarEvents";
import { useSubjectData } from "../hooks/useSubjectData";

interface ExamenesProps {
	calendarEvents: EventsState;
	onUpdateCalendarEvents: (e: EventsState) => void;
}

const Examenes: React.FC<ExamenesProps> = ({
	calendarEvents,
	onUpdateCalendarEvents,
}) => {
	const { academicDates, updateAcademicDates } = useAcademicCalendar();
	const { allSubjects } = useSubjectData();
	const [newExam, setNewExam] = useState({ date: "", subject: "", topic: "" });

	const exams = Object.entries(calendarEvents)
		.flatMap(([date, evs]) =>
			evs
				.filter((e) => e.type === "examen")
				.map((e) => ({ ...e, date, id: `${date}-${e.title}` })),
		)
		.sort((a, b) => a.date.localeCompare(b.date));

	const handleAddExam = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!newExam.date || !newExam.subject) return;

		const updated = {
			...calendarEvents,
			[newExam.date]: [
				...(calendarEvents[newExam.date] || []),
				{
					title: `Examen: ${newExam.subject}`,
					topic: newExam.topic,
					type: "examen",
					time: "09:00",
				},
			],
		};
		onUpdateCalendarEvents(updated);
		setNewExam({ date: "", subject: "", topic: "" });
	};

	const handleRemoveExam = (date: string, title: string) => {
		const updated = {
			...calendarEvents,
			[date]: calendarEvents[date].filter((e) => e.title !== title),
		};
		if (updated[date].length === 0) delete updated[date];
		onUpdateCalendarEvents(updated);
	};

	const isFormValid = newExam.date && newExam.subject;

	return (
		<div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
			<header className="flex items-center gap-3 mb-8 text-left">
				<div className="p-3 bg-lti-orange/20 rounded-xl">
					<CalendarDays className="text-lti-orange" size={28} />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-white tracking-tight">
						Gestión de Exámenes
					</h1>
					<p className="text-slate-400 text-sm">
						Configura períodos y fechas de evaluación
					</p>
				</div>
			</header>

			{/* Configuración del Período */}
			<section className="card p-6 space-y-4">
				<h2 className="text-lg font-semibold text-white flex items-center gap-2">
					<Calendar size={18} className="text-lti-blue" />
					Período de Exámenes
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-1.5 flex flex-col items-start">
						<label className="text-xs font-medium text-slate-400 uppercase">
							Inicio
						</label>
						<input
							type="date"
							value={academicDates.examStart}
							onChange={(e) =>
								updateAcademicDates({ examStart: e.target.value })
							}
							className="w-full bg-navy-800 border border-navy-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-lti-orange outline-none transition-all cursor-pointer"
						/>
					</div>
					<div className="space-y-1.5 flex flex-col items-start">
						<label className="text-xs font-medium text-slate-400 uppercase">
							Fin
						</label>
						<input
							type="date"
							value={academicDates.examEnd}
							onChange={(e) => updateAcademicDates({ examEnd: e.target.value })}
							className="w-full bg-navy-800 border border-navy-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-lti-orange outline-none transition-all cursor-pointer"
						/>
					</div>
				</div>
			</section>

			{/* Agregar Nuevo Examen */}
			<section className="card p-6 space-y-4">
				<h2 className="text-lg font-semibold text-white flex items-center gap-2">
					<Plus size={18} className="text-green-400" />
					Añadir Fecha de Examen
				</h2>
				<form onSubmit={handleAddExam} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<input
							type="date"
							value={newExam.date}
							required
							onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
							className="bg-navy-800 border border-navy-700 text-white rounded-lg p-2.5 outline-none focus:border-lti-orange transition-colors cursor-pointer"
						/>
						<select
							value={newExam.subject}
							required
							onChange={(e) =>
								setNewExam({ ...newExam, subject: e.target.value })
							}
							className="bg-navy-800 border border-navy-700 text-white rounded-lg p-2.5 outline-none focus:border-lti-orange transition-colors cursor-pointer"
						>
							<option value="" disabled>
								Seleccionar Materia...
							</option>
							{allSubjects.map((s: Subject) => (
								<option key={s.id} value={s.name}>
									{s.name}
								</option>
							))}
						</select>
						<input
							type="text"
							placeholder="Temática (opcional)"
							value={newExam.topic}
							onChange={(e) =>
								setNewExam({ ...newExam, topic: e.target.value })
							}
							className="bg-navy-800 border border-navy-700 text-white rounded-lg p-2.5 outline-none focus:border-lti-orange transition-colors"
						/>
					</div>
					<button
						type="submit"
						disabled={!isFormValid}
						className={`w-full font-bold p-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
							isFormValid
								? "bg-lti-orange hover:bg-lti-orange/90 text-white cursor-pointer"
								: "bg-navy-700 text-slate-500 cursor-not-allowed opacity-50"
						}`}
					>
						<Plus size={20} />
						Registrar Examen
					</button>
				</form>
			</section>

			{/* Lista de Exámenes */}
			<section className="space-y-3">
				<h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">
					Próximos Exámenes
				</h2>
				<div className="space-y-2">
					{exams.length === 0 ? (
						<div className="card p-8 text-center border-dashed border-2 border-slate-800">
							<p className="text-slate-500">No hay exámenes registrados</p>
						</div>
					) : (
						exams.map((exam) => (
							<div
								key={exam.id}
								className="card p-4 flex items-center justify-between group hover:border-lti-orange/30 transition-all"
							>
								<div className="flex items-center gap-4">
									<div className="flex flex-col items-center justify-center p-2 bg-navy-800 rounded-lg min-w-[60px] border border-navy-700">
										<span className="text-[10px] uppercase font-bold text-lti-orange">
											{new Date(exam.date).toLocaleDateString("es-UY", {
												month: "short",
											})}
										</span>
										<span className="text-xl font-black text-white">
											{parseInt(exam.date.split("-")[2], 10)}
										</span>
									</div>
									<div>
										<p className="text-white font-bold">
											{exam.title.replace("Examen: ", "")}
										</p>
										{exam.topic && (
											<p className="text-slate-400 text-xs">{exam.topic}</p>
										)}
									</div>
								</div>
								<button
									onClick={() => handleRemoveExam(exam.date, exam.title)}
									className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
								>
									<Trash2 size={18} />
								</button>
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
};

export default Examenes;

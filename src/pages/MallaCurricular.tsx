import { Award, BookOpen, Clock } from "lucide-react";
import { CURRICULUM, formatDateShort, TOTAL_CREDITS } from "../data/lti";
import { useSubjectData } from "../hooks/useSubjectData";

const STATUS_STYLES = {
	en_curso: "bg-lti-blue/10 text-lti-blue border-lti-blue/30",
	aprobada: "bg-green-500/10 text-green-400 border-green-500/30",
	pendiente: "bg-navy-700/60 text-slate-400 border-navy-600/30",
	reprobada: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_LABELS = {
	en_curso: "En curso",
	aprobada: "Aprobada",
	pendiente: "Pendiente",
	reprobada: "Reprobada",
};

export default function MallaCurricular() {
	const { data } = useSubjectData();

	const allSubjects = CURRICULUM.flatMap((s) => s.subjects).map((s) => ({
		...s,
		status: data[s.id]?.status || s.status,
		grade: data[s.id]?.grade,
	}));

	const creditsDone = allSubjects
		.filter((s) => s.status === "aprobada")
		.reduce((a, s) => a + s.credits, 0);
	const creditsActive = allSubjects
		.filter((s) => s.status === "en_curso")
		.reduce((a, s) => a + s.credits, 0);
	const creditsPending = allSubjects
		.filter((s) => s.status === "pendiente")
		.reduce((a, s) => a + s.credits, 0);
	const pct = Math.round((creditsDone / TOTAL_CREDITS) * 100);

	// Tecnicatura = first 4 semesters
	const tcTotal = CURRICULUM.slice(0, 4)
		.flatMap((s) => s.subjects)
		.reduce((a, s) => a + s.credits, 0);
	const tcDone = allSubjects
		.filter((s) => s.semester <= 4 && s.status === "aprobada")
		.reduce((a, s) => a + s.credits, 0);

	return (
		<div className="p-6 space-y-5 animate-fade-in">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white">Malla Curricular</h1>
				<p className="text-slate-400 text-sm mt-0.5">
					Licenciatura en Tecnologías de la Información — Plan 2024
				</p>
			</div>

			{/* Credit counter cards */}
			<div className="grid grid-cols-4 gap-4">
				{/* Total progress */}
				<div className="col-span-1 card p-4 space-y-3">
					<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
						Progreso total
					</p>
					<div className="flex items-end gap-2">
						<span className="text-3xl font-bold text-gradient">{pct}%</span>
					</div>
					<div className="space-y-1">
						<div className="flex justify-between text-xs text-slate-400">
							<span>
								{creditsDone} / {TOTAL_CREDITS} cr
							</span>
						</div>
						<div className="h-2 bg-navy-900 rounded-full overflow-hidden">
							<div
								className="h-full gradient-blue rounded-full transition-all duration-500"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<div className="flex justify-between text-[10px] text-slate-600">
							<span>Inicio</span>
							<span>Tec.</span>
							<span>Lic.</span>
						</div>
					</div>
				</div>

				{/* Obtenidos */}
				<div className="card p-4 flex flex-col gap-2 border-l-4 border-green-500">
					<div className="flex items-center gap-2 text-green-400">
						<Award size={16} />
						<p className="text-xs font-semibold uppercase tracking-wider">
							Obtenidos
						</p>
					</div>
					<p className="text-3xl font-bold text-white">{creditsDone}</p>
					<p className="text-xs text-slate-400">créditos aprobados</p>
				</div>

				{/* En curso */}
				<div className="card p-4 flex flex-col gap-2 border-l-4 border-lti-blue">
					<div className="flex items-center gap-2 text-lti-blue">
						<Clock size={16} />
						<p className="text-xs font-semibold uppercase tracking-wider">
							En Curso
						</p>
					</div>
					<p className="text-3xl font-bold text-white">{creditsActive}</p>
					<p className="text-xs text-slate-400">créditos cursando</p>
				</div>

				{/* Pendientes */}
				<div className="card p-4 flex flex-col gap-2 border-l-4 border-slate-600">
					<div className="flex items-center gap-2 text-slate-400">
						<BookOpen size={16} />
						<p className="text-xs font-semibold uppercase tracking-wider">
							Pendientes
						</p>
					</div>
					<p className="text-3xl font-bold text-white">{creditsPending}</p>
					<p className="text-xs text-slate-400">créditos restantes</p>
				</div>
			</div>

			{/* Tecnicatura progress */}
			<div className="card p-4">
				<div className="flex items-center justify-between mb-2">
					<p className="text-sm font-medium text-white">
						★ Titulación intermedia — Tecnicatura (Semestres 1-4)
					</p>
					<span className="text-sm font-bold text-yellow-400">
						{tcDone} / {tcTotal} cr
					</span>
				</div>
				<div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
					<div
						className="h-full rounded-full transition-all duration-500 bg-yellow-400"
						style={{ width: `${Math.round((tcDone / tcTotal) * 100)}%` }}
					/>
				</div>
			</div>

			{/* Curriculum Grid — scroll bidireccional */}
			<div
				className="overflow-auto border border-navy-700/40 rounded-xl"
				style={{ maxHeight: "calc(100vh - 320px)" }}
			>
				<div className="flex gap-4 p-2" style={{ minWidth: "max-content" }}>
					{CURRICULUM.map((sem) => {
						const semCredits = sem.subjects.reduce((a, s) => a + s.credits, 0);
						const isCurrent = sem.number === 1;
						return (
							<div
								key={sem.number}
								className={`w-52 flex-shrink-0 card p-3 space-y-2 ${
									isCurrent ? "border-lti-blue/40 glow-blue" : ""
								}`}
							>
								{/* Semester Header */}
								<div
									className={`rounded-lg p-2 text-center ${
										isCurrent ? "gradient-blue" : "bg-navy-700/50"
									}`}
								>
									<p
										className={`text-xs font-bold ${isCurrent ? "text-white" : "text-slate-400"}`}
									>
										{sem.label}
									</p>
									<p
										className={`text-xs ${isCurrent ? "text-sky-100" : "text-slate-400"}`}
									>
										{semCredits} créditos
										{sem.number === 4 && (
											<span className="block text-yellow-300 text-xs">
												★ Tecnicatura
											</span>
										)}
										{sem.number === 8 && (
											<span className="block text-yellow-300 text-xs">
												★ Licenciatura
											</span>
										)}
									</p>
								</div>

								{/* Subjects */}
								<div className="space-y-1.5">
									{sem.subjects.map((baseSubject) => {
										const subject =
											allSubjects.find((s) => s.id === baseSubject.id) ||
											baseSubject;
										return (
											<div
												key={subject.id}
												className={`relative overflow-hidden rounded-lg p-2 border text-xs transition-all ${STATUS_STYLES[subject.status]} ${
													subject.status === "en_curso"
														? "animate-pulse-slow"
														: ""
												}`}
											>
												{subject.status === "aprobada" &&
													subject.grade !== undefined && (
														<div className="absolute top-0 right-0 bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-bl-lg text-[10px] font-bold border-b border-l border-green-500/30">
															{subject.grade}
														</div>
													)}
												<div className="flex items-start justify-between gap-1">
													<div
														className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
														style={{ backgroundColor: subject.color }}
													/>
													<p
														className="flex-1 font-medium leading-tight line-clamp-2"
														style={{
															color:
																subject.status === "pendiente"
																	? "#64748b"
																	: undefined,
														}}
													>
														{subject.name}
													</p>
												</div>
												<div className="flex items-center justify-between mt-1.5 ml-2.5">
													<span className="font-bold">
														{subject.credits} cr
													</span>
													<span
														className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
															subject.status === "en_curso"
																? "bg-lti-blue text-white text-[10px]"
																: subject.status === "aprobada"
																	? "bg-green-500 text-white text-[10px]"
																	: "bg-navy-600 text-slate-400 text-[10px]"
														}`}
													>
														{STATUS_LABELS[subject.status]}
													</span>
												</div>
												{subject.startDate && (
													<p className="ml-2.5 text-[10px] text-slate-600 mt-1">
														{formatDateShort(subject.startDate)}
													</p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

import { Award, BookOpen, Clock } from "lucide-react";
import { CURRICULUM, TOTAL_CREDITS } from "../data/lti";
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
	const { data, allSubjects, customSubjects } = useSubjectData();

	const subjectsWithStatus = allSubjects.map((s) => ({
		...s,
		status: data[s.id]?.status || s.status,
		grade: data[s.id]?.grade,
	}));

	const creditsDone = subjectsWithStatus
		.filter((s) => s.status === "aprobada")
		.reduce((a, s) => a + s.credits, 0);
	const creditsActive = subjectsWithStatus
		.filter((s) => s.status === "en_curso")
		.reduce((a, s) => a + s.credits, 0);
	const creditsPending = subjectsWithStatus
		.filter((s) => s.status === "pendiente")
		.reduce((a, s) => a + s.credits, 0);
	
	// Progressive total credits includes custom ones
	const totalRequired = Math.max(TOTAL_CREDITS, creditsDone + creditsPending + creditsActive);
	const pct = Math.round((creditsDone / totalRequired) * 100);

	// Tecnicatura = first 4 semesters (static)
	const tcTotal = CURRICULUM.slice(0, 4)
		.flatMap((s) => s.subjects)
		.reduce((a, s) => a + s.credits, 0);
	const tcDone = subjectsWithStatus
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

			{/* Credit counter cards sliced for brevity (keeping logic same) */}
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
								{creditsDone} / {totalRequired} cr
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

			{/* Curriculum Grid */}
			<div
				className="overflow-auto border border-navy-700/40 rounded-xl"
				style={{ maxHeight: "calc(100vh - 350px)" }}
			>
				<div className="flex gap-4 p-4 pb-8" style={{ minWidth: "max-content" }}>
					{CURRICULUM.map((sem) => {
						const semCustomSubjects = customSubjects.filter(
							(s) => s.semester === sem.number,
						);
						const allSemSubjects = [...sem.subjects, ...semCustomSubjects];
						const semCredits = allSemSubjects.reduce((a, s) => a + s.credits, 0);
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
									</p>
								</div>

								{/* Subjects */}
								<div className="space-y-1.5">
									{allSemSubjects.map((baseSubject) => {
										const subject =
											subjectsWithStatus.find((s) => s.id === baseSubject.id) ||
											baseSubject;
										return (
											<div
												key={subject.id}
												className={`relative overflow-hidden rounded-lg p-2 border text-xs transition-all ${STATUS_STYLES[subject.status as keyof typeof STATUS_STYLES]} ${
													subject.status === "en_curso"
														? "animate-pulse-slow"
														: ""
												}`}
											>
												<div className="flex items-start justify-between gap-1">
													<div
														className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
														style={{ backgroundColor: subject.color }}
													/>
													<p className="flex-1 font-medium leading-tight">
														{subject.name}
													</p>
												</div>
												<div className="flex items-center justify-between mt-1.5 ml-2.5">
													<span className="font-bold">
														{subject.credits} cr
													</span>
													<span
														className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
															subject.status === "en_curso"
																? "bg-lti-blue text-white"
																: subject.status === "aprobada"
																	? "bg-green-500 text-white"
																	: "bg-navy-600 text-slate-400"
														}`}
													>
														{STATUS_LABELS[subject.status as keyof typeof STATUS_LABELS]}
													</span>
												</div>
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

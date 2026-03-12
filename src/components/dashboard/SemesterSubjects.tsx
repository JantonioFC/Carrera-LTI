import type { Subject } from "../../data/lti";

interface SemesterSubjectsProps {
	subjects: Subject[];
}

export function SemesterSubjects({ subjects }: SemesterSubjectsProps) {
	const totalCredits = subjects.reduce((a, s) => a + s.credits, 0);

	return (
		<div className="card p-5">
			<h2 className="text-white font-semibold text-sm mb-4">
				U.C. — Semestre 1
				<span className="ml-2 text-xs text-slate-400 font-normal">
					{totalCredits} créditos
				</span>
			</h2>
			<div className="space-y-2">
				{subjects.map((subject) => (
					<div
						key={subject.id}
						className="flex items-center gap-3 p-2.5 rounded-lg bg-navy-900/40 border border-navy-700/30 hover:border-navy-600/50 transition-colors"
					>
						<div
							className="w-2.5 h-2.5 rounded-full flex-shrink-0"
							style={{ backgroundColor: subject.color }}
						/>
						<span className="text-sm text-slate-300 flex-1 truncate">
							{subject.name}
						</span>
						<span className="text-xs text-slate-400 font-medium shrink-0">
							{subject.credits} cr
						</span>
						<span
							className={`px-2 py-0.5 text-xs rounded-full font-medium shrink-0 ${
								subject.status === "aprobada"
									? "bg-green-500/10 text-green-400"
									: subject.status === "en_curso"
										? "bg-lti-blue/10 text-lti-blue"
										: "bg-slate-500/10 text-slate-400"
							}`}
						>
							{subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

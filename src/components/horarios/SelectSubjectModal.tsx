import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Subject } from "../../data/lti";
import { useSubjectData } from "../../hooks/useSubjectData";

interface SelectSubjectModalProps {
	onClose: () => void;
}

export function SelectSubjectModal({ onClose }: SelectSubjectModalProps) {
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

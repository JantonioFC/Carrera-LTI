import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AREA_COLORS, type Subject } from "../../data/lti";
import type { SubjectData, SubjectResource } from "../../hooks/useSubjectData";

interface EditSubjectModalProps {
	subject: Subject;
	currentData: SubjectData;
	onSave: (p: Partial<SubjectData>) => void;
	onUpdateBase?: (p: Partial<Subject>) => void;
	onDelete?: () => void;
	onClose: () => void;
}

export function EditSubjectModal({
	subject,
	currentData,
	onSave,
	onUpdateBase,
	onDelete,
	onClose,
}: EditSubjectModalProps) {
	const [status, setStatus] = useState(currentData.status);
	const [name, setName] = useState(subject.name);
	const [credits, setCredits] = useState(subject.credits);
	const [area, setArea] = useState(subject.area);
	const [grade, setGrade] = useState(currentData.grade?.toString() || "");
	const [resources, setResources] = useState<SubjectResource[]>(
		currentData.resources || [],
	);

	const [newResName, setNewResName] = useState("");
	const [newResUrl, setNewResUrl] = useState("");

	const handleAddResource = () => {
		if (!newResName.trim() || !newResUrl.trim()) return;
		const newRes: SubjectResource = {
			id: Date.now().toString(),
			name: newResName.trim(),
			url: newResUrl.trim(),
			type: "link",
		};
		setResources([...resources, newRes]);
		setNewResName("");
		setNewResUrl("");
	};

	const handleRemoveResource = (id: string) => {
		setResources(resources.filter((r) => r.id !== id));
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto pt-10 pb-10">
			<div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">
				<div
					className="p-5 border-b border-navy-700/50 flex justify-between items-center flex-shrink-0"
					style={{ borderTop: `4px solid ${subject.color}` }}
				>
					<h3 className="text-white font-semibold">{subject.name}</h3>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
					>
						×
					</button>
				</div>

				<div className="p-5 overflow-y-auto space-y-6 form-scrollbar">
					{onUpdateBase && (
						<div className="space-y-4 p-4 bg-navy-900/50 rounded-xl border border-navy-700/30">
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Propiedades de la U.C.
							</p>
							<div>
								<label className="block text-xs font-medium text-slate-400 mb-1.5">
									Nombre de la Materia
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs font-medium text-slate-400 mb-1.5">
										Créditos
									</label>
									<input
										type="number"
										value={credits}
										onChange={(e) => setCredits(Number(e.target.value))}
										className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-slate-400 mb-1.5">
										Área
									</label>
									<select
										value={area}
										onChange={(e) => setArea(e.target.value)}
										className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
									>
										{Object.keys(AREA_COLORS).map((a) => (
											<option key={a} value={a}>
												{a}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>
					)}
					{/* Status & Grade */}
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-2">
								Estado de la Materia
							</label>
							<div className="grid grid-cols-3 gap-2">
								{(["pendiente", "en_curso", "aprobada"] as const).map((s) => (
									<button
										key={s}
										onClick={() => setStatus(s)}
										className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
											status === s
												? "bg-lti-blue/20 border-lti-blue text-lti-blue"
												: "bg-navy-900 border-navy-600 text-slate-400 hover:bg-navy-700"
										}`}
									>
										{s === "en_curso"
											? "En Curso"
											: s.charAt(0).toUpperCase() + s.slice(1)}
									</button>
								))}
							</div>
						</div>

						<div
							className={`transition-opacity duration-300 ${status === "aprobada" ? "opacity-100" : "opacity-40 pointer-events-none"}`}
						>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Calificación Final (Opcional)
							</label>
							<input
								type="number"
								min="1"
								max="12"
								value={grade}
								onChange={(e) => setGrade(e.target.value)}
								placeholder="Ej: 9"
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
							/>
						</div>
					</div>

					<div className="h-px bg-navy-700/50" />

					{/* Resources */}
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-3">
							Enlaces y Recursos
						</label>

						<div className="space-y-2 mb-4">
							{resources.length === 0 ? (
								<p className="text-xs text-slate-400 italic">
									No hay recursos agregados.
								</p>
							) : (
								resources.map((res) => (
									<div
										key={res.id}
										className="flex items-center gap-2 p-2 rounded-lg bg-navy-900 border border-navy-600/50"
									>
										<LinkIcon
											size={14}
											className="text-lti-blue flex-shrink-0"
										/>
										<a
											href={res.url}
											target="_blank"
											rel="noreferrer"
											className="text-sm text-slate-300 hover:text-white truncate flex-1 hover:underline"
										>
											{res.name}
										</a>
										<button
											onClick={() => handleRemoveResource(res.id)}
											className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
										>
											<Trash2 size={14} />
										</button>
									</div>
								))
							)}
						</div>

						<div className="flex gap-2 items-start">
							<div className="flex-1 space-y-2">
								<input
									type="text"
									value={newResName}
									onChange={(e) => setNewResName(e.target.value)}
									placeholder="Nombre (ej: Drive Clases)"
									className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lti-blue"
								/>
								<input
									type="url"
									value={newResUrl}
									onChange={(e) => setNewResUrl(e.target.value)}
									placeholder="https://..."
									className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lti-blue"
									onKeyDown={(e) => e.key === "Enter" && handleAddResource()}
								/>
							</div>
							<button
								onClick={handleAddResource}
								disabled={!newResName.trim() || !newResUrl.trim()}
								className="p-2 h-full min-h-[72px] bg-lti-blue/10 text-lti-blue border border-lti-blue/20 rounded-lg hover:bg-lti-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
							>
								<Plus size={16} />
								<span className="text-[10px] font-bold">AÑADIR</span>
							</button>
						</div>
					</div>
				</div>

				<div className="p-5 border-t border-navy-700/50 flex justify-between items-center flex-shrink-0">
					{onDelete ? (
						<button
							onClick={onDelete}
							className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
						>
							<Trash2 size={14} />
							Eliminar Materia
						</button>
					) : (
						<div />
					)}
					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm text-slate-400 hover:text-white"
						>
							Cancelar
						</button>
						<button
							onClick={() => {
								onSave({
									status,
									grade: grade ? Number(grade) : undefined,
									resources,
								});
								if (onUpdateBase) {
									onUpdateBase({ name, credits, area });
								}
								onClose();
							}}
							className="px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium shadow-lg shadow-blue-500/20"
						>
							Guardar Cambios
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

import { Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CURRICULUM, formatDateShort, type Subject } from "../data/lti";
import {
	type SubjectData,
	type SubjectResource,
	useSubjectData,
} from "../hooks/useSubjectData";

export default function Materias() {
	const sem1 = CURRICULUM[0];
	const { data, updateSubject } = useSubjectData();
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

	// Mezclar currículum estático con el estado global local y memoizar
	const subjectsWithData = useMemo(
		() =>
			sem1.subjects.map((s) => ({
				...s,
				status: data[s.id]?.status || s.status,
			})),
		[data],
	);

	const totalCredits = useMemo(
		() => subjectsWithData.reduce((a, s) => a + s.credits, 0),
		[subjectsWithData],
	);

	return (
		<>
			<div className="p-6 space-y-5 animate-fade-in">
				<div>
					<h1 className="text-2xl font-bold text-white">
						Unidades Curriculares
					</h1>
					<p className="text-slate-400 text-sm mt-0.5">
						Semestre 1 — {totalCredits} créditos totales
					</p>
				</div>

				<div className="@container">
					<div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
						{subjectsWithData.map((subject) => (
							<div
								key={subject.id}
								onClick={() => setEditingSubject(subject)}
								className="card card-hover p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer relative group"
							>
								<div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
									<Pencil
										size={14}
										className="text-slate-400 hover:text-white"
									/>
								</div>
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
										<p className="text-xs text-slate-400 mt-0.5">
											{subject.area}
										</p>
									</div>
									<div
										className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
										style={{
											backgroundColor: `${subject.color}20`,
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
								<div className="space-y-2 mt-auto pt-2 border-t border-navy-700/50">
									<div className="flex items-center justify-between">
										<span
											className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
												data[subject.id]?.status === "aprobada"
													? "bg-green-500/10 text-green-400 border-green-500/20"
													: data[subject.id]?.status === "pendiente"
														? "bg-slate-500/10 text-slate-400 border-slate-500/20"
														: "bg-lti-blue/10 text-lti-blue border-lti-blue/20"
											}`}
										>
											{data[subject.id]?.status === "aprobada"
												? "Aprobada"
												: data[subject.id]?.status === "pendiente"
													? "Pendiente"
													: "En curso"}
										</span>

										{data[subject.id]?.status === "aprobada" &&
											data[subject.id]?.grade !== undefined && (
												<span className="text-sm font-bold text-white bg-green-500/20 px-2 py-0.5 rounded-lg border border-green-500/30">
													Nota: {data[subject.id]?.grade}
												</span>
											)}
									</div>
								</div>

								{/* Resources Preview */}
								{(data[subject.id]?.resources?.length || 0) > 0 && (
									<div className="pt-3 border-t border-navy-700/50 flex flex-col gap-2">
										<p className="text-xs font-semibold text-slate-400">
											Recursos
										</p>
										<div className="flex flex-wrap gap-2">
											{data[subject.id]?.resources.map((res) => (
												<a
													key={res.id}
													href={res.url}
													target="_blank"
													rel="noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="flex items-center gap-1.5 px-2 py-1 bg-navy-900 border border-navy-600 hover:border-lti-blue/50 text-slate-300 hover:text-lti-blue rounded-md text-xs transition-colors"
												>
													<LinkIcon size={12} />
													<span className="truncate max-w-[120px]">
														{res.name}
													</span>
												</a>
											))}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			{editingSubject && (
				<EditSubjectModal
					subject={editingSubject}
					currentData={
						data[editingSubject.id] || {
							status: editingSubject.status,
							resources: [],
						}
					}
					onSave={(partial) => {
						updateSubject(editingSubject.id, partial);
						setEditingSubject(null);
					}}
					onClose={() => setEditingSubject(null)}
				/>
			)}
		</>
	);
}

function EditSubjectModal({
	subject,
	currentData,
	onSave,
	onClose,
}: {
	subject: Subject;
	currentData: SubjectData;
	onSave: (p: Partial<SubjectData>) => void;
	onClose: () => void;
}) {
	const [status, setStatus] = useState(currentData.status);
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

						{/* List */}
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

						{/* Add new */}
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

				<div className="p-5 border-t border-navy-700/50 flex justify-end gap-3 flex-shrink-0">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-slate-400 hover:text-white"
					>
						Cancelar
					</button>
					<button
						onClick={() =>
							onSave({
								status,
								grade: grade ? Number(grade) : undefined,
								resources,
							})
						}
						className="px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium shadow-lg shadow-blue-500/20"
					>
						Guardar Cambios
					</button>
				</div>
			</div>
		</div>
	);
}

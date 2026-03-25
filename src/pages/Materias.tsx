import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateSubjectModal } from "../components/materias/CreateSubjectModal";
import { EditSubjectModal } from "../components/materias/EditSubjectModal";
import { SubjectCard } from "../components/materias/SubjectCard";
import type { Subject } from "../data/lti";
import { type SubjectData, useSubjectData } from "../hooks/useSubjectData";

export default function Materias() {
	const {
		data,
		updateSubject,
		allSubjects,
		addCustomSubject,
		removeCustomSubject,
		customSubjects,
		updateCustomSubject,
	} = useSubjectData();
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	// Mezclar currículum estático con el estado global local y memoizar
	const subjectsWithData = useMemo(
		() =>
			allSubjects
				.map((s) => ({
					...s,
					status: data[s.id]?.status || s.status,
				}))
				.filter((s) => s.semester === 1 || !s.id.startsWith("s")), // Muestra semestre 1 y personalizadas por defecto
		[data, allSubjects],
	);

	const totalCredits = useMemo(
		() => subjectsWithData.reduce((a, s) => a + s.credits, 0),
		[subjectsWithData],
	);

	return (
		<>
			<div className="p-6 space-y-5 animate-fade-in">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold text-white">
							Unidades Curriculares
						</h1>
						<p className="text-slate-400 text-sm mt-0.5">
							Mis materias — {totalCredits} créditos totales
						</p>
					</div>
					<button
						onClick={() => setIsCreating(true)}
						className="flex items-center gap-2 px-4 py-2 bg-lti-blue hover:bg-lti-blue-dark text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
					>
						<Plus size={18} />
						Nueva U.C.
					</button>
				</div>

				<div className="@container">
					<div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @6xl:grid-cols-3">
						{subjectsWithData.map((subject) => (
							<SubjectCard
								key={subject.id}
								subject={subject}
								data={data[subject.id] as SubjectData | undefined}
								onClick={() => setEditingSubject(subject)}
							/>
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
					onSave={(updated) => updateSubject(editingSubject.id, updated)}
					onUpdateBase={
						customSubjects.some((s) => s.id === editingSubject.id)
							? (updates) => updateCustomSubject(editingSubject.id, updates)
							: undefined
					}
					onDelete={
						customSubjects.some((s) => s.id === editingSubject.id)
							? () => {
									if (confirm("¿Eliminar esta materia personalizada?")) {
										removeCustomSubject(editingSubject.id);
										setEditingSubject(null);
									}
								}
							: undefined
					}
					onClose={() => setEditingSubject(null)}
				/>
			)}

			{isCreating && (
				<CreateSubjectModal
					onSave={(newSubject) => {
						addCustomSubject(newSubject);
						setIsCreating(false);
					}}
					onClose={() => setIsCreating(false)}
				/>
			)}
		</>
	);
}

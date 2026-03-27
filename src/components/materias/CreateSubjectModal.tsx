import { Plus } from "lucide-react";
import { useState } from "react";
import { AREA_COLORS, type Subject } from "../../data/lti";

interface CreateSubjectModalProps {
	onSave: (s: Subject) => void;
	onClose: () => void;
}

export function CreateSubjectModal({
	onSave,
	onClose,
}: CreateSubjectModalProps) {
	const [name, setName] = useState("");
	const [credits, setCredits] = useState("4");
	const [area, setArea] = useState("Gestión");

	const handleSave = () => {
		if (!name.trim()) return;
		const newSubject: Subject = {
			id: `custom-${Date.now()}`,
			name: name.trim(),
			credits: Number(credits),
			semester: 1,
			color: (AREA_COLORS as Record<string, string>)[area] || "#64748b",
			area,
			status: "en_curso",
		};
		onSave(newSubject);
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
			<div className="bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl w-full max-w-sm">
				<div className="p-5 border-b border-navy-700/50 flex justify-between items-center">
					<h3 className="text-white font-semibold flex items-center gap-2">
						<Plus size={18} className="text-lti-blue" />
						Nueva Unidad Curricular
					</h3>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
					>
						×
					</button>
				</div>
				<div className="p-5 space-y-4">
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
							Nombre de la Materia
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ej: Taller de Robótica"
							className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Créditos
							</label>
							<input
								type="number"
								min="1"
								value={credits}
								onChange={(e) => setCredits(e.target.value)}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Área
							</label>
							<select
								value={area}
								onChange={(e) => setArea(e.target.value)}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue"
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
				<div className="p-5 border-t border-navy-700/50 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-slate-400 hover:text-white"
					>
						Cancelar
					</button>
					<button
						onClick={handleSave}
						disabled={!name.trim()}
						className="px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
					>
						Crear Materia
					</button>
				</div>
			</div>
		</div>
	);
}

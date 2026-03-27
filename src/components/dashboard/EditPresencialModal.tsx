import * as Dialog from "@radix-ui/react-dialog";
import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { PresencialEvent } from "../../data/lti";
import { AREA_COLORS } from "../../data/lti";

interface EditPresencialModalProps {
	event?: PresencialEvent;
	onSave: (updated: PresencialEvent) => void;
	onDelete?: (id: string) => void;
	onClose: () => void;
}

export function EditPresencialModal({
	event,
	onSave,
	onDelete,
	onClose,
}: EditPresencialModalProps) {
	const [form, setForm] = useState<PresencialEvent>(
		event || {
			id: `pres-${Date.now()}`,
			date: new Date().toISOString().slice(0, 10),
			activity: "",
			area: "Desarrollo",
			sede: "Río Negro",
			hours: "9:00 - 17:00",
			includesEval: false,
		},
	);

	return (
		<Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" />
				<Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-navy-800 rounded-2xl border border-navy-600/50 shadow-2xl p-0 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
					<div className="p-5 border-b border-navy-700/50 flex items-center justify-between">
						<Dialog.Title className="text-white font-semibold m-0">
							{event ? "Editar Instancia" : "Nueva Instancia"}
						</Dialog.Title>
						<Dialog.Close asChild>
							<button
								className="text-slate-400 hover:text-white transition-colors"
								aria-label="Cerrar"
							>
								<X size={20} />
							</button>
						</Dialog.Close>
					</div>
					<div className="p-5 space-y-4">
						<div>
							<label
								className="block text-xs font-medium text-slate-400 mb-1.5"
								htmlFor="date"
							>
								Fecha
							</label>
							<input
								id="date"
								type="date"
								value={form.date}
								onChange={(e) => setForm({ ...form, date: e.target.value })}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
							/>
						</div>
						<div>
							<label
								className="block text-xs font-medium text-slate-400 mb-1.5"
								htmlFor="activity"
							>
								Actividad
							</label>
							<input
								id="activity"
								type="text"
								value={form.activity}
								onChange={(e) => setForm({ ...form, activity: e.target.value })}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
								placeholder="Nombre de la actividad"
							/>
						</div>
						<div>
							<label
								className="block text-xs font-medium text-slate-400 mb-1.5"
								htmlFor="sede"
							>
								Sede
							</label>
							<input
								id="sede"
								type="text"
								value={form.sede}
								onChange={(e) => setForm({ ...form, sede: e.target.value })}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
							/>
						</div>
						<div>
							<label
								className="block text-xs font-medium text-slate-400 mb-1.5"
								htmlFor="hours"
							>
								Horario
							</label>
							<input
								id="hours"
								type="text"
								value={form.hours}
								onChange={(e) => setForm({ ...form, hours: e.target.value })}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
								placeholder="ej: 9:00 - 17:00"
							/>
						</div>
						<div>
							<label
								className="block text-xs font-medium text-slate-400 mb-1.5"
								htmlFor="area"
							>
								Área
							</label>
							<select
								id="area"
								value={form.area}
								onChange={(e) => setForm({ ...form, area: e.target.value })}
								className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lti-blue transition-colors"
							>
								{Object.keys(AREA_COLORS).map((a) => (
									<option key={a} value={a}>
										{a}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="includesEval"
								checked={form.includesEval}
								onChange={(e) =>
									setForm({ ...form, includesEval: e.target.checked })
								}
								className="w-4 h-4 accent-lti-orange"
							/>
							<label
								htmlFor="includesEval"
								className="text-sm text-slate-300 select-none"
							>
								Incluye evaluación final
							</label>
						</div>
					</div>
					<div className="p-5 border-t border-navy-700/50 flex items-center justify-between">
						{onDelete && event && (
							<button
								onClick={() => onDelete(event.id)}
								aria-label="Eliminar Instancia"
								className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
							>
								<Trash2 size={14} />
								Eliminar
							</button>
						)}
						{!onDelete && <div />}
						<div className="flex gap-3">
							<Dialog.Close asChild>
								<button className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
									Cancelar
								</button>
							</Dialog.Close>
							<button
								onClick={() => onSave(form)}
								className="flex items-center gap-2 px-4 py-2 text-sm gradient-blue text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
							>
								<Check size={14} />
								Guardar cambios
							</button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

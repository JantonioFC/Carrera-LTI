import { Calendar as CalendarIcon, Tag, X } from "lucide-react";
import React, { useEffect, useState } from "react";

/** QP-NEW-3 (#289): delay en ms para hacer foco en el input tras apertura del modal. */
const MODAL_FOCUS_DELAY_MS = 100;

interface CalendarEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (title: string) => void;
	initialTitle?: string;
	date: Date;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
	isOpen,
	onClose,
	onSave,
	initialTitle = "",
	date,
}) => {
	const [title, setTitle] = useState(initialTitle);

	const inputRef = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setTitle(initialTitle);
			setTimeout(() => inputRef.current?.focus(), MODAL_FOCUS_DELAY_MS);
		}
	}, [isOpen, initialTitle]);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (title.trim()) {
			onSave(title.trim());
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
			<div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center">
				<div className="p-4 border-b border-navy-700 flex items-center justify-between bg-navy-950/50">
					<h3 className="text-white font-semibold flex items-center gap-2">
						<CalendarIcon size={18} className="text-lti-blue" />
						{initialTitle ? "Editar Evento" : "Nuevo Evento"}
					</h3>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div>
						<span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
							Fecha
						</span>
						<div className="bg-navy-800/50 border border-navy-700 rounded-lg px-3 py-2 text-slate-300 text-sm">
							{date.toLocaleDateString("es-ES", {
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</div>
					</div>

					<div>
						<label
							htmlFor="event-title"
							className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"
						>
							Título del Evento
						</label>
						<div className="relative">
							<Tag
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
								size={16}
							/>
							<input
								id="event-title"
								ref={inputRef}
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Ej: Entrega de Proyecto"
								className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-lti-blue transition-colors"
							/>
						</div>
					</div>

					<div className="pt-4 flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2.5 bg-navy-800 text-slate-300 hover:text-white rounded-xl font-medium transition-all"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={!title.trim()}
							className="flex-[2] px-4 py-2.5 bg-lti-blue hover:bg-lti-blue-hover text-white rounded-xl font-bold shadow-lg shadow-lti-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Guardar Evento
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

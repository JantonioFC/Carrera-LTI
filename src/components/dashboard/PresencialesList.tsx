import { AlertCircle, Clock, MapPin, Pencil } from "lucide-react";
import { getDaysUntil, isDatePast, type PresencialEvent } from "../../data/lti";

interface PresencialesListProps {
	presenciales: PresencialEvent[];
	onEdit: (event: PresencialEvent) => void;
}

export function PresencialesList({
	presenciales,
	onEdit,
}: PresencialesListProps) {
	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-white font-semibold text-sm">
						Instancias Presenciales Obligatorias
					</h2>
					<p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
						<MapPin size={10} /> Sede {presenciales[0]?.sede} — Jornadas 9:00 a
						17:00 hs
					</p>
				</div>
			</div>
			<div className="space-y-2">
				{presenciales.map((event) => {
					const past = isDatePast(event.date);
					const days = getDaysUntil(event.date);
					return (
						<div
							key={event.id}
							className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
								past
									? "bg-navy-900/50 border-navy-700/30 opacity-50"
									: days <= 7
										? "bg-lti-blue/5 border-lti-blue/20"
										: "bg-navy-900/30 border-navy-700/30"
							}`}
						>
							<div className="text-center min-w-[44px]">
								<p className="text-xs text-slate-400 font-medium">
									{new Date(`${event.date}T12:00:00`)
										.toLocaleDateString("es-UY", { month: "short" })
										.toUpperCase()}
								</p>
								<p
									className={`text-lg font-bold leading-none ${past ? "text-slate-400" : "text-white"}`}
								>
									{new Date(`${event.date}T12:00:00`).getDate()}
								</p>
							</div>
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm font-medium truncate ${past ? "text-slate-400" : "text-white"}`}
								>
									{event.activity}
								</p>
								<div className="flex items-center gap-2 mt-0.5">
									{event.includesEval && !past && (
										<span className="flex items-center gap-1 text-xs text-lti-orange font-medium">
											<AlertCircle size={10} />
											Eval. final
										</span>
									)}
									<span className="flex items-center gap-1 text-xs text-slate-400">
										<Clock size={10} />
										{event.hours}
									</span>
								</div>
							</div>
							{!past && (
								<span className="text-xs text-slate-400 shrink-0">
									{days === 0 ? "¡Hoy!" : `${days}d`}
								</span>
							)}
							<button
								onClick={() => onEdit(event)}
								className="p-1.5 rounded-md text-slate-400 hover:text-lti-blue hover:bg-lti-blue/10 transition-colors"
								title="Editar"
								aria-label={`Editar ${event.activity}`}
							>
								<Pencil size={13} />
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

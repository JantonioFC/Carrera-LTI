import { Link as LinkIcon, Pencil } from "lucide-react";
import type { Subject, SubjectStatus } from "../../data/lti";
import { formatDateShort } from "../../data/lti";
import type { SubjectData } from "../../hooks/useSubjectData";

interface SubjectCardProps {
	subject: Subject & { status: SubjectStatus };
	data: SubjectData | undefined;
	onClick: () => void;
}

export function SubjectCard({ subject, data, onClick }: SubjectCardProps) {
	return (
		<div
			onClick={onClick}
			className="card card-hover p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer relative group"
		>
			<div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
				<Pencil size={14} className="text-slate-400 hover:text-white" />
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
					<p className="text-xs text-slate-400 mt-0.5">{subject.area}</p>
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

			{/* Status + Grade */}
			<div className="space-y-2 mt-auto pt-2 border-t border-navy-700/50">
				<div className="flex items-center justify-between">
					<span
						className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
							data?.status === "aprobada"
								? "bg-green-500/10 text-green-400 border-green-500/20"
								: data?.status === "pendiente"
									? "bg-slate-500/10 text-slate-400 border-slate-500/20"
									: "bg-lti-blue/10 text-lti-blue border-lti-blue/20"
						}`}
					>
						{data?.status === "aprobada"
							? "Aprobada"
							: data?.status === "pendiente"
								? "Pendiente"
								: "En curso"}
					</span>

					{data?.status === "aprobada" && data?.grade !== undefined && (
						<span className="text-sm font-bold text-white bg-green-500/20 px-2 py-0.5 rounded-lg border border-green-500/30">
							Nota: {data.grade}
						</span>
					)}
				</div>
			</div>

			{/* Resources Preview */}
			{(data?.resources?.length || 0) > 0 && (
				<div className="pt-3 border-t border-navy-700/50 flex flex-col gap-2">
					<p className="text-xs font-semibold text-slate-400">Recursos</p>
					<div className="flex flex-wrap gap-2">
						{data?.resources.map((res) => (
							<a
								key={res.id}
								href={res.url}
								target="_blank"
								rel="noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1.5 px-2 py-1 bg-navy-900 border border-navy-600 hover:border-lti-blue/50 text-slate-300 hover:text-lti-blue rounded-md text-xs transition-colors"
							>
								<LinkIcon size={12} />
								<span className="truncate max-w-[120px]">{res.name}</span>
							</a>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

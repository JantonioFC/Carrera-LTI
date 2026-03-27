import { type CortexActivity, useCortexStore } from "./cortexStore";

function activityLabel(activity: CortexActivity): string {
	switch (activity.type) {
		case "idle":
			return "Inactivo";
		case "indexing":
			return `Indexando: ${activity.docTitle}`;
		case "transcribing":
			return `Transcribiendo: ${activity.filename}`;
		case "querying":
			return `Consultando: ${activity.query}`;
		case "query_error":
			return `Error: ${activity.error}`;
		case "ocr":
			return `OCR: ${activity.filename}`;
	}
}

/**
 * Indicador compacto del estado actual de Cortex.
 * Pensado para vivir en la barra lateral o header de la app.
 */
export function CortexActivityIndicator() {
	const activity = useCortexStore((s) => s.activity);
	const progress = activity.type === "indexing" ? activity.progress : undefined;

	return (
		<div className="cortex-activity-indicator">
			<span data-testid="cortex-activity" className="cortex-activity-label">
				{activityLabel(activity)}
			</span>
			{progress !== undefined && (
				<span
					data-testid="cortex-progress"
					className="cortex-activity-progress"
				>
					{progress}%
				</span>
			)}
		</div>
	);
}

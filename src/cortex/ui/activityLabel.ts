import type { CortexActivity } from "./cortexStore";

/**
 * Devuelve la etiqueta de texto para el estado de actividad de Cortex.
 *
 * QP-01 (#317): rama `default` con never-check para detectar en compilación
 * si se añade un nuevo tipo al union sin actualizar este switch.
 *
 * QP-02 (#323): extraída de CortexActivityIndicator y CortexTab para evitar duplicación.
 */
export function activityLabel(activity: CortexActivity): string {
	switch (activity.type) {
		case "idle":
			return "Inactivo";
		case "indexing":
			return `Indexando: ${activity.docTitle}`;
		case "querying":
			return `Consultando: ${activity.query}`;
		case "query_error":
			return `Error: ${activity.error}`;
		case "ocr":
			return `OCR: ${activity.filename}`;
		default: {
			const _exhaustive: never = activity;
			return `Desconocido: ${(_exhaustive as CortexActivity).type}`;
		}
	}
}

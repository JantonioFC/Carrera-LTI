import { activityLabel } from "./activityLabel";
import { useCortexStore } from "./cortexStore";

function formatTs(ts: number | null): string {
	if (ts === null) return "Nunca";
	return new Date(ts).toLocaleString("es-AR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

/**
 * Tab dedicado de Cortex: muestra estado del índice y actividad actual.
 */
export function CortexTab() {
	const indexedDocCount = useCortexStore((s) => s.indexedDocCount);
	const lastIndexedAt = useCortexStore((s) => s.lastIndexedAt);
	const activity = useCortexStore((s) => s.activity);

	return (
		<div className="cortex-tab">
			<p data-testid="cortex-banner" className="cortex-banner">
				Cortex responde solo con tu material indexado
			</p>

			<section className="cortex-section">
				<h2 className="cortex-section-title">Estado del índice</h2>
				<dl className="cortex-stats">
					<dt>Documentos indexados</dt>
					<dd data-testid="cortex-doc-count">{indexedDocCount}</dd>

					<dt>Última indexación</dt>
					<dd data-testid="cortex-last-indexed">{formatTs(lastIndexedAt)}</dd>
				</dl>
			</section>

			<section className="cortex-section">
				<h2 className="cortex-section-title">Actividad</h2>
				<span data-testid="cortex-activity">{activityLabel(activity)}</span>
			</section>
		</div>
	);
}

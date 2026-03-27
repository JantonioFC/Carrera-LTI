import { type CortexQueryResult, useCortexStore } from "./cortexStore";

const MAX_RESULTS = 3;

interface NexusContextSurfaceProps {
	taskTitle: string;
}

function ContextResult({ result }: { result: CortexQueryResult }) {
	return (
		<li data-testid="nexus-context-result" className="nexus-context-result">
			<p>{result.content}</p>
		</li>
	);
}

/**
 * Superficie contextual que aparece al abrir una tarea de Nexus (Kanban).
 *
 * Muestra hasta 3 fragmentos del índice RuVector relacionados con el título
 * de la tarea, para que el usuario tenga contexto relevante de sus apuntes
 * sin tener que buscar manualmente.
 *
 * Si no hay resultados ni carga activa, no renderiza nada (null)
 * para no ocupar espacio en el panel de la tarea.
 */
export function NexusContextSurface({ taskTitle }: NexusContextSurfaceProps) {
	const results = useCortexStore((s) => s.queryResults);
	const activity = useCortexStore((s) => s.activity);

	if (activity.type === "querying") {
		return (
			<div
				data-testid="nexus-context-loading"
				className="nexus-context-loading"
			>
				Buscando contexto…
			</div>
		);
	}

	if (activity.type === "query_error") {
		return (
			<div data-testid="nexus-context-error" className="nexus-context-error">
				{activity.error}
			</div>
		);
	}

	if (results.length === 0) return null;

	const top = results.slice(0, MAX_RESULTS);

	return (
		<aside data-testid="nexus-context-panel" className="nexus-context-panel">
			<header className="nexus-context-header">
				<span>Contexto para: {taskTitle}</span>
			</header>
			<ul className="nexus-context-list">
				{top.map((r) => (
					<ContextResult key={r.chunkId} result={r} />
				))}
			</ul>
		</aside>
	);
}

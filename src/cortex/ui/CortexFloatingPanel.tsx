import { type KeyboardEvent, useState } from "react";
import { type CortexQueryResult, useCortexStore } from "./cortexStore";

interface CortexFloatingPanelProps {
	onQuery: (query: string) => void;
}

function ResultItem({ result }: { result: CortexQueryResult }) {
	return (
		<li className="cortex-result-item">
			<p className="cortex-result-content">{result.content}</p>
			<span className="cortex-result-score">
				{(result.score * 100).toFixed(0)}%
			</span>
		</li>
	);
}

/**
 * Panel flotante de consulta rápida al índice RuVector.
 *
 * Gestiona el input del usuario y delega la lógica de búsqueda
 * al callback onQuery (inyectado desde la página padre).
 * El estado de resultados, loading y error vive en cortexStore.
 */
export function CortexFloatingPanel({ onQuery }: CortexFloatingPanelProps) {
	const [input, setInput] = useState("");
	const results = useCortexStore((s) => s.queryResults);
	const isQuerying = useCortexStore((s) => s.isQuerying);
	const queryError = useCortexStore((s) => s.queryError);

	const handleSubmit = () => {
		const trimmed = input.trim();
		if (!trimmed) return;
		onQuery(trimmed);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") handleSubmit();
	};

	return (
		<div className="cortex-floating-panel">
			<div className="cortex-search-row">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Consultar índice..."
					className="cortex-search-input"
				/>
				<button
					type="button"
					onClick={handleSubmit}
					className="cortex-search-btn"
				>
					Buscar
				</button>
			</div>

			{isQuerying && (
				<div data-testid="cortex-loading" className="cortex-loading">
					Consultando…
				</div>
			)}

			{queryError && (
				<div data-testid="cortex-error" className="cortex-error">
					{queryError}
				</div>
			)}

			{!isQuerying && !queryError && results.length === 0 && (
				<div data-testid="cortex-empty" className="cortex-empty">
					Sin resultados
				</div>
			)}

			{results.length > 0 && (
				<ul className="cortex-results-list">
					{results.map((r) => (
						<ResultItem key={r.chunkId} result={r} />
					))}
				</ul>
			)}
		</div>
	);
}

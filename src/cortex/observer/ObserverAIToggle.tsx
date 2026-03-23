import { useObserverStore } from "./observerStore";

interface ObserverAIToggleProps {
	/** Inicia el subproceso Observer AI. Resuelve cuando arrancó limpiamente. */
	onStart: () => Promise<void>;
	/** Detiene el subproceso Observer AI. Resuelve cuando terminó limpiamente. */
	onStop: () => Promise<void>;
}

/**
 * Toggle on/off para el subproceso Observer AI.
 *
 * - Estado persiste entre sesiones (localStorage via observerStore).
 * - Muestra notificación al activar (REQ-06: usuario debe saber que está grabando).
 * - Se deshabilita durante la transición para evitar doble-click.
 * - Detiene el proceso limpiamente (no kill abrupto) al desactivar.
 */
export function ObserverAIToggle({ onStart, onStop }: ObserverAIToggleProps) {
	const isRunning = useObserverStore((s) => s.isRunning);
	const isTransitioning = useObserverStore((s) => s.isTransitioning);
	const showNotification = useObserverStore((s) => s.showNotification);
	const { setRunning, setTransitioning, setShowNotification } =
		useObserverStore.getState();

	const handleToggle = async () => {
		setTransitioning(true);
		try {
			if (!isRunning) {
				await onStart();
				setRunning(true);
				setShowNotification(true);
			} else {
				await onStop();
				setRunning(false);
				setShowNotification(false);
			}
		} finally {
			setTransitioning(false);
		}
	};

	return (
		<div className="observer-toggle-wrapper">
			<button
				role="switch"
				aria-checked={isRunning}
				aria-label="Observer AI"
				disabled={isTransitioning}
				onClick={handleToggle}
				className={`observer-toggle ${isRunning ? "observer-toggle--on" : "observer-toggle--off"}`}
				type="button"
			>
				Observer AI
			</button>

			<span data-testid="observer-status" className="observer-status">
				{isRunning ? "Activo" : "Inactivo"}
			</span>

			{showNotification && (
				<div
					data-testid="observer-notification"
					role="alert"
					className="observer-notification"
				>
					Observer AI está capturando audio de la conferencia.
				</div>
			)}
		</div>
	);
}

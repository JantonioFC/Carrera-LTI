import { useAetherStore } from "../../store/aetherStore";

/**
 * Hook que conecta el ObserverAIToggle con la API IPC de Electron.
 *
 * Flujo al activar:
 *   onStart() → observer:toggle(true) → subproceso Python captura audio
 *
 * Flujo al desactivar:
 *   onStop() → observer:toggle(false) → Python guarda WAV y termina
 *             → cortex:transcribe(wavPath) → texto
 *             → addNote + updateNote en Aether (ingestNote para embedding)
 *
 * En modo web (sin window.cortexAPI) las funciones son no-ops.
 *
 * Ref: RFC-002 §4.4 Fase E — Issue #58
 */
export function useObserverIPC(): {
	onStart: () => Promise<void>;
	onStop: () => Promise<void>;
} {
	const addNote = useAetherStore((s) => s.addNote);
	const updateNote = useAetherStore((s) => s.updateNote);
	const ingestNote = useAetherStore((s) => s.ingestNote);

	const onStart = async (): Promise<void> => {
		const api = window.cortexAPI;
		if (!api) return;
		await api.observer.toggle(true);
	};

	const onStop = async (): Promise<void> => {
		const api = window.cortexAPI;
		if (!api) return;

		const result = await api.observer.toggle(false);

		if (result.wavPath) {
			const { text } = await api.cortex.transcribe(result.wavPath);

			if (text.trim()) {
				const now = new Date().toLocaleString("es-AR", {
					dateStyle: "short",
					timeStyle: "short",
				});
				const note = addNote(`Clase ${now}`);
				updateNote(note.id, { content: text });
				await ingestNote(note.id);
			}
		}
	};

	return { onStart, onStop };
}

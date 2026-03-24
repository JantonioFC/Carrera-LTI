import { type AetherNoteId, useAetherStore } from "../../store/aetherStore";

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
 * Los callbacks de Aether se inyectan desde el componente padre para
 * desacoplar este hook del store concreto (Issue #90).
 *
 * Ref: RFC-002 §4.4 Fase E — Issue #58
 */

export interface ObserverIPCCallbacks {
	addNote: (title: string) => { id: AetherNoteId };
	updateNote: (id: AetherNoteId, data: { content: string }) => void;
	ingestNote: (id: AetherNoteId) => Promise<void>;
}

export function useObserverIPC(callbacks?: ObserverIPCCallbacks): {
	onStart: () => Promise<void>;
	onStop: () => Promise<void>;
} {
	// Si no se inyectan callbacks, los tomamos del store (compatibilidad)
	const storeAddNote = useAetherStore((s) => s.addNote);
	const storeUpdateNote = useAetherStore((s) => s.updateNote);
	const storeIngestNote = useAetherStore((s) => s.ingestNote);

	const addNote = callbacks?.addNote ?? storeAddNote;
	const updateNote = callbacks?.updateNote ?? storeUpdateNote;
	const ingestNote = callbacks?.ingestNote ?? storeIngestNote;

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

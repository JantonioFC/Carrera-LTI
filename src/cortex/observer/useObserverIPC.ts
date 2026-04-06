import { type AetherNoteId, useAetherStore } from "../../store/aetherStore";

/**
 * Hook que conecta el ObserverAIToggle con la API IPC de Electron.
 *
 * Flujo al activar:
 *   onStart() → observer:toggle(true) → subproceso Python captura audio
 *
 * Flujo al desactivar (modo local):
 *   onStop() → observer:toggle(false) → Python guarda WAV y termina
 *             → cortex:transcribe(wavPath) → texto (Whisper local)
 *             → addNote + updateNote en Aether (ingestNote para embedding)
 *
 * Flujo al desactivar (modo VPS):
 *   onStop() → observer:toggle(false) → Python guarda WAV y termina
 *             → fs:read-file(wavPath) → bytes
 *             → POST ${VITE_CORTEX_URL}/cortex/transcribe (multipart)
 *             → texto → addNote + updateNote + ingestNote
 *
 * En modo web (sin window.cortexAPI) las funciones son no-ops.
 *
 * Los callbacks de Aether se inyectan desde el componente padre para
 * desacoplar este hook del store concreto (Issue #90).
 *
 * Ref: RFC-002 §4.4 Fase E — Issue #58
 */

const CORTEX_URL = (import.meta.env.VITE_CORTEX_URL ?? "").trim();

export interface ObserverIPCCallbacks {
	addNote: (title: string) => { id: AetherNoteId };
	updateNote: (id: AetherNoteId, data: { content: string }) => void;
	ingestNote: (id: AetherNoteId) => Promise<void>;
}

async function transcribeViaVPS(wavPath: string): Promise<string> {
	const api = window.cortexAPI;
	if (!api) return "";

	const bytes = await api.fs.readFile(wavPath);
	const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/wav" });
	const form = new FormData();
	form.append("file", blob, "recording.wav");

	const res = await fetch(`${CORTEX_URL}/cortex/transcribe`, {
		method: "POST",
		body: form,
	});

	if (!res.ok) {
		throw new Error(`VPS transcribe error: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as { text?: string };
	return data.text ?? "";
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
			const text = CORTEX_URL
				? await transcribeViaVPS(result.wavPath)
				: (await api.cortex.transcribe(result.wavPath)).text;

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

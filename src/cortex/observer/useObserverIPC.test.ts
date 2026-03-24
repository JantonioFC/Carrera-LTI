import { afterEach, describe, expect, it, vi } from "vitest";
import type { AetherNoteId } from "../../store/aetherStore";

import { renderHook } from "@testing-library/react";
import { useObserverIPC } from "./useObserverIPC";

/**
 * Tests de integración: pipeline Observer → Transcribe → Aether.
 * Los callbacks de Aether se inyectan como mocks — no se depende del store
 * concreto, lo que valida el desacoplamiento del Issue #90.
 * Ref: Issue #88 / #90 — v3.3.0 / v3.4.0
 */

function makeCortexAPI(
	overrides: {
		toggleResult?: { wavPath?: string };
		transcribeResult?: { text: string };
	} = {},
) {
	return {
		observer: {
			toggle: vi
				.fn()
				.mockResolvedValue(overrides.toggleResult ?? { wavPath: undefined }),
		},
		cortex: {
			transcribe: vi
				.fn()
				.mockResolvedValue(
					overrides.transcribeResult ?? { text: "transcripción de prueba" },
				),
		},
	};
}

function makeCallbacks() {
	return {
		addNote: vi.fn((title: string) => ({ id: `note_${title}` as AetherNoteId })),
		updateNote: vi.fn(),
		ingestNote: vi.fn().mockResolvedValue(undefined),
	};
}

afterEach(() => {
	vi.restoreAllMocks();
	delete (window as unknown as { cortexAPI?: unknown }).cortexAPI;
});

// --- onStart ----------------------------------------------------------------

describe("useObserverIPC — onStart", () => {
	it("llama a observer.toggle(true)", async () => {
		const api = makeCortexAPI();
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStart();

		expect(api.observer.toggle).toHaveBeenCalledWith(true);
	});

	it("es no-op si cortexAPI no está disponible", async () => {
		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await expect(result.current.onStart()).resolves.toBeUndefined();
	});
});

// --- onStop -----------------------------------------------------------------

describe("useObserverIPC — onStop", () => {
	it("llama a observer.toggle(false)", async () => {
		const api = makeCortexAPI({ toggleResult: { wavPath: undefined } });
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(api.observer.toggle).toHaveBeenCalledWith(false);
	});

	it("es no-op si cortexAPI no está disponible", async () => {
		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await expect(result.current.onStop()).resolves.toBeUndefined();
	});

	it("no llama a transcribe si toggle no devuelve wavPath", async () => {
		const api = makeCortexAPI({ toggleResult: { wavPath: undefined } });
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(api.cortex.transcribe).not.toHaveBeenCalled();
	});

	it("llama a transcribe con el wavPath cuando toggle lo devuelve", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: "El profesor explicó álgebra lineal." },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(api.cortex.transcribe).toHaveBeenCalledWith("/tmp/clase.wav");
	});

	it("llama a addNote y updateNote con el texto transcripto", async () => {
		const texto = "El three-way handshake consta de SYN, SYN-ACK y ACK.";
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: texto },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(cb.addNote).toHaveBeenCalledWith(expect.stringMatching(/^Clase /));
		expect(cb.updateNote).toHaveBeenCalledWith(expect.any(String), {
			content: texto,
		});
	});

	it("llama a ingestNote con el id de la nota creada", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: "contenido válido" },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const noteId = "note_test_123" as AetherNoteId;
		const cb = makeCallbacks();
		cb.addNote.mockReturnValue({ id: noteId as AetherNoteId });

		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(cb.ingestNote).toHaveBeenCalledWith(noteId);
	});

	it("no llama a addNote si el texto transcripto está vacío", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/silencio.wav" },
			transcribeResult: { text: "   " },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(cb.addNote).not.toHaveBeenCalled();
	});

	it("no llama a addNote si el texto transcripto es string vacío", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/vacio.wav" },
			transcribeResult: { text: "" },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const cb = makeCallbacks();
		const { result } = renderHook(() => useObserverIPC(cb));
		await result.current.onStop();

		expect(cb.addNote).not.toHaveBeenCalled();
	});
});

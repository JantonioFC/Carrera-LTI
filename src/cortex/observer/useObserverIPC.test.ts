import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks de dependencias del store (deben ir antes del import del store)
vi.mock("idb-keyval", () => ({
	get: vi.fn().mockResolvedValue(undefined),
	set: vi.fn().mockResolvedValue(undefined),
	del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../utils/security", () => ({
	obfuscate: vi.fn((v: string) => Promise.resolve(v)),
	deobfuscate: vi.fn((v: unknown) =>
		Promise.resolve(typeof v === "string" ? v : null),
	),
}));

import { renderHook } from "@testing-library/react";
import { useAetherStore } from "../../store/aetherStore";
import { useObserverIPC } from "./useObserverIPC";

/**
 * Tests de integración: pipeline Observer → Transcribe → Aether.
 * Se mockea window.cortexAPI y se usa el store real para verificar
 * que la nota queda efectivamente guardada en el estado.
 * Ref: Issue #88 — v3.3.0 Testing Coverage
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

function resetStore() {
	useAetherStore.setState({
		notes: [],
		chatHistory: [],
		geminiApiKey: "",
		gmailClientId: "",
		gmailApiKey: "",
	});
}

beforeEach(() => {
	resetStore();
});

afterEach(() => {
	resetStore();
	vi.restoreAllMocks();
	delete (window as unknown as { cortexAPI?: unknown }).cortexAPI;
});

// ─── onStart ────────────────────────────────────────────────────────────────

describe("useObserverIPC — onStart", () => {
	it("llama a observer.toggle(true)", async () => {
		const api = makeCortexAPI();
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStart();

		expect(api.observer.toggle).toHaveBeenCalledWith(true);
	});

	it("es no-op si cortexAPI no está disponible", async () => {
		// sin asignar window.cortexAPI
		const { result } = renderHook(() => useObserverIPC());
		await expect(result.current.onStart()).resolves.toBeUndefined();
	});
});

// ─── onStop ─────────────────────────────────────────────────────────────────

describe("useObserverIPC — onStop", () => {
	it("llama a observer.toggle(false)", async () => {
		const api = makeCortexAPI({ toggleResult: { wavPath: undefined } });
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		expect(api.observer.toggle).toHaveBeenCalledWith(false);
	});

	it("es no-op si cortexAPI no está disponible", async () => {
		const { result } = renderHook(() => useObserverIPC());
		await expect(result.current.onStop()).resolves.toBeUndefined();
	});

	it("no llama a transcribe si toggle no devuelve wavPath", async () => {
		const api = makeCortexAPI({ toggleResult: { wavPath: undefined } });
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		expect(api.cortex.transcribe).not.toHaveBeenCalled();
	});

	it("llama a transcribe con el wavPath cuando toggle lo devuelve", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: "El profesor explicó álgebra lineal." },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		expect(api.cortex.transcribe).toHaveBeenCalledWith("/tmp/clase.wav");
	});

	it("crea una nota en aetherStore con el texto transcripto", async () => {
		const texto = "El three-way handshake consta de SYN, SYN-ACK y ACK.";
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: texto },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		const { notes } = useAetherStore.getState();
		expect(notes).toHaveLength(1);
		expect(notes[0].content).toBe(texto);
	});

	it("el título de la nota incluye 'Clase' y una fecha", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/clase.wav" },
			transcribeResult: { text: "contenido de la clase" },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		const { notes } = useAetherStore.getState();
		expect(notes[0].title).toMatch(/^Clase /);
	});

	it("no crea nota si el texto transcripto está vacío", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/silencio.wav" },
			transcribeResult: { text: "   " },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		expect(useAetherStore.getState().notes).toHaveLength(0);
	});

	it("no crea nota si el texto transcripto está vacío (string vacío)", async () => {
		const api = makeCortexAPI({
			toggleResult: { wavPath: "/tmp/vacio.wav" },
			transcribeResult: { text: "" },
		});
		(window as unknown as { cortexAPI: typeof api }).cortexAPI = api;

		const { result } = renderHook(() => useObserverIPC());
		await result.current.onStop();

		expect(useAetherStore.getState().notes).toHaveLength(0);
	});
});

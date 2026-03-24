import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock idb-keyval para que persist no intente usar IndexedDB en tests
vi.mock("idb-keyval", () => ({
	get: vi.fn().mockResolvedValue(undefined),
	set: vi.fn().mockResolvedValue(undefined),
	del: vi.fn().mockResolvedValue(undefined),
}));

// Mock security utils (obfuscate/deobfuscate son async, devuelven el valor tal cual en tests)
vi.mock("../utils/security", () => ({
	obfuscate: vi.fn((v: string) => Promise.resolve(v)),
	deobfuscate: vi.fn((v: unknown) =>
		Promise.resolve(typeof v === "string" ? v : null),
	),
}));

import { useAetherStore } from "./aetherStore";

function resetStore() {
	useAetherStore.setState({
		notes: [],
		chatHistory: [],
		geminiApiKey: "",
		gmailClientId: "",
		gmailApiKey: "",
	});
}

describe("aetherStore — mutaciones de notas", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("addNote crea una nota con título por defecto", () => {
		const note = useAetherStore.getState().addNote();
		const { notes } = useAetherStore.getState();
		expect(notes).toHaveLength(1);
		expect(note.title).toBe("Nueva Nota");
		expect(note.id).toMatch(/^note_/);
	});

	it("addNote con título personalizado", () => {
		const note = useAetherStore.getState().addNote("Mi Apunte");
		expect(note.title).toBe("Mi Apunte");
	});

	it("addNote agrega al inicio (unshift)", () => {
		useAetherStore.getState().addNote("Primera");
		useAetherStore.getState().addNote("Segunda");
		const { notes } = useAetherStore.getState();
		expect(notes[0].title).toBe("Segunda");
		expect(notes[1].title).toBe("Primera");
	});

	it("updateNote cambia título y actualiza updatedAt", async () => {
		const note = useAetherStore.getState().addNote("Original");
		const before = note.updatedAt;

		await new Promise((r) => setTimeout(r, 5));

		useAetherStore.getState().updateNote(note.id, { title: "Modificado" });
		const updated = useAetherStore.getState().getNote(note.id);
		expect(updated?.title).toBe("Modificado");
		expect(updated?.updatedAt).toBeGreaterThan(before);
	});

	it("updateNote en id inexistente no lanza ni cambia el store", () => {
		useAetherStore.getState().addNote("Existente");
		expect(() =>
			useAetherStore
				.getState()
				.updateNote("note_inexistente" as any, { title: "X" }),
		).not.toThrow();
		expect(useAetherStore.getState().notes).toHaveLength(1);
	});

	it("deleteNote elimina la nota correcta", () => {
		const a = useAetherStore.getState().addNote("A");
		const b = useAetherStore.getState().addNote("B");
		useAetherStore.getState().deleteNote(a.id);
		const { notes } = useAetherStore.getState();
		expect(notes).toHaveLength(1);
		expect(notes[0].id).toBe(b.id);
	});

	it("getNote devuelve la nota correcta por id", () => {
		const note = useAetherStore.getState().addNote("Buscable");
		const found = useAetherStore.getState().getNote(note.id);
		expect(found).toBeDefined();
		expect(found?.title).toBe("Buscable");
	});

	it("getNote devuelve undefined para id inexistente", () => {
		expect(
			useAetherStore.getState().getNote("note_nada" as any),
		).toBeUndefined();
	});
});

describe("aetherStore — getGraphData (O(n) con Map)", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("notas sin links → nodes correctos, sin links", () => {
		useAetherStore.getState().addNote("A");
		useAetherStore.getState().addNote("B");
		const { nodes, links } = useAetherStore.getState().getGraphData();
		expect(nodes).toHaveLength(2);
		expect(links).toHaveLength(0);
	});

	it("nota con [[link]] al título de otra genera un link", () => {
		useAetherStore
			.getState()
			.updateNote(useAetherStore.getState().addNote("Destino").id, {
				content: "",
			});
		const origen = useAetherStore.getState().addNote("Origen");
		useAetherStore
			.getState()
			.updateNote(origen.id, { content: "Esto enlaza [[Destino]]" });

		const { links } = useAetherStore.getState().getGraphData();
		expect(links).toHaveLength(1);
	});

	it("link a título inexistente no genera edge", () => {
		const note = useAetherStore.getState().addNote("Sola");
		useAetherStore.getState().updateNote(note.id, { content: "[[NoExiste]]" });
		const { links } = useAetherStore.getState().getGraphData();
		expect(links).toHaveLength(0);
	});
});

describe("aetherStore — findBacklinks", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("encuentra notas que apuntan al nodo dado", () => {
		const dest = useAetherStore.getState().addNote("Destino");
		const src = useAetherStore.getState().addNote("Fuente");
		useAetherStore
			.getState()
			.updateNote(src.id, { content: "Ver [[Destino]] para más info" });

		const backlinks = useAetherStore.getState().findBacklinks(dest.id);
		expect(backlinks.map((n) => n.id)).toContain(src.id);
	});

	it("no incluye la nota como backlink de sí misma", () => {
		const note = useAetherStore.getState().addNote("Circular");
		useAetherStore.getState().updateNote(note.id, { content: "[[Circular]]" });
		const backlinks = useAetherStore.getState().findBacklinks(note.id);
		expect(backlinks.map((n) => n.id)).not.toContain(note.id);
	});

	it("devuelve [] si el nodo no existe", () => {
		expect(
			useAetherStore.getState().findBacklinks("note_ghost" as any),
		).toEqual([]);
	});
});

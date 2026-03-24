import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// nexusStore usa IndexeddbPersistence de yjs — mock para no tocar IDB en tests
vi.mock("y-indexeddb", () => ({
	IndexeddbPersistence: vi.fn().mockImplementation(() => ({})),
}));

import { useNexusStore } from "./nexusStore";

function resetStore() {
	useNexusStore.setState({
		documents: [],
		yDocs: {},
		yDocsCreating: new Set(),
	});
}

describe("nexusStore — mutaciones de documentos", () => {
	beforeEach(() => {
		localStorage.clear();
		resetStore();
	});
	afterEach(() => {
		localStorage.clear();
		resetStore();
	});

	it("addDocument crea un doc con título por defecto", () => {
		const doc = useNexusStore.getState().addDocument();
		expect(doc.title).toBe("Página sin título");
		expect(doc.id).toMatch(/^doc_/);
		expect(useNexusStore.getState().documents).toHaveLength(1);
	});

	it("addDocument con título personalizado", () => {
		const doc = useNexusStore.getState().addDocument("Notas de clase");
		expect(doc.title).toBe("Notas de clase");
	});

	it("addDocument inserta al inicio (unshift)", () => {
		useNexusStore.getState().addDocument("Primero");
		useNexusStore.getState().addDocument("Segundo");
		const { documents } = useNexusStore.getState();
		expect(documents[0].title).toBe("Segundo");
	});

	it("updateDocument cambia título y actualiza updatedAt", async () => {
		const doc = useNexusStore.getState().addDocument("Original");
		const before = doc.updatedAt;

		await new Promise((r) => setTimeout(r, 5));

		useNexusStore.getState().updateDocument(doc.id, { title: "Editado" });
		const updated = useNexusStore.getState().getDocument(doc.id);
		expect(updated?.title).toBe("Editado");
		expect(updated?.updatedAt).toBeGreaterThan(before);
	});

	it("updateDocument en id inexistente no lanza", () => {
		expect(() =>
			useNexusStore
				.getState()
				.updateDocument("doc_ghost" as any, { title: "X" }),
		).not.toThrow();
	});

	it("deleteDocument elimina el documento correcto", () => {
		const a = useNexusStore.getState().addDocument("A");
		const b = useNexusStore.getState().addDocument("B");
		useNexusStore.getState().deleteDocument(a.id);
		const { documents } = useNexusStore.getState();
		expect(documents).toHaveLength(1);
		expect(documents[0].id).toBe(b.id);
	});

	it("getDocument retorna el doc por id", () => {
		const doc = useNexusStore.getState().addDocument("Buscable");
		expect(useNexusStore.getState().getDocument(doc.id)?.title).toBe(
			"Buscable",
		);
	});

	it("getDocument retorna undefined para id inexistente", () => {
		expect(
			useNexusStore.getState().getDocument("doc_nada" as any),
		).toBeUndefined();
	});

	it("persiste documentos en localStorage tras addDocument", () => {
		useNexusStore.getState().addDocument("Persistido");
		const raw = localStorage.getItem("lti_nexus_docs");
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!);
		expect(parsed[0].title).toBe("Persistido");
	});
});

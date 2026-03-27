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
		expect(documents[0]!.title).toBe("Segundo");
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
		expect(documents[0]!.id).toBe(b.id);
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
		// AR-06 (#235): clave migrada de "lti_nexus_docs" (array crudo) a
		// "lti_nexus_state" (formato zustand persist: { state, version })
		const raw = localStorage.getItem("lti_nexus_state");
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!);
		expect(parsed.state.documents[0].title).toBe("Persistido");
	});
});

import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

describe("nexusStore — getYDoc y deleteDocument con YDoc", () => {
	beforeEach(() => {
		localStorage.clear();
		resetStore();
		// Reemplazar con constructor válido para que `new IndexeddbPersistence()` no lance
		vi.mocked(IndexeddbPersistence).mockImplementation(function (
			this: unknown,
		) {
			return {};
		} as any);
	});
	afterEach(() => {
		localStorage.clear();
		resetStore();
	});

	it("retorna un Y.Doc para un id existente", () => {
		const doc = useNexusStore.getState().addDocument("Con YDoc");
		const ydoc = useNexusStore.getState().getYDoc(doc.id);
		expect(ydoc).toBeInstanceOf(Y.Doc);
	});

	it("llamarlo dos veces con el mismo id retorna el mismo objeto", () => {
		const doc = useNexusStore.getState().addDocument("Cache");
		const first = useNexusStore.getState().getYDoc(doc.id);
		const second = useNexusStore.getState().getYDoc(doc.id);
		expect(first).toBe(second);
	});

	it("crea la IndexeddbPersistence al crear el YDoc", () => {
		const doc = useNexusStore.getState().addDocument("IDB");
		useNexusStore.getState().getYDoc(doc.id);
		expect(IndexeddbPersistence).toHaveBeenCalledWith(
			`nexus-doc-${doc.id}`,
			expect.any(Y.Doc),
		);
	});

	it("deleteDocument elimina el doc de documents y de yDocs", () => {
		const doc = useNexusStore.getState().addDocument("Borrable");
		useNexusStore.getState().getYDoc(doc.id);
		useNexusStore.getState().deleteDocument(doc.id);

		expect(useNexusStore.getState().documents).toHaveLength(0);
		expect(useNexusStore.getState().yDocs[doc.id]).toBeUndefined();
	});

	it("deleteDocument llama destroy() en el YDoc", () => {
		const doc = useNexusStore.getState().addDocument("Destroy");
		const ydoc = useNexusStore.getState().getYDoc(doc.id);
		const destroySpy = vi.spyOn(ydoc, "destroy");

		useNexusStore.getState().deleteDocument(doc.id);

		expect(destroySpy).toHaveBeenCalledOnce();
	});

	it("después de deleteDocument, getYDoc crea un nuevo YDoc (no reutiliza el destruido)", () => {
		const doc = useNexusStore.getState().addDocument("Renew");
		useNexusStore.getState().addDocument("Keep"); // para que el doc siga existiendo tras resetear
		const first = useNexusStore.getState().getYDoc(doc.id);
		useNexusStore.getState().deleteDocument(doc.id);

		// Re-agregar el doc para poder llamar getYDoc de nuevo
		const newDoc = useNexusStore.getState().addDocument("Renew");
		const second = useNexusStore.getState().getYDoc(newDoc.id);

		expect(second).not.toBe(first);
	});
});

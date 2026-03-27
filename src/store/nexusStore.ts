// AR-06 (#235): migrado de localStorage manual a Zustand persist middleware
// para consistencia con aetherStore y observerStore.
import { enableMapSet } from "immer";
import { v4 as uuidv4 } from "uuid";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { NexusDocumentId } from "../utils/schemas";

export type { NexusDocumentId };

enableMapSet();

export interface NexusDocument {
	id: NexusDocumentId;
	title: string;
	createdAt: number;
	updatedAt: number;
	tags: string[];
}

interface NexusState {
	documents: NexusDocument[];
	yDocs: Record<string, Y.Doc>;
	yDocsCreating: Set<string>;
}

interface NexusActions {
	addDocument: (title?: string) => NexusDocument;
	updateDocument: (
		id: NexusDocumentId,
		updates: Partial<NexusDocument>,
	) => void;
	deleteDocument: (id: NexusDocumentId) => void;
	getDocument: (id: NexusDocumentId) => NexusDocument | undefined;
	getYDoc: (id: NexusDocumentId) => Y.Doc;
}

export const useNexusStore = create<NexusState & NexusActions>()(
	persist(
		immer((set, get) => ({
			documents: [],
			yDocs: {},
			yDocsCreating: new Set(),

			addDocument: (title = "Página sin título") => {
				const newDoc: NexusDocument = {
					id: `doc_${uuidv4()}` as NexusDocumentId,
					title,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					tags: [],
				};
				set((state) => {
					state.documents.unshift(newDoc);
				});
				return newDoc;
			},

			updateDocument: (id, updates) => {
				set((state) => {
					const doc = state.documents.find((d) => d.id === id);
					if (doc) {
						Object.assign(doc, updates);
						doc.updatedAt = Date.now();
					}
				});
			},

			deleteDocument: (id) => {
				const { yDocs } = get();
				if (yDocs[id]) {
					yDocs[id].destroy();
				}

				set((state) => {
					state.documents = state.documents.filter((doc) => doc.id !== id);
					delete state.yDocs[id];
				});
			},

			getDocument: (id) => {
				return get().documents.find((d) => d.id === id);
			},

			getYDoc: (id) => {
				const { yDocs, yDocsCreating } = get();

				if (yDocs[id]) {
					return yDocs[id];
				}

				const idStr = String(id);
				if (yDocsCreating.has(idStr)) {
					return new Y.Doc(); // Temporary doc return while initializing
				}

				const ydoc = new Y.Doc();
				void new IndexeddbPersistence(`nexus-doc-${idStr}`, ydoc);

				// Marcar, registrar y limpiar el flag en un solo bloque atómico
				// para evitar fugas si un render intermedio re-entra (#163).
				set((state) => {
					state.yDocsCreating.add(idStr);
					state.yDocs[idStr] = ydoc;
					state.yDocsCreating.delete(idStr);
				});

				return ydoc;
			},
		})),
		{
			name: "lti_nexus_state", // nueva clave — evita conflicto de formato con la legacy
			storage: createJSONStorage(() => localStorage),
			// Solo persiste los metadatos del documento; yDocs/yDocsCreating son runtime.
			partialize: (state) => ({ documents: state.documents }),
			onRehydrateStorage: () => (state) => {
				if (!state || state.documents.length > 0) return;
				// Migración one-shot: si no hay documentos y existe la clave legacy,
				// importar los datos del formato anterior (array JSON crudo).
				try {
					const legacy = localStorage.getItem("lti_nexus_docs");
					if (legacy) {
						const docs = JSON.parse(legacy) as NexusDocument[];
						if (Array.isArray(docs) && docs.length > 0) {
							state.documents = docs;
							localStorage.removeItem("lti_nexus_docs");
						}
					}
				} catch {
					// ignorar: si la migración falla el usuario empieza con lista vacía
				}
			},
		},
	),
);

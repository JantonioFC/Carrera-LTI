import { v4 as uuidv4 } from "uuid";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { safeParseJSON } from "../utils/safeStorage";

export type NexusDocumentId = `doc_${string}`;

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
	immer((set, get) => {
		const initialDocuments = safeParseJSON<NexusDocument[]>(
			"lti_nexus_docs",
			[],
		);

		const syncDocuments = (docs: NexusDocument[]) => {
			localStorage.setItem("lti_nexus_docs", JSON.stringify(docs));
		};

		return {
			documents: initialDocuments,
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
					syncDocuments(state.documents);
				});
				return newDoc;
			},

			updateDocument: (id, updates) => {
				set((state) => {
					const doc = state.documents.find((d) => d.id === id);
					if (doc) {
						Object.assign(doc, updates);
						doc.updatedAt = Date.now();
						syncDocuments(state.documents);
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
					syncDocuments(state.documents);

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

				yDocsCreating.add(idStr);

				const ydoc = new Y.Doc();
				void new IndexeddbPersistence(`nexus-doc-${idStr}`, ydoc);

				set((state) => {
					state.yDocs[idStr] = ydoc as any; // Ignore immer draft type checking for Y.Doc
					state.yDocsCreating.delete(idStr);
				});

				return ydoc;
			},
		};
	}),
);

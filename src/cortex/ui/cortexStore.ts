/**
 * Store global de estado de la UI de Cortex.
 *
 * Centraliza la actividad en curso (indexado, transcripción, OCR, consulta),
 * el conteo de documentos indexados y los resultados de la última consulta.
 * No persiste en localStorage — se reconstruye desde el backend al arrancar.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CortexChunk } from "../../types/cortex";

// AR-11 (#236): re-exportar CortexChunk como CortexQueryResult por compatibilidad con importadores existentes
export type { CortexChunk as CortexQueryResult } from "../../types/cortex";

export type CortexActivity =
	| { type: "idle" }
	| { type: "indexing"; docTitle: string; progress?: number }
	| { type: "querying"; query: string }
	| { type: "query_error"; error: string }
	| { type: "ocr"; filename: string };

export interface CortexState {
	activity: CortexActivity;
	indexedDocCount: number;
	lastIndexedAt: number | null;
	queryResults: CortexChunk[];
}

interface CortexActions {
	setActivity: (activity: CortexActivity) => void;
	setIndexedDocCount: (count: number) => void;
	setLastIndexedAt: (ts: number) => void;
	setQueryResults: (results: CortexChunk[]) => void;
	reset: () => void;
}

const initialState: CortexState = {
	activity: { type: "idle" },
	indexedDocCount: 0,
	lastIndexedAt: null,
	queryResults: [],
};

export const useCortexStore = create<CortexState & CortexActions>()(
	immer((set) => ({
		...initialState,

		setActivity: (activity) =>
			set((s) => {
				s.activity = activity;
			}),

		setIndexedDocCount: (count) =>
			set((s) => {
				s.indexedDocCount = count;
			}),

		setLastIndexedAt: (ts) =>
			set((s) => {
				s.lastIndexedAt = ts;
			}),

		setQueryResults: (results) =>
			set((s) => {
				s.queryResults = results;
			}),

		reset: () => set(() => ({ ...initialState })),
	})),
);

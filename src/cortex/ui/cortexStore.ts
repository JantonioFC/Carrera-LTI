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
	| { type: "transcribing"; filename: string }
	| { type: "querying"; query: string }
	| { type: "ocr"; filename: string };

export interface CortexState {
	activity: CortexActivity;
	indexedDocCount: number;
	lastIndexedAt: number | null;
	queryResults: CortexChunk[];
	isQuerying: boolean;
	queryError: string | null;
}

interface CortexActions {
	setActivity: (activity: CortexActivity) => void;
	setIndexedDocCount: (count: number) => void;
	setLastIndexedAt: (ts: number) => void;
	setQueryResults: (results: CortexChunk[]) => void;
	setIsQuerying: (v: boolean) => void;
	setQueryError: (err: string | null) => void;
	reset: () => void;
}

const initialState: CortexState = {
	activity: { type: "idle" },
	indexedDocCount: 0,
	lastIndexedAt: null,
	queryResults: [],
	isQuerying: false,
	queryError: null,
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

		setIsQuerying: (v) =>
			set((s) => {
				s.isQuerying = v;
			}),

		setQueryError: (err) =>
			set((s) => {
				s.queryError = err;
			}),

		reset: () => set(() => ({ ...initialState })),
	})),
);

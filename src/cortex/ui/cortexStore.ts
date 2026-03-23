import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type CortexActivity =
	| { type: "idle" }
	| { type: "indexing"; docTitle: string; progress?: number }
	| { type: "transcribing"; filename: string }
	| { type: "querying"; query: string }
	| { type: "ocr"; filename: string };

export interface CortexQueryResult {
	chunkId: string;
	docId: string;
	content: string;
	score: number;
}

export interface CortexState {
	activity: CortexActivity;
	indexedDocCount: number;
	lastIndexedAt: number | null;
	queryResults: CortexQueryResult[];
	isQuerying: boolean;
	queryError: string | null;
}

interface CortexActions {
	setActivity: (activity: CortexActivity) => void;
	setIndexedDocCount: (count: number) => void;
	setLastIndexedAt: (ts: number) => void;
	setQueryResults: (results: CortexQueryResult[]) => void;
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

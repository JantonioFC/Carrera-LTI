import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type CortexActivity,
	type CortexQueryResult,
	useCortexStore,
} from "../cortex/ui/cortexStore";

function resetStore() {
	useCortexStore.getState().reset();
}

describe("cortexStore — estado inicial", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("la actividad inicial es idle", () => {
		const { activity } = useCortexStore.getState();
		expect(activity.type).toBe("idle");
	});

	it("indexedDocCount inicial es 0", () => {
		expect(useCortexStore.getState().indexedDocCount).toBe(0);
	});

	it("lastIndexedAt inicial es null", () => {
		expect(useCortexStore.getState().lastIndexedAt).toBeNull();
	});

	it("queryResults inicial es array vacío", () => {
		expect(useCortexStore.getState().queryResults).toEqual([]);
	});

	it("la actividad inicial no es query_error ni querying", () => {
		const { activity } = useCortexStore.getState();
		expect(activity.type).not.toBe("querying");
		expect(activity.type).not.toBe("query_error");
	});
});

describe("cortexStore — setActivity", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setActivity cambia la actividad a indexing", () => {
		const activity: CortexActivity = {
			type: "indexing",
			docTitle: "Diseño de sistemas",
			progress: 50,
		};
		useCortexStore.getState().setActivity(activity);
		expect(useCortexStore.getState().activity).toEqual(activity);
	});

	it("setActivity cambia la actividad a transcribing", () => {
		const activity: CortexActivity = {
			type: "transcribing",
			filename: "clase01.wav",
		};
		useCortexStore.getState().setActivity(activity);
		expect(useCortexStore.getState().activity).toEqual(activity);
	});

	it("setActivity cambia la actividad a querying", () => {
		const activity: CortexActivity = {
			type: "querying",
			query: "¿Qué es DDD?",
		};
		useCortexStore.getState().setActivity(activity);
		expect(useCortexStore.getState().activity).toEqual(activity);
	});

	it("setActivity cambia la actividad a ocr", () => {
		const activity: CortexActivity = {
			type: "ocr",
			filename: "diagrama.png",
		};
		useCortexStore.getState().setActivity(activity);
		expect(useCortexStore.getState().activity).toEqual(activity);
	});

	it("setActivity vuelve a idle", () => {
		useCortexStore.getState().setActivity({ type: "querying", query: "test" });
		useCortexStore.getState().setActivity({ type: "idle" });
		expect(useCortexStore.getState().activity.type).toBe("idle");
	});
});

describe("cortexStore — setIndexedDocCount", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setIndexedDocCount actualiza el contador", () => {
		useCortexStore.getState().setIndexedDocCount(42);
		expect(useCortexStore.getState().indexedDocCount).toBe(42);
	});

	it("setIndexedDocCount acepta 0", () => {
		useCortexStore.getState().setIndexedDocCount(10);
		useCortexStore.getState().setIndexedDocCount(0);
		expect(useCortexStore.getState().indexedDocCount).toBe(0);
	});
});

describe("cortexStore — setLastIndexedAt", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setLastIndexedAt guarda el timestamp", () => {
		const ts = Date.now();
		useCortexStore.getState().setLastIndexedAt(ts);
		expect(useCortexStore.getState().lastIndexedAt).toBe(ts);
	});

	it("setLastIndexedAt sobreescribe un valor previo", () => {
		useCortexStore.getState().setLastIndexedAt(1000);
		useCortexStore.getState().setLastIndexedAt(2000);
		expect(useCortexStore.getState().lastIndexedAt).toBe(2000);
	});
});

describe("cortexStore — setQueryResults", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setQueryResults reemplaza el array de resultados", () => {
		const results: CortexQueryResult[] = [
			{ chunkId: "c1", docId: "d1", content: "texto A", score: 0.9 },
			{ chunkId: "c2", docId: "d2", content: "texto B", score: 0.7 },
		];
		useCortexStore.getState().setQueryResults(results);
		expect(useCortexStore.getState().queryResults).toHaveLength(2);
		expect(useCortexStore.getState().queryResults[0]!.chunkId).toBe("c1");
	});

	it("setQueryResults con array vacío limpia los resultados", () => {
		useCortexStore
			.getState()
			.setQueryResults([
				{ chunkId: "c1", docId: "d1", content: "x", score: 0.5 },
			]);
		useCortexStore.getState().setQueryResults([]);
		expect(useCortexStore.getState().queryResults).toEqual([]);
	});
});

describe("cortexStore — activity query_error", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setActivity(query_error) almacena el mensaje de error", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "query_error", error: "Error de conexión" });
		const { activity } = useCortexStore.getState();
		expect(activity.type).toBe("query_error");
		if (activity.type === "query_error") {
			expect(activity.error).toBe("Error de conexión");
		}
	});

	it("setActivity(idle) después de query_error limpia el estado de error", () => {
		useCortexStore
			.getState()
			.setActivity({ type: "query_error", error: "fallo" });
		useCortexStore.getState().setActivity({ type: "idle" });
		expect(useCortexStore.getState().activity.type).toBe("idle");
	});

	it("setActivity(querying) establece el estado de carga", () => {
		useCortexStore.getState().setActivity({ type: "querying", query: "TCP" });
		expect(useCortexStore.getState().activity.type).toBe("querying");
	});
});

describe("cortexStore — reset", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("reset devuelve todo al estado inicial", () => {
		// Modificar varios campos
		useCortexStore.getState().setActivity({ type: "querying", query: "algo" });
		useCortexStore.getState().setIndexedDocCount(99);
		useCortexStore.getState().setLastIndexedAt(Date.now());
		useCortexStore
			.getState()
			.setQueryResults([
				{ chunkId: "c1", docId: "d1", content: "x", score: 0.8 },
			]);
		useCortexStore
			.getState()
			.setActivity({ type: "query_error", error: "fallo" });

		useCortexStore.getState().reset();

		const s = useCortexStore.getState();
		expect(s.activity.type).toBe("idle");
		expect(s.indexedDocCount).toBe(0);
		expect(s.lastIndexedAt).toBeNull();
		expect(s.queryResults).toEqual([]);
	});
});

import { describe, expect, it, vi } from "vitest";
import {
	cosineSimilarity,
	findSimilarNotes,
	generateEmbedding,
} from "./embeddings";

// Hoisted: mock de @google/genai para el test de error de API
const mockEmbedContent = vi.hoisted(() => vi.fn().mockRejectedValue(new Error("API error")));
vi.mock("@google/genai", () => ({
	GoogleGenAI: vi.fn(function () {
		return { models: { embedContent: mockEmbedContent } };
	}),
}));

// --- cosineSimilarity ---

describe("cosineSimilarity", () => {
	it("vectores idénticos → similitud 1", () => {
		const v = [1, 2, 3];
		expect(cosineSimilarity(v, v)).toBeCloseTo(1.0);
	});

	it("vectores ortogonales → similitud 0", () => {
		expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
	});

	it("vectores opuestos → similitud -1", () => {
		expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
	});

	it("vector cero → devuelve 0 sin dividir por cero", () => {
		expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
	});

	it("vectores de alta dimensión calculan correctamente", () => {
		const a = Array.from({ length: 768 }, (_, i) => Math.sin(i));
		const b = Array.from({ length: 768 }, (_, i) => Math.cos(i));
		const sim = cosineSimilarity(a, b);
		expect(sim).toBeGreaterThanOrEqual(-1);
		expect(sim).toBeLessThanOrEqual(1);
	});
});

// --- findSimilarNotes ---

describe("findSimilarNotes", () => {
	const notes = [
		{ id: "a", embedding: [1, 0, 0] },
		{ id: "b", embedding: [0, 1, 0] },
		{ id: "c", embedding: [0.9, 0.1, 0] },
		{ id: "d" }, // sin embedding
	];

	it("omite items sin embedding", () => {
		const results = findSimilarNotes([1, 0, 0], notes, 10);
		expect(results.map((n) => n.id)).not.toContain("d");
	});

	it("ordena por similitud descendente", () => {
		const results = findSimilarNotes([1, 0, 0], notes, 3);
		// 'a' es idéntico → debe ser el primero
		expect(results[0]!.id).toBe("a");
		// 'c' es más similar a [1,0,0] que 'b'
		expect(results[1]!.id).toBe("c");
	});

	it("respeta el límite de resultados", () => {
		const results = findSimilarNotes([1, 0, 0], notes, 2);
		expect(results).toHaveLength(2);
	});

	it("con lista vacía devuelve array vacío", () => {
		expect(findSimilarNotes([1, 0, 0], [], 5)).toEqual([]);
	});

	it("todos sin embedding devuelve array vacío", () => {
		const noEmbed: { embedding?: number[] }[] = [{}, {}];
		expect(findSimilarNotes([1, 0, 0], noEmbed, 5)).toEqual([]);
	});
});

// --- generateEmbedding ---

describe("generateEmbedding", () => {
	it("retorna null si apiKey está vacío", async () => {
		expect(await generateEmbedding("", "texto")).toBeNull();
	});

	it("retorna null si el texto está vacío", async () => {
		expect(await generateEmbedding("api-key", "")).toBeNull();
	});

	it("retorna null y no lanza si la API falla", async () => {
		const result = await generateEmbedding("fake-key", "texto de prueba");
		expect(result).toBeNull();
	});
});

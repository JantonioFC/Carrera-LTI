import { GoogleGenAI } from "@google/genai";

/**
 * Generates an embedding vector for a given text using Gemini.
 */
export async function generateEmbedding(
	apiKey: string,
	text: string,
): Promise<number[] | null> {
	if (!apiKey || !text) return null;

	try {
		const ai = new GoogleGenAI({ apiKey });
		const response = await ai.models.embedContent({
			model: "text-embedding-004",
			contents: [text],
		});
		return response.embeddings?.[0]?.values || null;
	} catch (error) {
		console.error("Error generating embedding:", error);
		return null;
	}
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
	const dotProduct = v1.reduce((acc, val, i) => acc + val * v2[i], 0);
	const magnitude1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0));
	const magnitude2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0));
	if (magnitude1 === 0 || magnitude2 === 0) return 0;
	return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Local vector search implementation.
 */
export function findSimilarNotes<T extends { embedding?: number[] }>(
	targetVector: number[],
	items: T[],
	limit: number = 3,
): T[] {
	return items
		.filter((item) => item.embedding && item.embedding.length > 0)
		.map((item) => ({
			item,
			similarity: cosineSimilarity(targetVector, item.embedding!),
		}))
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, limit)
		.map((res) => res.item);
}

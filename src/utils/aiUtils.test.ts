import type { GenerateContentParameters, Schema } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	generateContentWithRetry,
	generateStructuredContentWithRetry,
	truncateContext,
} from "./aiUtils";

// --- truncateContext ---

describe("truncateContext", () => {
	it("devuelve el texto sin cambios si es menor al límite", () => {
		const text = "Hola mundo";
		expect(truncateContext(text, 100)).toBe(text);
	});

	it("trunca exactamente en maxChars", () => {
		const text = "a".repeat(200);
		const result = truncateContext(text, 100);
		expect(result.startsWith("a".repeat(100))).toBe(true);
		expect(result).toContain("[Contenido truncado");
	});

	it("no trunca texto igual a maxChars", () => {
		const text = "x".repeat(50);
		expect(truncateContext(text, 50)).toBe(text);
	});
});

// --- generateContentWithRetry ---

describe("generateContentWithRetry", () => {
	it("devuelve resultado en el primer intento exitoso", async () => {
		const mockAi = {
			models: { generateContent: vi.fn().mockResolvedValue({ text: "ok" }) },
		} as any;

		const result = await generateContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			3,
		);
		expect(result).toEqual({ text: "ok" });
		expect(mockAi.models.generateContent).toHaveBeenCalledTimes(1);
	});

	it("reintenta en error 429 y eventualmente lanza si se agotan intentos", async () => {
		const error429 = Object.assign(new Error("rate limited"), { status: 429 });
		const mockAi = {
			models: { generateContent: vi.fn().mockRejectedValue(error429) },
		} as any;

		await expect(
			generateContentWithRetry(mockAi, {} as GenerateContentParameters, 2),
		).rejects.toThrow("rate limited");
		// maxRetries=2: intento 0 falla → reintenta → intento 1 falla → lanza
		expect(mockAi.models.generateContent).toHaveBeenCalledTimes(2);
	}, 10000);

	it("lanza inmediatamente en error no retryable (4xx distinto de 429)", async () => {
		const error400 = Object.assign(new Error("bad request"), { status: 400 });
		const mockAi = {
			models: { generateContent: vi.fn().mockRejectedValue(error400) },
		} as any;

		await expect(
			generateContentWithRetry(mockAi, {} as GenerateContentParameters, 3),
		).rejects.toThrow("bad request");
		expect(mockAi.models.generateContent).toHaveBeenCalledTimes(1);
	});

	it("reintenta en error de red (fetch failed)", async () => {
		const networkError = new Error("fetch failed");
		const mockAi = {
			models: {
				generateContent: vi
					.fn()
					.mockRejectedValueOnce(networkError)
					.mockResolvedValueOnce({ text: "recovered" }),
			},
		} as any;

		const result = await generateContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			3,
		);
		expect(result).toEqual({ text: "recovered" });
		expect(mockAi.models.generateContent).toHaveBeenCalledTimes(2);
	}, 5000);

	// #244: verificar que se agotan exactamente maxRetries intentos en error de red
	it("agota todos los reintentos en error de red y lanza", async () => {
		const networkError = new Error("fetch failed");
		const mockAi = {
			models: {
				generateContent: vi.fn().mockRejectedValue(networkError),
			},
		} as any;

		await expect(
			generateContentWithRetry(mockAi, {} as GenerateContentParameters, 3),
		).rejects.toThrow("fetch failed");
		expect(mockAi.models.generateContent).toHaveBeenCalledTimes(3);
	}, 15000);
});

// --- generateStructuredContentWithRetry ---

describe("generateStructuredContentWithRetry", () => {
	const schema = z.object({ answer: z.string() });
	const geminiSchema = {} as Schema;

	it("retorna ok con datos válidos", async () => {
		const mockAi = {
			models: {
				generateContent: vi
					.fn()
					.mockResolvedValue({ text: JSON.stringify({ answer: "hola" }) }),
			},
		} as any;

		const result = await generateStructuredContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			schema,
			geminiSchema,
		);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.answer).toBe("hola");
	});

	it("retorna err si el texto está vacío", async () => {
		const mockAi = {
			models: { generateContent: vi.fn().mockResolvedValue({ text: "" }) },
		} as any;

		const result = await generateStructuredContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			schema,
			geminiSchema,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toContain("vacía");
	});

	it("retorna err si el JSON es inválido", async () => {
		const mockAi = {
			models: {
				generateContent: vi.fn().mockResolvedValue({ text: "no-es-json{" }),
			},
		} as any;

		const result = await generateStructuredContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			schema,
			geminiSchema,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toContain("JSON válido");
	});

	it("retorna err si el JSON no pasa la validación Zod", async () => {
		const mockAi = {
			models: {
				generateContent: vi
					.fn()
					.mockResolvedValue({ text: JSON.stringify({ wrong: 123 }) }),
			},
		} as any;

		const result = await generateStructuredContentWithRetry(
			mockAi,
			{} as GenerateContentParameters,
			schema,
			geminiSchema,
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toContain("Zod");
	});
});

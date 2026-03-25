import type { Schema } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// --- Mocks -----------------------------------------------------------------

const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

// GoogleGenAI must be a proper constructor (class-like), not an arrow function
vi.mock("@google/genai", () => {
	function GoogleGenAI(this: { models: unknown }, _opts: { apiKey: string }) {
		this.models = {
			generateContent: mockGenerateContent,
			generateContentStream: mockGenerateContentStream,
		};
	}
	return { GoogleGenAI };
});

// Mock aiUtils to isolate AIBackendClient from the real retry/structured logic
const mockGenerateStructuredContentWithRetry = vi.fn();
const mockTruncateContext = vi.fn((text: string, _maxChars?: number) => text);

vi.mock("../utils/aiUtils", () => ({
	generateStructuredContentWithRetry: (...args: unknown[]) =>
		mockGenerateStructuredContentWithRetry(...args),
	truncateContext: (text: string, maxChars?: number) =>
		mockTruncateContext(text, maxChars),
}));

// ---------------------------------------------------------------------------

import { err, ok } from "../utils/result";
import { AIBackendClient } from "./aiClient";

const dummyZodSchema = z.object({ answer: z.string() });
const dummyGeminiSchema = {
	type: "OBJECT",
	properties: { answer: { type: "STRING" } },
} as Schema;

// ---------------------------------------------------------------------------

describe("AIBackendClient", () => {
	let client: AIBackendClient;

	beforeEach(() => {
		vi.clearAllMocks();
		mockTruncateContext.mockImplementation((text: string) => text);
		client = new AIBackendClient({ apiKey: "test-api-key" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -------------------------------------------------------------------------
	// 1. Successful call
	// -------------------------------------------------------------------------

	describe("askAether — llamada exitosa", () => {
		it("retorna la respuesta esperada cuando la API responde correctamente", async () => {
			const expected = ok({ answer: "Hola desde Aether" });
			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(expected);

			const result = await client.askAether(
				"¿Qué hay en mis notas?",
				"Nota 1: contenido",
				dummyZodSchema,
				dummyGeminiSchema,
			);

			expect(result).toEqual(expected);
			expect(mockGenerateStructuredContentWithRetry).toHaveBeenCalledOnce();
		});
	});

	describe("askNexus — llamada exitosa", () => {
		it("retorna la respuesta esperada cuando la API responde correctamente", async () => {
			const expected = ok({ answer: "Datos de Nexus" });
			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(expected);

			const messages = [
				{ role: "user", parts: [{ text: "¿Qué materias tengo?" }] },
			];

			const result = await client.askNexus(
				messages,
				"Contexto del sistema",
				dummyZodSchema,
				dummyGeminiSchema,
			);

			expect(result).toEqual(expected);
			expect(mockGenerateStructuredContentWithRetry).toHaveBeenCalledOnce();
		});
	});

	// -------------------------------------------------------------------------
	// 2. Rate limit (429)
	// -------------------------------------------------------------------------

	describe("rate limiting (429)", () => {
		it("retorna un error apropiado cuando la utilidad reporta rate limit", async () => {
			const rateLimitError = Object.assign(new Error("Too Many Requests"), {
				status: 429,
			});
			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(
				err(rateLimitError),
			);

			const result = await client.askAether(
				"prompt",
				"ctx",
				dummyZodSchema,
				dummyGeminiSchema,
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect((result.error as Error).message).toContain("Too Many Requests");
			}
		});

		it("propaga el error cuando generateStructuredContentWithRetry lanza", async () => {
			const rateLimitError = Object.assign(new Error("Rate limit exceeded"), {
				status: 429,
			});
			mockGenerateStructuredContentWithRetry.mockRejectedValueOnce(
				rateLimitError,
			);

			await expect(
				client.askAether("prompt", "ctx", dummyZodSchema, dummyGeminiSchema),
			).rejects.toThrow("Rate limit exceeded");
		});
	});

	// -------------------------------------------------------------------------
	// 3. API errors (5xx)
	// -------------------------------------------------------------------------

	describe("errores de API (5xx)", () => {
		it("retorna un error cuando la API devuelve 500", async () => {
			const serverError = Object.assign(new Error("Internal Server Error"), {
				status: 500,
			});
			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(
				err(serverError),
			);

			const result = await client.askAether(
				"prompt",
				"ctx",
				dummyZodSchema,
				dummyGeminiSchema,
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect((result.error as Error).message).toContain(
					"Internal Server Error",
				);
			}
		});

		it("retorna error en askNexus cuando la API devuelve 503", async () => {
			const serviceUnavailable = Object.assign(
				new Error("Service Unavailable"),
				{ status: 503 },
			);
			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(
				err(serviceUnavailable),
			);

			const result = await client.askNexus(
				[{ role: "user", parts: [{ text: "test" }] }],
				"ctx",
				dummyZodSchema,
				dummyGeminiSchema,
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect((result.error as Error).message).toContain(
					"Service Unavailable",
				);
			}
		});
	});

	// -------------------------------------------------------------------------
	// 4. updateApiKey
	// -------------------------------------------------------------------------

	describe("updateApiKey", () => {
		it("lanza error cuando no hay API key configurada", async () => {
			const clientWithoutKey = new AIBackendClient();
			await expect(
				clientWithoutKey.askAether(
					"prompt",
					"ctx",
					dummyZodSchema,
					dummyGeminiSchema,
				),
			).rejects.toThrow("API Key no configurada.");
		});

		it("permite hacer llamadas tras configurar una nueva key con updateApiKey", async () => {
			const clientFresh = new AIBackendClient();

			// Before updateApiKey it should throw
			await expect(
				clientFresh.askAether(
					"prompt",
					"ctx",
					dummyZodSchema,
					dummyGeminiSchema,
				),
			).rejects.toThrow("API Key no configurada.");

			// After updateApiKey calls should work
			clientFresh.updateApiKey("nueva-api-key-456");

			mockGenerateStructuredContentWithRetry.mockResolvedValueOnce(
				ok({ answer: "ok con nueva key" }),
			);
			const result = await clientFresh.askAether(
				"prompt",
				"ctx",
				dummyZodSchema,
				dummyGeminiSchema,
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual({ answer: "ok con nueva key" });
			}
		});
	});

	// -------------------------------------------------------------------------
	// 5. Streaming — el callback recibe chunks
	// -------------------------------------------------------------------------

	describe("askAetherStream — streaming", () => {
		it("el callback onChunk recibe todos los chunks del stream", async () => {
			const chunks = [
				{ text: "Hola" },
				{ text: ", " },
				{ text: "soy Aether." },
			];

			async function* fakeStream() {
				for (const chunk of chunks) {
					yield chunk;
				}
			}

			mockGenerateContentStream.mockResolvedValueOnce(fakeStream());

			const received: string[] = [];
			await client.askAetherStream("¿Quién eres?", "Notas de prueba", (text) =>
				received.push(text),
			);

			expect(received).toEqual(["Hola", ", ", "soy Aether."]);
			expect(mockGenerateContentStream).toHaveBeenCalledOnce();
		});

		it("ignora chunks sin propiedad text en el stream de Aether", async () => {
			async function* fakeStream() {
				yield { text: "Chunk válido" };
				yield {}; // sin propiedad text
				yield { text: undefined };
				yield { text: "Otro chunk" };
			}

			mockGenerateContentStream.mockResolvedValueOnce(fakeStream());

			const received: string[] = [];
			await client.askAetherStream("prompt", "ctx", (t) => received.push(t));

			expect(received).toEqual(["Chunk válido", "Otro chunk"]);
		});
	});

	describe("askNexusStream — streaming", () => {
		it("el callback onChunk recibe todos los chunks del stream de Nexus", async () => {
			const chunks = [{ text: "Tienes" }, { text: " 3 materias." }];

			async function* fakeStream() {
				for (const chunk of chunks) {
					yield chunk;
				}
			}

			mockGenerateContentStream.mockResolvedValueOnce(fakeStream());

			const received: string[] = [];
			await client.askNexusStream(
				[{ role: "user", parts: [{ text: "¿Qué materias tengo?" }] }],
				"Contexto Nexus",
				(text) => received.push(text),
			);

			expect(received).toEqual(["Tienes", " 3 materias."]);
			expect(mockGenerateContentStream).toHaveBeenCalledOnce();
		});
	});
});

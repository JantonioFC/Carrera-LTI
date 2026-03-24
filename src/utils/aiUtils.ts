import type { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";
import { logger } from "./logger";
import { err, ok, type Result } from "./result";

/**
 * Wrapper for Gemini AI generateContent with exponential backoff retry logic.
 * Handles 429 (Too Many Requests), 503 (Unavailable) and network failures.
 *
 * @param ai - The initialized GoogleGenAI instance.
 * @param options - Generation options to pass to the model.
 * @param maxRetries - Maximum number of retry attempts. Defaults to 3.
 * @returns The response from the Gemini API.
 */
export async function generateContentWithRetry(
	ai: GoogleGenAI,
	options: any,
	maxRetries: number = 3,
): Promise<any> {
	let attempt = 0;

	while (attempt < maxRetries) {
		try {
			return await ai.models.generateContent(options);
		} catch (error: any) {
			const status = error?.status;
			const isRetryable =
				status === 429 ||
				status >= 500 ||
				error?.message?.toLowerCase().includes("fetch failed") ||
				error?.message?.toLowerCase().includes("network");

			if (isRetryable && attempt < maxRetries - 1) {
				attempt++;
				const delayMs = 2 ** (attempt - 1) * 1000 + Math.random() * 500; // Exponential backoff with jitter
				logger.warn(
					"Gemini",
					`Error ${status || "Network"}. Intento ${attempt}/${maxRetries} en ${Math.round(delayMs)}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			} else {
				throw error;
			}
		}
	}
}

/**
 * Truncates text to prevent exceeding the model's token limits.
 *
 * @param text - The original large string.
 * @param maxChars - Maximum characters to allow. Defaults to 40000.
 * @returns The truncated string if it exceeded the limit.
 */
export function truncateContext(
	text: string,
	maxChars: number = 40000,
): string {
	if (text.length <= maxChars) return text;
	return `${text.slice(0, maxChars)}\n\n...[Contenido truncado por límite de tokens]`;
}

/**
 * Wrapper for generation of Structured Outputs using JSON.
 * It forces JSON responseMimeType, parses the response, and statically validates it with Zod.
 * Prevents hallucinations in JSON parsing.
 */
export async function generateStructuredContentWithRetry<T>(
	ai: GoogleGenAI,
	options: any,
	zodSchema: ZodType<T>,
	geminiSchema: any,
	maxRetries: number = 3,
): Promise<Result<T, Error>> {
	const structuredOptions = {
		...options,
		config: {
			...options.config,
			responseMimeType: "application/json",
			responseSchema: geminiSchema,
		},
	};

	try {
		const response = await generateContentWithRetry(
			ai,
			structuredOptions,
			maxRetries,
		);
		const text = response.text || "";
		if (!text) return err(new Error("Respuesta vacía de Gemini."));

		let parsedJson;
		try {
			parsedJson = JSON.parse(text);
		} catch (_e) {
			return err(new Error("La respuesta de la IA no es un JSON válido."));
		}

		const validation = zodSchema.safeParse(parsedJson);
		if (!validation.success) {
			return err(
				new Error(
					`Validación Zod fallida: ${validation.error.issues[0]?.message}`,
				),
			);
		}

		return ok(validation.data);
	} catch (error: any) {
		return err(error instanceof Error ? error : new Error(String(error)));
	}
}

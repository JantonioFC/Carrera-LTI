import { GoogleGenAI } from "@google/genai";
import {
	generateStructuredContentWithRetry,
	truncateContext,
} from "../utils/aiUtils";
import type { ZodType } from "zod";

/**
 * Limitador de Tasa Cliente (Token Bucket simple por minuto)
 */
class RateLimiter {
	private tokens: number;
	private lastRefill: number;
	private readonly maxTokens: number;
	private readonly refillRateMs: number;

	constructor(maxRequestsPerMinute: number) {
		this.maxTokens = maxRequestsPerMinute;
		this.tokens = maxRequestsPerMinute;
		this.lastRefill = Date.now();
		this.refillRateMs = 60000 / maxRequestsPerMinute;
	}

	async acquireToken(): Promise<void> {
		this.refill();
		if (this.tokens >= 1) {
			this.tokens -= 1;
			return;
		}
		// Si no hay tokens, esperar hasta el próximo refill
		const waitTime = this.refillRateMs - (Date.now() - this.lastRefill);
		if (waitTime > 0) {
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}
		return this.acquireToken();
	}

	private refill() {
		const now = Date.now();
		const elapsedTime = now - this.lastRefill;
		const tokensToAdd = Math.floor(elapsedTime / this.refillRateMs);

		if (tokensToAdd > 0) {
			this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
			this.lastRefill = now;
		}
	}
}

const aiRateLimiter = new RateLimiter(15); // max 15 requests per minute

export interface AIClientConfig {
	apiKey: string;
}

export class AIBackendClient {
	private client: GoogleGenAI | null = null;

	constructor(config?: AIClientConfig) {
		if (config?.apiKey) {
			this.client = new GoogleGenAI({ apiKey: config.apiKey });
		}
	}

	updateApiKey(apiKey: string) {
		this.client = new GoogleGenAI({ apiKey });
	}

	private async ensureClient() {
		if (!this.client) throw new Error("API Key no configurada.");
		await aiRateLimiter.acquireToken();
		return this.client;
	}

	/**
	 * Genera respuesta conversacional para AetherChat implementando Chain-of-Thought
	 */
	async askAether(
		prompt: string,
		contextNotes: string,
		zodSchema: ZodType<any>,
		geminiSchema: any,
	) {
		const ai = await this.ensureClient();

		const systemInstruction = `Eres Aether, un asistente de IA de "Segundo Cerebro". 
Tu objetivo es ayudar al usuario a recordar, conectar y generar ideas basadas EXCLUSIVAMENTE en sus propias notas.

# Instrucciones (Chain of Thought):
1. Analiza cuidadosamente la pregunta del usuario.
2. Revisa el contenido de las notas proporcionadas en busqueda de entidades, fechas, conceptos e ideas clave.
3. Encuentra conexiones entre diferentes notas si aplican.
4. Formula una respuesta exhaustiva en formato Markdown.
5. Referencia los nombres de las notas explícitamente cuando uses su información.

Aquí están las notas actuales del usuario en su bóveda:
${truncateContext(contextNotes, 30000)}`;

		return generateStructuredContentWithRetry(
			ai,
			{
				model: "gemini-2.5-flash",
				contents: prompt,
				config: {
					systemInstruction,
					temperature: 0.7,
				},
			},
			zodSchema,
			geminiSchema,
		);
	}

	/**
	 * Genera respuesta conversacional para NexusAI analizando bases de datos y documentos
	 */
	async askNexus(
		messages: { role: string; parts: { text: string }[] }[],
		systemContext: string,
		zodSchema: ZodType<any>,
		geminiSchema: any,
	) {
		const ai = await this.ensureClient();

		const enhancedContext = `${systemContext}

# Reglas Adicionales (Few-Shot & CoT):
Piensa paso a paso sobre el entorno y estado de la información.
Ejemplo de razonamiento:
Usuario: "¿Qué materias curso este semestre?"
Pensamiento: Necesito buscar en las "Bases de Datos Nexus" para encontrar algo relacionado a "Materias" o "Semestre". 
Acción: Retorno la lista estructurada con colores (si aplica).`;

		const chatContents = [
			{ role: "user", parts: [{ text: enhancedContext }] },
			...messages,
		];

		return generateStructuredContentWithRetry(
			ai,
			{
				model: "gemini-2.5-flash",
				contents: chatContents,
			},
			zodSchema,
			geminiSchema,
		);
	}

	/**
	 * Streaming methods for chat UX
	 */
	async askAetherStream(
		prompt: string,
		contextNotes: string,
		onChunk: (text: string) => void
	) {
		const ai = await this.ensureClient();

		const systemInstruction = `Eres Aether, un asistente de IA de "Segundo Cerebro". 
Tu objetivo es ayudar al usuario a recordar, conectar y generar ideas basadas EXCLUSIVAMENTE en sus propias notas.

# Instrucciones (Chain of Thought):
1. Analiza cuidadosamente la pregunta del usuario.
2. Revisa el contenido de las notas proporcionadas en busqueda de entidades, fechas, conceptos e ideas clave.
3. Encuentra conexiones entre diferentes notas si aplican.
4. Formula una respuesta exhaustiva en formato Markdown.
5. Referencia los nombres de las notas explícitamente cuando uses su información.

Aquí están las notas actuales del usuario en su bóveda:
${truncateContext(contextNotes, 30000)}`;

		const response = await ai.models.generateContentStream({
			model: "gemini-2.5-flash",
			contents: prompt,
			config: {
				systemInstruction,
				temperature: 0.7,
			},
		});

		for await (const chunk of response) {
			if (chunk.text) {
				onChunk(chunk.text);
			}
		}
	}

	async askNexusStream(
		messages: { role: string; parts: { text: string }[] }[],
		systemContext: string,
		onChunk: (text: string) => void
	) {
		const ai = await this.ensureClient();

		const enhancedContext = `${systemContext}

# Reglas Adicionales (Few-Shot & CoT):
Piensa paso a paso sobre el entorno y estado de la información.
Ejemplo de razonamiento:
Usuario: "¿Qué materias curso este semestre?"
Pensamiento: Necesito buscar en las "Bases de Datos Nexus" para encontrar algo relacionado a "Materias" o "Semestre". 
Acción: Retorno la lista estructurada con colores (si aplica).`;

		const chatContents = [
			{ role: "user", parts: [{ text: enhancedContext }] },
			...messages,
		];

		const response = await ai.models.generateContentStream({
			model: "gemini-2.5-flash",
			contents: chatContents as any,
		});

		for await (const chunk of response) {
			if (chunk.text) {
				onChunk(chunk.text);
			}
		}
	}
}

// Singleton client instance
export const apiBackend = new AIBackendClient();

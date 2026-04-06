import type { Schema } from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";
import {
	AETHER_NOTES_CONTEXT_CHARS,
	generateStructuredContentWithRetry,
	truncateContext,
} from "../utils/aiUtils";

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

// QP-06 (#202): systemInstruction compartida entre askAether y askAetherStream
const AETHER_SYSTEM_INSTRUCTION = `Eres Aether, un asistente de IA de "Segundo Cerebro".
Tu objetivo es ayudar al usuario a recordar, conectar y generar ideas basadas EXCLUSIVAMENTE en sus propias notas.

# Instrucciones (Chain of Thought):
1. Analiza cuidadosamente la pregunta del usuario.
2. Revisa el contenido de las notas proporcionadas en busqueda de entidades, fechas, conceptos e ideas clave.
3. Encuentra conexiones entre diferentes notas si aplican.
4. Formula una respuesta exhaustiva en formato Markdown.
5. Referencia los nombres de las notas explícitamente cuando uses su información.`;

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
		geminiSchema: Schema,
	) {
		const ai = await this.ensureClient();

		const systemInstruction = `${AETHER_SYSTEM_INSTRUCTION}

Aquí están las notas actuales del usuario en su bóveda:
${truncateContext(contextNotes, AETHER_NOTES_CONTEXT_CHARS)}`;

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
		geminiSchema: Schema,
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
		onChunk: (text: string) => void,
	) {
		const ai = await this.ensureClient();

		const systemInstruction = `${AETHER_SYSTEM_INSTRUCTION}

Aquí están las notas actuales del usuario en su bóveda:
${truncateContext(contextNotes, AETHER_NOTES_CONTEXT_CHARS)}`;

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
		onChunk: (text: string) => void,
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
			contents: chatContents,
		});

		for await (const chunk of response) {
			if (chunk.text) {
				onChunk(chunk.text);
			}
		}
	}
}

// ── VPS client (modo Sovereign Station) ──────────────────────────────────────
// Delega las llamadas a IA al backend VPS vía HTTP en lugar de llamar Gemini
// directamente. La API key vive en el servidor; el cliente no la necesita.

const _CORTEX_URL = (import.meta.env.VITE_CORTEX_URL ?? "").trim();

interface VPSGenerateRequest {
	action: "askAether" | "askNexus" | "askAetherStream" | "askNexusStream";
	model: string;
	contents?: unknown;
	messages?: unknown;
	systemInstruction?: string;
	temperature?: number;
}

interface VPSGenerateResponse {
	text: string;
}

async function vpsGenerate(req: VPSGenerateRequest): Promise<string> {
	const res = await fetch(`${_CORTEX_URL}/ai/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) {
		throw new Error(`VPS /ai/generate error: ${res.status} ${res.statusText}`);
	}
	const data = (await res.json()) as VPSGenerateResponse;
	return data.text;
}

export class VPSAIClient extends AIBackendClient {
	override updateApiKey(_apiKey: string): void {
		// no-op: la clave vive en el VPS
	}

	override async askAether(
		prompt: string,
		contextNotes: string,
		zodSchema: Parameters<AIBackendClient["askAether"]>[2],
	) {
		const text = await vpsGenerate({
			action: "askAether",
			model: "gemini-2.5-flash",
			contents: prompt,
			systemInstruction: contextNotes,
			temperature: 0.7,
		});
		// Parsear el JSON que devuelve el VPS con el mismo esquema Zod
		const parsed = JSON.parse(text);
		return zodSchema.parse(parsed);
	}

	override async askNexus(
		messages: Parameters<AIBackendClient["askNexus"]>[0],
		systemContext: string,
		zodSchema: Parameters<AIBackendClient["askNexus"]>[2],
	) {
		const text = await vpsGenerate({
			action: "askNexus",
			model: "gemini-2.5-flash",
			messages,
			systemInstruction: systemContext,
		});
		const parsed = JSON.parse(text);
		return zodSchema.parse(parsed);
	}

	override async askAetherStream(
		prompt: string,
		contextNotes: string,
		onChunk: (text: string) => void,
	): Promise<void> {
		const res = await fetch(`${_CORTEX_URL}/ai/generate/stream`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "askAetherStream",
				model: "gemini-2.5-flash",
				contents: prompt,
				systemInstruction: contextNotes,
				temperature: 0.7,
			}),
		});
		if (!res.ok || !res.body) {
			throw new Error(`VPS stream error: ${res.status}`);
		}
		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			onChunk(decoder.decode(value, { stream: true }));
		}
	}

	override async askNexusStream(
		messages: Parameters<AIBackendClient["askNexusStream"]>[0],
		systemContext: string,
		onChunk: (text: string) => void,
	): Promise<void> {
		const res = await fetch(`${_CORTEX_URL}/ai/generate/stream`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "askNexusStream",
				model: "gemini-2.5-flash",
				messages,
				systemInstruction: systemContext,
			}),
		});
		if (!res.ok || !res.body) {
			throw new Error(`VPS stream error: ${res.status}`);
		}
		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			onChunk(decoder.decode(value, { stream: true }));
		}
	}
}

// ── Singleton ─────────────────────────────────────────────────────────────────
// Singleton client instance.
// Usar `let` permite reemplazarlo en tests con _setApiBackend().
// AR-02 (#258): evita acoplamiento a GoogleGenAI en tests de variantes.
// En modo VPS se instancia VPSAIClient en lugar de AIBackendClient.
export let apiBackend: AIBackendClient = _CORTEX_URL
	? new VPSAIClient()
	: new AIBackendClient();

/** Para tests únicamente: reemplaza la instancia singleton. */
export function _setApiBackend(client: AIBackendClient): void {
	apiBackend = client;
}

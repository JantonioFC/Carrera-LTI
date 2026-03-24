/**
 * Utilidades seguras para lectura/escritura de localStorage y sessionStorage.
 * Protege contra JSON corrupto, localStorage lleno o deshabilitado.
 */

import type { ZodType } from "zod";
import { logger } from "./logger";
import { err, ok, type Result } from "./result";

/**
 * Lee y parsea un valor de localStorage retornando un Result.
 */
export function parseJSON<T>(key: string): Result<T, Error> {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null)
			return err(new Error(`Clave "${key}" no encontrada en localStorage`));
		return ok(JSON.parse(raw) as T);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

/**
 * Funciones legacy adaptadas para mantener compatibilidad, wrappers sobre parseJSON
 */
export function safeParseJSON<T>(key: string, fallback: T): T {
	const result = parseJSON<T>(key);
	if (result.ok) return result.value;
	logger.warn(
		"safeStorage",
		`Error leyendo "${key}" de localStorage, usando fallback.`,
	);
	return fallback;
}

export function parseSessionJSON<T>(key: string): Result<T, Error> {
	try {
		const raw = sessionStorage.getItem(key);
		if (raw === null)
			return err(new Error(`Clave "${key}" no encontrada en sessionStorage`));
		return ok(JSON.parse(raw) as T);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

export function safeParseSessionJSON<T>(key: string, fallback: T): T {
	const result = parseSessionJSON<T>(key);
	if (result.ok) return result.value;
	logger.warn(
		"safeStorage",
		`Error leyendo "${key}" de sessionStorage, usando fallback.`,
	);
	return fallback;
}

/**
 * Lee, parsea y valida un valor de localStorage usando un schema Zod, retornando un Result.
 */
export function parseValidatedJSON<T>(
	key: string,
	schema: ZodType<T>,
): Result<T, Error> {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return err(new Error(`Clave "${key}" no encontrada`));
		const parsed = JSON.parse(raw);
		const result = schema.safeParse(parsed);
		if (result.success) {
			return ok(result.data);
		}
		return err(
			new Error(
				`Datos inválidos en "${key}": ${result.error.issues[0]?.message}`,
			),
		);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

export function safeParseValidatedJSON<T>(
	key: string,
	schema: ZodType<T>,
	fallback: T,
): T {
	const result = parseValidatedJSON(key, schema);
	if (result.ok) return result.value;
	logger.warn("safeStorage", `${result.error.message}. Usando fallback.`);
	return fallback;
}

/**
 * Serializa y guarda un valor en localStorage.
 * Retorna un Result para manejar quota exceeded u otros errores. (#73)
 */
export function setJSON<T>(key: string, value: T): Result<void, Error> {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return ok(undefined);
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)));
	}
}

/**
 * Elimina una clave de localStorage de forma segura. (#73)
 */
export function removeKey(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignorar si el storage no está disponible
	}
}

/** Claves de localStorage usadas en la app — fuente de verdad (#73) */
export const STORAGE_KEYS = {
	SUBJECT_DATA: "lti_subject_data",
	CUSTOM_SUBJECTS: "lti_custom_subjects",
	ACADEMIC_DATES: "lti_academic_dates",
	TASKS: "lti_tasks",
	SCHEDULE: "lti_schedule",
	PRESENCIALES: "lti_eventos_presenciales",
	NEXUS_DOCS: "lti_nexus_docs",
	NEXUS_AI_HISTORY: "lti_nexus_ai_history",
	SYNC_QUEUE: "lti_sync_queue",
	CAL_EVENTS: "cal2026_events",
} as const;

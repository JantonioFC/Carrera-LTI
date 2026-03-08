/**
 * Utilidades seguras para lectura/escritura de localStorage y sessionStorage.
 * Protege contra JSON corrupto, localStorage lleno o deshabilitado.
 */

import type { ZodType } from 'zod';

/**
 * Lee y parsea un valor de localStorage con protección contra errores.
 * @param key - La clave en localStorage.
 * @param fallback - Valor por defecto devuelto en caso de fallo o inexistencia.
 * @returns El objeto parseado de tipo T o el fallback.
 */
export function safeParseJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[safeStorage] Error leyendo "${key}" de localStorage, usando fallback.`);
    return fallback;
  }
}

/**
 * Lee y parsea un valor de sessionStorage con protección contra errores.
 * @param key - La clave en sessionStorage.
 * @param fallback - Valor por defecto devuelto en caso de fallo.
 * @returns El objeto parseado de tipo T o el fallback.
 */
export function safeParseSessionJSON<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[safeStorage] Error leyendo "${key}" de sessionStorage, usando fallback.`);
    return fallback;
  }
}

/**
 * Lee, parsea y valida un valor de localStorage usando un schema Zod.
 * @param key - La clave en localStorage.
 * @param schema - Schema de Zod para validación estructural.
 * @param fallback - Valor a retornar en caso de error o invalidación.
 * @returns Los datos tipificados y validados, o el fallback.
 */
export function safeParseValidatedJSON<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.warn(`[safeStorage] Datos inválidos en "${key}":`, result.error.issues[0]?.message);
    return fallback;
  } catch {
    console.warn(`[safeStorage] Error leyendo "${key}" de localStorage, usando fallback.`);
    return fallback;
  }
}

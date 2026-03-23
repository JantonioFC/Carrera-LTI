import type { RuVectorChunk } from '../ruvector/RuVectorAdapter';

/** Mínimo de palabras significativas en común para considerar grounded */
const MIN_OVERLAP_WORDS = 2;

/** Palabras vacías que no cuentan como evidencia de grounding */
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'y', 'a', 'que', 'es',
  'se', 'no', 'con', 'por', 'su', 'para', 'al', 'del', 'como', 'o', 'más',
  'the', 'a', 'an', 'is', 'are', 'of', 'in', 'and', 'to', 'it', 'for',
]);

export interface GroundedSource {
  docId: string;
  chunkId: string;
}

export interface GroundedResponse {
  content: string;
  sources: GroundedSource[];
  grounded: boolean;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/**
 * Verifica si una respuesta está fundamentada en los chunks del índice local.
 *
 * REQ-22: Cortex NUNCA debe responder con conocimiento externo.
 * Una respuesta se considera grounded si comparte al menos MIN_OVERLAP_WORDS
 * palabras significativas con alguno de los chunks recuperados.
 */
export function isGrounded(response: string, chunks: RuVectorChunk[]): boolean {
  if (!response || chunks.length === 0) return false;

  const responseTokens = tokenize(response);
  if (responseTokens.size === 0) return false;

  for (const chunk of chunks) {
    const chunkTokens = tokenize(chunk.content);
    let overlap = 0;
    for (const token of responseTokens) {
      if (chunkTokens.has(token)) overlap++;
      if (overlap >= MIN_OVERLAP_WORDS) return true;
    }
  }

  return false;
}

/**
 * Construye una respuesta grounded a partir de los chunks recuperados.
 *
 * Si no hay chunks → respuesta estándar de "no encontré información".
 * Las fuentes se deduplicanan por docId para evitar citas duplicadas.
 */
export function buildGroundedResponse(chunks: RuVectorChunk[], _query: string): GroundedResponse {
  if (chunks.length === 0) {
    return {
      content: 'No encontré información sobre esto en tu índice.',
      sources: [],
      grounded: false,
    };
  }

  // Construir contenido concatenando los chunks por orden de score
  const sorted = [...chunks].sort((a, b) => b.score - a.score);
  const content = sorted.map((c) => c.content).join('\n\n');

  // Deduplicar fuentes por docId
  const seen = new Set<string>();
  const sources: GroundedSource[] = [];
  for (const chunk of sorted) {
    if (!seen.has(chunk.docId)) {
      seen.add(chunk.docId);
      sources.push({ docId: chunk.docId, chunkId: chunk.chunkId });
    }
  }

  return { content, sources, grounded: true };
}

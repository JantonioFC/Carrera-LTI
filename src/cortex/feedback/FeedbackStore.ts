import type { TimeProvider } from '../__mocks__/MockTimeProvider';

const PENALTY_DELTA = 0.15;
const BOOST_DELTA = 0.10;

export interface SearchResult {
  id: string;
  score: number;
}

export interface FeedbackEntry {
  resultId: string;
  signal: 'positive' | 'negative';
  createdAt: number;
}

export interface PruneOptions {
  retentionDays: number;
  time: TimeProvider;
}

/**
 * Ajusta los scores de resultados de búsqueda según el historial de feedback.
 *
 * - Señal negativa: resta PENALTY_DELTA por ocurrencia.
 * - Señal positiva: suma BOOST_DELTA por ocurrencia.
 * - Score final clampeado a [0, 1].
 *
 * Las señales se aplican de forma acumulativa para que feedback
 * repetido tenga más peso que feedback puntual.
 */
export function applyPenalty(results: SearchResult[], feedback: FeedbackEntry[]): SearchResult[] {
  return results.map((result) => {
    const signals = feedback.filter((f) => f.resultId === result.id);
    let score = result.score;

    for (const entry of signals) {
      if (entry.signal === 'negative') score -= PENALTY_DELTA;
      else if (entry.signal === 'positive') score += BOOST_DELTA;
    }

    return { ...result, score: Math.min(1, Math.max(0, score)) };
  });
}

/**
 * Elimina entradas de feedback más antiguas que retentionDays.
 * Las entradas exactamente en el límite se conservan.
 */
export function pruneExpiredFeedback(feedback: FeedbackEntry[], opts: PruneOptions): FeedbackEntry[] {
  const cutoff = opts.time.now() - opts.retentionDays * 86_400_000;
  return feedback.filter((entry) => entry.createdAt >= cutoff);
}

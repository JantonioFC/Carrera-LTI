import type { IFs } from 'memfs';
import type { TimeProvider } from '../__mocks__/MockTimeProvider';

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

interface WavManagerOptions {
  fs: IFs;
  time: TimeProvider;
}

/**
 * Gestiona archivos .wav temporales de grabación.
 *
 * Privacidad (REQ-22):
 * - Elimina el .wav inmediatamente tras una transcripción exitosa.
 * - NO elimina si la transcripción falló (permite re-intentos).
 * - Poda automática de .wav con más de 24h de antigüedad.
 */
export class WavManager {
  private readonly fs: IFs;
  private readonly time: TimeProvider;

  constructor({ fs, time }: WavManagerOptions) {
    this.fs = fs;
    this.time = time;
  }

  /** Elimina el archivo .wav tras una transcripción exitosa. */
  async deleteAfterTranscription(path: string): Promise<void> {
    try {
      this.fs.unlinkSync(path);
    } catch {
      // Archivo inexistente — no es error
    }
  }

  /**
   * Registra que la transcripción falló.
   * El archivo debe conservarse para re-intentos manuales.
   * (No hace nada sobre el archivo — intencional.)
   */
  async handleTranscriptionFailed(_path: string): Promise<void> {
    // Comportamiento explícito: conservar el archivo
  }

  /**
   * Elimina todos los archivos .wav en `dir` con más de 24h de antigüedad.
   * Solo actúa sobre archivos con extensión .wav.
   */
  async pruneExpiredRecordings(dir: string): Promise<void> {
    const now = this.time.now();
    const entries = this.fs.readdirSync(dir) as string[];

    for (const entry of entries) {
      if (!entry.endsWith('.wav')) continue;

      const fullPath = `${dir}/${entry}`;
      try {
        const stat = this.fs.statSync(fullPath);
        const age = now - (stat.mtimeMs as number);
        if (age > MAX_AGE_MS) {
          this.fs.unlinkSync(fullPath);
        }
      } catch {
        // Archivo eliminado por otro proceso entre readdirSync y statSync
      }
    }
  }
}

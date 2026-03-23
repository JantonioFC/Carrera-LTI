import { describe, it, expect, beforeEach } from 'vitest';
import { Volume } from 'memfs';
import { WavManager } from './WavManager';
import { MockTimeProvider } from '../__mocks__/MockTimeProvider';

const WAV_CONTENT = Buffer.from('RIFF....WAVEfmt ');

describe('WavManager — deleteAfterTranscription', () => {
  let vol: InstanceType<typeof Volume>;
  let wav: WavManager;

  beforeEach(() => {
    vol = new Volume();
    vol.mkdirSync('/tmp', { recursive: true });
    wav = new WavManager({ fs: vol as never, time: new MockTimeProvider(Date.now()) });
  });

  it('should_delete_wav_file_after_successful_transcription', async () => {
    vol.writeFileSync('/tmp/recording.wav', WAV_CONTENT);
    await wav.deleteAfterTranscription('/tmp/recording.wav');
    expect(vol.existsSync('/tmp/recording.wav')).toBe(false);
  });

  it('should_not_throw_if_file_already_absent', async () => {
    await expect(wav.deleteAfterTranscription('/tmp/ghost.wav')).resolves.not.toThrow();
  });

  it('should_not_delete_wav_if_transcription_failed', async () => {
    vol.writeFileSync('/tmp/recording.wav', WAV_CONTENT);
    await wav.handleTranscriptionFailed('/tmp/recording.wav');
    expect(vol.existsSync('/tmp/recording.wav')).toBe(true);
  });
});

describe('WavManager — pruneExpiredRecordings', () => {
  it('should_delete_wav_files_older_than_24_hours', async () => {
    const now = Date.now();
    const vol = new Volume();
    vol.mkdirSync('/tmp', { recursive: true });
    vol.writeFileSync('/tmp/old.wav', WAV_CONTENT);
    // Parchear stat para simular archivo de 25h de antigüedad
    const origStat = vol.statSync.bind(vol);
    vol.statSync = (p: unknown) => {
      const s = origStat(p as string);
      (s as Record<string, unknown>).mtimeMs = now - 25 * 3_600_000;
      return s;
    };

    const time = new MockTimeProvider(now);
    const wav = new WavManager({ fs: vol as never, time });
    await wav.pruneExpiredRecordings('/tmp');
    expect(vol.existsSync('/tmp/old.wav')).toBe(false);
  });

  it('should_keep_wav_files_newer_than_24_hours', async () => {
    const now = Date.now();
    const vol = new Volume();
    vol.mkdirSync('/tmp', { recursive: true });
    vol.writeFileSync('/tmp/fresh.wav', WAV_CONTENT);
    const origStat = vol.statSync.bind(vol);
    vol.statSync = (p: unknown) => {
      const s = origStat(p as string);
      (s as Record<string, unknown>).mtimeMs = now - 1 * 3_600_000; // 1h
      return s;
    };

    const time = new MockTimeProvider(now);
    const wav = new WavManager({ fs: vol as never, time });
    await wav.pruneExpiredRecordings('/tmp');
    expect(vol.existsSync('/tmp/fresh.wav')).toBe(true);
  });

  it('should_only_prune_wav_files_not_other_extensions', async () => {
    const now = Date.now();
    const vol = new Volume();
    vol.mkdirSync('/tmp', { recursive: true });
    vol.writeFileSync('/tmp/old.wav', WAV_CONTENT);
    vol.writeFileSync('/tmp/notes.txt', 'keep me');
    const origStat = vol.statSync.bind(vol);
    vol.statSync = (p: unknown) => {
      const s = origStat(p as string);
      (s as Record<string, unknown>).mtimeMs = now - 25 * 3_600_000;
      return s;
    };

    const time = new MockTimeProvider(now);
    const wav = new WavManager({ fs: vol as never, time });
    await wav.pruneExpiredRecordings('/tmp');
    expect(vol.existsSync('/tmp/old.wav')).toBe(false);
    expect(vol.existsSync('/tmp/notes.txt')).toBe(true);
  });
});

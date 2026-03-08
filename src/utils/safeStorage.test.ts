import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeParseJSON, safeParseSessionJSON } from './safeStorage';

describe('safeParseJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna el fallback si la key no existe', () => {
    const result = safeParseJSON('nonexistent', []);
    expect(result).toEqual([]);
  });

  it('retorna el fallback si la key no existe (objeto)', () => {
    const fallback = { default: true };
    const result = safeParseJSON('nonexistent', fallback);
    expect(result).toEqual(fallback);
  });

  it('parsea correctamente JSON válido', () => {
    const data = [{ id: '1', name: 'Test' }];
    localStorage.setItem('test_key', JSON.stringify(data));
    const result = safeParseJSON('test_key', []);
    expect(result).toEqual(data);
  });

  it('retorna el fallback si el JSON es inválido/corrupto', () => {
    localStorage.setItem('bad_json', '{invalid json!!!');
    const result = safeParseJSON('bad_json', 'fallback');
    expect(result).toBe('fallback');
  });

  it('retorna el fallback si localStorage lanza excepción', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    const result = safeParseJSON('key', 42);
    expect(result).toBe(42);
    spy.mockRestore();
  });
});

describe('safeParseSessionJSON', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('retorna el fallback si la key no existe', () => {
    const result = safeParseSessionJSON('nonexistent', 'default');
    expect(result).toBe('default');
  });

  it('parsea correctamente JSON válido desde sessionStorage', () => {
    sessionStorage.setItem('session_key', JSON.stringify({ test: true }));
    const result = safeParseSessionJSON('session_key', {});
    expect(result).toEqual({ test: true });
  });

  it('retorna el fallback si el JSON es inválido en sessionStorage', () => {
    sessionStorage.setItem('bad_session', 'not-json');
    const result = safeParseSessionJSON('bad_session', []);
    expect(result).toEqual([]);
  });
});

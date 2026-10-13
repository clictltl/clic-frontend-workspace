import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('generateUUID', () => {
  it('funciona sem crypto.randomUUID (http fora do localhost, navegadores antigos)', async () => {
    // Fora de contexto seguro o navegador não expõe randomUUID; getRandomValues continua existindo.
    // A biblioteca uuid detecta o randomUUID ao ser importada: troca o crypto antes e importa depois.
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    vi.resetModules();
    const { generateUUID } = await import('../id');

    const a = generateUUID();
    const b = generateUUID();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
});

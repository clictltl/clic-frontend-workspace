/**
 * SORTEIO COM SEMENTE
 *
 * Gerador mulberry32: o estado é um inteiro de 32 bits guardado no `ChatState`, então
 * a mesma semente com as mesmas respostas reproduz os mesmos sorteios (session replay).
 */

/** Próximo número em [0, 1) e o novo estado do gerador. Não altera nada. */
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Semente nova para uma conversa (fora do motor, que precisa ser determinístico). */
export function createSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

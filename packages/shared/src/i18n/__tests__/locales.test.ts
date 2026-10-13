import { describe, it, expect } from 'vitest';
import ptBR from '../locales/pt-BR';
import en from '../locales/en';

/** Todas as chaves folha, no formato 'a.b.c'. */
const keys = (obj: Record<string, any>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe('locales', () => {
  it('pt-BR e en têm as mesmas chaves (uma chave faltando cai no outro idioma sem aviso)', () => {
    const pt = new Set(keys(ptBR));
    const enKeys = new Set(keys(en));
    expect([...pt].filter(k => !enKeys.has(k)), 'faltam no en').toEqual([]);
    expect([...enKeys].filter(k => !pt.has(k)), 'faltam no pt-BR').toEqual([]);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import ptBR from '../../i18n/locales/pt-BR';
import en from '../../i18n/locales/en';
import { i18n } from '../../i18n';
import { API_ERROR_KEYS, apiErrorMessage, requestErrorMessage, NetworkError, ApiError } from '../apiErrors';

/** Lê 'a.b.c' dentro do objeto de mensagens. */
const lookup = (messages: any, key: string) => key.split('.').reduce((obj, part) => obj?.[part], messages);

afterEach(() => vi.restoreAllMocks());

describe('API_ERROR_KEYS', () => {
  it.each(Object.entries(API_ERROR_KEYS))('%s aponta para uma chave que existe em pt-BR e en', (_code, key) => {
    expect(typeof lookup(ptBR, key)).toBe('string');
    expect(typeof lookup(en, key)).toBe('string');
  });

  it('cobre os códigos novos e os antigos (back-end anterior ainda em produção)', () => {
    for (const code of ['NOT_FOUND', 'FORBIDDEN', 'EMPTY_OR_CORRUPTED_DATA', 'EMPTY_DATA', 'INVALID_TOKEN', 'NAME_ALREADY_EXISTS']) {
      expect(API_ERROR_KEYS).toHaveProperty(code);
    }
  });
});

describe('apiErrorMessage', () => {
  it('traduz um código conhecido', () => {
    expect(apiErrorMessage('NAME_ALREADY_EXISTS')).toBe(i18n.global.t('errors.name_exists'));
  });

  it('código desconhecido: usa o fallback e avisa no console', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(apiErrorMessage('SOMETHING_NEW', 'errors.upload')).toBe(i18n.global.t('errors.upload'));
    expect(warn).toHaveBeenCalled();
  });

  it('sem código: mensagem genérica', () => {
    expect(apiErrorMessage(undefined)).toBe(i18n.global.t('errors.unknown'));
  });
});

describe('requestErrorMessage', () => {
  it('mantém as mensagens já traduzidas', () => {
    expect(requestErrorMessage(new NetworkError())).toBe(i18n.global.t('errors.network'));
    expect(requestErrorMessage(new ApiError('FORBIDDEN', 'Sem permissão'))).toBe('Sem permissão');
    expect(requestErrorMessage(new Error('Imagem não encontrada'))).toBe('Imagem não encontrada');
  });

  it('erro de programação vira a mensagem genérica (sem texto técnico)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(requestErrorMessage(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe(i18n.global.t('errors.unknown'));
  });
});

import {
  CHAT_FONTS, FONT_SIZES, THEMES,
  type Appearance, type ChatFont, type ChoiceMedia, type FontSize, type ThemeKey
} from '../types/chatbot';
import { isValidSource } from './media';

/**
 * Cores de um tema. Os pares texto/fundo têm contraste AA (≥ 4,5:1),
 * conferido em `appearance.test.ts`.
 */
export interface ThemeColors {
  background: string;      // Fundo da conversa (tela inicial e mensagens)
  backgroundImage: string; // Padrão desenhado em CSS sobre o fundo ('none' = liso)
  surface: string;         // Cabeçalho, área de resposta e botões de opção
  text: string;            // Texto sobre o fundo e sobre a superfície
  muted: string;           // Texto secundário e "digitando…"
  border: string;
  botBubble: string;
  botText: string;
  botBorder: string;
  userBubble: string;
  userText: string;
  accent: string;          // Botões e texto das opções
  accentHover: string;
  onAccent: string;        // Texto sobre os botões
}

export const THEME_COLORS: Record<ThemeKey, ThemeColors> = {
  classic: {
    background: '#f9fafb', backgroundImage: 'none', surface: '#ffffff', text: '#374151', muted: '#6b7280', border: '#e5e7eb',
    botBubble: '#ffffff', botText: '#374151', botBorder: '#e5e7eb', userBubble: '#2563eb', userText: '#ffffff',
    accent: '#2563eb', accentHover: '#1d4ed8', onAccent: '#ffffff'
  },
  ocean: {
    background: '#e0f2fe', backgroundImage: 'none', surface: '#ffffff', text: '#0c4a6e', muted: '#075985', border: '#bae6fd',
    botBubble: '#ffffff', botText: '#0c4a6e', botBorder: '#bae6fd', userBubble: '#0f766e', userText: '#ffffff',
    accent: '#0f766e', accentHover: '#115e59', onAccent: '#ffffff'
  },
  forest: {
    background: '#ecfdf5', backgroundImage: 'none', surface: '#ffffff', text: '#064e3b', muted: '#047857', border: '#a7f3d0',
    botBubble: '#ffffff', botText: '#064e3b', botBorder: '#a7f3d0', userBubble: '#15803d', userText: '#ffffff',
    accent: '#15803d', accentHover: '#166534', onAccent: '#ffffff'
  },
  sunset: {
    background: '#ffedd5', backgroundImage: 'none', surface: '#ffffff', text: '#7c2d12', muted: '#9a3412', border: '#fed7aa',
    botBubble: '#ffffff', botText: '#7c2d12', botBorder: '#fed7aa', userBubble: '#c2410c', userText: '#ffffff',
    accent: '#c2410c', accentHover: '#9a3412', onAccent: '#ffffff'
  },
  cotton_candy: {
    background: '#fdf2f8', backgroundImage: 'none', surface: '#ffffff', text: '#701a75', muted: '#86198f', border: '#f5d0fe',
    botBubble: '#ffffff', botText: '#701a75', botBorder: '#f5d0fe', userBubble: '#7c3aed', userText: '#ffffff',
    accent: '#be185d', accentHover: '#9d174d', onAccent: '#ffffff'
  },
  notebook: {
    background: '#fffdf5',
    // Linhas pautadas de caderno
    backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #dbeafe 27px, #dbeafe 28px)',
    surface: '#ffffff', text: '#1f2937', muted: '#4b5563', border: '#e5e7eb',
    botBubble: '#fef08a', botText: '#422006', botBorder: '#facc15', userBubble: '#1e3a8a', userText: '#ffffff',
    accent: '#1e40af', accentHover: '#1e3a8a', onAccent: '#ffffff'
  },
  night: {
    background: '#0f172a', backgroundImage: 'none', surface: '#1e293b', text: '#f1f5f9', muted: '#94a3b8', border: '#334155',
    botBubble: '#1e293b', botText: '#e2e8f0', botBorder: '#334155', userBubble: '#38bdf8', userText: '#0f172a',
    accent: '#38bdf8', accentHover: '#7dd3fc', onAccent: '#0f172a'
  },
  space: {
    background: '#0b1020',
    // Estrelas: pontos claros repetidos
    backgroundImage: [
      'radial-gradient(1px 1px at 20px 30px, #ffffff, transparent)',
      'radial-gradient(1px 1px at 90px 140px, #cbd5e1, transparent)',
      'radial-gradient(1.5px 1.5px at 160px 70px, #ffffff, transparent)',
      'radial-gradient(1px 1px at 130px 190px, #e0e7ff, transparent)'
    ].join(', '),
    surface: '#1a1f3a', text: '#e0e7ff', muted: '#a5b4fc', border: '#312e81',
    botBubble: '#1e1b4b', botText: '#e0e7ff', botBorder: '#3730a3', userBubble: '#a78bfa', userText: '#1e1b4b',
    accent: '#a78bfa', accentHover: '#c4b5fd', onAccent: '#1e1b4b'
  },
  high_contrast: {
    background: '#000000', backgroundImage: 'none', surface: '#000000', text: '#ffffff', muted: '#e5e5e5', border: '#ffffff',
    botBubble: '#000000', botText: '#ffffff', botBorder: '#ffffff', userBubble: '#ffd700', userText: '#000000',
    accent: '#ffd700', accentHover: '#ffe766', onAccent: '#000000'
  }
};

/** Pilha de fontes de cada opção (a fonte baixada vem primeiro; o sistema é o reserva). */
const SYSTEM_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_FAMILIES: Record<ChatFont, string> = {
  system: SYSTEM_STACK,
  andika: `'Andika', ${SYSTEM_STACK}`,
  nunito: `'Nunito', ${SYSTEM_STACK}`,
  atkinson: `'Atkinson Hyperlegible', ${SYSTEM_STACK}`,
  comic: `'Comic Neue', ${SYSTEM_STACK}`
};

/** Tamanho do texto das mensagens, opções e campo de resposta (px). */
export const FONT_SIZE_PX: Record<FontSize, number> = { small: 13, medium: 15, large: 18 };

/** Limite do título da tela inicial (cabe numa linha do celular). */
export const WELCOME_TITLE_MAX = 60;

export function createAppearance(): Appearance {
  return { avatar: null, theme: 'classic', font: 'system', fontSize: 'medium', welcomeTitle: '' };
}

function isValidAvatar(avatar: unknown): avatar is ChoiceMedia {
  if (typeof avatar !== 'object' || avatar === null) return false;
  const media = avatar as ChoiceMedia;
  if (media.kind === 'emoji') return typeof media.emoji === 'string' && media.emoji.trim() !== '';
  return media.kind === 'image' && typeof media.source === 'object' && media.source !== null && isValidSource(media.source);
}

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

/** Aparência de um JSON externo: campos ausentes ou inválidos voltam ao padrão. */
export function normalizeAppearance(raw: unknown): Appearance {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof Appearance, unknown>>;
  const defaults = createAppearance();
  return {
    avatar: isValidAvatar(data.avatar) ? data.avatar : null,
    theme: oneOf(THEMES, data.theme, defaults.theme),
    font: oneOf(CHAT_FONTS, data.font, defaults.font),
    fontSize: oneOf(FONT_SIZES, data.fontSize, defaults.fontSize),
    welcomeTitle: typeof data.welcomeTitle === 'string' ? data.welcomeTitle.slice(0, WELCOME_TITLE_MAX) : ''
  };
}

/** Variáveis CSS aplicadas na raiz do chat e do cabeçalho. */
export function appearanceStyle(appearance: Appearance): Record<string, string> {
  const c = THEME_COLORS[appearance.theme];
  return {
    '--chat-bg': c.background,
    '--chat-bg-image': c.backgroundImage,
    '--chat-surface': c.surface,
    '--chat-text': c.text,
    '--chat-muted': c.muted,
    '--chat-border': c.border,
    '--chat-bot-bg': c.botBubble,
    '--chat-bot-text': c.botText,
    '--chat-bot-border': c.botBorder,
    '--chat-user-bg': c.userBubble,
    '--chat-user-text': c.userText,
    '--chat-accent': c.accent,
    '--chat-accent-hover': c.accentHover,
    '--chat-on-accent': c.onAccent,
    '--chat-font-family': FONT_FAMILIES[appearance.font],
    '--chat-font-size': `${FONT_SIZE_PX[appearance.fontSize]}px`
  };
}

import { describe, it, expect } from 'vitest';
import { THEMES } from '../../types/chatbot';
import { THEME_COLORS, appearanceStyle, createAppearance, type ThemeColors } from '../appearance';

/** Contraste WCAG entre duas cores hex (#rrggbb). */
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const channel = (i: number) => {
      const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Pares texto/fundo que aparecem no chat. */
const TEXT_PAIRS: [text: keyof ThemeColors, background: keyof ThemeColors][] = [
  ['text', 'background'], ['muted', 'background'], ['text', 'surface'], ['muted', 'surface'],
  ['botText', 'botBubble'], ['userText', 'userBubble'],
  ['onAccent', 'accent'], ['onAccent', 'accentHover'], ['accent', 'surface']
];

describe('appearance', () => {
  it.each(THEMES)('keeps every text readable in the %s theme (AA)', theme => {
    const colors = THEME_COLORS[theme];
    for (const [text, background] of TEXT_PAIRS) {
      const ratio = contrast(colors[text], colors[background]);
      expect(ratio, `${text} on ${background}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('turns the appearance into chat CSS variables', () => {
    const style = appearanceStyle({ ...createAppearance(), theme: 'forest', font: 'andika', fontSize: 'large' });
    expect(style).toMatchObject({
      '--chat-accent': '#15803d',
      '--chat-font-size': '18px'
    });
    expect(style['--chat-font-family']).toMatch(/^'Andika', /);
  });
});

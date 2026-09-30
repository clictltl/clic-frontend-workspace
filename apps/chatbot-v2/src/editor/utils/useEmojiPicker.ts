import { useI18n } from 'vue-i18n';

/** Tamanho padrão do seletor do emoji-mart (usado para posicionar o popover). */
export const EMOJI_PICKER_SIZE = { width: 352, height: 435 };

/**
 * Cria (sob demanda) o seletor do emoji-mart dentro de um container.
 * O posicionamento/abertura do popover fica com quem usa, que controla o foco.
 */
export function useEmojiPicker(onSelect: (emoji: string) => void) {
  const { locale } = useI18n();
  let picker: HTMLElement | null = null;

  async function mount(container: HTMLElement | null) {
    if (picker || !container) return;
    const [{ Picker }, data] = await Promise.all([import('emoji-mart'), import('@emoji-mart/data')]);
    picker = new Picker({
      data: (data as any).default || data,
      locale: locale.value.split('-')[0], // emoji-mart usa códigos curtos ('pt', 'en')
      theme: 'light',
      onEmojiSelect: (emoji: { native: string }) => onSelect(emoji.native)
    }) as unknown as HTMLElement;
    container.appendChild(picker);
  }

  return { mount };
}

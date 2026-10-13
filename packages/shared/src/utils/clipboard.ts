/**
 * Copia um texto para a área de transferência.
 * navigator.clipboard só existe em contexto seguro (https ou localhost) e em navegadores mais novos;
 * fora disso, tenta o método antigo (execCommand). Devolve false se nada funcionou,
 * para quem chamou avisar e deixar o texto selecionado para cópia manual.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permissão negada ou indisponível: tenta o método antigo
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

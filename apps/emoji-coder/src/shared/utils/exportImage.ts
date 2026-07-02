/**
 * Exporta a grade desenhada como uma imagem PNG (fundo transparente)
 * usando a API nativa do HTML5 Canvas.
 */
export function exportToImage(cols: number, rows: number, paintedCells: Record<string, string>, fileName = 'meu-emoji.png') {
  // Tamanho de cada bloco em pixels (Alta resolução)
  const cellSize = 64; 
  
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Falha ao obter o contexto 2D do Canvas.');
    return;
  }

  // O fundo do canvas já é transparente por padrão.
  // Vamos desenhar apenas as células que possuem cor.
  for (const [coord, color] of Object.entries(paintedCells)) {
    const [xStr, yStr] = coord.split(',');
    
    // Proteção para o TypeScript: garante que as duas partes existem
    if (!xStr || !yStr) continue;

    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);

    if (!isNaN(x) && !isNaN(y)) {
      ctx.fillStyle = color;
      // Adicionamos 0.5px de sobra para evitar linhas brancas sutis de anti-aliasing entre os blocos
      ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
    }
  }

  // Converte para Base64 e dispara o download automático
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
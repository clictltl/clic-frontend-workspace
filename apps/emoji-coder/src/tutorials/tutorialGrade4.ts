export interface TutorialChallenge {
  id: number;
  title: string;
  description: string;
  tip: string;
  grid: { cols: number; rows: number };
  startPos: { x: number; y: number };
  blocks: string[];
  targetCells: Record<string, string>;
  validate: (engineState: any) => boolean;
  successMsg: string;
}

export const challengesGrade4: TutorialChallenge[] = [
  {
    id: 1,
    title: 'Vá para a direita!',
    description: 'A tartaruga precisa chegar até o bloco verde. Use o bloco → Direita para mover!',
    tip: 'Cada → Direita avança 1 célula. Quantas vezes você precisa usar para chegar ao verde?',
    grid: { cols: 4, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right'],
    targetCells: { '3,0': '#22c55e' }, // x=3, y=0
    validate: (state) => state.turtleX === 3 && state.turtleY === 0,
    successMsg: 'Parabéns! Você moveu a tartaruga até o objetivo!'
  },
  {
    id: 2,
    title: 'Pinte uma linha!',
    description: 'Pinte os 4 blocos da linha. Use Pintar e → Direita.',
    tip: 'Comece pintando onde está, depois vá para direita e pinte de novo!',
    grid: { cols: 4, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'paint'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 4; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: 'Muito bem! Você pintou a linha inteira!'
  },
  {
    id: 3,
    title: 'Use o Repita!',
    description: 'Pinte uma linha de 6 blocos, mas desta vez use o bloco Repita para facilitar!',
    tip: 'Coloque Pintar + Direita dentro do Repita. Repita 6 vezes!',
    grid: { cols: 6, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'paint', 'turtle_repeat'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 6; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: 'Perfeito! O bloco Repita deixou seu código muito mais simples!'
  },
  {
    id: 4,
    title: 'Pinte tudo!',
    description: 'Pinte todos os 12 blocos do grid 4×3 de azul. Use todos os movimentos!',
    tip: 'Pinte linha por linha ou coluna por coluna. Use Repita para facilitar!',
    grid: { cols: 4, rows: 3 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'move_left', 'move_up', 'move_down', 'paint', 'turtle_repeat'],
    targetCells: {},
    validate: (state) => {
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 4; x++) if (!state.paintedCells[`${x},${y}`]) return false;
      }
      return true;
    },
    successMsg: 'Excelente! Você pintou todos os blocos do grid!'
  },
  {
    id: 5,
    title: 'Pinte a moldura!',
    description: 'Pinte apenas as bordas do grid 8×8. Não pinte os blocos do meio!',
    tip: 'Pinte a linha de cima toda, depois as laterais, e por fim a linha de baixo. Use Repita!',
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'move_left', 'move_up', 'move_down', 'paint', 'turtle_repeat'],
    targetCells: {},
    validate: (state) => {
      const borders = ['0,0','1,0','2,0','3,0','4,0','5,0','6,0','7,0',
                       '0,7','1,7','2,7','3,7','4,7','5,7','6,7','7,7',
                       '0,1','0,2','0,3','0,4','0,5','0,6',
                       '7,1','7,2','7,3','7,4','7,5','7,6'];
      const painted = Object.keys(state.paintedCells);
      return painted.length === borders.length && 
             borders.every(k => state.paintedCells[k]) && 
             painted.every(k => borders.includes(k));
    },
    successMsg: 'Fantástico! Você pintou a moldura perfeita sem pintar nenhum bloco a mais! 🎉'
  }
];
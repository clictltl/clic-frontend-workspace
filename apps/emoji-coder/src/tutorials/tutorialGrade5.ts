import type { TutorialChallenge } from './index';

export const challengesGrade5: TutorialChallenge[] = [
  {
    id: 1,
    title: 'Chegue ao objetivo!',
    description: 'A tartaruga precisa chegar até o bloco verde no final da linha. Use o bloco Frente para avançar!',
    tip: 'Cada Frente avança 1 passo. Quantos passos até o bloco verde?',
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward'],
    targetCells: { '7,0': '#22c55e' }, // x=7, y=0
    validate: (state) => state.turtleX === 7 && state.turtleY === 0,
    successMsg: 'Você chegou ao objetivo! Aprendeu a mover a tartaruga com precisão.'
  },
  {
    id: 2,
    title: 'Pinte a linha!',
    description: 'Pinte todos os 8 blocos da linha. Use Pintar e Frente.',
    tip: 'Pinte a célula atual, avance, pinte a próxima... repita para todos os 8 blocos!',
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'paint'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 8; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: 'Incrível! Você pintou a linha inteira — mas foi bem trabalhoso, né? Há uma forma melhor...'
  },
  {
    id: 3,
    title: 'Use o Repita!',
    description: 'Pinte a linha novamente — mas desta vez use o bloco Repita.',
    tip: 'Coloque Pintar + Frente dentro do Repita. Quantas vezes você precisa repetir?',
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'paint', 'controls_repeat_ext'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 8; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: 'Perfeito! O bloco Repita deixou o código muito menor e mais elegante!'
  },
  {
    id: 4,
    title: 'Crie uma função!',
    description: 'Defina uma função que pinte uma linha inteira e chame-a duas vezes — uma por linha!',
    tip: 'Crie uma função com Repita 4×(Pintar + Frente). Depois navegue até a próxima linha e chame a função de novo.',
    grid: { cols: 4, rows: 2 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'controls_repeat_ext', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {},
    validate: (state, ast) => {
      // 1. Validação visual (O chão foi pintado?)
      let paintedAll = true;
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 4; x++) if (!state.paintedCells[`${x},${y}`]) paintedAll = false;
      }
      
      // 2. Validação estrutural super simples (Usou o bloco de chamada?)
      const usedProcedureCall = JSON.stringify(ast).includes('"isCall":true');
      
      return paintedAll && usedProcedureCall;
    },
    successMsg: 'Excelente! Funções permitem reutilizar código — defina uma vez, use quantas quiser!'
  },
  {
    id: 5,
    title: 'Desenhe um quadrado!',
    description: 'Pinte o perímetro do quadrado marcado na malha.',
    tip: 'Tente: Repita 4 vezes — Repita 2×(Pintar + Frente), depois Girar direita.',
    grid: { cols: 8, rows: 8 },
    startPos: { x: 2, y: 2 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'controls_repeat_ext', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {
      '2,2': '#e2e8f0', '3,2': '#e2e8f0', '4,2': '#e2e8f0',
      '4,3': '#e2e8f0', '4,4': '#e2e8f0', '3,4': '#e2e8f0',
      '2,4': '#e2e8f0', '2,3': '#e2e8f0'
    },
    validate: (state) => {
      const sq = ['2,2','3,2','4,2','4,3','4,4','3,4','2,4','2,3'];
      return sq.every(k => state.paintedCells[k]);
    },
    successMsg: 'Fantástico! Você desenhou um quadrado usando código. Você é um(a) programador(a)!'
  },
  {
    id: 6,
    title: 'Moldura!',
    description: 'Pinte apenas as bordas da tela - o perímetro completo.',
    tip: 'Use Repita para cada lado. Depois de pintar um lado, gire para o próximo!',
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'controls_repeat_ext', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {},
    validate: (state) => {
      const borders = ['0,0','1,0','2,0','3,0','4,0','5,0','6,0','7,0',
                       '0,7','1,7','2,7','3,7','4,7','5,7','6,7','7,7',
                       '0,1','0,2','0,3','0,4','0,5','0,6',
                       '7,1','7,2','7,3','7,4','7,5','7,6'];
      return borders.every(k => state.paintedCells[k]);
    },
    successMsg: 'Excelente! Você criou uma moldura perfeita ao redor da tela!'
  },
  {
    id: 7,
    title: 'Mude os olhos!',
    description: 'Mude os 2 blocos pretos para outra cor!',
    tip: 'Navegue até cada olho preto e pinte. Use os comandos para chegar lá!',
    grid: { cols: 8, rows: 9 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'move_backward', 'turn_left', 'turn_right', 'paint', 'controls_repeat_ext'],
    // Coordenadas mapeadas de row,col para x,y
    targetCells: {
      '2,1':'#dc2626','3,1':'#dc2626','4,1':'#dc2626','5,1':'#dc2626',
      '2,2':'#dc2626','3,2':'#dc2626','4,2':'#dc2626','6,2':'#dc2626',
      '2,3':'#fef08a','3,3':'#000000','4,3':'#fef08a','5,3':'#000000',
      '2,4':'#fef08a','3,4':'#fef08a','4,4':'#fef08a','5,4':'#fef08a',
      '1,5':'#dc2626','2,5':'#2563eb','3,5':'#dc2626','4,5':'#dc2626','5,5':'#2563eb','6,5':'#dc2626',
      '1,6':'#fef08a','2,6':'#2563eb','3,6':'#2563eb','4,6':'#2563eb','5,6':'#2563eb','6,6':'#fef08a',
      '2,7':'#2563eb','3,7':'#2563eb','4,7':'#2563eb','5,7':'#2563eb',
      '2,8':'#9B4D24','5,8':'#9B4D24'
    },
    validate: (state) => state.paintedCells['3,3'] && state.paintedCells['5,3'],
    successMsg: 'Perfeito! Você mudou os olhos de preto para outra cor!'
  },
  {
    id: 8,
    title: 'Pinte a letra E!',
    description: 'A letra E está em cinza. Pinte toda a letra com a cor que quiser!',
    tip: 'Navegue por cada linha da letra. Cuidado: pinte APENAS a letra!',
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'move_backward', 'turn_left', 'turn_right', 'paint', 'controls_repeat_ext', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {
      '2,1':'#d1d5db','3,1':'#d1d5db','4,1':'#d1d5db','5,1':'#d1d5db',
      '2,2':'#d1d5db',
      '2,3':'#d1d5db','3,3':'#d1d5db','4,3':'#d1d5db','5,3':'#d1d5db',
      '2,4':'#d1d5db',
      '2,5':'#d1d5db','3,5':'#d1d5db','4,5':'#d1d5db','5,5':'#d1d5db'
    },
    validate: (state) => {
      const letraE = ['2,1','3,1','4,1','5,1','2,2','2,3','3,3','4,3','5,3','2,4','2,5','3,5','4,5','5,5'];
      const painted = Object.keys(state.paintedCells);
      return painted.length === letraE.length && painted.every(k => letraE.includes(k));
    },
    successMsg: 'Incrível! Você coloriu a letra E completamente!'
  }
];
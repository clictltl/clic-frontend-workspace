import type { TutorialChallenge } from './index';

// --- CÓDIGOS INICIAIS PRÉ-POPULADOS ---
const initialWorkspaceChallenge4 = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "start",
        id: "q_VNCC*Ynx7HvaHIa0Vg",
        x: 40,
        y: 40,
        deletable: false,
        next: {
          block: {
            type: "procedures_callnoreturn",
            id: "aFAtj~P2(Bk5Fo8zu~9)",
            extraState: { name: "pintar linha" }
          }
        }
      },
      {
        type: "procedures_defnoreturn",
        id: "+V.d7T,I3H?jfB{c3$SM",
        x: 332,
        y: 47,
        fields: { NAME: "pintar linha" },
        inputs: {
          STACK: {
            block: {
              type: "turtle_repeat",
              id: "vzA-===9XEE/#}x+f@gN",
              fields: { TIMES: 4 },
              inputs: {
                DO: {
                  block: {
                    type: "paint",
                    id: "]w{![R,GQvcE/s{}bq-s",
                    fields: { COLOR: "#fde047" },
                    next: {
                      block: {
                        type: "move_forward",
                        id: "u+5[/5|iqU=jc|w(pwSm"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
};

export const getChallengesGrade5 = (t: any): TutorialChallenge[] => [
  {
    id: 1,
    title: t('emojiCoder.tutorials.grade5.c1.title'),
    description: t('emojiCoder.tutorials.grade5.c1.desc'),
    tip: t('emojiCoder.tutorials.grade5.c1.tip'),
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward'],
    targetCells: { '7,0': '#22c55e' }, // x=7, y=0
    validate: (state) => state.turtleX === 7 && state.turtleY === 0,
    successMsg: t('emojiCoder.tutorials.grade5.c1.success')
  },
  {
    id: 2,
    title: t('emojiCoder.tutorials.grade5.c2.title'),
    description: t('emojiCoder.tutorials.grade5.c2.desc'),
    tip: t('emojiCoder.tutorials.grade5.c2.tip'),
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'paint'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 8; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: t('emojiCoder.tutorials.grade5.c2.success')
  },
  {
    id: 3,
    title: t('emojiCoder.tutorials.grade5.c3.title'),
    description: t('emojiCoder.tutorials.grade5.c3.desc'),
    tip: t('emojiCoder.tutorials.grade5.c3.tip'),
    grid: { cols: 8, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'paint', 'turtle_repeat'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 8; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: t('emojiCoder.tutorials.grade5.c3.success')
  },
  {
    id: 4,
    title: t('emojiCoder.tutorials.grade5.c4.title'),
    description: t('emojiCoder.tutorials.grade5.c4.desc'),
    tip: t('emojiCoder.tutorials.grade5.c4.tip'),
    grid: { cols: 4, rows: 2 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'turtle_repeat', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {},
    initialWorkspace: initialWorkspaceChallenge4,
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
    successMsg: t('emojiCoder.tutorials.grade5.c4.success')
  },
  {
    id: 5,
    title: t('emojiCoder.tutorials.grade5.c5.title'),
    description: t('emojiCoder.tutorials.grade5.c5.desc'),
    tip: t('emojiCoder.tutorials.grade5.c5.tip'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 2, y: 2 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'turtle_repeat', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {
      '2,2': '#e2e8f0', '3,2': '#e2e8f0', '4,2': '#e2e8f0',
      '4,3': '#e2e8f0', '4,4': '#e2e8f0', '3,4': '#e2e8f0',
      '2,4': '#e2e8f0', '2,3': '#e2e8f0'
    },
    validate: (state) => {
      const sq = ['2,2','3,2','4,2','4,3','4,4','3,4','2,4','2,3'];
      return sq.every(k => state.paintedCells[k]);
    },
    successMsg: t('emojiCoder.tutorials.grade5.c5.success')
  },
  {
    id: 6,
    title: t('emojiCoder.tutorials.grade5.c6.title'),
    description: t('emojiCoder.tutorials.grade5.c6.desc'),
    tip: t('emojiCoder.tutorials.grade5.c6.tip'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'turn_left', 'turn_right', 'paint', 'turtle_repeat', 'procedures_defnoreturn', 'procedures_callnoreturn'],
    targetCells: {},
    validate: (state) => {
      const borders = ['0,0','1,0','2,0','3,0','4,0','5,0','6,0','7,0',
                       '0,7','1,7','2,7','3,7','4,7','5,7','6,7','7,7',
                       '0,1','0,2','0,3','0,4','0,5','0,6',
                       '7,1','7,2','7,3','7,4','7,5','7,6'];
      return borders.every(k => state.paintedCells[k]);
    },
    successMsg: t('emojiCoder.tutorials.grade5.c6.success')
  },
  {
    id: 7,
    title: t('emojiCoder.tutorials.grade5.c7.title'),
    description: t('emojiCoder.tutorials.grade5.c7.desc'),
    tip: t('emojiCoder.tutorials.grade5.c7.tip'),
    grid: { cols: 8, rows: 9 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'move_backward', 'turn_left', 'turn_right', 'paint', 'turtle_repeat'],
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
    successMsg: t('emojiCoder.tutorials.grade5.c7.success')
  },
  {
    id: 8,
    title: t('emojiCoder.tutorials.grade5.c8.title'),
    description: t('emojiCoder.tutorials.grade5.c8.desc'),
    tip: t('emojiCoder.tutorials.grade5.c8.tip'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_forward', 'move_backward', 'turn_left', 'turn_right', 'paint', 'turtle_repeat', 'procedures_defnoreturn', 'procedures_callnoreturn'],
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
    successMsg: t('emojiCoder.tutorials.grade5.c8.success')
  }
];
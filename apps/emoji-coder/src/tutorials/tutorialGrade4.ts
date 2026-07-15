import type { TutorialChallenge } from './index';

export const getChallengesGrade4 = (t: any): TutorialChallenge[] => [
  {
    id: 1,
    title: t('emojiCoder.tutorials.grade4.c1.title'),
    description: t('emojiCoder.tutorials.grade4.c1.desc'),
    tip: t('emojiCoder.tutorials.grade4.c1.tip'),
    grid: { cols: 4, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right'],
    targetCells: { '3,0': '#22c55e' }, // x=3, y=0
    validate: (state) => state.turtleX === 3 && state.turtleY === 0,
    successMsg: t('emojiCoder.tutorials.grade4.c1.success')
  },
  {
    id: 2,
    title: t('emojiCoder.tutorials.grade4.c2.title'),
    description: t('emojiCoder.tutorials.grade4.c2.desc'),
    tip: t('emojiCoder.tutorials.grade4.c2.tip'),
    grid: { cols: 4, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'paint'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 4; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: t('emojiCoder.tutorials.grade4.c2.success')
  },
  {
    id: 3,
    title: t('emojiCoder.tutorials.grade4.c3.title'),
    description: t('emojiCoder.tutorials.grade4.c3.desc'),
    tip: t('emojiCoder.tutorials.grade4.c3.tip'),
    grid: { cols: 6, rows: 1 },
    startPos: { x: 0, y: 0 },
    blocks: ['move_right', 'paint', 'turtle_repeat'],
    targetCells: {},
    validate: (state) => {
      for (let x = 0; x < 6; x++) if (!state.paintedCells[`${x},0`]) return false;
      return true;
    },
    successMsg: t('emojiCoder.tutorials.grade4.c3.success')
  },
  {
    id: 4,
    title: t('emojiCoder.tutorials.grade4.c4.title'),
    description: t('emojiCoder.tutorials.grade4.c4.desc'),
    tip: t('emojiCoder.tutorials.grade4.c4.tip'),
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
    successMsg: t('emojiCoder.tutorials.grade4.c4.success')
  },
  {
    id: 5,
    title: t('emojiCoder.tutorials.grade4.c5.title'),
    description: t('emojiCoder.tutorials.grade4.c5.desc'),
    tip: t('emojiCoder.tutorials.grade4.c5.tip'),
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
    successMsg: t('emojiCoder.tutorials.grade4.c5.success')
  }
];

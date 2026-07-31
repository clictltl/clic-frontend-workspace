import type { ActivityStep } from './index';

export const getActivitiesSD1Class2 = (t: any): ActivityStep[] => [
  {
    id: 1,
    title: t('emojiCoder.activities.sd1_class2.a1.title'),
    description: t('emojiCoder.activities.sd1_class2.a1.desc'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: {
      'movement': ['move_forward', 'move_backward', 'turn_left', 'turn_right'],
      'actions': ['paint'],
      'loops': ['turtle_repeat']
    },
    targetCells: {}
  },
  {
    id: 2,
    title: t('emojiCoder.activities.sd1_class2.a2.title'),
    description: t('emojiCoder.activities.sd1_class2.a2.desc'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: {
      'movement': ['move_forward', 'move_backward', 'turn_left', 'turn_right'],
      'actions': ['paint'],
      'loops': ['turtle_repeat']
    },
    targetCells: {}
  }
];

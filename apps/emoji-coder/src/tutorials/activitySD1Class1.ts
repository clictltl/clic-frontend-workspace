import type { ActivityStep } from './index';

export const getActivitiesSD1Class1 = (t: any): ActivityStep[] => [
  {
    id: 1,
    title: t('emojiCoder.activities.sd1_class1.a1.title'),
    description: t('emojiCoder.activities.sd1_class1.a1.desc'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: {
      'movement': ['move_right_icon', 'move_left_icon', 'move_up_icon', 'move_down_icon'],
      'actions': ['paint_icon'],
      'loops': ['turtle_repeat_icon']
    },
    targetCells: {}
  },
  {
    id: 2,
    title: t('emojiCoder.activities.sd1_class1.a2.title'),
    description: t('emojiCoder.activities.sd1_class1.a2.desc'),
    grid: { cols: 8, rows: 8 },
    startPos: { x: 0, y: 0 },
    blocks: {
      'movement': ['move_forward', 'move_backward', 'turn_left', 'turn_right'],
      'actions': ['paint_text'],
      'loops': ['turtle_repeat_text']
    },
    targetCells: {}
  }
];

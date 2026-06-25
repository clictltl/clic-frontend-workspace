import { challengesGrade4 } from './tutorialGrade4';
import { challengesGrade5 } from './tutorialGrade5';

export interface TutorialChallenge {
  id: number;
  title: string;
  description: string;
  tip: string;
  grid: { cols: number; rows: number };
  startPos: { x: number; y: number };
  blocks: string[];
  targetCells: Record<string, string>;
  initialWorkspace?: any;
  validate: (engineState: any, ast: any[]) => boolean;
  successMsg: string;
}

export const getTutorialChallenges = (libraryId: string | null) => {
  if (libraryId === 'turtle-tutorial-5') return challengesGrade5;
  return challengesGrade4; // Default para Grade 4
};
import { getChallengesGrade4 } from './tutorialGrade4';
import { getChallengesGrade5 } from './tutorialGrade5';

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

export const getTutorialChallenges = (libraryId: string | null, t: any) => {
  if (libraryId === 'turtle-tutorial-5') return getChallengesGrade5(t);
  return getChallengesGrade4(t); // Default para Grade 4
};

import { getLibrary } from '@/libraries';

export interface SequenceStep {
  id: number;
  title: string;
  description: string;
  tip?: string;
  grid: { cols: number; rows: number };
  startPos: { x: number; y: number };
  blocks: Record<string, string[]>;
  targetCells: Record<string, string>;
  initialWorkspace?: any;
}

export interface TutorialChallenge extends SequenceStep {
  validate: (engineState: any, ast: any[]) => boolean;
  successMsg: string;
}

export interface ActivityStep extends SequenceStep {
  validate?: never;
  successMsg?: never;
}

export type AnySequenceStep = TutorialChallenge | ActivityStep;

export const getTutorialChallenges = (libraryId: string | null, t: any): AnySequenceStep[] => {
  if (!libraryId) return [];
  const library = getLibrary(libraryId);
  
  if (library.getSequenceSteps) {
    return library.getSequenceSteps(t);
  }
  
  return [];
};

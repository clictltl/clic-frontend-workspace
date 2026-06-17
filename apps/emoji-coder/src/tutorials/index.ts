import { challengesGrade4 } from './tutorialGrade4';
import { challengesGrade5 } from './tutorialGrade5';

export const getTutorialChallenges = (libraryId: string | null) => {
  if (libraryId === 'turtle-tutorial-5') return challengesGrade5;
  return challengesGrade4; // Default para Grade 4
};
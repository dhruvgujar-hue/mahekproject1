import type { GamePhase } from '@/types';

export const GAME_PHASES: GamePhase[] = [
  'CharacterSelect',
  'ShoppingSpree',
  'StylingRound',
  'Accessorize',
  'Evaluation',
  'Results',
];

export function isTimedPhase(phase: GamePhase): boolean {
  return phase === 'ShoppingSpree' || phase === 'StylingRound';
}

export function defaultTimeForPhase(phase: GamePhase): number {
  if (phase === 'ShoppingSpree') return 105;
  if (phase === 'StylingRound') return 300;
  return 0;
}


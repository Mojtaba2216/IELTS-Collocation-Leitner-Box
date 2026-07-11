import type { CardBoxStatus } from '../types';

export type CardStatusMap = Record<number, CardBoxStatus>;

export const initializeStatuses = (cards: { id: number }[]): CardStatusMap => {
  return cards.reduce<CardStatusMap>((acc, card) => {
    acc[card.id] = { box: 1, lastReviewed: '' };
    return acc;
  }, {});
};

/**
 * Leitner Box Algorithm:
 * - Card starts in Box 1
 * - If correct: move to next box (1→2→3→4→5)
 * - If wrong: reset to Box 1
 * - If hard: stay in same box
 * - Box 5 = Mastered
 */
export const moveCard = (status: CardBoxStatus, response: 'wrong' | 'hard' | 'correct'): number => {
  if (!status) {
    return 1;
  }

  if (response === 'wrong') {
    // Reset to Box 1
    return 1;
  }

  if (response === 'hard') {
    // Stay in same box
    return status.box;
  }

  if (response === 'correct') {
    // Move to next box, max 5
    return Math.min(5, status.box + 1);
  }

  return status.box;
};

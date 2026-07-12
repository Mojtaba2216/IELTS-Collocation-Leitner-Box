import type { CategoryStudyState, CollocationCard, ReviewCardState } from '../types';

// Review intervals for each box (in days)
// Box 1: 1 day (daily)
// Box 2: 1 day after first correct answer
// Box 3: 3 days
// Box 4: 7 days
// Box 5: 14 days (mastered)
const BOX_INTERVALS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0, // Same day
  2: 1, // 1 day after moving to box 2
  3: 3, // 3 days
  4: 7, // 7 days
  5: 14 // 14 days
};

export const getTodayString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateBefore = (dateStr1: string, dateStr2: string): boolean => {
  return new Date(dateStr1) < new Date(dateStr2);
};

const isDateBeforeOrEqual = (dateStr1: string, dateStr2: string): boolean => {
  return new Date(dateStr1) <= new Date(dateStr2);
};

export const getDefaultCategoryState = (): CategoryStudyState => ({
  cards: {},
  introducedCount: 0,
  lastIntroducedDate: ''
});

/**
 * Generate exactly 10 new cards per category per day
 * Each new card goes to Box 1
 */
export const ensureCategoryStateForToday = (
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string,
  newCardsPerDay = 10
): CategoryStudyState => {
  const nextState: CategoryStudyState = {
    ...state,
    cards: { ...state.cards }
  };

  // Find cards not yet introduced to this category
  const existingIds = new Set(Object.keys(nextState.cards).map(Number));
  const notIntroducedCards = cards.filter((card) => !existingIds.has(card.id));

  // Check how many cards were introduced today
  const introducedTodayCount = Object.values(nextState.cards).filter(
    (card) => card.createdAt === today
  ).length;

  // Calculate remaining slots for today
  const remainingSlots = Math.max(0, newCardsPerDay - introducedTodayCount);

  // Add new cards to Box 1 if there are slots
  if (remainingSlots > 0 && notIntroducedCards.length > 0) {
    const toIntroduce = notIntroducedCards.slice(0, remainingSlots);

    toIntroduce.forEach((card) => {
      nextState.cards[card.id] = {
        id: card.id,
        category: card.category,
        box: 1,
        createdAt: today,
        nextReviewDate: today, // Box 1: review same day
        lastReviewedDate: '',
        reviewCount: 0
      };
    });

    nextState.introducedCount = Object.values(nextState.cards).length;
  }

  nextState.lastIntroducedDate = today;
  return nextState;
};

/**
 * Ensure each category has correct state for today with 10 new cards
 */
export const ensureAllCategoryStates = (
  states: Record<string, CategoryStudyState>,
  cards: CollocationCard[],
  today: string,
  newCardsPerDay = 10
): Record<string, CategoryStudyState> => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();

  return categories.reduce<Record<string, CategoryStudyState>>((acc, category) => {
    const categoryCards = cards.filter((card) => card.category === category);
    const categoryState = states[category] ?? getDefaultCategoryState();
    
    acc[category] = ensureCategoryStateForToday(
      categoryState,
      categoryCards,
      today,
      newCardsPerDay
    );
    return acc;
  }, {});
};

/**
 * Build daily review summary for a category
 * Shows:
 * - 10 new cards for today
 * - Cards ready for review from previous days
 */
export const buildDailyReviewSummary = (
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string
) => {
  const allCards = Object.values(state.cards);

  // New cards introduced today (Box 1, created today)
  const newCardsToday = allCards.filter(
    (card) => card.createdAt === today && card.box === 1
  );

  // Cards ready for review (nextReviewDate <= today, but not introduced today)
  const readyForReview = allCards.filter(
    (card) => card.createdAt !== today && isDateBeforeOrEqual(card.nextReviewDate, today)
  );

  // Cards by box (all cards)
  const box1Cards = allCards.filter((card) => card.box === 1);
  const box2Cards = allCards.filter((card) => card.box === 2);
  const box3Cards = allCards.filter((card) => card.box === 3);
  const box4Cards = allCards.filter((card) => card.box === 4);
  const box5Cards = allCards.filter((card) => card.box === 5);

  // Review queue: First cards ready for review, then new cards
  const queue = [
    ...readyForReview,
    ...newCardsToday
  ];

  return {
    queue,
    summary: {
      total: queue.length,
      newCards: newCardsToday.length,
      readyForReview: readyForReview.length,
      box1: box1Cards.length,
      box2: box2Cards.length,
      box3: box3Cards.length,
      box4: box4Cards.length,
      box5: box5Cards.length
    },
    availableCardIds: cards.map((card) => card.id)
  };
};

/**
 * Apply review response and calculate next review date
 * Leitner Box algorithm:
 * - Wrong: Stay in Box 1, review same day
 * - Hard: Stay in same box, review after half the interval
 * - Correct: Move to next box (or stay at 5)
 */
export const applyReviewResponse = (
  cardState: ReviewCardState,
  response: 'wrong' | 'hard' | 'correct',
  reviewedAt: string,
  today: string
): ReviewCardState => {
  if (response === 'wrong') {
    // Back to Box 1, review again today
    return {
      ...cardState,
      box: 1,
      lastReviewedDate: reviewedAt,
      nextReviewDate: today, // Repeat today
      reviewCount: cardState.reviewCount + 1
    };
  }

  if (response === 'hard') {
    // Stay in same box, review after half the normal interval
    const interval = BOX_INTERVALS[cardState.box];
    const halfInterval = Math.max(1, Math.floor(interval / 2));
    return {
      ...cardState,
      box: cardState.box,
      lastReviewedDate: reviewedAt,
      nextReviewDate: addDays(today, halfInterval),
      reviewCount: cardState.reviewCount + 1
    };
  }

  // Correct response: Advance to next box
  if (cardState.box === 5) {
    // Already at final box
    return {
      ...cardState,
      box: 5,
      lastReviewedDate: reviewedAt,
      nextReviewDate: addDays(today, BOX_INTERVALS[5]),
      reviewCount: cardState.reviewCount + 1
    };
  }

  const nextBox = (cardState.box + 1) as 1 | 2 | 3 | 4 | 5;
  const interval = BOX_INTERVALS[nextBox];

  return {
    ...cardState,
    box: nextBox,
    lastReviewedDate: reviewedAt,
    nextReviewDate: addDays(today, interval),
    reviewCount: cardState.reviewCount + 1
  };
};

/**
 * Simulate advancing to next day for testing
 * This helps verify that cards reappear on the correct days
 */
export const simulateNextDay = (): string => {
  const today = getTodayString();
  const tomorrow = addDays(today, 1);

  // Store the simulated date in localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('__leitner_simulated_date__', tomorrow);
  }

  return tomorrow;
};

/**
 * Get the current date (respects simulated date for testing)
 */
export const getCurrentDate = (): string => {
  if (typeof window !== 'undefined') {
    const simulated = window.localStorage.getItem('__leitner_simulated_date__');
    if (simulated) {
      return simulated;
    }
  }
  return getTodayString();
};

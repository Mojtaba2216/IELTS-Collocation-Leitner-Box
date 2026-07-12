import type { CategoryStudyState, CollocationCard, DailyProgressEntry, ReviewCardState } from '../types';

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

export const getDefaultDailyProgressEntry = (): DailyProgressEntry => ({
  date: '',
  newCardIds: [],
  reviewedCardIds: []
});

export const ensureDailyProgressEntryForToday = (
  progressEntry: DailyProgressEntry,
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string,
  newCardsPerDay = 10
): DailyProgressEntry => {
  const isSameDay = progressEntry.date === today;
  const existingIds = new Set(Object.keys(state.cards).map(Number));
  const remainingCards = cards.filter((card) => !existingIds.has(card.id));
  const currentNewIds = isSameDay ? [...progressEntry.newCardIds] : [];
  const updatedReviewedCardIds = isSameDay
    ? progressEntry.reviewedCardIds.filter((id) => currentNewIds.includes(id))
    : [];

  const availableNewIds = remainingCards
    .map((card) => card.id)
    .filter((id) => !currentNewIds.includes(id));

  while (currentNewIds.length < newCardsPerDay && availableNewIds.length > 0) {
    currentNewIds.push(availableNewIds.shift() as number);
  }

  return {
    date: today,
    newCardIds: currentNewIds,
    reviewedCardIds: updatedReviewedCardIds
  };
};

/**
 * Ensure the category state contains the exact new cards assigned for today.
 */
export const ensureCategoryStateForToday = (
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string,
  dailyProgressEntry: DailyProgressEntry
): CategoryStudyState => {
  const nextState: CategoryStudyState = {
    ...state,
    cards: { ...state.cards }
  };

  dailyProgressEntry.newCardIds.forEach((cardId) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;

    const existingCardState = nextState.cards[cardId];
    if (existingCardState) {
      nextState.cards[cardId] = {
        ...existingCardState,
        box: 1,
        boxNumber: 1,
        isNew: true,
        introducedDay: today,
        createdAt: today,
        nextReviewDate: today
      };
      return;
    }

    nextState.cards[cardId] = {
      id: card.id,
      category: card.category,
      box: 1,
      boxNumber: 1,
      isNew: true,
      introducedDay: today,
      createdAt: today,
      nextReviewDate: today,
      lastReviewedDate: '',
      reviewCount: 0
    };
  });

  nextState.introducedCount = Object.values(nextState.cards).length;
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
  dailyProgress: Record<string, DailyProgressEntry>,
  newCardsPerDay = 10
): Record<string, CategoryStudyState> => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();

  return categories.reduce<Record<string, CategoryStudyState>>((acc, category) => {
    const categoryCards = cards.filter((card) => card.category === category);
    const categoryState = states[category] ?? getDefaultCategoryState();
    const progressEntry = dailyProgress[category] ?? getDefaultDailyProgressEntry();

    acc[category] = ensureCategoryStateForToday(
      categoryState,
      categoryCards,
      today,
      progressEntry
    );
    return acc;
  }, {});
};

export const ensureAllDailyProgressForToday = (
  dailyProgress: Record<string, DailyProgressEntry>,
  states: Record<string, CategoryStudyState>,
  cards: CollocationCard[],
  today: string,
  newCardsPerDay = 10
): Record<string, DailyProgressEntry> => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();

  return categories.reduce<Record<string, DailyProgressEntry>>((acc, category) => {
    const categoryCards = cards.filter((card) => card.category === category);
    const categoryState = states[category] ?? getDefaultCategoryState();
    const categoryProgress = dailyProgress[category] ?? getDefaultDailyProgressEntry();

    acc[category] = ensureDailyProgressEntryForToday(
      categoryProgress,
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
 * - cards ready for review from earlier days
 * - today's new cards
 */
export const buildDailyReviewSummary = (
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string,
  dailyProgressEntry: DailyProgressEntry
) => {
  const allCards = Object.values(state.cards);
  const todayNewSet = new Set(dailyProgressEntry.newCardIds);

  const newCardsToday = dailyProgressEntry.newCardIds
    .map((id) => state.cards[id])
    .filter((card): card is ReviewCardState => Boolean(card));

  const readyForReview = allCards.filter(
    (card) => !todayNewSet.has(card.id) && isDateBeforeOrEqual(card.nextReviewDate, today)
  );

  const box1Cards = allCards.filter((card) => card.box === 1);
  const box2Cards = allCards.filter((card) => card.box === 2);
  const box3Cards = allCards.filter((card) => card.box === 3);
  const box4Cards = allCards.filter((card) => card.box === 4);
  const box5Cards = allCards.filter((card) => card.box === 5);

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
      boxNumber: 1,
      isNew: false,
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
      boxNumber: cardState.box,
      isNew: false,
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
      boxNumber: 5,
      isNew: false,
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
    boxNumber: nextBox,
    isNew: false,
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
export type DailyQuotaSimulationResult = {
  category: string;
  day: string;
  newCards: number;
  uniqueNewCards: boolean;
  expectedNewCards: number;
};

export type DailyQuotaSimulationReport = {
  success: boolean;
  days: string[];
  results: DailyQuotaSimulationResult[];
  errors: string[];
};

export const runDailyQuotaSimulation = (
  cards: CollocationCard[],
  dayCount: number,
  newCardsPerDay = 10
): DailyQuotaSimulationReport => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();
  let state: Record<string, CategoryStudyState> = Object.fromEntries(
    categories.map((category) => [category, getDefaultCategoryState()])
  );
  let dailyProgress: Record<string, DailyProgressEntry> = Object.fromEntries(
    categories.map((category) => [category, getDefaultDailyProgressEntry()])
  );

  const results: DailyQuotaSimulationResult[] = [];
  const errors: string[] = [];
  const introducedSets: Record<string, Set<number>> = Object.fromEntries(
    categories.map((category) => [category, new Set<number>()])
  );

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const day = addDays(getTodayString(), dayIndex);
    dailyProgress = ensureAllDailyProgressForToday(dailyProgress, state, cards, day, newCardsPerDay);
    state = ensureAllCategoryStates(state, cards, day, dailyProgress, newCardsPerDay);

    for (const category of categories) {
      const entry = dailyProgress[category];
      const uniqueNewCards = entry.newCardIds.every((id) => !introducedSets[category].has(id)) &&
        new Set(entry.newCardIds).size === entry.newCardIds.length;

      entry.newCardIds.forEach((id) => introducedSets[category].add(id));

      const result: DailyQuotaSimulationResult = {
        category,
        day,
        newCards: entry.newCardIds.length,
        uniqueNewCards,
        expectedNewCards: newCardsPerDay
      };

      results.push(result);
      if (entry.newCardIds.length !== newCardsPerDay) {
        errors.push(`Category ${category} day ${day} introduced ${entry.newCardIds.length} cards, expected ${newCardsPerDay}`);
      }
      if (!uniqueNewCards) {
        errors.push(`Category ${category} day ${day} introduced duplicate cards across days`);
      }
    }
  }

  return {
    success: errors.length === 0,
    days: Array.from({ length: dayCount }, (_, i) => addDays(getTodayString(), i)),
    results,
    errors
  };
};

export const getCurrentDate = (): string => {
  if (typeof window !== 'undefined') {
    const simulated = window.localStorage.getItem('__leitner_simulated_date__');
    if (simulated) {
      return simulated;
    }
  }
  return getTodayString();
};

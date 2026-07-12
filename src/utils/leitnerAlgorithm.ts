import type { CategoryStudyState, CollocationCard, ReviewCardState } from '../types';

const BOX_INTERVALS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
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

export const getDefaultCategoryState = (): CategoryStudyState => ({
  cards: {},
  introducedCount: 0,
  lastIntroducedDate: ''
});

export const ensureCategoryStateForToday = (
  state: CategoryStudyState,
  cards: Pick<CollocationCard, 'id'>[],
  today: string,
  newCardsPerDay = 10
): CategoryStudyState => {
  const nextState: CategoryStudyState = {
    ...state,
    cards: { ...state.cards }
  };

  const existingIds = new Set(Object.keys(nextState.cards).map(Number));
  const remainingIds = cards.map((card) => card.id).filter((id) => !existingIds.has(id));
  const introducedTodayCount = Object.values(nextState.cards).filter((card) => card.introducedOn === today).length;
  const remainingSlots = Math.max(0, newCardsPerDay - introducedTodayCount);

  if (remainingSlots > 0 && remainingIds.length > 0) {
    const toIntroduce = remainingIds.slice(0, remainingSlots);

    toIntroduce.forEach((id) => {
      nextState.cards[id] = {
        id,
        box: 1,
        lastReviewed: '',
        nextReviewAt: today,
        reviewCount: 0,
        createdAt: today,
        introducedOn: today
      };
    });

    nextState.introducedCount += toIntroduce.length;
  }

  nextState.lastIntroducedDate = today;
  return nextState;
};

export const ensureAllCategoryStates = (
  states: Record<string, CategoryStudyState>,
  cards: CollocationCard[],
  today: string,
  newCardsPerDay = 10
): Record<string, CategoryStudyState> => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();

  return categories.reduce<Record<string, CategoryStudyState>>((acc, category) => {
    const categoryCards = cards.filter((card) => card.category === category);
    acc[category] = ensureCategoryStateForToday(
      states[category] ?? getDefaultCategoryState(),
      categoryCards,
      today,
      newCardsPerDay
    );
    return acc;
  }, {});
};

export const buildDailyReviewSummary = (
  state: CategoryStudyState,
  cards: CollocationCard[],
  today: string
) => {
  const entries = Object.values(state.cards).filter((card) => card.nextReviewAt <= today);
  const newCards = entries.filter((card) => card.reviewCount === 0 && card.introducedOn === today);
  const dueCards = entries.filter((card) => card.reviewCount > 0 || card.introducedOn !== today);

  const box1 = dueCards.filter((card) => card.box === 1).length;
  const box2 = dueCards.filter((card) => card.box === 2).length;
  const box3 = dueCards.filter((card) => card.box === 3).length;
  const box4 = dueCards.filter((card) => card.box === 4).length;
  const box5 = dueCards.filter((card) => card.box === 5).length;

  const queue = [
    ...newCards,
    ...dueCards.filter((card) => card.box === 1),
    ...dueCards.filter((card) => card.box === 2),
    ...dueCards.filter((card) => card.box === 3),
    ...dueCards.filter((card) => card.box === 4),
    ...dueCards.filter((card) => card.box === 5)
  ];

  return {
    queue,
    summary: {
      total: queue.length,
      newCards: newCards.length,
      box1,
      box2,
      box3,
      box4,
      box5
    },
    availableCardIds: cards.map((card) => card.id)
  };
};

export const applyReviewResponse = (
  cardState: ReviewCardState,
  response: 'wrong' | 'hard' | 'correct',
  reviewedAt: string,
  today: string
): ReviewCardState => {
  if (response === 'wrong') {
    return {
      ...cardState,
      box: 1,
      lastReviewed: reviewedAt,
      nextReviewAt: today,
      reviewCount: cardState.reviewCount + 1
    };
  }

  if (response === 'hard') {
    const nextBox = cardState.box;
    return {
      ...cardState,
      box: nextBox,
      lastReviewed: reviewedAt,
      nextReviewAt: addDays(today, Math.max(1, Math.floor(BOX_INTERVALS[nextBox] / 2))),
      reviewCount: cardState.reviewCount + 1
    };
  }

  const nextBox = Math.min(5, cardState.box + 1) as 1 | 2 | 3 | 4 | 5;
  return {
    ...cardState,
    box: nextBox,
    lastReviewed: reviewedAt,
    nextReviewAt: addDays(today, BOX_INTERVALS[nextBox]),
    reviewCount: cardState.reviewCount + 1
  };
};

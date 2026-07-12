export type CollocationCard = {
  id: number;
  english: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  level: 'B1' | 'B2' | 'C1';
  category: string;
};

export type LocaleKey = 'fa';

export type ReviewCardState = {
  id: number;
  category: string;
  box: 1 | 2 | 3 | 4 | 5;
  boxNumber: 1 | 2 | 3 | 4 | 5;
  isNew: boolean;
  introducedDay: string;
  createdAt: string;
  nextReviewDate: string;
  lastReviewedDate: string;
  reviewCount: number;
};

export type CategoryStudyState = {
  cards: Record<number, ReviewCardState>;
  introducedCount: number;
  lastIntroducedDate: string;
};

export type DailyProgressEntry = {
  date: string;
  newCardIds: number[];
  reviewedCardIds: number[];
};

export type ReviewHistoryEntry = {
  cardId: number;
  category: string;
  response: 'wrong' | 'hard' | 'correct';
  timestamp: string;
};

export type SavedProgress = {
  categoryStates: Record<string, CategoryStudyState>;
  dailyProgress: Record<string, DailyProgressEntry>;
  selectedCategory: string;
  reviewHistory: ReviewHistoryEntry[];
  locale: LocaleKey;
  streak: number;
  lastStreakDate: string;
};

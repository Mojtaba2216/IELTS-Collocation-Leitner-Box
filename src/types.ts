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
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewed: string;
  nextReviewAt: string;
  reviewCount: number;
  createdAt: string;
  introducedOn: string;
};

export type CategoryStudyState = {
  cards: Record<number, ReviewCardState>;
  introducedCount: number;
  lastIntroducedDate: string;
};

export type ReviewHistoryEntry = {
  cardId: number;
  category: string;
  response: 'wrong' | 'hard' | 'correct';
  timestamp: string;
};

export type SavedProgress = {
  categoryStates: Record<string, CategoryStudyState>;
  selectedCategory: string;
  reviewHistory: ReviewHistoryEntry[];
  locale: LocaleKey;
  streak: number;
  lastStreakDate: string;
};

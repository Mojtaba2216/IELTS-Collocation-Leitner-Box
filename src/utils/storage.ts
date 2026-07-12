import type { CategoryStudyState, CollocationCard, LocaleKey, ReviewHistoryEntry, SavedProgress } from '../types';
import { getDefaultCategoryState, getTodayString } from './leitnerAlgorithm';

const STORAGE_KEY = 'ielts-collocation-leitner-state-v2';

const isReviewHistoryEntry = (item: unknown): item is ReviewHistoryEntry => {
  if (!item || typeof item !== 'object') return false;
  const entry = item as Partial<ReviewHistoryEntry>;
  return (
    typeof entry.cardId === 'number' &&
    typeof entry.category === 'string' &&
    ['wrong', 'hard', 'correct'].includes((entry.response ?? '') as string) &&
    typeof entry.timestamp === 'string'
  );
};

const isCategoryStudyState = (item: unknown): item is CategoryStudyState => {
  if (!item || typeof item !== 'object') return false;
  const state = item as Partial<CategoryStudyState>;
  
  // Check if all card values have the required fields
  if (typeof state.cards === 'object' && state.cards !== null) {
    const cardEntries = Object.entries(state.cards);
    const allValid = cardEntries.every(([, card]) => {
      return (
        typeof card === 'object' &&
        card !== null &&
        typeof (card as any).id === 'number' &&
        typeof (card as any).category === 'string' &&
        typeof (card as any).box === 'number' &&
        typeof (card as any).createdAt === 'string' &&
        typeof (card as any).nextReviewDate === 'string' &&
        typeof (card as any).lastReviewedDate === 'string' &&
        typeof (card as any).reviewCount === 'number'
      );
    });
    return allValid && typeof state.introducedCount === 'number' && typeof state.lastIntroducedDate === 'string';
  }
  return false;
};

const isSavedProgress = (item: unknown): item is SavedProgress => {
  if (!item || typeof item !== 'object') return false;
  const progress = item as Partial<SavedProgress>;
  return (
    typeof progress.selectedCategory === 'string' &&
    typeof progress.locale === 'string' &&
    typeof progress.streak === 'number' &&
    typeof progress.lastStreakDate === 'string' &&
    Array.isArray(progress.reviewHistory) &&
    typeof progress.categoryStates === 'object' && progress.categoryStates !== null
  );
};

const migrateLegacyProgress = (cards: CollocationCard[], item: unknown): SavedProgress => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();
  const categoryStates = Object.fromEntries(
    categories.map((category) => [category, getDefaultCategoryState()])
  ) as Record<string, CategoryStudyState>;

  if (!item || typeof item !== 'object') {
    return {
      categoryStates,
      selectedCategory: categories[0] ?? 'All',
      reviewHistory: [],
      locale: 'fa',
      streak: 0,
      lastStreakDate: ''
    };
  }

  const legacy = item as { cards?: Array<{ id: number; box?: number; reviewCount?: number; lastReviewed?: string }> };
  if (!Array.isArray(legacy.cards)) {
    return {
      categoryStates,
      selectedCategory: 'All',
      reviewHistory: [],
      locale: 'fa',
      streak: 0,
      lastStreakDate: ''
    };
  }

  const today = getTodayString();
  legacy.cards.forEach((entry) => {
    const card = cards.find((item) => item.id === entry.id);
    if (!card) return;
    const categoryState = categoryStates[card.category] ?? getDefaultCategoryState();
    categoryState.cards[card.id] = {
      id: card.id,
      category: card.category,
      box: (entry.box as 1 | 2 | 3 | 4 | 5) ?? 1,
      createdAt: today,
      nextReviewDate: today,
      lastReviewedDate: entry.lastReviewed ?? '',
      reviewCount: entry.reviewCount ?? 0
    };
    categoryState.introducedCount = Math.max(categoryState.introducedCount, 1);
    categoryState.lastIntroducedDate = today;
    categoryStates[card.category] = categoryState;
  });

  return {
    categoryStates,
    selectedCategory: 'All',
    reviewHistory: [],
    locale: 'fa',
    streak: 0,
    lastStreakDate: ''
  };
};

export const loadProgress = (cards: CollocationCard[]): SavedProgress => {
  const categories = Array.from(new Set(cards.map((card) => card.category))).sort();
  const defaultProgress: SavedProgress = {
    categoryStates: Object.fromEntries(categories.map((category) => [category, getDefaultCategoryState()])),
    selectedCategory: categories[0] ?? 'All',
    reviewHistory: [],
    locale: 'fa',
    streak: 0,
    lastStreakDate: ''
  };

  if (typeof window === 'undefined') {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;

    const parsed = JSON.parse(raw) as unknown;

    if (isSavedProgress(parsed)) {
      const restoredCategoryStates = Object.fromEntries(
        Object.entries(parsed.categoryStates).map(([category, state]) => [category, isCategoryStudyState(state) ? state : getDefaultCategoryState()])
      ) as Record<string, CategoryStudyState>;

      return {
        categoryStates: restoredCategoryStates,
        selectedCategory: parsed.selectedCategory || categories[0] || 'All',
        reviewHistory: parsed.reviewHistory.filter(isReviewHistoryEntry),
        locale: parsed.locale === 'fa' ? 'fa' : 'fa',
        streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
        lastStreakDate: typeof parsed.lastStreakDate === 'string' ? parsed.lastStreakDate : ''
      };
    }

    return migrateLegacyProgress(cards, parsed);
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (data: SavedProgress) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
};

export const clearProgress = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

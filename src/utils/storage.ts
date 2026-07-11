import type { CardStatusMap } from './leitnerAlgorithm';
import type { LocaleKey } from '../types';

const STORAGE_KEY = 'ielts-collocation-leitner-state';

export type ReviewHistoryEntry = {
  cardId: number;
  response: 'wrong' | 'hard' | 'correct';
  timestamp: string;
};

export type CardProgressEntry = {
  id: number;
  box: number;
  mastered: boolean;
  reviewCount: number;
  lastReviewed: string;
};

export type ProgressStats = {
  totalCards: number;
  masteredCards: number;
  learnedPercent: number;
  dueToday: number;
};

export type SavedProgress = {
  cards: CardProgressEntry[];
  selectedCategory: string;
  statistics: ProgressStats;
  reviewHistory: ReviewHistoryEntry[];
  locale: LocaleKey;
  streak: number;
  lastStreakDate: string;
};

export const buildDefaultStatuses = (cards: { id: number }[]): CardStatusMap => {
  return cards.reduce<CardStatusMap>((acc, card) => {
    acc[card.id] = { box: 1, lastReviewed: '' };
    return acc;
  }, {});
};

export const buildProgressFromStatuses = (cards: { id: number }[], statuses: CardStatusMap): CardProgressEntry[] => {
  return cards.map((card) => {
    const status = statuses[card.id] ?? { box: 1, lastReviewed: '' };
    return {
      id: card.id,
      box: status.box,
      mastered: status.box === 5,
      reviewCount: (status as any).reviewCount ?? 0,
      lastReviewed: status.lastReviewed || ''
    };
  });
};

export const calculateProgressStats = (cards: { id: number }[], statuses: CardStatusMap): ProgressStats => {
  const totalCards = cards.length;
  const masteredCards = cards.filter((card) => statuses[card.id]?.box === 5).length;
  const dueToday = cards.filter((card) => statuses[card.id]?.box !== 5).length;
  const learnedPercent = totalCards ? Math.round((masteredCards / totalCards) * 100) : 0;

  return {
    totalCards,
    masteredCards,
    learnedPercent,
    dueToday
  };
};

const isReviewHistoryEntry = (item: unknown): item is ReviewHistoryEntry => {
  if (!item || typeof item !== 'object') return false;
  return (
    typeof (item as ReviewHistoryEntry).cardId === 'number' &&
    ['wrong', 'hard', 'correct'].includes((item as ReviewHistoryEntry).response) &&
    typeof (item as ReviewHistoryEntry).timestamp === 'string'
  );
};

const isSavedProgress = (item: unknown): item is SavedProgress => {
  if (!item || typeof item !== 'object') return false;
  const progress = item as Partial<SavedProgress>;
  return (
    Array.isArray(progress.cards) &&
    typeof progress.selectedCategory === 'string' &&
    typeof progress.locale === 'string' &&
    typeof progress.streak === 'number' &&
    typeof progress.lastStreakDate === 'string' &&
    Array.isArray(progress.reviewHistory) &&
    typeof progress.statistics === 'object'
  );
};

const isLegacyStorage = (item: unknown): item is { statuses: CardStatusMap; selectedCategory?: string; locale?: LocaleKey; streak?: number; lastStreakDate?: string; reviewHistory?: unknown; progressStats?: ProgressStats } => {
  if (!item || typeof item !== 'object') return false;
  const progress = item as any;
  return typeof progress.statuses === 'object';
};

export const loadProgress = (cards: { id: number }[]): SavedProgress => {
  const defaultStatuses = buildDefaultStatuses(cards);
  const defaultStats = calculateProgressStats(cards, defaultStatuses);

  const defaultProgress: SavedProgress = {
    cards: buildProgressFromStatuses(cards, defaultStatuses),
    selectedCategory: 'All',
    statistics: defaultStats,
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
      console.log('Progress restored');
      const restoredCards = cards.map((card) => {
        const savedCard = parsed.cards.find((entry) => entry.id === card.id);
        return {
          id: card.id,
          box: savedCard?.box ?? 1,
          mastered: savedCard?.mastered ?? false,
          reviewCount: typeof savedCard?.reviewCount === 'number' ? savedCard.reviewCount : 0,
          lastReviewed: savedCard?.lastReviewed ?? ''
        };
      });
      return {
        cards: restoredCards,
        selectedCategory: parsed.selectedCategory,
        statistics: parsed.statistics,
        reviewHistory: parsed.reviewHistory.filter(isReviewHistoryEntry),
        locale: parsed.locale === 'en' ? 'en' : 'fa',
        streak: parsed.streak,
        lastStreakDate: parsed.lastStreakDate
      };
    }

    if (isLegacyStorage(parsed)) {
      console.log('Progress restored from legacy state');
      const statuses = cards.reduce<CardStatusMap>((acc, card) => {
        acc[card.id] = parsed.statuses?.[card.id] ?? { box: 1, lastReviewed: '' };
        return acc;
      }, {});
      const restoredCards = buildProgressFromStatuses(cards, statuses);
      return {
        cards: restoredCards,
        selectedCategory: typeof parsed.selectedCategory === 'string' ? parsed.selectedCategory : 'All',
        statistics: parsed.progressStats ?? calculateProgressStats(cards, statuses),
        reviewHistory: Array.isArray(parsed.reviewHistory) ? parsed.reviewHistory.filter(isReviewHistoryEntry) : [],
        locale: parsed.locale === 'en' ? 'en' : 'fa',
        streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
        lastStreakDate: typeof parsed.lastStreakDate === 'string' ? parsed.lastStreakDate : ''
      };
    }

    return defaultProgress;
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (data: SavedProgress) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Progress saved');
  } catch {
    // ignore storage errors
  }
};

export const clearProgress = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export type { CardStatusMap } from './leitnerAlgorithm';

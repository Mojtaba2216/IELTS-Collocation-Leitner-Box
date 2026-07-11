import type { CardStatusMap, StorageState } from './leitnerAlgorithm';
import type { LocaleKey } from '../types';

const STORAGE_KEY = 'ielts-collocation-leitner-state';

type PersistedState = {
  statuses: CardStatusMap;
  selectedCategory: string;
  locale: LocaleKey;
};

export const loadAppState = (cards: { id: number }[]): { statuses: CardStatusMap; selectedCategory: string; locale: LocaleKey } => {
  const defaultStatuses = cards.reduce<CardStatusMap>((acc, card) => {
    acc[card.id] = { box: 1, lastReviewed: '' };
    return acc;
  }, {});

  if (typeof window === 'undefined') {
    return {
      statuses: defaultStatuses,
      selectedCategory: 'All',
      locale: 'fa'
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        statuses: defaultStatuses,
        selectedCategory: 'All',
        locale: 'fa'
      };
    }

    const parsed: PersistedState = JSON.parse(raw);
    const statuses = cards.reduce<CardStatusMap>((acc, card) => {
      acc[card.id] = parsed.statuses?.[card.id] ?? { box: 1, lastReviewed: '' };
      return acc;
    }, {});

    return {
      statuses,
      selectedCategory: parsed.selectedCategory ?? 'All',
      locale: parsed.locale === 'en' ? 'en' : 'fa'
    };
  } catch {
    return {
      statuses: defaultStatuses,
      selectedCategory: 'All',
      locale: 'fa'
    };
  }
};

export const saveAppState = (state: PersistedState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export type { CardStatusMap } from './leitnerAlgorithm';

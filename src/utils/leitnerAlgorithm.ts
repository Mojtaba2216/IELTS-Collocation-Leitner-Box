export type CardStatus = {
  box: number;
  lastReviewed: string;
};

export type CardStatusMap = Record<number, CardStatus>;

export type StorageState = {
  statuses: CardStatusMap;
  selectedCategory: string;
  locale: 'fa' | 'en';
};

export const initializeStatuses = (cards: { id: number }[]): CardStatusMap => {
  return cards.reduce<CardStatusMap>((acc, card) => {
    acc[card.id] = { box: 1, lastReviewed: '' };
    return acc;
  }, {});
};

export const moveCard = (status: CardStatus, response: 'wrong' | 'hard' | 'correct'): number => {
  if (!status) {
    return 1;
  }

  if (response === 'wrong') {
    return 1;
  }

  if (response === 'hard') {
    return status.box;
  }

  return Math.min(5, status.box + 1);
};

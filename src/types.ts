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

export type LocaleKey = 'fa' | 'en';

export type CardBoxStatus = {
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewed: string;
};

export type CategoryProgress = {
  box1: number;
  box2: number;
  box3: number;
  box4: number;
  mastered: number;
};

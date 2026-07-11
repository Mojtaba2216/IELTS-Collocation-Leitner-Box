export type CollocationCard = {
  id: number;
  english: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  level: 'B2' | 'C1';
  category: string;
};

export type LocaleKey = 'fa' | 'en';

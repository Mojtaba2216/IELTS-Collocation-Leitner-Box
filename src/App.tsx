import { useEffect, useMemo, useState } from 'react';
import rawCollocations from './data/collocations.json';
import { moveCard, initializeStatuses } from './utils/leitnerAlgorithm';
import { loadAppState, saveAppState, type CardStatusMap } from './utils/storage';
import Categories from './components/Categories';
import FlashCard from './components/FlashCard';
import Dashboard from './components/Dashboard';
import LeitnerBox from './components/LeitnerBox';
import ProgressChart from './components/ProgressChart';
import type { LocaleKey, CollocationCard } from './types';

const collocations = rawCollocations as CollocationCard[];

const locales = {
  fa: {
    title: 'IELTS Collocation Leitner Box',
    description: 'سیستم لایتنر برای یادگیری کالوکیشن‌های آیلتس',
    allCategories: 'همه دسته‌ها',
    reviewToday: 'مرور امروز',
    learned: 'یادگرفته شده',
    totalCards: 'تعداد کارت‌ها',
    progress: 'درصد پیشرفت',
    categoryProgress: 'پیشرفت دسته',
    showAnswer: 'نمایش پاسخ',
    learnedAll: 'تمام کارت‌های این دسته مرور شده‌اند.',
    selectLanguage: 'زبان',
    darkMode: 'حالت تاریک',
    chooseCategory: 'انتخاب دسته',
    boxes: ['کارت‌های جدید', 'مرور اول', 'مرور دوم', 'تثبیت', 'یادگیری کامل']
  },
  en: {
    title: 'IELTS Collocation Leitner Box',
    description: 'A Leitner learning system for IELTS collocations.',
    allCategories: 'All categories',
    reviewToday: 'Review today',
    learned: 'Learned',
    totalCards: 'Total cards',
    progress: 'Progress',
    categoryProgress: 'Category progress',
    showAnswer: 'Show answer',
    learnedAll: 'All cards in this category have been reviewed.',
    selectLanguage: 'Language',
    darkMode: 'Dark mode',
    chooseCategory: 'Choose category',
    boxes: ['New cards', 'First review', 'Second review', 'Consolidation', 'Mastered']
  }
};

type Card = typeof collocations[number];

const App = () => {
  const [locale, setLocale] = useState<LocaleKey>('fa');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statuses, setStatuses] = useState<CardStatusMap>(() => initializeStatuses(collocations));
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const saved = loadAppState(collocations);
    setStatuses(saved.statuses);
    setSelectedCategory(saved.selectedCategory);
    setLocale(saved.locale);
  }, []);

  useEffect(() => {
    saveAppState({ statuses, selectedCategory, locale });
  }, [statuses, selectedCategory, locale]);

  const categories = useMemo(() => {
    const counts = collocations.reduce<Record<string, number>>((acc, card) => {
      acc[card.category] = (acc[card.category] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).sort().map((category) => ({
      name: category,
      count: counts[category]
    }));
  }, []);

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') return collocations;
    return collocations.filter((card) => card.category === selectedCategory);
  }, [selectedCategory]);

  const dueCards = useMemo(
    () => filteredCards.filter((card) => statuses[card.id]?.box !== 5),
    [filteredCards, statuses]
  );

  useEffect(() => {
    if (reviewIndex >= dueCards.length) {
      setReviewIndex(0);
    }
  }, [dueCards.length, reviewIndex]);

  const currentCard = dueCards.length > 0 ? dueCards[reviewIndex % dueCards.length] : filteredCards[0]!;

  const boxCounts = useMemo(
    () => [1, 2, 3, 4, 5].map((box) => filteredCards.filter((card) => statuses[card.id]?.box === box).length),
    [filteredCards, statuses]
  );

  const learnedCount = filteredCards.filter((card) => statuses[card.id]?.box === 5).length;
  const totalCount = filteredCards.length;
  const progressPercent = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;
  const overallLearned = collocations.filter((card) => statuses[card.id]?.box === 5).length;
  const totalAll = collocations.length;
  const overallPercent = totalAll ? Math.round((overallLearned / totalAll) * 100) : 0;

  const t = locales[locale];

  const handleAnswer = (response: 'wrong' | 'hard' | 'correct') => {
    if (!currentCard) return;
    const nextBox = moveCard(statuses[currentCard.id], response);
    setStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        box: nextBox,
        lastReviewed: new Date().toISOString()
      }
    }));
    setShowAnswer(false);
    setReviewIndex((prevIndex) => (dueCards.length > 1 ? (prevIndex + 1) % dueCards.length : 0));
  };

  const categoryProgress = useMemo(
    () => ({
      value: progressPercent,
      label: `${progressPercent}%`
    }),
    [progressPercent]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <div className="locale-switcher">
          <label>
            {t.selectLanguage}:
            <select value={locale} onChange={(event) => setLocale(event.target.value as LocaleKey)}>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </header>

      <main className="app-grid">
        <section className="sidebar">
          <Categories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            allLabel={t.allCategories}
          />
          <LeitnerBox boxCounts={boxCounts} labels={t.boxes} />
        </section>

        <section className="main-panel">
          <Dashboard
            totalCards={totalAll}
            learned={overallLearned}
            reviewToday={dueCards.length}
            progress={overallPercent}
            categoryProgress={categoryProgress}
            currentCategory={selectedCategory}
          />

          <ProgressChart categories={categories} statuses={statuses} cards={collocations} locale={locale} />

          <div className="card-section">
            <div className="card-summary">
              <strong>{selectedCategory === 'All' ? t.allCategories : selectedCategory}</strong>
              <span>{`${learnedCount} / ${totalCount}`}</span>
            </div>

            <FlashCard
              card={currentCard}
              showAnswer={showAnswer}
              onToggleAnswer={() => setShowAnswer((current) => !current)}
              onAnswer={handleAnswer}
              isReview={dueCards.length > 0}
              labels={t}
            />

            {dueCards.length === 0 && (
              <div className="empty-state">{t.learnedAll}</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

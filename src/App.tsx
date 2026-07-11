import { useEffect, useMemo, useState } from 'react';
import rawCollocations from './data/collocations.json';
import { moveCard, initializeStatuses, type CardStatusMap } from './utils/leitnerAlgorithm';
import { loadProgress, saveProgress, type CardProgressEntry, type ProgressStats, type ReviewHistoryEntry, type SavedProgress } from './utils/storage';
import FlashCard from './components/FlashCard';
import Dashboard from './components/Dashboard';
import LeitnerBox from './components/LeitnerBox';
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

const categoryIcons: Record<string, string> = {
  Environment: '🌱',
  Education: '🎓',
  Technology: '💻',
  Health: '🏥',
  Economy: '💰'
};

const App = () => {
  const [initialProgress] = useState(() => loadProgress(collocations));
  const [locale, setLocale] = useState<LocaleKey>(initialProgress.locale);
  const [tab, setTab] = useState<'home' | 'study' | 'categories'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialProgress.selectedCategory);
  const [statuses, setStatuses] = useState<CardStatusMap>(() => {
    const initialStatuses = initializeStatuses(collocations);
    initialProgress.cards.forEach((card) => {
      initialStatuses[card.id] = {
        box: card.box,
        lastReviewed: card.lastReviewed
      };
    });
    return initialStatuses;
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [streak, setStreak] = useState(initialProgress.streak);
  const [lastStreakDate, setLastStreakDate] = useState(initialProgress.lastStreakDate);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryEntry[]>(initialProgress.reviewHistory);

  useEffect(() => {
    saveProgress({
      cards: collocations.map((card) => ({
        id: card.id,
        box: statuses[card.id]?.box ?? 1,
        mastered: (statuses[card.id]?.box ?? 1) === 5,
        reviewCount: 0,
        lastReviewed: statuses[card.id]?.lastReviewed ?? ''
      })),
      selectedCategory,
      statistics: {
        totalCards: collocations.length,
        masteredCards: collocations.filter((card) => statuses[card.id]?.box === 5).length,
        learnedPercent: collocations.length ? Math.round((collocations.filter((card) => statuses[card.id]?.box === 5).length / collocations.length) * 100) : 0,
        dueToday: collocations.filter((card) => statuses[card.id]?.box !== 5).length
      },
      reviewHistory,
      locale,
      streak,
      lastStreakDate
    });
  }, [statuses, selectedCategory, locale, streak, lastStreakDate, reviewHistory]);

  const categories = useMemo(() => {
    const counts = collocations.reduce<Record<string, number>>((acc, card) => {
      acc[card.category] = (acc[card.category] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).sort().map((category) => ({
      name: category,
      count: counts[category],
      icon: categoryIcons[category] || '⭐'
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

  const currentCard = dueCards.length > 0 ? dueCards[reviewIndex % dueCards.length] : null;

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
  const today = new Date().toISOString().slice(0, 10);

  const t = locales[locale];

  const handleAnswer = (response: 'wrong' | 'hard' | 'correct') => {
    if (!currentCard) return;

    const nextBox = moveCard(statuses[currentCard.id], response);
    const reviewedAt = new Date().toISOString();

    setStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        box: nextBox,
        lastReviewed: reviewedAt
      }
    }));

    setReviewHistory((prev) => [
      { cardId: currentCard.id, response, timestamp: reviewedAt },
      ...prev
    ]);

    if (lastStreakDate !== today) {
      setStreak((value) => value + 1);
      setLastStreakDate(today);
    }

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

  const categoryCards = categories.map((category) => {
    const categoryCards = collocations.filter((card) => card.category === category.name);
    const learned = categoryCards.filter((card) => statuses[card.id]?.box === 5).length;
    const percent = categoryCards.length ? Math.round((learned / categoryCards.length) * 100) : 0;
    return {
      ...category,
      percent,
      learned,
      total: categoryCards.length
    };
  });

  return (
    <div className="app-wrapper">
      <main className="page-content">
        <div className="app-shell">
          <div className="app-frame">
            <div className="scrollable-content">
              <header className="app-header">
                <div>
                  <p className="eyebrow">Smart IELTS Practice</p>
                  <h1>{t.title}</h1>
                  <p className="subtitle">{t.description}</p>
                </div>
                <div className="locale-switcher">
                  <select value={locale} onChange={(event) => setLocale(event.target.value as LocaleKey)}>
                    <option value="fa">فارسی</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </header>

              <main className="main-content app-content">
                <section className="hero-card glass-card">
                  <div className="hero-top">
                    <div>
                      <span className="hero-badge">Today&apos;s review</span>
                      <h2>{dueCards.length} items pending</h2>
                    </div>
                    <div className="hero-ring">
                      <span>{overallPercent}%</span>
                    </div>
                  </div>

                  <div className="hero-metrics">
                    <div className="metric-card">
                      <span>Streak</span>
                      <strong>{streak} days</strong>
                    </div>
                    <div className="metric-card">
                      <span>Mastered</span>
                      <strong>{overallLearned}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Progress</span>
                      <strong>{overallPercent}%</strong>
                    </div>
                  </div>
                </section>

                <section className="section-header">
                  <div>
                    <h2>Learn faster</h2>
                    <p>Swipe through cards and boost your IELTS collocations.</p>
                  </div>
                  <button className="primary-pill" onClick={() => setTab('study')}>Continue study</button>
                </section>

                {tab === 'home' && (
                  <section className="dashboard-grid">
                    <Dashboard
                      totalCards={totalAll}
                      learned={overallLearned}
                      reviewToday={dueCards.length}
                      progress={overallPercent}
                      categoryProgress={categoryProgress}
                      currentCategory={selectedCategory}
                      streak={streak}
                    />

                    <div className="glass-card notes-card">
                      <div className="section-label">Leitner boxes</div>
                      <LeitnerBox boxCounts={boxCounts} labels={t.boxes} />
                    </div>
                  </section>
                )}

                {tab === 'study' && (
                  <section className="study-section">
                    <div className="section-header">
                      <div>
                        <h2>Flashcard review</h2>
                        <p>{selectedCategory === 'All' ? 'Studying all categories' : `Studying ${selectedCategory}`}</p>
                      </div>
                      <button className="secondary-pill" onClick={() => setTab('categories')}>Choose category</button>
                    </div>

                    <div className="card-section">
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
                )}

                {tab === 'categories' && (
                  <section className="categories-grid">
                    <div className="section-header">
                      <div>
                        <h2>Categories</h2>
                        <p>Select a topic and focus on specific collocations.</p>
                      </div>
                      <button className="secondary-pill" onClick={() => setTab('home')}>Back home</button>
                    </div>

                    <div className="category-card-grid">
                      <div
                        className={`category-card ${selectedCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('All')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="category-card-top">
                          <span className="category-icon">✨</span>
                          <div>
                            <strong>All topics</strong>
                            <p>{totalAll} phrases</p>
                          </div>
                        </div>
                        <div className="category-progress-bar">
                          <div className="category-progress-fill" style={{ width: `${overallPercent}%` }} />
                        </div>
                        <button className="card-action" onClick={() => { setSelectedCategory('All'); setTab('study'); }}>
                          Start learning
                        </button>
                      </div>

                      {categoryCards.map((category) => (
                        <div
                          key={category.name}
                          className={`category-card ${selectedCategory === category.name ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(category.name)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="category-card-top">
                            <span className="category-icon">{category.icon}</span>
                            <div>
                              <strong>{category.name}</strong>
                              <p>{category.total} phrases · {category.percent}% learned</p>
                            </div>
                          </div>
                          <div className="category-progress-bar">
                            <div className="category-progress-fill" style={{ width: `${category.percent}%` }} />
                          </div>
                          <button className="card-action" onClick={() => { setSelectedCategory(category.name); setTab('study'); }}>
                            Start learning
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </main>
            </div>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <span>🏠</span>
          <small>Home</small>
        </button>
        <button className={`nav-item ${tab === 'study' ? 'active' : ''}`} onClick={() => setTab('study')}>
          <span>📚</span>
          <small>Study</small>
        </button>
        <button className={`nav-item ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
          <span>🗂️</span>
          <small>Topics</small>
        </button>
      </nav>
    </div>
  );
};

export default App;

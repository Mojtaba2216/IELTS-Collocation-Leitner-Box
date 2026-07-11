import { useEffect, useMemo, useState } from 'react';
import rawCollocations from './data/collocations.cleaned.json';
import { moveCard, initializeStatuses, type CardStatusMap } from './utils/leitnerAlgorithm';
import { loadProgress, saveProgress, type ReviewHistoryEntry } from './utils/storage';
import FlashCard from './components/FlashCard';
import Dashboard from './components/Dashboard';
import LeitnerBox from './components/LeitnerBox';
import type { LocaleKey, CollocationCard } from './types';

const collocations = rawCollocations as CollocationCard[];

const locales = {
  fa: {
    appTitle: 'جعبه لایتنر کالوکیشن‌های IELTS',
    appDescription: 'سیستم حرفه‌ای برای یادگیری کالوکیشن‌های IELTS با روش علمی لایتنر',
    homeTitle: 'آغاز کنید',
    learnTitle: 'یادگیری سریع‌تر',
    learnDesc: 'کارت‌ها را مرور کنید و کالوکیشن‌های IELTS خود را قوی‌تر کنید.',
    continueStudy: 'ادامه مطالعه',
    chooseCategory: 'انتخاب دسته',
    categories: 'دسته‌ها',
    categoriesDesc: 'یک موضوع را انتخاب کنید و بر روی کالوکیشن‌های خاص تمرکز کنید.',
    backHome: 'بازگشت به خانه',
    studyingAll: 'مطالعه از تمام دسته‌ها',
    flashcardReview: 'مرور کارت فلش',
    completedAll: 'تمام کارت‌های این دسته تسلط کامل یافتند! 🎉',
    todayReview: 'مرور امروز',
    itemsPending: 'مورد منتظر',
    dailyStreak: 'تعداد روز متوالی',
    totalCards: 'مجموع کارت‌ها',
    mastered: 'تسلط یافته',
    progress: 'درصد',
    learnedAll: 'تمام کارت‌های این دسته تسلط یافتند.',
    startLearning: 'شروع یادگیری',
    allTopics: 'تمام موضوعات',
    phrases: 'عبارت',
    learned: 'یادگرفته',
    home: 'خانه',
    study: 'مطالعه',
    topics: 'دسته‌ها',
    showAnswer: 'دیدن پاسخ',
    didntKnow: 'بلد نبودم',
    difficult: 'سخت بود',
    mastered_button: 'یاد گرفتم',
    meaningFarsi: 'معنی فارسی',
    pronunciation: 'تلفظ',
    example: 'مثال (IELTS Writing)',
  },
  en: {
    appTitle: 'IELTS Collocation Leitner Box',
    appDescription: 'Professional system for learning IELTS collocations with Leitner method',
    homeTitle: 'Dashboard',
    learnTitle: 'Learn faster',
    learnDesc: 'Swipe through cards and boost your IELTS collocations.',
    continueStudy: 'Continue study',
    chooseCategory: 'Choose category',
    categories: 'Categories',
    categoriesDesc: 'Select a topic and focus on specific collocations.',
    backHome: 'Back home',
    studyingAll: 'Studying all categories',
    flashcardReview: 'Flashcard review',
    completedAll: 'All cards in this category are mastered! 🎉',
    todayReview: 'Today\'s review',
    itemsPending: 'items pending',
    dailyStreak: 'Daily streak',
    totalCards: 'Total cards',
    mastered: 'Mastered',
    progress: 'Progress',
    learnedAll: 'All cards learned.',
    startLearning: 'Start learning',
    allTopics: 'All topics',
    phrases: 'phrases',
    learned: 'learned',
    home: 'Home',
    study: 'Study',
    topics: 'Topics',
    showAnswer: 'Show answer',
    didntKnow: 'Didn\'t know',
    difficult: 'Difficult',
    mastered_button: 'Mastered',
    meaningFarsi: 'Meaning',
    pronunciation: 'Pronunciation',
    example: 'Example',
  }
};

type Card = typeof collocations[number];

const categoryIcons: Record<string, string> = {
  'محیط‌زیست': '🌍',
  'آموزش': '🎓',
  'فناوری': '💻',
  'سلامت': '🏥',
  'اقتصاد': '💰',
  'جرم و قانون': '⚖️',
  'شهرسازی': '🏙️',
  'فرهنگ': '🎭',
  'حقوق اجتماعی': '👥',
};

const App = () => {
  const [initialProgress] = useState(() => loadProgress(collocations));
  const [locale] = useState<LocaleKey>('fa');
  const [tab, setTab] = useState<'home' | 'study' | 'categories'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialProgress.selectedCategory);
  const [statuses, setStatuses] = useState<CardStatusMap>(() => {
    const initialStatuses = initializeStatuses(collocations);
    initialProgress.cards.forEach((card) => {
      initialStatuses[card.id] = {
        box: card.box as 1 | 2 | 3 | 4 | 5,
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

  const t = locales.fa;

  const handleAnswer = (response: 'wrong' | 'hard' | 'correct') => {
    if (!currentCard) return;

    const nextBox = moveCard(statuses[currentCard.id], response);
    const reviewedAt = new Date().toISOString();

    setStatuses((prev) => ({
      ...prev,
      [currentCard.id]: {
        box: Math.min(5, Math.max(1, nextBox)) as 1 | 2 | 3 | 4 | 5,
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
                <h1>{t.appTitle}</h1>
                <p>{t.appDescription}</p>
              </header>

              <main className="app-content">
                {tab === 'home' && (
                  <>
                    <section className="glass-card hero-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div>
                          <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block', marginBottom: '12px' }}>
                            {t.todayReview}
                          </div>
                          <h2 style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px' }}>
                            {dueCards.length} {t.itemsPending}
                          </h2>
                        </div>
                        <div className="circle-ring">
                          {overallPercent}%
                        </div>
                      </div>

                      <div className="hero-metrics">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ color: '#cbd5e1' }}>{t.dailyStreak}</span>
                          <strong style={{ fontSize: '18px' }}>{streak} 🔥</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ color: '#cbd5e1' }}>{t.mastered}</span>
                          <strong style={{ fontSize: '18px', color: '#3b82f6' }}>{overallLearned}/{totalAll}</strong>
                        </div>
                      </div>
                    </section>

                    <section style={{ padding: '0 4px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{t.learnTitle}</h2>
                        <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{t.learnDesc}</p>
                      </div>
                      <button 
                        className="primary-pill"
                        onClick={() => setTab('study')}
                        style={{ padding: '14px 20px', fontSize: '16px' }}
                      >
                        → {t.continueStudy}
                      </button>
                    </section>

                    <section className="glass-card">
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>📊 جعبه‌های لایتنر</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '13px' }}>دسته‌بندی کارت‌های فعلی</p>
                      </div>
                      <LeitnerBox boxCounts={boxCounts} labels={[]} />
                    </section>

                    <Dashboard
                      totalCards={totalAll}
                      learned={overallLearned}
                      reviewToday={dueCards.length}
                      progress={overallPercent}
                      categoryProgress={categoryProgress}
                      currentCategory={selectedCategory}
                      streak={streak}
                    />
                  </>
                )}

                {tab === 'study' && (
                  <>
                    <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{t.flashcardReview}</h2>
                        <p style={{ color: '#cbd5e1', fontSize: '14px' }}>
                          {selectedCategory === 'All' ? t.studyingAll : selectedCategory}
                        </p>
                      </div>
                      <button className="secondary-pill" onClick={() => setTab('categories')} style={{ whiteSpace: 'nowrap' }}>
                        {t.chooseCategory}
                      </button>
                    </section>

                    {dueCards.length > 0 ? (
                      <FlashCard
                        card={currentCard}
                        showAnswer={showAnswer}
                        onToggleAnswer={() => setShowAnswer((current) => !current)}
                        onAnswer={handleAnswer}
                        isReview={true}
                        labels={t as any}
                      />
                    ) : (
                      <div className="glass-card empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <p>{t.completedAll}</p>
                      </div>
                    )}
                  </>
                )}

                {tab === 'categories' && (
                  <>
                    <section style={{ marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>{t.categories}</h2>
                      <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{t.categoriesDesc}</p>
                    </section>

                    <div className="categories-grid">
                      <div 
                        className="category-card"
                        onClick={() => { setSelectedCategory('All'); setTab('study'); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="category-icon">✨</div>
                        <div className="category-name">{t.allTopics}</div>
                        <div className="category-count">{totalAll} {t.phrases} · {overallPercent}% {t.learned}</div>
                        <div className="category-progress" style={{ marginTop: '12px' }}>
                          <div className="category-progress-bar" style={{ width: `${overallPercent}%` }}></div>
                        </div>
                      </div>

                      {categoryCards.map((category) => (
                        <div 
                          key={category.name}
                          className="category-card"
                          onClick={() => { setSelectedCategory(category.name); setTab('study'); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="category-icon">{category.icon}</div>
                          <div className="category-name">{category.name}</div>
                          <div className="category-count">{category.total} {t.phrases} · {category.percent}% {t.learned}</div>
                          <div className="category-progress" style={{ marginTop: '12px' }}>
                            <div className="category-progress-bar" style={{ width: `${category.percent}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </main>
            </div>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${tab === 'home' ? 'active' : ''}`} 
          onClick={() => setTab('home')}
          style={{ color: tab === 'home' ? '#3b82f6' : '#cbd5e1' }}
        >
          <span className="nav-icon">🏠</span>
          <span>{t.home}</span>
        </button>
        <button 
          className={`nav-item ${tab === 'study' ? 'active' : ''}`} 
          onClick={() => setTab('study')}
          style={{ color: tab === 'study' ? '#3b82f6' : '#cbd5e1' }}
        >
          <span className="nav-icon">📚</span>
          <span>{t.study}</span>
        </button>
        <button 
          className={`nav-item ${tab === 'categories' ? 'active' : ''}`} 
          onClick={() => setTab('categories')}
          style={{ color: tab === 'categories' ? '#3b82f6' : '#cbd5e1' }}
        >
          <span className="nav-icon">🗂️</span>
          <span>{t.topics}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

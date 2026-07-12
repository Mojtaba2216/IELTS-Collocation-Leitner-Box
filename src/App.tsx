import { useEffect, useMemo, useState } from 'react';
import rawCollocations from './data/collocations.cleaned.json';
import {
  applyReviewResponse,
  buildDailyReviewSummary,
  ensureAllCategoryStates,
  ensureAllDailyProgressForToday,
  getCurrentDate,
  getDefaultCategoryState,
  runDailyQuotaSimulation,
  type DailyQuotaSimulationReport
} from './utils/leitnerAlgorithm';
import { loadProgress, saveProgress } from './utils/storage';
import FlashCard from './components/FlashCard';
import LeitnerBox from './components/LeitnerBox';
import type { CollocationCard, SavedProgress } from './types';

type Tab = 'home' | 'study' | 'categories';
type Card = typeof collocations[number];

const collocations = rawCollocations as CollocationCard[];

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

const boxMeta = [
  { key: 1, title: '📦 جعبه ۱', subtitle: 'یادگیری اولیه', icon: '📦' },
  { key: 2, title: '📦 جعبه ۲', subtitle: 'مرور کوتاه مدت', icon: '⏱️' },
  { key: 3, title: '📦 جعبه ۳', subtitle: 'تثبیت یادگیری', icon: '🧠' },
  { key: 4, title: '📦 جعبه ۴', subtitle: 'یادگیری عمیق', icon: '🔍' },
  { key: 5, title: '📦 جعبه ۵', subtitle: 'تسلط کامل', icon: '🏁' }
];

const categoryNames = Array.from(new Set(collocations.map((card) => card.category))).sort();
const initialStoredProgress = loadProgress(collocations);
const initialCategory = initialStoredProgress.selectedCategory && categoryNames.includes(initialStoredProgress.selectedCategory)
  ? initialStoredProgress.selectedCategory
  : categoryNames[0] ?? 'All';

const locales = {
  fa: {
    appTitle: 'جعبه لایتنر کالوکیشن‌های IELTS',
    appDescription: 'سیستم مرور روزانه و جعبه لایتنر برای کالوکیشن‌های آیلتس',
    todayReview: 'مرور امروز',
    todayIntro: 'یک جلسه هدفمند برای تثبیت کالوکیشن‌ها',
    goToStudy: 'شروع مرور',
    selectCategory: 'انتخاب دسته',
    studyToday: 'مرور امروز',
    studySummary: 'کارت‌های امروز',
    reviewCount: 'خلاصه امروز',
    home: 'خانه',
    study: 'مطالعه',
    topics: 'دسته‌ها',
    chooseCategory: 'انتخاب دسته',
    categories: 'جعبه لایتنر هر دسته',
    categoryDesc: 'هر دسته وضعیت مستقل خود را دارد.',
    todayCards: 'کارت امروز',
    newCards: 'کارت‌های جدید',
    readyToReview: 'آماده مرور',
    totalToday: 'مجموع امروز',
    currentBox: 'جعبه فعلی',
    boxLabel: 'جعبه',
    cardOf: 'کارت',
    from: 'از',
    reviewFinished: 'کارت‌های امروز تمام شده‌اند. برای مرور بعدی آماده باشید.',
    finishStudy: 'پایان مطالعه',
    remainingToday: 'کارت باقی‌مانده امروز',
    sessionSaved: 'پیشرفت این جلسه ذخیره شد.',
    viewCards: 'مشاهده کارت‌ها',
    backHome: 'بازگشت به خانه',
    continueReview: 'ادامه مرور',
    todayCardsSummary: 'کارت‌های امروز',
    reviewedCount: 'بررسی شده',
    remainingCount: 'باقی‌مانده',
    startTodayReview: 'شروع مرور امروز',
    reviewAgainToday: 'مرور مجدد کارت‌های امروز',
    viewBoxes: 'مشاهده جعبه‌های لایتنر',
    reviewAgainHint: 'فقط تمرین و تثبیت بدون تغییر جعبه',
    noReviewAgainCards: 'هنوز کارتی برای مرور مجدد امروز ثبت نشده است.'
  }
};

type CustomSelectProps = {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
};

const CustomSelect = ({ value, options, onChange, className = '' }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-select')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <div className={`custom-select ${className}`.trim()}>
      <button
        type="button"
        className="custom-select-trigger"
        onMouseDown={(event) => event.preventDefault()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="custom-select-arrow">{open ? '▴' : '▾'}</span>
      </button>

      {open ? (
        <div className="custom-select-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`custom-select-option ${option.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const App = () => {
  const [progress, setProgress] = useState<SavedProgress>(() => {
    const today = getCurrentDate();
    const dailyProgress = ensureAllDailyProgressForToday(
      initialStoredProgress.dailyProgress,
      initialStoredProgress.categoryStates,
      collocations,
      today,
      10
    );
    const categoryStates = ensureAllCategoryStates(
      initialStoredProgress.categoryStates,
      collocations,
      today,
      dailyProgress,
      10
    );

    return {
      ...initialStoredProgress,
      dailyProgress,
      categoryStates
    };
  });
  const [tab, setTab] = useState<Tab>('home');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);
  const [sessionTotalToday, setSessionTotalToday] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'standard' | 'again'>('standard');
  const [testReport, setTestReport] = useState<DailyQuotaSimulationReport | null>(null);

  const t = locales.fa;
  const today = getCurrentDate();

  const categories = useMemo(() => {
    return categoryNames.map((category) => ({
      name: category,
      icon: categoryIcons[category] || '⭐'
    }));
  }, []);

  const testModeEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('test');
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    setProgress((prev) => {
      const dailyProgress = ensureAllDailyProgressForToday(
        prev.dailyProgress,
        prev.categoryStates,
        collocations,
        today,
        10
      );

      const categoryStates = ensureAllCategoryStates(
        prev.categoryStates,
        collocations,
        today,
        dailyProgress,
        10
      );

      return {
        ...prev,
        dailyProgress,
        categoryStates
      };
    });
  }, [today]);

  useEffect(() => {
    setShowAnswer(false);
    setReviewIndex(0);
    setStudyMode('standard');
  }, [selectedCategory]);

  const currentCategoryState = progress.categoryStates[selectedCategory] ?? getDefaultCategoryState();
  const selectedCategoryCards = useMemo(() => {
    return collocations.filter((card) => card.category === selectedCategory);
  }, [selectedCategory]);

  const selectedCategoryProgress = progress.dailyProgress[selectedCategory] || {
    date: today,
    newCardIds: [],
    reviewedCardIds: []
  };

  const dailySummary = useMemo(() => {
    return buildDailyReviewSummary(currentCategoryState, selectedCategoryCards, today, selectedCategoryProgress);
  }, [currentCategoryState, selectedCategoryCards, today, selectedCategoryProgress]);

  const reviewCards = useMemo(() => {
    return dailySummary.queue
      .map((entry) => selectedCategoryCards.find((card) => card.id === entry.id))
      .filter((card): card is Card => Boolean(card));
  }, [dailySummary.queue, selectedCategoryCards]);

  const reviewAgainCards = useMemo(() => {
    return Array.from(
      new Set(
        progress.reviewHistory
          .filter((entry) => entry.category === selectedCategory && entry.timestamp.startsWith(today))
          .map((entry) => entry.cardId)
      )
    )
      .map((id) => selectedCategoryCards.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card));
  }, [progress.reviewHistory, selectedCategory, selectedCategoryCards, today]);

  const reviewModeCards = studyMode === 'again' ? reviewAgainCards : reviewCards;

  useEffect(() => {
    if (reviewIndex >= reviewModeCards.length) {
      setReviewIndex(0);
    }
  }, [reviewModeCards.length, reviewIndex]);

  const currentCard = reviewModeCards[reviewIndex] ?? null;
  const currentCardState = currentCard ? currentCategoryState.cards[currentCard.id] : null;
  const dailyNewCardsCount = selectedCategoryProgress.newCardIds.length;
  const todayCardCount = reviewModeCards.length;
  const readyToReviewCount = dailySummary.summary.readyForReview;
  const totalTodayCards = dailySummary.summary.total;
  const remainingToday = Math.max(0, reviewModeCards.length - sessionReviewedCount);

  const reviewStats = [
    { label: t.newCards, value: dailyNewCardsCount, icon: '✨' },
    { label: t.readyToReview, value: readyToReviewCount, icon: '🧠' },
    { label: t.totalToday, value: totalTodayCards, icon: '📅' }
  ];

  const handleCategorySelection = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSessionTotalToday(10);
    setSessionReviewedCount(0);
    setSessionSummary(null);
    setReviewIndex(0);
    setShowAnswer(false);
    setStudyMode('standard');
  };

  const handleStartStudy = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSessionTotalToday(10);
    setSessionReviewedCount(0);
    setSessionSummary(null);
    setReviewIndex(0);
    setShowAnswer(false);
    setStudyMode('standard');
    setTab('study');
  };

  const handleReviewAgain = () => {
    setStudyMode('again');
    setSessionReviewedCount(0);
    setSessionSummary(null);
    setReviewIndex(0);
    setShowAnswer(false);
  };

  const handleViewBoxes = () => {
    setTab('categories');
    setStudyMode('standard');
  };

  const handleAnswer = (response: 'wrong' | 'hard' | 'correct') => {
    if (!currentCard) return;

    const reviewedAt = new Date().toISOString();

    if (studyMode === 'again') {
      setProgress((prev) => ({
        ...prev,
        reviewHistory: [
          { cardId: currentCard.id, category: selectedCategory, response, timestamp: reviewedAt },
          ...prev.reviewHistory
        ].slice(0, 200),
        selectedCategory
      }));
    } else {
      const nextCardState = applyReviewResponse(
        currentCategoryState.cards[currentCard.id] ?? {
          id: currentCard.id,
          category: selectedCategory,
          box: 1,
          boxNumber: 1,
          isNew: true,
          introducedDay: today,
          createdAt: today,
          nextReviewDate: today,
          lastReviewedDate: '',
          reviewCount: 0
        },
        response,
        reviewedAt,
        today
      );

      setProgress((prev) => {
        const categoryState = prev.categoryStates[selectedCategory] ?? getDefaultCategoryState();
        const nextCategoryState = {
          ...categoryState,
          cards: {
            ...categoryState.cards,
            [currentCard.id]: nextCardState
          }
        };

        const nextCategoryStates = {
          ...prev.categoryStates,
          [selectedCategory]: nextCategoryState
        };

        const currentProgress = prev.dailyProgress[selectedCategory] ?? {
          date: today,
          newCardIds: [],
          reviewedCardIds: []
        };
        const reviewedCardIds = currentProgress.reviewedCardIds.includes(currentCard.id)
          ? currentProgress.reviewedCardIds
          : [...currentProgress.reviewedCardIds, currentCard.id];

        const nextDailyProgress = {
          ...prev.dailyProgress,
          [selectedCategory]: {
            ...currentProgress,
            reviewedCardIds
          }
        };

        const nextHistory = [
          { cardId: currentCard.id, category: selectedCategory, response, timestamp: reviewedAt },
          ...prev.reviewHistory
        ].slice(0, 200);

        const nextStreak = prev.lastStreakDate !== today ? prev.streak + 1 : prev.streak;

        return {
          ...prev,
          categoryStates: nextCategoryStates,
          dailyProgress: nextDailyProgress,
          reviewHistory: nextHistory,
          streak: nextStreak,
          lastStreakDate: prev.lastStreakDate !== today ? today : prev.lastStreakDate,
          selectedCategory
        };
      });
    }

    setSessionReviewedCount((count) => count + 1);
    setShowAnswer(false);
    setReviewIndex((prev) => (reviewModeCards.length > 1 ? (prev + 1) % reviewModeCards.length : 0));
  };

  const handleFinishStudy = () => {
    const reviewedCount = sessionReviewedCount;
    const pendingCount = Math.max(0, reviewModeCards.length - reviewedCount);
    const modeLabel = studyMode === 'again' ? 'در حالت مرور مجدد' : 'در مرور اصلی';
    setSessionSummary(`${reviewedCount} کارت امروز بررسی شد ${modeLabel}. ${pendingCount > 0 ? `کارت‌های باقی‌مانده (${pendingCount}) برای مرور بعدی ذخیره شدند.` : 'همه کارت‌های این جلسه بررسی شدند.'}`);
    setShowAnswer(false);
  };

  const categoryBoxCounts = (categoryName: string) => {
    const state = progress.categoryStates[categoryName] ?? getDefaultCategoryState();
    return [1, 2, 3, 4, 5].map((box) => Object.values(state.cards).filter((card) => card.box === box).length);
  };

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
                      <div className="hero-top-row">
                        <div>
                          <div className="study-pill">{t.todayReview}</div>
                          <h2>{t.todayIntro}</h2>
                          <p>جلسه‌ای کوتاه، منظم و شبیه اپ‌های آموزشی حرفه‌ای.</p>
                        </div>
                        <button className="primary-pill" onClick={() => handleStartStudy(selectedCategory)}>
                          {t.goToStudy}
                        </button>
                      </div>

                      <div className="mini-stat-grid">
                        {reviewStats.map((stat) => (
                          <div key={stat.label} className="mini-stat-card">
                            <span className="mini-stat-icon">{stat.icon}</span>
                            <div>
                              <strong>{stat.value}</strong>
                              <p>{stat.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hero-control-row">
                        <label className="field-label">{t.selectCategory}</label>
                        <CustomSelect
                          value={selectedCategory}
                          options={categories.map((category) => ({ value: category.name, label: category.name }))}
                          onChange={handleCategorySelection}
                        />
                      </div>
                    </section>

                    {testModeEnabled ? (
                      <section className="glass-card test-mode-card">
                        <div className="section-heading">
                          <div>
                            <h3>Test mode: 3-day simulation</h3>
                            <p>Verify each category receives exactly 10 new cards each day.</p>
                          </div>
                          <button
                            className="secondary-pill"
                            onClick={() => {
                              const report = runDailyQuotaSimulation(collocations, 3, 10);
                              setTestReport(report);
                            }}
                          >
                            Run simulation
                          </button>
                        </div>
                        {testReport ? (
                          <div className="test-report">
                            <div className={`test-report-status ${testReport.success ? 'pass' : 'fail'}`}>
                              {testReport.success ? '✅ Simulation passed' : '❌ Simulation failed'}
                            </div>
                            <div className="test-report-summary">
                              <p>Days: {testReport.days.join(', ')}</p>
                              <p>Results: {testReport.results.length} records</p>
                              {testReport.errors.length > 0 ? (
                                <ul>
                                  {testReport.errors.map((error) => (
                                    <li key={error}>{error}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>Every category got exactly 10 unique new cards per day.</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                          <div className="debug-status">
                            <h4>Debug status</h4>
                            <p>Showing selected categories totals and today's new cards (from dailyProgress)</p>
                            <div className="debug-grid">
                              {[
                                'محیط زیست',
                                'اقتصاد',
                                'آموزش',
                                'جرم و قانون',
                                'سلامت',
                                'فناوری',
                                'جامعه',
                                'شهر و حمل و نقل',
                                'کار و شغل',
                                'فرهنگ و رسانه'
                              ].map((cat) => {
                                const normalized = cat === 'محیط زیست' ? 'محیط‌زیست' : cat === 'شهر و حمل و نقل' ? 'شهرسازی' : cat === 'جامعه' ? 'حقوق اجتماعی' : cat === 'فرهنگ و رسانه' ? 'فرهنگ' : cat;
                                const total = collocations.filter((c) => c.category === normalized).length;
                                const todayProgress = progress.dailyProgress[normalized];
                                const todaysNew = todayProgress && todayProgress.date === today ? (todayProgress.newCardIds || []).length : 0;
                                return (
                                  <div key={cat} className="debug-item">
                                    <strong>{cat}:</strong>
                                    <div>Total cards: {total}</div>
                                    <div>Today's new cards: {todaysNew}/10</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                      </section>
                    ) : null}

                    <section className="glass-card">
                      <div className="section-heading">
                        <div>
                          <h3>جعبه‌های لایتنر</h3>
                          <p>هر جعبه نقش مشخصی در تثبیت یادگیری دارد.</p>
                        </div>
                      </div>
                      <LeitnerBox
                        boxes={boxMeta.map((box, index) => ({
                          ...box,
                          count: categoryBoxCounts(selectedCategory)[index]
                        }))}
                        onView={() => setTab('study')}
                      />
                    </section>
                  </>
                )}

                {tab === 'study' && (
                  <>
                    <section className="study-toolbar">
                      <div>
                        <h2>{t.studyToday}</h2>
                        <p>{selectedCategory} • {todayCardCount} {t.todayCards}</p>
                      </div>
                      <CustomSelect
                        value={selectedCategory}
                        options={categories.map((category) => ({ value: category.name, label: category.name }))}
                        onChange={handleCategorySelection}
                        className="compact"
                      />
                    </section>

                    <div className="study-action-grid">
                      <button className={`study-action-button ${studyMode === 'standard' ? 'active' : ''}`} onClick={() => {
                        setStudyMode('standard');
                        setSessionReviewedCount(0);
                        setSessionSummary(null);
                        setReviewIndex(0);
                        setShowAnswer(false);
                      }}>{t.startTodayReview}</button>
                      <button className={`study-action-button ${studyMode === 'again' ? 'active' : ''}`} onClick={handleReviewAgain}>{t.reviewAgainToday}</button>
                      <button className="study-action-button" onClick={handleViewBoxes}>{t.viewBoxes}</button>
                    </div>

                    <div className="study-status-card">
                      <div className="study-status-block">
                        <span className="study-status-title">📚 {t.todayReview}</span>
                        <strong>{todayCardCount}</strong>
                        <p>{t.todayCardsSummary}</p>
                      </div>
                      <div className="study-status-block">
                        <span className="study-status-title">✅ {t.reviewedCount}</span>
                        <strong>{sessionReviewedCount}</strong>
                        <p>{t.reviewedCount}</p>
                      </div>
                      <div className="study-status-block">
                        <span className="study-status-title">⏳ {t.remainingCount}</span>
                        <strong>{remainingToday}</strong>
                        <p>{t.remainingToday}</p>
                      </div>
                    </div>

                    {studyMode === 'again' && reviewAgainCards.length === 0 ? (
                      <div className="glass-card empty-state">
                        <div className="empty-state-icon">🔁</div>
                        <p>{t.noReviewAgainCards}</p>
                      </div>
                    ) : sessionSummary ? (
                      <div className="glass-card finish-session-card">
                        <div className="finish-session-icon">✅</div>
                        <h3>{sessionSummary}</h3>
                        <p>{t.sessionSaved}</p>
                        <div className="finish-session-actions">
                          <button className="primary-pill" onClick={() => setTab('home')}>{t.backHome}</button>
                          <button className="secondary-pill" onClick={() => {
                            setSessionReviewedCount(0);
                            setSessionSummary(null);
                            setReviewIndex(0);
                            setShowAnswer(false);
                          }}>{t.continueReview}</button>
                        </div>
                      </div>
                    ) : reviewModeCards.length > 0 ? (
                      <>
                        <div className="study-meta">
                          <span>{t.cardOf} {Math.min(reviewIndex + 1, reviewModeCards.length)} {t.from} {reviewModeCards.length}</span>
                          <span>{t.currentBox}: {currentCardState?.box ?? 1}</span>
                        </div>
                        {studyMode === 'again' ? (
                          <div className="study-mode-hint">{t.reviewAgainHint}</div>
                        ) : null}
                        <FlashCard
                          card={currentCard}
                          showAnswer={showAnswer}
                          onToggleAnswer={() => setShowAnswer((current) => !current)}
                          onAnswer={handleAnswer}
                          isReview={true}
                          labels={t as any}
                        />
                        <div className="study-footer">
                          <div>
                            <strong>{remainingToday} {t.remainingToday}</strong>
                            <p>{t.sessionSaved}</p>
                          </div>
                          <button className="secondary-pill" onClick={handleFinishStudy}>{t.finishStudy}</button>
                        </div>
                      </>
                    ) : (
                      <div className="glass-card empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <p>{t.reviewFinished}</p>
                      </div>
                    )}
                  </>
                )}

                {tab === 'categories' && (
                  <>
                    <section className="study-toolbar">
                      <div>
                        <h2>{t.categories}</h2>
                        <p>{t.categoryDesc}</p>
                      </div>
                    </section>

                    <div className="categories-grid">
                      {categories.map((category) => {
                        const categoryItemCards = collocations.filter((card) => card.category === category.name);
                        return (
                          <button
                            key={category.name}
                            className="category-summary-card"
                            onClick={() => handleStartStudy(category.name)}
                          >
                            <div className="category-summary-head">
                              <span className="category-icon">{category.icon}</span>
                              <div>
                                <h3>{category.name}</h3>
                                <p>{categoryItemCards.length} کارت</p>
                              </div>
                            </div>
                            <LeitnerBox
                              boxes={boxMeta.map((box, index) => ({
                                ...box,
                                count: categoryBoxCounts(category.name)[index]
                              }))}
                              onView={() => handleStartStudy(category.name)}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </main>
            </div>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <span className="nav-icon">🏠</span>
          <span>{t.home}</span>
        </button>
        <button className={`nav-item ${tab === 'study' ? 'active' : ''}`} onClick={() => setTab('study')}>
          <span className="nav-icon">📚</span>
          <span>{t.study}</span>
        </button>
        <button className={`nav-item ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
          <span className="nav-icon">🗂️</span>
          <span>{t.topics}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

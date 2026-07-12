import type { CollocationCard, LocaleKey } from '../types';

type CardStatus = {
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewed: string;
};

type Props = {
  categories: { name: string; count: number }[];
  statuses: Record<number, CardStatus>;
  cards: CollocationCard[];
  locale: LocaleKey;
};

const ProgressChart = ({ categories, statuses, cards, locale }: Props) => {
  const perCategory = categories.map((category) => {
    const categoryCards = cards.filter((card) => card.category === category.name);
    const learned = categoryCards.filter((card) => statuses[card.id]?.box === 5).length;
    const percent = categoryCards.length ? Math.round((learned / categoryCards.length) * 100) : 0;
    return {
      name: category.name,
      percent,
      learned,
      total: categoryCards.length
    };
  });

  return (
    <div className="panel chart-panel">
      <div className="panel-header">پیشرفت دسته‌ها</div>
      <div className="chart-list">
        {perCategory.map((category) => (
          <div key={category.name} className="chart-item">
            <div className="chart-item-top">
              <span>{category.name}</span>
              <strong>{category.percent}%</strong>
            </div>
            <div className="chart-bar">
              <div className="chart-fill" style={{ width: `${category.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;

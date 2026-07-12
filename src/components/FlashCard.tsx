import type { CollocationCard } from '../types';

type Props = {
  card: CollocationCard | null;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  onAnswer: (response: 'wrong' | 'hard' | 'correct') => void;
  isReview: boolean;
  labels: { [key: string]: string | string[] };
};

const FlashCard = ({ card, showAnswer, onToggleAnswer, onAnswer }: Props) => {
  if (!card) {
    return (
      <div className="glass-card empty-state">
        <div className="empty-state-icon">📚</div>
        <p>تمام کارت‌های این دسته تسلط کامل یافتند!</p>
      </div>
    );
  }

  const handleCardClick = () => {
    if (!showAnswer) {
      onToggleAnswer();
    }
  };

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>, response: 'wrong' | 'hard' | 'correct') => {
    event.stopPropagation();
    onAnswer(response);
  };

  return (
    <div className={`flashcard ${showAnswer ? 'flipped' : ''}`} onClick={handleCardClick}>
      <div className="card-panel card-front">
        <div className="flashcard-header">
          <span className="flashcard-tag">{card.category}</span>
          <span className="flashcard-level">{card.level}</span>
        </div>

        <div className="flashcard-main">
          <h2>{card.english}</h2>
          <p className="flashcard-prompt">برای دیدن پاسخ روی کارت کلیک کنید</p>
        </div>
      </div>

      <div className="card-panel card-back">
        <div className="flashcard-header">
          <span className="flashcard-tag">{card.category}</span>
          <span className="flashcard-level">{card.level}</span>
        </div>

        <div className="flashcard-answer">
          <div>
            <p className="label">معنی فارسی</p>
            <p className="translation">{card.translation}</p>
          </div>

          <div>
            <p className="label">تلفظ</p>
            <p className="pronunciation">{card.pronunciation}</p>
          </div>

          <div className="example-block">
            <p className="label">مثال (IELTS Writing)</p>
            <p>{card.example}</p>
            <p className="example-translation">{card.exampleTranslation}</p>
          </div>
        </div>

        <div className="flashcard-actions response-buttons">
          <button className="btn btn-wrong" onClick={(event) => handleButtonClick(event, 'wrong')}>
            ❌ بلد نبودم
          </button>
          <button className="btn btn-hard" onClick={(event) => handleButtonClick(event, 'hard')}>
            😐 سخت بود
          </button>
          <button className="btn btn-correct" onClick={(event) => handleButtonClick(event, 'correct')}>
            ✅ یاد گرفتم
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;

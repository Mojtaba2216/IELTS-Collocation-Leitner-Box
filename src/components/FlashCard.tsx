import type { CollocationCard } from '../types';

type Labels = {
  showAnswer: string;
  learned: string;
  reviewToday: string;
  chooseCategory: string;
  boxes: string[];
};

type Props = {
  card: CollocationCard | null;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  onAnswer: (response: 'wrong' | 'hard' | 'correct') => void;
  isReview: boolean;
  labels: { [key: string]: string | string[] };
};

const FlashCard = ({ card, showAnswer, onToggleAnswer, onAnswer, isReview, labels }: Props) => {
  if (!card) {
    return <div className="flashcard empty">No cards available</div>;
  }

  return (
    <div className="flashcard">
      <div className="flashcard-header">
        <div>
          <span className="flashcard-tag">{card.category}</span>
          <span className="flashcard-level">{card.level}</span>
        </div>
      </div>

      <div className="flashcard-content">
        <h2>{card.english}</h2>
        {showAnswer ? (
          <div className="flashcard-answer">
            <p className="translation">{card.translation}</p>
            <p className="pronunciation">{card.pronunciation}</p>
            <div className="example-block">
              <strong>Example:</strong>
              <p>{card.example}</p>
              <p className="example-translation">{card.exampleTranslation}</p>
            </div>
          </div>
        ) : (
          <div className="flashcard-cover">{labels.showAnswer}</div>
        )}
      </div>

      <div className="flashcard-actions">
        <button className="btn btn-secondary" onClick={onToggleAnswer}>
          {showAnswer ? 'Hide answer' : labels.showAnswer}
        </button>
        {showAnswer && (
          <div className="response-buttons">
            <button className="btn btn-wrong" onClick={() => onAnswer('wrong')}>
              ❌ بلد نبودم
            </button>
            <button className="btn btn-hard" onClick={() => onAnswer('hard')}>
              😐 سخت بود
            </button>
            <button className="btn btn-correct" onClick={() => onAnswer('correct')}>
              ✅ یاد گرفتم
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashCard;

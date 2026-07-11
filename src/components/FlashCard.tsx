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
    <div className={`flashcard ${showAnswer ? 'flipped' : ''}`}>
      <div className="card-panel card-front">
        <div className="flashcard-header">
          <span className="flashcard-tag">{card.category}</span>
          <span className="flashcard-level">{card.level}</span>
        </div>

        <div className="flashcard-main">
          <h2>{card.english}</h2>
          <p className="flashcard-prompt">Tap to reveal the meaning and example.</p>
        </div>

        <button className="btn btn-show-answer" onClick={onToggleAnswer}>
          {showAnswer ? 'Hide answer' : labels.showAnswer}
        </button>
      </div>

      <div className="card-panel card-back">
        <div className="flashcard-header back-header">
          <span className="flashcard-tag">{card.category}</span>
          <span className="flashcard-level">{card.level}</span>
        </div>

        <div className="flashcard-answer">
          <div>
            <p className="label">Meaning</p>
            <p className="translation">{card.translation}</p>
          </div>

          <div>
            <p className="label">Pronunciation</p>
            <p className="pronunciation">{card.pronunciation}</p>
          </div>

          <div className="example-block">
            <p className="label">IELTS Writing Task 2</p>
            <p>{card.example}</p>
            <p className="example-translation">{card.exampleTranslation}</p>
          </div>
        </div>

        <div className="flashcard-actions response-buttons card-actions-bottom">
          <button className="btn btn-wrong" onClick={() => onAnswer('wrong')}>
            ❌ Didn't know
          </button>
          <button className="btn btn-hard" onClick={() => onAnswer('hard')}>
            😐 Difficult
          </button>
          <button className="btn btn-correct" onClick={() => onAnswer('correct')}>
            ✅ Mastered
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;

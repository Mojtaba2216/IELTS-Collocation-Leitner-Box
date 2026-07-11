type Props = {
  totalCards: number;
  learned: number;
  reviewToday: number;
  progress: number;
  categoryProgress: {
    value: number;
    label: string;
  };
  currentCategory: string;
  streak: number;
};

const Dashboard = ({ totalCards, learned, reviewToday, progress, categoryProgress, currentCategory, streak }: Props) => {
  return (
    <div className="dashboard-panel glass-card">
      <div className="dashboard-header">
        <span className="section-label">Quick summary</span>
        <strong>Learning snapshot</strong>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stat">
          <span>Total cards</span>
          <strong>{totalCards}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Mastered</span>
          <strong>{learned}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Today&apos;s review</span>
          <strong>{reviewToday}</strong>
        </div>
        <div className="dashboard-ring-card">
          <span>Progress</span>
          <div
            className="circle-ring"
            style={{
              background: `conic-gradient(var(--accent-strong) ${progress * 3.6}deg, rgba(255,255,255,0.06) 0deg)`
            }}
          >
            <strong>{progress}%</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-meta">
        <div>
          <span>Current streak</span>
          <strong>{streak} days</strong>
        </div>
        <div>
          <span>{currentCategory === 'All' ? 'Learning all categories' : currentCategory}</span>
          <strong>{categoryProgress.label}</strong>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

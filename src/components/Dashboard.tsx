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
};

const Dashboard = ({ totalCards, learned, reviewToday, progress, categoryProgress, currentCategory }: Props) => {
  return (
    <div className="panel dashboard-panel">
      <div className="panel-header">داشبورد</div>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span>کل کارت‌ها</span>
          <strong>{totalCards}</strong>
        </div>
        <div className="dashboard-card">
          <span>یادگرفته شده</span>
          <strong>{learned}</strong>
        </div>
        <div className="dashboard-card">
          <span>مرور امروز</span>
          <strong>{reviewToday}</strong>
        </div>
        <div className="dashboard-card progress-card">
          <span>درصد پیشرفت</span>
          <strong>{progress}%</strong>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="dashboard-footer">
        <span>دسته انتخاب‌شده:</span>
        <strong>{currentCategory === 'All' ? 'همه دسته‌ها' : currentCategory}</strong>
      </div>
      <div className="dashboard-footer">
        <span>پیشرفت دسته:</span>
        <strong>{categoryProgress.label}</strong>
      </div>
    </div>
  );
};

export default Dashboard;

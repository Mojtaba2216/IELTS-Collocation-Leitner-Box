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
    <div className="dashboard-panel">
      <div className="dashboard-grid">
        <div className="dashboard-stat">
          <span>مجموع کارت‌ها</span>
          <strong>{totalCards}</strong>
        </div>
        <div className="dashboard-stat">
          <span>تسلط یافته</span>
          <strong>{learned}</strong>
        </div>
        <div className="dashboard-stat">
          <span>مرور امروز</span>
          <strong>{reviewToday}</strong>
        </div>
        <div className="dashboard-stat">
          <span>درصد</span>
          <strong>{progress}%</strong>
        </div>
      </div>

      <div className="dashboard-ring-card">
        <span>دسته‌های درحال مطالعه</span>
        <div className="circle-ring">
          <strong>{categoryProgress.value}%</strong>
        </div>
        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '14px' }}>
          {currentCategory === 'All' ? 'یادگیری از همه دسته‌ها' : currentCategory}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)' }}>
        <span style={{ color: '#cbd5e1' }}>تعداد روز متوالی</span>
        <strong style={{ fontSize: '20px', color: '#3b82f6' }}>{streak} روز</strong>
      </div>
    </div>
  );
};

export default Dashboard;

type Props = {
  boxCounts: number[];
  labels: string[];
};

const LeitnerBox = ({ boxCounts, labels }: Props) => {
  return (
    <div className="leitner-panel glass-card">
      <div className="panel-header">Leitner boxes</div>
      <div className="box-list modern-box-list">
        {boxCounts.map((count, index) => (
          <div key={index} className="box-item modern-box-item">
            <span>{labels[index]}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeitnerBox;

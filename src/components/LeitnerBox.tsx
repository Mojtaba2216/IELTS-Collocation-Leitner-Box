type Props = {
  boxCounts: number[];
  labels: string[];
};

const LeitnerBox = ({ boxCounts, labels }: Props) => {
  return (
    <div className="panel leitner-panel">
      <div className="panel-header">جعبه لایتنر</div>
      <div className="box-list">
        {boxCounts.map((count, index) => (
          <div key={index} className="box-item">
            <span>{labels[index]}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeitnerBox;

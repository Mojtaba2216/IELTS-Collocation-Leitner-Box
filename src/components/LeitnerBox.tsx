type Props = {
  boxCounts: number[];
  labels: string[];
};

const LeitnerBox = ({ boxCounts, labels }: Props) => {
  const boxNames = ['📌 جدید', '✍️ اول', '📖 دوم', '🔒 تثبیت', '🏆 تسلط'];

  return (
    <div className="leitner-boxes">
      {boxCounts.map((count, index) => (
        <div key={index} className="box-item">
          <div className="box-label">{boxNames[index]}</div>
          <div className="box-count">{count}</div>
        </div>
      ))}
    </div>
  );
};

export default LeitnerBox;

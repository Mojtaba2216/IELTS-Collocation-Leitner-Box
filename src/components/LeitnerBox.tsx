type BoxItem = {
  key: number;
  title: string;
  subtitle: string;
  icon: string;
  count: number;
};

type Props = {
  boxes: BoxItem[];
  onView?: () => void;
};

const LeitnerBox = ({ boxes, onView }: Props) => {
  return (
    <div className="leitner-boxes">
      {boxes.map((box) => (
        <div key={box.key} className="box-item">
          <div className="box-item-icon">{box.icon}</div>
          <div className="box-item-content">
            <div className="box-label">{box.title}</div>
            <div className="box-subtitle">{box.subtitle}</div>
            <div className="box-count">{box.count} کارت</div>
          </div>
          {onView ? (
            <button className="box-view-button" onClick={onView}>
              مشاهده کارت‌ها
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default LeitnerBox;

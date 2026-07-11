import type { LocaleKey } from '../types';

type Category = {
  name: string;
  count: number;
};

type Props = {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  allLabel: string;
};

const Categories = ({ categories, selectedCategory, onSelectCategory, allLabel }: Props) => {
  return (
    <div className="panel categories-panel">
      <div className="panel-header">{allLabel}</div>
      <div className="category-list">
        <button
          className={`category-button ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => onSelectCategory('All')}
        >
          {allLabel}
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(category.name)}
          >
            <span>{category.name}</span>
            <span>{category.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Categories;

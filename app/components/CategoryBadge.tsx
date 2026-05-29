import { Category, CATEGORY_BG, CATEGORY_COLORS, CATEGORY_ICONS } from '@/app/types/expense';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const dim = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base';
  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center shrink-0`}
      style={{ background: CATEGORY_BG[category] }}
      title={category}
    >
      <span>{CATEGORY_ICONS[category]}</span>
    </div>
  );
}

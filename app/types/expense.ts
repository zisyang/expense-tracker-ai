export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export interface Expense {
  id: string;
  date: string;       // YYYY-MM-DD
  amount: string;     // stored as string to preserve decimal
  category: Category;
  description: string;
}

export interface Filters {
  search: string;
  category: string;
  from: string;
  to: string;
}

export const CATEGORIES: Category[] = [
  'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food:           '#e05c5c',
  Transportation: '#3266ad',
  Entertainment:  '#9b59b6',
  Shopping:       '#e67e22',
  Bills:          '#3d9c6a',
  Other:          '#888780',
};

export const CATEGORY_BG: Record<Category, string> = {
  Food:           '#fde8e8',
  Transportation: '#e6f1fb',
  Entertainment:  '#f3e8f9',
  Shopping:       '#fef3e2',
  Bills:          '#e8f6ef',
  Other:          '#f1efe8',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food:           '🍽️',
  Transportation: '🚗',
  Entertainment:  '🎉',
  Shopping:       '🛍️',
  Bills:          '📄',
  Other:          '•••',
};

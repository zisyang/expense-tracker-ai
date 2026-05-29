import { Expense, Category, CATEGORY_COLORS } from '@/app/types/expense';

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function groupByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {} as Record<string, number>);
}

export function getLast6Months(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'short' }),
    };
  });
}

export function getMonthlyTotals(expenses: Expense[]): { label: string; total: number }[] {
  const months = getLast6Months();
  return months.map(({ key, label }) => ({
    label,
    total: expenses
      .filter(e => e.date.startsWith(key))
      .reduce((s, e) => s + parseFloat(e.amount), 0),
  }));
}

export function getCategoryChartData(expenses: Expense[]) {
  const totals = groupByCategory(expenses);
  return Object.entries(totals).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: CATEGORY_COLORS[name as Category] || '#888',
  }));
}

export function exportToCSV(expenses: Expense[]): void {
  const rows = [
    ['Date', 'Category', 'Amount', 'Description'],
    ...expenses.map(e => [e.date, e.category, e.amount, e.description]),
  ];
  const csv = rows
    .map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'expenses.csv';
  a.click();
}

export function getSeedData(uid: () => string): Expense[] {
  const now = new Date();
  const d = (monthOffset: number, day: number) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);
    return date.toISOString().slice(0, 10);
  };
  const seed: Array<{ cat: Category; desc: string; amt: number; off: number; day: number }> = [
    { cat: 'Food', desc: 'Grocery run', amt: 87.50, off: 0, day: 25 },
    { cat: 'Bills', desc: 'Electric bill', amt: 142.00, off: 0, day: 20 },
    { cat: 'Transportation', desc: 'Uber to airport', amt: 34.75, off: 0, day: 18 },
    { cat: 'Entertainment', desc: 'Movie tickets', amt: 28.00, off: 0, day: 15 },
    { cat: 'Shopping', desc: 'New headphones', amt: 129.99, off: 0, day: 12 },
    { cat: 'Food', desc: 'Restaurant dinner', amt: 62.40, off: 0, day: 10 },
    { cat: 'Bills', desc: 'Internet service', amt: 59.99, off: 1, day: 28 },
    { cat: 'Food', desc: 'Coffee shop', amt: 18.50, off: 1, day: 22 },
    { cat: 'Transportation', desc: 'Monthly transit pass', amt: 95.00, off: 1, day: 1 },
    { cat: 'Entertainment', desc: 'Streaming services', amt: 45.98, off: 1, day: 5 },
    { cat: 'Shopping', desc: 'Books', amt: 37.20, off: 2, day: 14 },
    { cat: 'Food', desc: 'Takeout', amt: 24.80, off: 2, day: 20 },
    { cat: 'Bills', desc: 'Phone bill', amt: 80.00, off: 2, day: 3 },
    { cat: 'Other', desc: 'Gym membership', amt: 55.00, off: 3, day: 8 },
    { cat: 'Food', desc: 'Farmers market', amt: 43.60, off: 3, day: 18 },
    { cat: 'Shopping', desc: 'Clothing', amt: 156.00, off: 4, day: 10 },
    { cat: 'Entertainment', desc: 'Concert tickets', amt: 88.00, off: 4, day: 22 },
    { cat: 'Transportation', desc: 'Gas', amt: 67.30, off: 5, day: 15 },
  ];
  return seed.map(s => ({
    id: uid(),
    date: d(s.off, s.day),
    amount: s.amt.toFixed(2),
    category: s.cat,
    description: s.desc,
  }));
}

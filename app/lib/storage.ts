import { Expense } from '@/app/types/expense';

const KEY = 'expenses';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

'use client';
import { Expense, Filters } from '@/app/types/expense';
import { formatCurrency } from '@/app/lib/utils';
import CategoryBadge from './CategoryBadge';
import FilterBar from './FilterBar';
import { Pencil, Trash2, Receipt } from 'lucide-react';
import { exportToCSV } from '@/app/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function ExpenseList({
  expenses, onEdit, onDelete, filters, onFiltersChange,
}: ExpenseListProps) {
  const filtered = expenses
    .filter(e => {
      const s = filters.search.toLowerCase();
      const matchSearch = !s || e.description.toLowerCase().includes(s) || e.category.toLowerCase().includes(s);
      const matchCat = !filters.category || e.category === filters.category;
      const matchFrom = !filters.from || e.date >= filters.from;
      const matchTo = !filters.to || e.date <= filters.to;
      return matchSearch && matchCat && matchFrom && matchTo;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        onExport={() => exportToCSV(filtered)}
        resultCount={filtered.length}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Receipt size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
            <p className="text-sm">No expenses found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((e, i) => (
              <div
                key={e.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <CategoryBadge category={e.category} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{e.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.category} · {e.date}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 shrink-0">
                  {formatCurrency(e.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onEdit(e)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Edit expense"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(e.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

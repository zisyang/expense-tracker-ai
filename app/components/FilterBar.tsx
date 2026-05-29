'use client';
import { Filters } from '@/app/types/expense';
import { CATEGORIES } from '@/app/types/expense';
import { Search, X, Download } from 'lucide-react';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onExport: () => void;
  resultCount: number;
}

export default function FilterBar({ filters, onChange, onExport, resultCount }: FilterBarProps) {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const clear = () => onChange({ search: '', category: '', from: '', to: '' });
  const hasFilters = filters.search || filters.category || filters.from || filters.to;

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <div className="relative flex-1 min-w-44">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search expenses…"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select
        value={filters.category}
        onChange={e => set('category', e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input
        type="date"
        value={filters.from}
        onChange={e => set('from', e.target.value)}
        title="From date"
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="date"
        value={filters.to}
        onChange={e => set('to', e.target.value)}
        title="To date"
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {hasFilters && (
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <X size={14} /> Clear
        </button>
      )}

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ml-auto"
      >
        <Download size={14} /> Export CSV
      </button>

      <span className="text-xs text-gray-400 w-full">
        {resultCount} {resultCount === 1 ? 'expense' : 'expenses'} {hasFilters ? 'found' : 'total'}
      </span>
    </div>
  );
}

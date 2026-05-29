'use client';
import { useState, useEffect } from 'react';
import { Expense, Category, CATEGORIES } from '@/app/types/expense';
import { uid } from '@/app/lib/storage';

interface ExpenseFormProps {
  onSave: (expense: Expense) => void;
  editExpense?: Expense | null;
  onCancelEdit?: () => void;
}

interface FormErrors {
  date?: string;
  amount?: string;
  category?: string;
  description?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ onSave, editExpense, onCancelEdit }: ExpenseFormProps) {
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editExpense) {
      setDate(editExpense.date);
      setAmount(editExpense.amount);
      setCategory(editExpense.category);
      setDescription(editExpense.description);
    }
  }, [editExpense]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!date) e.date = 'Date is required';
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount greater than 0';
    if (!category) e.category = 'Please select a category';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const expense: Expense = {
      id: editExpense?.id || uid(),
      date,
      amount: parseFloat(amount).toFixed(2),
      category: category as Category,
      description: description.trim(),
    };
    onSave(expense);
    if (!editExpense) {
      setDate(today());
      setAmount('');
      setCategory('');
      setDescription('');
      setErrors({});
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-5">
        {editExpense ? 'Edit expense' : 'New expense'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputClass('date')}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className={inputClass('amount')}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className={inputClass('category')}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was this for?"
              className={inputClass('description')}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {editExpense && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`px-5 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
              saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saved ? '✓ Saved!' : editExpense ? 'Update expense' : 'Save expense'}
          </button>
        </div>
      </form>
    </div>
  );
}

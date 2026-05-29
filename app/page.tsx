'use client';
import { useState, useEffect } from 'react';
import { Expense, Filters } from '@/app/types/expense';
import { loadExpenses, saveExpenses } from '@/app/lib/storage';
import { getSeedData } from '@/app/lib/utils';
import { uid } from '@/app/lib/storage';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import Toast from './components/Toast';
import { LayoutDashboard, List, Plus, Receipt } from 'lucide-react';

type Tab = 'dashboard' | 'expenses' | 'add';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [filters, setFilters] = useState<Filters>({ search: '', category: '', from: '', to: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = loadExpenses();
    if (stored.length === 0) {
      const seed = getSeedData(uid);
      saveExpenses(seed);
      setExpenses(seed);
    } else {
      setExpenses(stored);
    }
    setMounted(true);
  }, []);

  function showToast(message: string) {
    setToast({ show: true, message });
  }

  function handleSave(expense: Expense) {
    let updated: Expense[];
    if (expenses.find(e => e.id === expense.id)) {
      updated = expenses.map(e => e.id === expense.id ? expense : e);
      showToast('Expense updated!');
    } else {
      updated = [expense, ...expenses];
      showToast('Expense saved!');
    }
    setExpenses(updated);
    saveExpenses(updated);
    setEditExpense(null);
    if (tab === 'add') setTab('expenses');
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    showToast('Expense deleted');
  }

  function handleEdit(expense: Expense) {
    setEditExpense(expense);
    setTab('add');
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'expenses', label: 'Expenses', icon: <List size={15} /> },
    { id: 'add', label: 'Add', icon: <Plus size={15} /> },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-400">
          <Receipt size={20} />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-1">
          <div className="flex items-center gap-2 mr-6">
            <Receipt size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">ExpenseTrack</span>
          </div>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'add') setEditExpense(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                tab === t.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <Dashboard expenses={expenses} />}
        {tab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
        {tab === 'add' && (
          <ExpenseForm
            onSave={handleSave}
            editExpense={editExpense}
            onCancelEdit={() => { setEditExpense(null); setTab('expenses'); }}
          />
        )}
      </main>

      <Toast
        message={toast.message}
        show={toast.show}
        onHide={() => setToast(t => ({ ...t, show: false }))}
      />
    </div>
  );
}

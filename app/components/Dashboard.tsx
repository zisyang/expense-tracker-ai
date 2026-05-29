'use client';
import { Expense, Category, CATEGORY_COLORS } from '@/app/types/expense';
import { formatCurrency, getCategoryChartData, getMonthlyTotals, exportToCSV } from '@/app/lib/utils';
import CategoryBadge from './CategoryBadge';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Coins, CalendarDays, Tag, TrendingUp, Download } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        {icon}{label}
      </div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ expenses }: DashboardProps) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const monthly = expenses.filter(e => e.date.startsWith(thisMonth)).reduce((s, e) => s + parseFloat(e.amount), 0);
  const catTotals: Record<string, number> = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const avg = expenses.length ? total / expenses.length : 0;
  const pieData = getCategoryChartData(expenses);
  const barData = getMonthlyTotals(expenses);
  const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Overview</h2>
        <button
          onClick={() => exportToCSV(expenses)}
          disabled={expenses.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={14} />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard icon={<Coins size={13} />} label="Total spent" value={formatCurrency(total)} sub={`${expenses.length} transactions`} />
        <MetricCard icon={<CalendarDays size={13} />} label="This month" value={formatCurrency(monthly)} sub={now.toLocaleString('default', { month: 'long' })} />
        <MetricCard icon={<Tag size={13} />} label="Top category" value={topCat ? topCat[0] : '—'} sub={topCat ? formatCurrency(topCat[1]) : ''} />
        <MetricCard icon={<TrendingUp size={13} />} label="Avg transaction" value={formatCurrency(avg)} sub="per expense" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Category pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Spending by category</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                {pieData.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                    {d.name} — {formatCurrency(d.value)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data yet</div>
          )}
        </div>

        {/* Monthly bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Last 6 months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={50} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Spending']} />
              <Bar dataKey="total" fill="#3266ad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Recent expenses</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No expenses yet — add your first one!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2.5">
                <CategoryBadge category={e.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{e.description}</p>
                  <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Expense, Category, CATEGORIES, CATEGORY_COLORS } from '@/app/types/expense';
import {
  ExportFormat, ExportOptions,
  filterExpenses, runExport,
} from '@/app/lib/exportEngine';
import {
  X, FileText, FileJson, FilePdf,
  Calendar, Tag, Download, Eye,
  CheckSquare, Square, Loader2, FileDown,
} from 'lucide-react';

interface ExportModalProps {
  expenses: Expense[];
  onClose: () => void;
}

const FORMAT_META: Record<ExportFormat, { label: string; desc: string; icon: React.ReactNode; accent: string }> = {
  csv:  { label: 'CSV',  desc: 'Spreadsheet-compatible',  icon: <FileText  size={18} />, accent: '#3d9c6a' },
  json: { label: 'JSON', desc: 'Structured data / API',   icon: <FileJson  size={18} />, accent: '#3266ad' },
  pdf:  { label: 'PDF',  desc: 'Print-ready report',      icon: <FileText  size={18} />, accent: '#e05c5c' },
};

type Step = 'options' | 'preview' | 'done';

export default function ExportModal({ expenses, onClose }: ExportModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [step,       setStep]       = useState<Step>('options');
  const [format,     setFormat]     = useState<ExportFormat>('csv');
  const [filename,   setFilename]   = useState('expenses');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = useMemo(
    () => filterExpenses(expenses, { dateFrom, dateTo, categories }),
    [expenses, dateFrom, dateTo, categories]
  );

  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + parseFloat(e.amount), 0),
    [filtered]
  );

  function toggleCategory(cat: Category) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function handleExport() {
    setLoading(true);
    const opts: ExportOptions = { format, filename, dateFrom, dateTo, categories };
    await runExport(expenses, opts);
    setLoading(false);
    setStep('done');
  }

  // Click outside to close
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
           style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileDown size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Export Data</h2>
              <p className="text-xs text-gray-400">{expenses.length} total expenses available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-0 px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          {(['options', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step === s ? 'bg-blue-600 text-white' :
                  (step === 'preview' && i === 0) || step === 'done' ? 'bg-emerald-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {((step === 'preview' && i === 0) || step === 'done') && i < ['options','preview','done'].indexOf(step) ? '✓' : i + 1}
                </div>
                <span className={`text-xs capitalize ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ════════ STEP: OPTIONS ════════ */}
          {step === 'options' && (
            <div className="space-y-6">

              {/* Format picker */}
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Export format</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(FORMAT_META) as [ExportFormat, typeof FORMAT_META[ExportFormat]][]).map(([fmt, meta]) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${
                        format === fmt
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span style={{ color: format === fmt ? meta.accent : '#9ca3af' }}>{meta.icon}</span>
                      <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                      <span className="text-xs text-gray-400">{meta.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Filename */}
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Filename</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={filename}
                    onChange={e => setFilename(e.target.value)}
                    placeholder="expenses"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400 font-mono shrink-0">.{format}</span>
                </div>
              </section>

              {/* Date range */}
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
                  Date range <span className="normal-case font-normal">(leave blank for all)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </section>

              {/* Category filter */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    <Tag size={12} className="inline mr-1.5 -mt-0.5" />
                    Categories <span className="normal-case font-normal">(none selected = all)</span>
                  </h3>
                  {categories.length > 0 && (
                    <button onClick={() => setCategories([])} className="text-xs text-blue-500 hover:text-blue-700">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const active = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          active ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                        style={active ? { background: CATEGORY_COLORS[cat] } : {}}
                      >
                        {active ? <CheckSquare size={12} /> : <Square size={12} />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Live summary */}
              <div className={`rounded-xl p-4 border flex items-center gap-4 ${
                filtered.length === 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
              }`}>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${filtered.length === 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                    {filtered.length} {filtered.length === 1 ? 'record' : 'records'} will be exported
                  </p>
                  <p className={`text-xs mt-0.5 ${filtered.length === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {filtered.length === 0 ? 'No expenses match your filters' : `Total: $${totalAmount.toFixed(2)}`}
                  </p>
                </div>
                {filtered.length > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-emerald-600">as <span className="font-mono font-semibold">{(filename.trim() || 'expenses')}.{format}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP: PREVIEW ════════ */}
          {step === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Previewing <span className="font-medium text-gray-900">{filtered.length}</span> records · <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span> total
                </p>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{(filename.trim()||'expenses')}.{format}</span>
              </div>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '40%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Date', 'Category', 'Amount', 'Description'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide" style={{ fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.slice(0, 50).map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-700 font-mono">{e.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded text-white text-xs"
                            style={{ background: CATEGORY_COLORS[e.category] || '#888', fontSize: 10 }}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-900 font-medium">${parseFloat(e.amount).toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-gray-600 truncate">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 50 && (
                  <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                    + {filtered.length - 50} more rows not shown in preview
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP: DONE ════════ */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <Download size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Export complete</h3>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{filtered.length} records</span> exported as{' '}
                <span className="font-mono font-medium text-gray-700">{(filename.trim()||'expenses')}.{format}</span>
              </p>
              <p className="text-xs text-gray-400">Check your downloads folder</p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setStep('options'); }} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  Export again
                </button>
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== 'done' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            {step === 'options' ? (
              <>
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={14} /> Preview export
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('options')} className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">← Back</button>
                <button
                  onClick={handleExport}
                  disabled={loading || filtered.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[140px] justify-center"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Exporting…</>
                    : <><Download size={14} /> Download {format.toUpperCase()}</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

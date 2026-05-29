import { Expense, Category, CATEGORY_COLORS } from '@/app/types/expense';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CloudDestination =
  | 'email'
  | 'google_sheets'
  | 'dropbox'
  | 'onedrive'
  | 'notion'
  | 'airtable';

export type ExportTemplate =
  | 'tax_report'
  | 'monthly_summary'
  | 'category_analysis'
  | 'full_export'
  | 'custom';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'never';

export type ExportStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface ExportHistoryEntry {
  id: string;
  timestamp: string;          // ISO string
  destination: CloudDestination;
  template: ExportTemplate;
  recordCount: number;
  totalAmount: number;
  status: ExportStatus;
  shareLink?: string;
  filename: string;
}

export interface ScheduledExport {
  id: string;
  frequency: ScheduleFrequency;
  destination: CloudDestination;
  template: ExportTemplate;
  nextRun: string;            // ISO string
  enabled: boolean;
  createdAt: string;
}

export interface ConnectionStatus {
  destination: CloudDestination;
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DESTINATION_META: Record<CloudDestination, {
  label: string; icon: string; color: string; bg: string; description: string;
}> = {
  email:         { label: 'Email',         icon: '✉️',  color: '#3266ad', bg: '#e6f1fb', description: 'Send as attachment' },
  google_sheets: { label: 'Google Sheets', icon: '📊',  color: '#3d9c6a', bg: '#e8f6ef', description: 'Sync to spreadsheet' },
  dropbox:       { label: 'Dropbox',       icon: '📦',  color: '#0061ff', bg: '#e6eeff', description: 'Save to cloud folder' },
  onedrive:      { label: 'OneDrive',      icon: '☁️',  color: '#0078d4', bg: '#e6f3fb', description: 'Microsoft cloud sync' },
  notion:        { label: 'Notion',        icon: '📝',  color: '#1a1a1a', bg: '#f1efe8', description: 'Create database page' },
  airtable:      { label: 'Airtable',      icon: '🗃️',  color: '#f82b60', bg: '#fde8ee', description: 'Sync to base table' },
};

export const TEMPLATE_META: Record<ExportTemplate, {
  label: string; icon: string; description: string; columns: string[];
}> = {
  tax_report:        { label: 'Tax Report',        icon: '🧾', description: 'Annual summary for accountants', columns: ['Date','Category','Amount','Description','Tax Year'] },
  monthly_summary:   { label: 'Monthly Summary',   icon: '📅', description: 'Month-over-month spending view', columns: ['Month','Total Spent','Top Category','Transaction Count'] },
  category_analysis: { label: 'Category Analysis', icon: '📊', description: 'Breakdown by spending category',  columns: ['Category','Total','% of Spend','Avg Transaction','Count'] },
  full_export:       { label: 'Full Export',        icon: '📋', description: 'All data, all fields',            columns: ['Date','Category','Amount','Description','ID'] },
  custom:            { label: 'Custom',             icon: '✏️', description: 'Choose your own columns',         columns: [] },
};

// ─── localStorage keys ────────────────────────────────────────────────────────

const HISTORY_KEY    = 'export_history';
const SCHEDULE_KEY   = 'export_schedules';
const CONNECTED_KEY  = 'connected_services';

// ─── History ──────────────────────────────────────────────────────────────────

export function loadHistory(): ExportHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory(h: ExportHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export function addHistoryEntry(entry: Omit<ExportHistoryEntry, 'id'>): ExportHistoryEntry {
  const full: ExportHistoryEntry = { ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2) };
  const history = [full, ...loadHistory()].slice(0, 50); // keep last 50
  saveHistory(history);
  return full;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export function loadSchedules(): ScheduledExport[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]'); } catch { return []; }
}

function saveSchedules(s: ScheduledExport[]) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));
}

function nextRunDate(freq: ScheduleFrequency): string {
  const d = new Date();
  if (freq === 'daily')   d.setDate(d.getDate() + 1);
  if (freq === 'weekly')  d.setDate(d.getDate() + 7);
  if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function addSchedule(
  frequency: ScheduleFrequency,
  destination: CloudDestination,
  template: ExportTemplate,
): ScheduledExport {
  const schedule: ScheduledExport = {
    id: Date.now().toString(36),
    frequency, destination, template,
    nextRun: nextRunDate(frequency),
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  saveSchedules([schedule, ...loadSchedules()]);
  return schedule;
}

export function toggleSchedule(id: string) {
  const schedules = loadSchedules().map(s =>
    s.id === id ? { ...s, enabled: !s.enabled } : s
  );
  saveSchedules(schedules);
}

export function deleteSchedule(id: string) {
  saveSchedules(loadSchedules().filter(s => s.id !== id));
}

// ─── Connected services ───────────────────────────────────────────────────────

const DEFAULT_CONNECTIONS: ConnectionStatus[] = [
  { destination: 'email',         connected: true,  accountEmail: 'me@example.com' },
  { destination: 'google_sheets', connected: false },
  { destination: 'dropbox',       connected: false },
  { destination: 'onedrive',      connected: false },
  { destination: 'notion',        connected: false },
  { destination: 'airtable',      connected: false },
];

export function loadConnections(): ConnectionStatus[] {
  if (typeof window === 'undefined') return DEFAULT_CONNECTIONS;
  try {
    const stored = JSON.parse(localStorage.getItem(CONNECTED_KEY) || 'null');
    return stored ?? DEFAULT_CONNECTIONS;
  } catch { return DEFAULT_CONNECTIONS; }
}

function saveConnections(c: ConnectionStatus[]) {
  localStorage.setItem(CONNECTED_KEY, JSON.stringify(c));
}

export function connectService(destination: CloudDestination, email: string) {
  const conns = loadConnections().map(c =>
    c.destination === destination
      ? { ...c, connected: true, accountEmail: email, lastSync: new Date().toISOString() }
      : c
  );
  saveConnections(conns);
}

export function disconnectService(destination: CloudDestination) {
  const conns = loadConnections().map(c =>
    c.destination === destination
      ? { destination, connected: false }
      : c
  );
  saveConnections(conns);
}

// ─── Data generators ──────────────────────────────────────────────────────────

function fmtAmt(n: number) { return '$' + n.toFixed(2); }
function escCSV(v: string) { return '"' + String(v).replace(/"/g, '""') + '"'; }

function buildTaxReport(expenses: Expense[]): string {
  const year = new Date().getFullYear();
  const rows = expenses.map(e => [e.date, e.category, e.amount, e.description, String(year)]);
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  return [
    ['Date', 'Category', 'Amount', 'Description', 'Tax Year'],
    ...rows,
    ['', 'TOTAL', fmtAmt(total), '', ''],
  ].map(r => r.map(escCSV).join(',')).join('\n');
}

function buildMonthlySummary(expenses: Expense[]): string {
  const byMonth: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    const m = e.date.slice(0, 7);
    (byMonth[m] = byMonth[m] || []).push(e);
  });
  const rows = Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a)).map(([month, exps]) => {
    const total = exps.reduce((s, e) => s + parseFloat(e.amount), 0);
    const cats: Record<string, number> = {};
    exps.forEach(e => { cats[e.category] = (cats[e.category] || 0) + parseFloat(e.amount); });
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return [month, fmtAmt(total), top, String(exps.length)];
  });
  return [['Month', 'Total Spent', 'Top Category', 'Transaction Count'], ...rows]
    .map(r => r.map(escCSV).join(',')).join('\n');
}

function buildCategoryAnalysis(expenses: Expense[]): string {
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const bycat: Record<string, number[]> = {};
  expenses.forEach(e => {
    (bycat[e.category] = bycat[e.category] || []).push(parseFloat(e.amount));
  });
  const rows = Object.entries(bycat)
    .sort((a, b) => b[1].reduce((s, n) => s + n, 0) - a[1].reduce((s, n) => s + n, 0))
    .map(([cat, amts]) => {
      const catTotal = amts.reduce((s, n) => s + n, 0);
      const avg = catTotal / amts.length;
      return [cat, fmtAmt(catTotal), ((catTotal / total) * 100).toFixed(1) + '%', fmtAmt(avg), String(amts.length)];
    });
  return [['Category', 'Total', '% of Spend', 'Avg Transaction', 'Count'], ...rows]
    .map(r => r.map(escCSV).join(',')).join('\n');
}

function buildFullExport(expenses: Expense[]): string {
  const rows = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => [e.date, e.category, e.amount, e.description, e.id]);
  return [['Date', 'Category', 'Amount', 'Description', 'ID'], ...rows]
    .map(r => r.map(escCSV).join(',')).join('\n');
}

export function buildCSVForTemplate(expenses: Expense[], template: ExportTemplate): string {
  switch (template) {
    case 'tax_report':        return buildTaxReport(expenses);
    case 'monthly_summary':   return buildMonthlySummary(expenses);
    case 'category_analysis': return buildCategoryAnalysis(expenses);
    default:                  return buildFullExport(expenses);
  }
}

// ─── Share link generator (simulated) ────────────────────────────────────────

export function generateShareToken(): string {
  return 'xp_' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function generateShareLink(token: string): string {
  return `https://expensetrack.app/shared/${token}`;
}

// ─── Simulated cloud send ─────────────────────────────────────────────────────

export async function simulateSend(
  expenses: Expense[],
  destination: CloudDestination,
  template: ExportTemplate,
  filename: string,
): Promise<{ shareLink: string }> {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const csv = buildCSVForTemplate(expenses, template);

  // For email and local-compatible destinations, also trigger a real download
  if (destination === 'email' || destination === 'dropbox' || destination === 'onedrive') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const token = generateShareToken();
  return { shareLink: generateShareLink(token) };
}

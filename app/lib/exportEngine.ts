import { Expense, Category } from '@/app/types/expense';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  dateFrom: string;
  dateTo: string;
  categories: Category[];
}

// ── Filter ────────────────────────────────────────────────────────────────────

export function filterExpenses(expenses: Expense[], opts: Pick<ExportOptions, 'dateFrom' | 'dateTo' | 'categories'>): Expense[] {
  return expenses
    .filter(e => {
      const afterFrom  = !opts.dateFrom  || e.date >= opts.dateFrom;
      const beforeTo   = !opts.dateTo    || e.date <= opts.dateTo;
      const inCategory = opts.categories.length === 0 || opts.categories.includes(e.category as Category);
      return afterFrom && beforeTo && inCategory;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function escapeCSV(val: string): string {
  return '"' + String(val).replace(/"/g, '""') + '"';
}

export function generateCSV(expenses: Expense[]): string {
  const header = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map(e => [e.date, e.category, e.amount, e.description]);
  return [header, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n');
}

// ── JSON ──────────────────────────────────────────────────────────────────────

export function generateJSON(expenses: Expense[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2),
    expenses: expenses.map(e => ({
      date: e.date,
      category: e.category,
      amount: parseFloat(e.amount),
      description: e.description,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

// ── PDF (pure browser, no library needed) ────────────────────────────────────
// Generates an HTML page and uses window.print() via a hidden iframe.

export function generateAndDownloadPDF(expenses: Expense[], filename: string): void {
  const totalAmount = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const rows = expenses
    .map(e => `
      <tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td style="text-align:right">$${parseFloat(e.amount).toFixed(2)}</td>
        <td>${e.description}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #6b7280; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f3f4f6; }
    th { padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 600; border-top: 2px solid #e5e7eb; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Expense Report</h1>
  <p class="meta">Exported ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ${expenses.length} records</p>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th style="text-align:right">Amount</th><th>Description</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td style="text-align:right">$${totalAmount.toFixed(2)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument!.open();
  iframe.contentDocument!.write(html);
  iframe.contentDocument!.close();
  setTimeout(() => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 300);
}

// ── Trigger download ──────────────────────────────────────────────────────────

export function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function runExport(expenses: Expense[], opts: ExportOptions): Promise<void> {
  const filtered = filterExpenses(expenses, opts);
  const base = opts.filename.trim() || 'expenses';

  if (opts.format === 'csv') {
    triggerDownload(generateCSV(filtered), `${base}.csv`, 'text/csv;charset=utf-8;');
  } else if (opts.format === 'json') {
    triggerDownload(generateJSON(filtered), `${base}.json`, 'application/json');
  } else {
    generateAndDownloadPDF(filtered, base);
  }

  // Brief artificial delay so loading state is perceptible
  await new Promise(r => setTimeout(r, 600));
}

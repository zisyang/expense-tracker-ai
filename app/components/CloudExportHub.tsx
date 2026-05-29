'use client';
import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/app/types/expense';
import {
  CloudDestination, ExportTemplate, ScheduleFrequency,
  ExportHistoryEntry, ScheduledExport, ConnectionStatus,
  DESTINATION_META, TEMPLATE_META,
  loadHistory, addHistoryEntry, clearHistory,
  loadSchedules, addSchedule, toggleSchedule, deleteSchedule,
  loadConnections, connectService, disconnectService,
  buildCSVForTemplate, simulateSend,
} from '@/app/lib/cloudExport';
import {
  X, Send, Clock, History, Plug, ChevronRight,
  CheckCircle, XCircle, Loader2, Share2, QrCode,
  Copy, Check, Trash2, ToggleLeft, ToggleRight,
  CloudUpload, Zap, Bell, Link,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DestinationCard({
  dest, selected, connected, onClick,
}: { dest: CloudDestination; selected: boolean; connected: boolean; onClick: () => void }) {
  const meta = DESTINATION_META[dest];
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left w-full transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xl">{meta.icon}</span>
        {connected
          ? <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
          : <span className="w-2 h-2 rounded-full bg-gray-200" title="Not connected" />}
      </div>
      <span className="text-xs font-semibold text-gray-900">{meta.label}</span>
      <span className="text-xs text-gray-400 leading-tight">{meta.description}</span>
    </button>
  );
}

function TemplateCard({
  tmpl, selected, onClick,
}: { tmpl: ExportTemplate; selected: boolean; onClick: () => void }) {
  const meta = TEMPLATE_META[tmpl];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <span className="text-lg">{meta.icon}</span>
      <span className="text-xs font-semibold text-gray-900 leading-tight">{meta.label}</span>
      <span className="text-xs text-gray-400 leading-tight">{meta.description}</span>
    </button>
  );
}

function StatusPill({ status }: { status: ExportHistoryEntry['status'] }) {
  const cfg = {
    complete:   { icon: <CheckCircle size={11} />, label: 'Sent',       cls: 'bg-emerald-50 text-emerald-700' },
    processing: { icon: <Loader2 size={11} className="animate-spin" />, label: 'Sending…', cls: 'bg-blue-50 text-blue-700' },
    pending:    { icon: <Clock size={11} />,      label: 'Pending',     cls: 'bg-yellow-50 text-yellow-700' },
    failed:     { icon: <XCircle size={11} />,    label: 'Failed',      cls: 'bg-red-50 text-red-600' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Tab: SEND ────────────────────────────────────────────────────────────────

function SendTab({ expenses }: { expenses: Expense[] }) {
  const [destination, setDestination] = useState<CloudDestination>('email');
  const [template, setTemplate]       = useState<ExportTemplate>('full_export');
  const [filename, setFilename]       = useState('expenses');
  const [recipientEmail, setEmail]    = useState('');
  const [sending, setSending]         = useState(false);
  const [done, setDone]               = useState<{ shareLink: string; entry: ExportHistoryEntry } | null>(null);
  const [copied, setCopied]           = useState(false);

  const connections = loadConnections();
  const conn        = connections.find(c => c.destination === destination);
  const total       = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const tmplMeta    = TEMPLATE_META[template];
  const destMeta    = DESTINATION_META[destination];

  async function handleSend() {
    setSending(true);
    const { shareLink } = await simulateSend(expenses, destination, template, filename.trim() || 'expenses');
    const entry = addHistoryEntry({
      timestamp: new Date().toISOString(),
      destination, template,
      recordCount: expenses.length,
      totalAmount: total,
      status: 'complete',
      shareLink,
      filename: filename.trim() || 'expenses',
    });
    setSending(false);
    setDone({ shareLink, entry });
  }

  function copyLink() {
    if (done) {
      navigator.clipboard.writeText(done.shareLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 text-center px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
          style={{ background: destMeta.bg }}>{destMeta.icon}</div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Sent to {destMeta.label}!</h3>
        <p className="text-sm text-gray-500 mb-6">
          {done.entry.recordCount} records · ${done.entry.totalAmount.toFixed(2)} total
        </p>

        {/* Share link */}
        <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Link size={11} /> Shareable link
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-blue-600 truncate font-mono bg-white border border-gray-100 rounded-lg px-2 py-1.5">
              {done.shareLink}
            </code>
            <button onClick={copyLink}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 shrink-0 transition-colors">
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* QR code placeholder */}
        <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <QrCode size={11} /> QR code
          </p>
          <div className="flex justify-center">
            <QRCodeSVG value={done.shareLink} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setDone(null)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Send again
          </button>
          <button onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Share2 size={13} /> Share link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Destination */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Send to</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DESTINATION_META) as CloudDestination[]).map(d => (
            <DestinationCard
              key={d} dest={d} selected={destination === d}
              connected={connections.find(c => c.destination === d)?.connected ?? false}
              onClick={() => setDestination(d)}
            />
          ))}
        </div>
        {conn?.connected && conn.accountEmail && (
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle size={11} /> Connected as {conn.accountEmail}
          </p>
        )}
        {!conn?.connected && (
          <p className="text-xs text-orange-500 mt-2 flex items-center gap-1.5">
            <Zap size={11} /> Connect this service first in the Connections tab
          </p>
        )}
      </section>

      {/* Template */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Template</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TEMPLATE_META) as ExportTemplate[]).filter(t => t !== 'custom').map(t => (
            <TemplateCard key={t} tmpl={t} selected={template === t} onClick={() => setTemplate(t)} />
          ))}
        </div>
        {tmplMeta.columns.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tmplMeta.columns.map(c => (
              <span key={c} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{c}</span>
            ))}
          </div>
        )}
      </section>

      {/* Options */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Options</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Filename</label>
            <div className="flex gap-2 items-center">
              <input type="text" value={filename} onChange={e => setFilename(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-xs text-gray-400 font-mono shrink-0">.csv</span>
            </div>
          </div>
          {destination === 'email' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Recipient email</label>
              <input type="email" value={recipientEmail} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>
      </section>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-center gap-4 border border-blue-100">
        <CloudUpload size={20} className="text-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {expenses.length} records · ${total.toFixed(2)} total
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            {tmplMeta.label} → {destMeta.label}
          </p>
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {sending
          ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
          : <><Send size={15} /> Send to {destMeta.label}</>}
      </button>
    </div>
  );
}

// ─── Minimal inline QR code (SVG, no external lib) ───────────────────────────

function QRCodeSVG({ value }: { value: string }) {
  // Deterministic grid from string hash — purely decorative/representative
  const hash = value.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
  const cells = 21;
  const size  = 126;
  const cell  = size / cells;

  function isSet(row: number, col: number): boolean {
    // Fixed corner patterns (finder patterns)
    const inCorner = (r: number, c: number, rows: number, cols: number) =>
      r >= 0 && r < rows && c >= 0 && c < cols;
    if (inCorner(row, col, 7, 7) || inCorner(row, col - cells + 7, 7, 7) ||
        inCorner(row - cells + 7, col, 7, 7)) {
      const lr = row < 7 ? row : row - (cells - 7);
      const lc = col < 7 ? col : col - (cells - 7);
      if (lr < 0 || lc < 0) {
        const lr2 = row - (cells - 7); const lc2 = col;
        if (lr2 >= 0 && lr2 < 7 && lc2 >= 0 && lc2 < 7) {
          return lr2 === 0 || lr2 === 6 || lc2 === 0 || lc2 === 6 || (lr2 >= 2 && lr2 <= 4 && lc2 >= 2 && lc2 <= 4);
        }
        return false;
      }
      return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
    }
    // Timing pattern
    if (row === 6 || col === 6) return (row + col) % 2 === 0;
    // Data area — pseudo-random from hash
    const seed = (hash ^ (row * 31 + col * 17)) >>> 0;
    return (seed % 3) !== 0;
  }

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isSet(r, c)) {
        rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" />);
      }
    }
  }

  return (
    <svg width={size + 16} height={size + 16} viewBox={`-8 -8 ${size + 16} ${size + 16}`}
      className="rounded-lg border border-gray-100 bg-white">
      <rect x={-8} y={-8} width={size + 16} height={size + 16} fill="white" />
      {rects}
    </svg>
  );
}

// ─── Tab: SCHEDULE ────────────────────────────────────────────────────────────

function ScheduleTab() {
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [freq, setFreq]           = useState<ScheduleFrequency>('weekly');
  const [dest, setDest]           = useState<CloudDestination>('email');
  const [tmpl, setTmpl]           = useState<ExportTemplate>('monthly_summary');
  const [added, setAdded]         = useState(false);

  useEffect(() => { setSchedules(loadSchedules()); }, []);

  function handleAdd() {
    const s = addSchedule(freq, dest, tmpl);
    setSchedules(prev => [s, ...prev]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleToggle(id: string) {
    toggleSchedule(id);
    setSchedules(loadSchedules());
  }

  function handleDelete(id: string) {
    deleteSchedule(id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  }

  const freqOptions: { value: ScheduleFrequency; label: string; icon: string }[] = [
    { value: 'daily',   label: 'Daily',   icon: '☀️' },
    { value: 'weekly',  label: 'Weekly',  icon: '📅' },
    { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Bell size={11} /> New schedule
        </h3>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Frequency</label>
          <div className="flex gap-2">
            {freqOptions.map(o => (
              <button key={o.value} onClick={() => setFreq(o.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 text-xs font-medium transition-all ${
                  freq === o.value ? 'border-blue-500 bg-white text-blue-700' : 'border-transparent bg-white text-gray-500 hover:border-gray-200'
                }`}>
                <span>{o.icon}</span>{o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Destination</label>
            <select value={dest} onChange={e => setDest(e.target.value as CloudDestination)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {(Object.keys(DESTINATION_META) as CloudDestination[]).map(d => (
                <option key={d} value={d}>{DESTINATION_META[d].icon} {DESTINATION_META[d].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Template</label>
            <select value={tmpl} onChange={e => setTmpl(e.target.value as ExportTemplate)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {(Object.keys(TEMPLATE_META) as ExportTemplate[]).filter(t => t !== 'custom').map(t => (
                <option key={t} value={t}>{TEMPLATE_META[t].icon} {TEMPLATE_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleAdd}
          className={`w-full py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            added ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          {added ? <><Check size={13} /> Schedule added!</> : <><Clock size={13} /> Create schedule</>}
        </button>
      </section>

      {schedules.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Active schedules</h3>
          <div className="space-y-2">
            {schedules.map(s => (
              <div key={s.id}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                <span className="text-lg shrink-0">{DESTINATION_META[s.destination].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">
                    {TEMPLATE_META[s.template].label} → {DESTINATION_META[s.destination].label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1)} · Next: {fmtDate(s.nextRun)}
                  </p>
                </div>
                <button onClick={() => handleToggle(s.id)} className="text-gray-400 hover:text-blue-600 transition-colors shrink-0">
                  {s.enabled ? <ToggleRight size={20} className="text-blue-500" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {schedules.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Clock size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No schedules yet</p>
          <p className="text-xs mt-1">Set one up above to automate your exports</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: HISTORY ─────────────────────────────────────────────────────────────

function HistoryTab() {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [copied, setCopied]   = useState<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <History size={28} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No export history yet</p>
        <p className="text-xs mt-1">Sent exports will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">{history.length} exports</p>
        <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-600 transition-colors">
          Clear history
        </button>
      </div>
      <div className="space-y-2">
        {history.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">{DESTINATION_META[e.destination].icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-gray-900">
                    {TEMPLATE_META[e.template].label} → {DESTINATION_META[e.destination].label}
                  </p>
                  <StatusPill status={e.status} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {e.recordCount} records · ${e.totalAmount.toFixed(2)} · {timeAgo(e.timestamp)}
                </p>
                {e.shareLink && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-blue-500 font-mono truncate flex-1 bg-blue-50 px-2 py-1 rounded">
                      {e.shareLink}
                    </code>
                    <button onClick={() => copyLink(e.shareLink!, e.id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 shrink-0 transition-colors">
                      {copied === e.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: CONNECTIONS ─────────────────────────────────────────────────────────

function ConnectionsTab() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [connecting, setConnecting]   = useState<CloudDestination | null>(null);
  const [emailInput, setEmailInput]   = useState('');

  useEffect(() => { setConnections(loadConnections()); }, []);

  async function handleConnect(dest: CloudDestination) {
    setConnecting(dest);
    await new Promise(r => setTimeout(r, 1000));
    const email = dest === 'email' ? (emailInput || 'me@example.com') : `user@${dest.replace('_', '')}.com`;
    connectService(dest, email);
    setConnections(loadConnections());
    setConnecting(null);
  }

  function handleDisconnect(dest: CloudDestination) {
    disconnectService(dest);
    setConnections(loadConnections());
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">
        Connect your accounts to enable cloud export destinations.
        Connections are saved locally.
      </p>
      {connections.map(conn => {
        const meta = DESTINATION_META[conn.destination];
        const isConnecting = connecting === conn.destination;
        return (
          <div key={conn.destination}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: meta.bg }}>{meta.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{meta.label}</p>
              {conn.connected && conn.accountEmail
                ? <p className="text-xs text-emerald-600">{conn.accountEmail}</p>
                : <p className="text-xs text-gray-400">{meta.description}</p>}
              {conn.connected && conn.lastSync && (
                <p className="text-xs text-gray-300 mt-0.5">Last sync {timeAgo(conn.lastSync)}</p>
              )}
            </div>
            {conn.connected ? (
              <button onClick={() => handleDisconnect(conn.destination)}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                Disconnect
              </button>
            ) : (
              <button onClick={() => handleConnect(conn.destination)} disabled={isConnecting}
                className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50">
                {isConnecting ? <Loader2 size={11} className="animate-spin" /> : <Plug size={11} />}
                {isConnecting ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type PanelTab = 'send' | 'schedule' | 'history' | 'connections';

interface CloudExportHubProps {
  expenses: Expense[];
  onClose: () => void;
}

export default function CloudExportHub({ expenses, onClose }: CloudExportHubProps) {
  const [tab, setTab] = useState<PanelTab>('send');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'send',        label: 'Send',        icon: <Send size={13} /> },
    { id: 'schedule',    label: 'Schedule',    icon: <Clock size={13} /> },
    { id: 'history',     label: 'History',     icon: <History size={13} /> },
    { id: 'connections', label: 'Connections', icon: <Plug size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Slide-in panel from right */}
      <div className="relative h-full sm:h-[90vh] w-full sm:max-w-sm bg-white shadow-2xl flex flex-col"
        style={{ borderRadius: '20px 0 0 20px' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <CloudUpload size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Cloud Export</h2>
                <p className="text-xs text-gray-400">{expenses.length} records ready</p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-2 shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'send'        && <SendTab expenses={expenses} />}
          {tab === 'schedule'    && <ScheduleTab />}
          {tab === 'history'     && <HistoryTab />}
          {tab === 'connections' && <ConnectionsTab />}
        </div>
      </div>
    </div>
  );
}

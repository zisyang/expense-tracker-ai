# ExpenseTrack — Personal Finance Manager

A modern, full-featured expense tracking app built with Next.js 14, TypeScript, Tailwind CSS, and Recharts.

## Features

- **Dashboard** — spending metrics, category pie chart, 6-month bar chart, recent expenses
- **Expense list** — search, filter by category & date range, edit, delete
- **Add/Edit form** — full validation, date picker, category selector
- **localStorage persistence** — data survives page refreshes
- **Demo data** — pre-seeded with 18 expenses across 6 months
- **Responsive** — works on desktop and mobile

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
open http://localhost:3000
```

## Build for production

```bash
npm run build
npm start
```

---

## Export feature branches

The export functionality has been developed in three independent branches, each a completely different approach. Merge whichever fits your needs.

### `feature-data-export-v1` — Simple export
**Philosophy:** one button, instant download, no friction.

- "Export Data" button in the dashboard header
- Downloads all expenses as a CSV file immediately on click
- Columns: Date, Category, Amount, Description
- Button is disabled when there are no expenses
- ~15 lines of new code across 2 files

**Files changed:** `app/components/Dashboard.tsx`, `app/lib/utils.ts`

---

### `feature-data-export-v2` — Advanced local export
**Philosophy:** full control before committing to a download.

- 3-step modal wizard: **Options → Preview → Done**
- **Step 1 – Options:** format picker (CSV / JSON / PDF), custom filename, date range filter, category multi-select, live record count + total amount summary
- **Step 2 – Preview:** paginated table (up to 50 rows) showing exactly what will be exported, with colour-coded category badges
- **Step 3 – Done:** confirmation with re-export shortcut
- PDF uses a hidden iframe + `window.print()` — no external library
- JSON export includes metadata: `exportedAt`, `totalRecords`, `totalAmount`
- Escape key and click-outside both close the modal
- ~505 lines across 3 files

**Files changed:** `app/components/Dashboard.tsx` (modified), `app/components/ExportModal.tsx` (new), `app/lib/exportEngine.ts` (new)

---

### `feature-data-export-v3` — Cloud-integrated export hub
**Philosophy:** treat export as a connected, ongoing service — not a one-off action.

A slide-in panel (Notion/Linear style) with four tabs:

| Tab | What it does |
|-----|-------------|
| **Send** | Pick from 6 destinations (Email, Google Sheets, Dropbox, OneDrive, Notion, Airtable), choose a template, set filename, send — success screen shows a shareable link and inline SVG QR code |
| **Schedule** | Set up recurring exports (daily / weekly / monthly) to any destination with any template; toggle or delete schedules; next-run dates calculated automatically |
| **History** | Full audit log of every export — destination, template, record count, total, relative timestamp, status pill, copy-to-clipboard share link |
| **Connections** | Connect/disconnect cloud accounts with simulated OAuth flow; shows connected email and last sync time |

Four structurally distinct CSV templates:
- **Tax Report** — date, category, amount, description, tax year + total row
- **Monthly Summary** — aggregated by month with top category and transaction count
- **Category Analysis** — total, % of spend, avg transaction, count per category
- **Full Export** — all fields including internal ID

All state (history, schedules, connections) persists to localStorage.
~977 lines across 3 files.

**Files changed:** `app/components/Dashboard.tsx` (modified), `app/components/CloudExportHub.tsx` (new), `app/lib/cloudExport.ts` (new)

---

### Branch comparison

|  | `v1` | `v2` | `v3` |
|--|------|------|------|
| UI pattern | Single button | Modal wizard | Slide-in panel |
| Formats | CSV | CSV, JSON, PDF | 4 CSV templates |
| Filtering | None | Date range + category | Per-destination |
| Preview | None | Full paginated table | None |
| Destinations | Browser download | Browser download | 6 cloud services |
| Sharing | None | None | Links + QR codes |
| Scheduling | None | None | Daily/weekly/monthly |
| History | None | None | Full audit log |
| Persisted state | None | None | Yes (localStorage) |
| New lines of code | ~15 | ~505 | ~977 |

### To merge a branch into master

```bash
git checkout master
git merge feature-data-export-v1   # or v2, or v3
```

---

## Project structure

```
app/
├── types/
│   └── expense.ts              # Expense interface, Category type, constants
├── lib/
│   ├── storage.ts              # localStorage helpers + uid()
│   ├── utils.ts                # formatCurrency, chart data, CSV export, seed data
│   ├── exportEngine.ts         # v2: CSV/JSON/PDF generators, filter logic
│   └── cloudExport.ts          # v3: templates, destinations, history, schedules
├── components/
│   ├── Dashboard.tsx           # Metrics + Recharts charts + recent list
│   ├── ExpenseForm.tsx         # Validated add/edit form
│   ├── ExpenseList.tsx         # Filterable list with edit/delete
│   ├── FilterBar.tsx           # Search + category + date range filters
│   ├── CategoryBadge.tsx       # Colored category icon badge
│   ├── Toast.tsx               # Success notification
│   ├── ExportModal.tsx         # v2: 3-step export wizard modal
│   └── CloudExportHub.tsx      # v3: slide-in cloud export panel
├── globals.css                 # Tailwind + Inter font
├── layout.tsx                  # Root layout with metadata
└── page.tsx                    # Main page — tab navigation + state
```

## Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 14.2.5 | App Router, SSR |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 2.12 | Charts |
| Lucide React | 0.400 | Icons |
| date-fns | 3.6 | Date utilities |

## Categories

Food · Transportation · Entertainment · Shopping · Bills · Other

# ExpenseTrack — Personal Finance Manager

A modern, full-featured expense tracking app built with Next.js 14, TypeScript, Tailwind CSS, and Recharts.

## Features

- **Dashboard** — spending metrics, category pie chart, 6-month bar chart, recent expenses
- **Expense list** — search, filter by category & date range, edit, delete
- **Add/Edit form** — full validation, date picker, category selector
- **CSV export** — download filtered expenses
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

## Project structure

```
app/
├── types/
│   └── expense.ts          # Expense interface, Category type, constants
├── lib/
│   ├── storage.ts          # localStorage helpers + uid()
│   └── utils.ts            # formatCurrency, chart data, CSV export, seed data
├── components/
│   ├── Dashboard.tsx       # Metrics + Recharts charts + recent list
│   ├── ExpenseForm.tsx     # Validated add/edit form
│   ├── ExpenseList.tsx     # Filterable list with edit/delete
│   ├── FilterBar.tsx       # Search + category + date range filters
│   ├── CategoryBadge.tsx   # Colored category icon badge
│   └── Toast.tsx           # Success notification
├── globals.css             # Tailwind + Inter font
├── layout.tsx              # Root layout with metadata
└── page.tsx                # Main page — tab navigation + state
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

## Build for production

```bash
npm run build
npm start
```

## Categories

Food · Transportation · Entertainment · Shopping · Bills · Other

# FinDash — Notion-Inspired Financial Dashboard

A sleek, customisable financial dashboard built with **Next.js 16**, **Tailwind CSS 4**, and **Supabase Auth**. Drag, resize, and rearrange real-time market widgets on a free-form grid — think Notion meets Bloomberg Terminal.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ecf8e?logo=supabase)
![Finnhub](https://img.shields.io/badge/Finnhub-API-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

### Dashboard Grid
- **Drag & drop** widgets anywhere on the grid via grab handles
- **Resize** any widget by dragging its corner
- Layout **auto-saves** to `localStorage` and persists across reloads
- **Add / remove** widgets on the fly from the floating action button
- Smooth CSS-transform animations and a placeholder preview while dragging

### Multi-Dashboard Support
- **Create multiple dashboards** for different purposes (e.g., "Main Portfolio", "Commodities", "News & Events")
- **Sidebar navigation** to switch between dashboards quickly
- **Rename and delete** dashboards with confirmation
- Each dashboard has its own widget layout and configuration
- **Blank template** option for starting fresh

### Widgets (15+ built-in)
| Widget | Description |
|---|---|
| **Stock Quote** | Live price, % change, OHLC data, and optional sparkline |
| **Price Chart** | Candlestick-resolution line chart with 1D–1Y range selector |
| **Company News** | Sentiment-tagged news feed for any ticker (editable) |
| **Market News** | General financial headlines |
| **Portfolio Tracker** | Add holdings (ticker / qty / avg cost), live P&L, and donut allocation chart |
| **Watchlist** | Sortable table of tickers with price, change (responsive card/table view) |
| **Market Overview** | Major-index quotes with mini sparklines |
| **Sector Heatmap** | Color-coded sector performance at a glance (responsive grid) |
| **Earnings Calendar** | Upcoming earnings dates and EPS estimates |
| **Technical Indicators** | Key financial metrics (P/E, market cap, 52-wk range, etc.) |
| **Crypto Tracker** | Real-time cryptocurrency quotes (BTC, ETH, SOL, etc.) |
| **Company Profile** | Detailed company information (market cap, industry, IPO date, etc.) |
| **Forex Rates** | Foreign exchange rates with base currency selector |
| **IPO Calendar** | Upcoming initial public offerings |
| **Insider Sentiment** | Insider trading sentiment analysis with bar chart |

### UI / UX
- **Dark / Light theme** with system-preference detection and manual toggle
- Notion-style hover-reveal drag handle and action buttons
- Loading skeletons, price-pulse animations, and glass-morphism cards
- **Responsive widgets** that adapt their layout when resized (vertical ↔ horizontal, hide/show elements)
- **Scrollable dashboard** — all widgets accessible even when many are added
- **Command palette** (`Ctrl+K` / `⌘K`) for instant stock search
- Responsive breakpoints (`lg` / `md` / `sm`) — works on tablets too
- Global rate-limit toast notifications
- **Minimum widget sizes** enforced to prevent unreadable layouts

### Data & Persistence
- All market data from [Finnhub](https://finnhub.io/) (free tier supported)
- Built-in API client with **request-level caching** and **deduplication**
- Widget configs, layouts, and portfolio holdings saved to `localStorage` with version migration
- API key entered once via onboarding flow or header input — never leaves the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Auth | Supabase (Google OAuth) |
| Data | Finnhub REST API |
| Charts | Recharts 3 |
| Grid | react-grid-layout 2 |
| Icons | Lucide React |
| Language | TypeScript 5 |

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- A free **Finnhub** API key — [register here](https://finnhub.io/register)
- A **Supabase** project (for auth) — [create one](https://supabase.com/dashboard)

### 1. Clone & install

```bash
git clone https://github.com/<your-user>/FinDashDesign.git
cd FinDashDesign
npm install
```

### 2. Configure environment

Create a `.env.local` (or `.env`) file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Note:** The Finnhub API key is entered through the app UI (onboarding flow) and stored in the browser's `localStorage`. It never touches the server.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be guided through:
1. **Login (Google OAuth)** (Supabase auth)
2. **Onboarding** — paste your Finnhub API key (verified live)
3. **Dashboard** — start dragging widgets!

---

## Project Structure

```
FinDashDesign/
├── app/
│   ├── (auth)/login/       # Google OAuth sign-in page
│   ├── auth/callback/       # OAuth callback handler
│   ├── dashboard/          # Main dashboard page
│   ├── onboarding/         # First-time setup flow
│   ├── clear-storage/      # Dev utility to reset localStorage
│   ├── globals.css         # Theme variables & grid overrides
│   └── layout.tsx          # Root layout + font loading
├── components/
│   ├── DashboardGrid.tsx   # react-grid-layout orchestrator
│   ├── Header.tsx          # Top bar (search, API key, theme, sign-out)
│   ├── OnboardingFlow.tsx  # 3-step onboarding wizard
│   ├── CommandPalette.tsx  # ⌘K stock search modal
│   ├── ChartDeferredRender.tsx  # Stable chart rendering wrapper
│   └── widgets/            # All 10 widget components
├── lib/
│   ├── finnhub.ts          # Finnhub API types & fetch helpers
│   ├── apiClient.ts        # Caching + dedup API client
│   ├── cache.ts            # localStorage cache with TTL
│   ├── storage.ts          # Typed localStorage helpers
│   ├── formatters.ts       # Currency / number / percent formatters
│   ├── widgetConfig.ts     # Widget type definitions & presets
│   └── supabaseClient.ts   # Supabase client singleton
└── hooks/
    └── useKeyboardShortcuts.ts
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Configuration Notes

- **React Strict Mode** is disabled in `next.config.ts` to prevent double-render issues with Recharts dimension calculations.
- **Layout version** (`LAYOUT_VERSION` in `DashboardGrid.tsx`) is bumped when default widget positions change — this auto-resets stale layouts in `localStorage`.
- **Portfolio version** (`PORTFOLIO_VERSION` in `PortfolioTracker.tsx`) works similarly for saved holdings.
- The `ChartDeferredRender` wrapper delays Recharts mounting until the container has valid dimensions, preventing the infamous `width(-1) height(-1)` error.

---

## License

MIT — use it however you like.

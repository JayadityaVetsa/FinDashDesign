export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--accent-blue)] opacity-[0.08] blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-[var(--accent-green)] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-base font-bold text-white shadow-lg">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                FinDash
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Notion-inspired financial dashboard
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
            <span className="hidden sm:inline text-[var(--text-muted)]">
              Built with Next.js, Finnhub & Supabase
            </span>
            <a
              href="/login"
              className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
            >
              Log in
            </a>
            <a
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[var(--accent-blue)] px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get started — it&apos;s free
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-14 grid flex-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] lg:items-center">
          {/* Left copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
              Live market widgets on a Notion-style canvas
            </div>

            <div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Build a financial workspace{" "}
                <span className="text-[var(--accent-blue)]">you</span> control.
              </h1>
              <p className="mt-4 max-w-xl text-balance text-sm text-[var(--text-secondary)] sm:text-base">
                Drag, resize, and rearrange real-time market widgets on a free-form
                grid. FinDash feels like Notion, but speaks the language of
                portfolios, watchlists, and earnings instead of pages and blocks.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent-blue)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get started — it&apos;s free
              </a>
              <span
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-2 text-xs font-medium text-[var(--text-secondary)]"
              >
                No credit card · your data syncs across devices
              </span>
            </div>

            <dl className="grid max-w-lg grid-cols-2 gap-4 text-xs text-[var(--text-secondary)] sm:text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  For every investor
                </dt>
                <dd className="mt-1">
                  Switch between Focused, Portfolio, and Trader presets — or start
                  from a blank canvas and design your own terminal.
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Cloud-synced &amp; per-user
                </dt>
                <dd className="mt-1">
                  Dashboards, portfolio, and settings are saved to your
                  Supabase-backed account — sign in on any device and pick up
                  where you left off.
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: dashboard preview card */}
          <div className="relative">
            <div className="pointer-events-none absolute -top-6 -right-10 h-32 w-32 rounded-full bg-[var(--accent-blue)] opacity-[0.14] blur-3xl" />
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-4 shadow-2xl backdrop-blur-xl">
              {/* Mini header */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-blue)]/80 text-[10px] font-semibold text-white">
                    F
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">
                      Main Portfolio
                    </span>
                    <span className="ml-1 text-[var(--text-muted)]">· Overview</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    Live
                  </span>
                  <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    Drag &amp; drop
                  </span>
                </div>
              </div>

              {/* Fake grid of widgets */}
              <div className="grid grid-cols-12 gap-2 text-[10px] text-[var(--text-secondary)]">
                <div className="col-span-4 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      AAPL
                    </span>
                    <span className="text-[var(--accent-green)]">+1.82%</span>
                  </div>
                  <div className="mt-1 h-8 rounded bg-[var(--bg-card-hover)]" />
                </div>
                <div className="col-span-4 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      MSFT
                    </span>
                    <span className="text-[var(--accent-red)]">-0.64%</span>
                  </div>
                  <div className="mt-1 h-8 rounded bg-[var(--bg-card-hover)]" />
                </div>
                <div className="col-span-4 row-span-2 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      Market overview
                    </span>
                    <span className="text-[var(--text-muted)]">S&P, NASDAQ, DOW</span>
                  </div>
                  <div className="mt-2 h-14 rounded bg-[var(--bg-card-hover)]" />
                </div>
                <div className="col-span-6 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      Watchlist
                    </span>
                    <span className="text-[var(--text-muted)]">6 symbols</span>
                  </div>
                  <div className="mt-1 space-y-1.5">
                    <div className="flex items-center justify-between rounded bg-[var(--bg-card-hover)] px-2 py-1">
                      <span>NVDA</span>
                      <span className="text-[var(--accent-green)]">+3.12%</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-[var(--bg-card-hover)] px-2 py-1">
                      <span>TSLA</span>
                      <span className="text-[var(--accent-red)]">-1.04%</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      Portfolio
                    </span>
                    <span className="text-[var(--accent-green)]">+4.7% today</span>
                  </div>
                  <div className="mt-1 h-10 rounded bg-[var(--bg-card-hover)]" />
                </div>
                <div className="col-span-12 rounded-lg bg-[var(--bg-secondary)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      Earnings &amp; headlines
                    </span>
                    <span className="text-[var(--text-muted)]">This week</span>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <div className="h-9 flex-1 rounded bg-[var(--bg-card-hover)]" />
                    <div className="h-9 flex-1 rounded bg-[var(--bg-card-hover)]" />
                    <div className="h-9 flex-1 rounded bg-[var(--bg-card-hover)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature row */}
        <section className="mt-10 grid gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)] sm:grid-cols-3">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Drag &amp; drop dashboards
            </h3>
            <p className="mt-1.5">
              Free-form grid powered by <span className="mono">react-grid-layout</span>.
              Every widget can be resized, rearranged, or removed in a couple of
              clicks.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Real-time market data
            </h3>
            <p className="mt-1.5">
              Live quotes, news, earnings, crypto, and forex via Finnhub&apos;s free
              tier — with request-level caching and rate-limit protection built-in.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Multi-dashboard workspaces
            </h3>
            <p className="mt-1.5">
              Create dashboards for your main portfolio, a trading setup, or a news
              wall. Layouts auto-save to your Supabase account and sync across
              devices.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

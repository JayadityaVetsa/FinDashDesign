import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, ListChecks, GraduationCap } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/PublicShell";
import { FEEDBACK_URL } from "@/lib/site";
export const metadata: Metadata = { alternates: { canonical: "/" } };
const faqs = [
  ["Can I try it without making an account?", "Yes. The interactive demo uses clearly labeled, invented sample prices and news. You can edit a watchlist, change sample holdings, and rearrange widgets without registering or entering an API key."],
  ["What do I need for my real workspace?", "Create a FinDash account, then connect your own Finnhub API key during setup. A free Finnhub key supports a range of quotes and company data. Some history, crypto, forex, and other endpoints may require a paid Finnhub plan."],
  ["Does FinDash connect to my brokerage or place trades?", "No. You enter holdings manually. FinDash is a tracking workspace, not a brokerage, and its displayed totals are not a complete brokerage statement or tax calculation."],
  ["Is my portfolio public?", "Your account’s dashboards and holdings are private to your session. The demo link only opens a sample workspace; it does not share your real portfolio. Demo edits stay in your browser."],
  ["Is FinDash free?", "The current FinDash app and sample demo have no subscription charge. Market data comes from your own Finnhub account and is subject to its plans, coverage, and limits."],
];
export default function Home() {
  return <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <PublicHeader />
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-2 lg:items-center lg:pt-20">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]">For students and newer investors</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Your first financial workspace.<br /><span className="text-[var(--accent-blue)]">Make it your own.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[var(--text-secondary)]">Keep the stocks you’re learning about, company news, and your holdings in one place. Start with a hands-on sample workspace before connecting your own market data.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-6 py-3 font-semibold text-white">Try the interactive demo <ArrowRight size={17} /></Link><Link href="/login?mode=signup" className="rounded-xl border border-[var(--border)] px-6 py-3 font-medium">Create a workspace</Link></div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Demo: no account or API key. Real market data: your own Finnhub key.</p>
        </div>
        <Link href="/demo" aria-label="Open the interactive sample dashboard" className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4 text-sm"><span className="font-semibold">Your learning workspace</span><span className="rounded-full bg-[var(--accent-amber)]/10 px-2 py-1 text-xs text-[var(--accent-amber)]">Illustrative sample</span></div>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 rounded-xl bg-[var(--bg-secondary)] p-3"><p className="mb-4 text-xs font-semibold uppercase text-[var(--text-muted)]">Watchlist</p>{["AAPL", "MSFT", "GOOGL", "NVDA"].map((ticker, i) => <div key={ticker} className="flex justify-between border-t border-[var(--border)] py-3 text-xs"><span className="mono">{ticker}</span><span className={i === 2 ? "text-[var(--accent-red)]" : "text-[var(--accent-green)]"}>{i === 2 ? "−0.6%" : "+1.2%"}</span></div>)}</div>
            <div className="col-span-3 rounded-xl bg-[var(--bg-secondary)] p-3"><p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Sample price chart</p><svg role="img" aria-label="Illustrative upward and downward sample price movements, not market data" viewBox="0 0 240 140" className="mt-4 w-full"><path d="M0 120H240M0 80H240M0 40H240" stroke="currentColor" opacity="0.08" /><polyline points="0,110 20,100 40,106 60,70 80,86 100,63 120,75 140,35 160,50 180,20 200,32 220,15 240,25" fill="none" stroke="var(--accent-blue)" strokeWidth="3" /></svg><p className="mt-2 text-xs text-[var(--text-muted)]">Choose what you want to follow.</p></div>
            <div className="col-span-5 flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] p-4 text-sm"><span>Watchlist · Portfolio · Company news</span><span className="text-[var(--accent-blue)]">Explore →</span></div>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">Open the demo to edit, drag, resize, and explore.</p>
        </Link>
      </section>
      <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:grid-cols-3">{[
          { icon: ListChecks, title: "Follow a few companies", text: "Build a watchlist with purpose, then keep relevant quotes and company news together." },
          { icon: LayoutDashboard, title: "Arrange your own view", text: "Add, move, and resize widgets. Your signed-in workspace saves across devices." },
          { icon: GraduationCap, title: "Learn the workflow first", text: "Use sample holdings and beginner guides before entering your real tracking information." },
        ].map(({ icon: Icon, title, text }) => <div key={title}><Icon className="mb-4 text-[var(--accent-blue)]" size={24} /><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p></div>)}</div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-blue)]">Start here</p><h2 className="mt-3 text-2xl font-semibold">One small workspace. A clearer routine.</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2"><Link href="/guides/first-stock-watchlist" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"><p className="text-xs text-[var(--text-muted)]">Watchlist guide · 4 min</p><h3 className="mt-3 text-lg font-semibold">Build your first stock watchlist</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">Pick a manageable set of symbols and learn what to review—without turning the list into a buy recommendation.</p><p className="mt-4 text-sm text-[var(--accent-blue)]">Read the guide →</p></Link><Link href="/guides/portfolio-tracking-basics" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"><p className="text-xs text-[var(--text-muted)]">Portfolio guide · 4 min</p><h3 className="mt-3 text-lg font-semibold">Understand your portfolio tracker</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">Learn quantity, average cost, current value, and what a simple gain/loss calculation leaves out.</p><p className="mt-4 text-sm text-[var(--accent-blue)]">Read the guide →</p></Link></div>
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-12"><h2 className="mb-6 text-2xl font-semibold">Before you get started</h2>{faqs.map(([q, a]) => <details key={q} className="border-b border-[var(--border)] py-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{a}</p></details>)}</section>
      <section className="mx-auto max-w-6xl px-5"><div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 sm:p-10"><h2 className="text-2xl font-semibold">Help shape FinDash’s student beta</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Try the demo and tell us one thing that felt useful and one thing that felt confusing. Specific feedback matters more than a polished review.</p><div className="mt-6 flex flex-wrap gap-4"><Link href="/demo" className="rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 font-semibold text-white">Explore the demo</Link><a href={FEEDBACK_URL} className="rounded-lg border border-[var(--border)] px-5 py-2.5">Share beta feedback</a></div><p className="mt-3 text-xs text-[var(--text-muted)]">Feedback opens a public GitHub issue. Leave out passwords, API keys, and account details.</p></div></section>
    </main>
    <PublicFooter />
  </div>;
}

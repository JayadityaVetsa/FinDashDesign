import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { FEEDBACK_URL, REPOSITORY_URL } from "@/lib/site";
export function PublicHeader() {
  return <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
    <Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-white">F</span>FinDash</Link>
    <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm"><Link href="/demo">Try demo</Link><Link href="/guides">Guides</Link><Link href="/login" className="text-[var(--text-secondary)]">Log in</Link><ThemeToggle /></nav>
  </header>;
}
export function PublicFooter() {
  return <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] px-5 py-7 text-xs text-[var(--text-secondary)]">
    <p>FinDash · A workspace for learning and tracking. No trades are placed.</p>
    <nav aria-label="Footer navigation" className="flex flex-wrap gap-4"><Link href="/guides">Beginner guides</Link><Link href="/privacy">Privacy & data</Link><a href={FEEDBACK_URL}>Give feedback</a><a href={REPOSITORY_URL}>Source code</a></nav>
  </footer>;
}

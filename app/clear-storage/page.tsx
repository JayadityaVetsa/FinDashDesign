"use client";
import { useState } from "react";
import Link from "next/link";
import { clearCache } from "@/lib/cache";
export default function ClearStoragePage() {
  const [done, setDone] = useState(false);
  return <main className="flex min-h-screen items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
    <h1 className="text-xl font-semibold">Refresh your market cache</h1>
    <p className="mt-3 text-sm text-[var(--text-secondary)]">Remove cached market data to fetch fresh quotes. Your saved workspace and pending edits are preserved.</p>
    <button onClick={() => { clearCache(); setDone(true); }} className="mt-5 rounded-lg bg-[var(--accent-blue)] px-5 py-2 text-white">{done ? "Cache cleared" : "Clear market cache"}</button>
    <Link href="/dashboard" className="mt-4 block text-sm text-[var(--accent-blue)]">Back to dashboard</Link>
  </div></main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/PublicShell";
import { guides } from "@/lib/guides";
export function generateStaticParams() { return guides.map(guide => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);
  return guide ? { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${slug}` }, openGraph: { title: guide.title, description: guide.description, type: "article" } } : { title: "Guide not found", robots: { index: false } };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);
  if (!guide) notFound();
  return <><PublicHeader /><main className="mx-auto max-w-3xl px-5 py-10"><Link href="/guides" className="text-sm text-[var(--accent-blue)]">← Beginner guides</Link><article><p className="mt-7 text-xs text-[var(--text-muted)]">FinDash guides · {guide.time} read</p><h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{guide.title}</h1><p className="mt-5 text-lg leading-8 text-[var(--text-secondary)]">{guide.description}</p><Link href="/demo" className="mt-6 inline-block rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 font-semibold text-white">Practice in the sample demo</Link>{guide.sections.map((section, i) => <section key={section.title} className="mt-10"><h2 className="text-xl font-semibold">{i + 1}. {section.title}</h2>{section.paragraphs.map(p => <p key={p} className="mt-4 leading-7 text-[var(--text-secondary)]">{p}</p>)}</section>)}<section className="mt-10 rounded-xl border border-[var(--border)] p-5"><h2 className="font-semibold">Further reading</h2><ul className="mt-3 space-y-2 text-sm">{guide.sources.map(source => <li key={source.url}><a className="text-[var(--accent-blue)] underline" href={source.url}>{source.title}</a></li>)}</ul></section></article><div className="mt-9 flex flex-wrap gap-4"><Link href="/demo" className="rounded-lg border border-[var(--border)] px-5 py-3">Explore the demo</Link><Link href="/login?mode=signup" className="rounded-lg bg-[var(--accent-blue)] px-5 py-3 font-semibold text-white">Create your workspace</Link></div></main><PublicFooter /></>;
}

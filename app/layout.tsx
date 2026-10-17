import type { Metadata } from "next";
import ThemeScript from "@/components/ThemeScript";
import PublicAnalytics from "@/components/PublicAnalytics";
import { SITE_URL } from "@/lib/site";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "FinDash — A financial workspace for students and newer investors", template: "%s | FinDash" },
  description: "Learn your way around watchlists and portfolio tracking. Try a customizable financial dashboard with sample data, then connect your own market data.",
  openGraph: { type: "website", siteName: "FinDash", title: "FinDash — Your first financial workspace", description: "Try an interactive dashboard demo. No account or API key needed for sample data." },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased"
      >
        <ThemeScript />
        {children}
        <PublicAnalytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import ThemeScript from "@/components/ThemeScript";
import "./globals.css";


export const metadata: Metadata = {
  title: "FinDash",
  description: "Premium financial terminal dashboard",
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
      </body>
    </html>
  );
}

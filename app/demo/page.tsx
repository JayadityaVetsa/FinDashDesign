import type { Metadata } from "next";
import DemoWorkspace from "@/components/DemoWorkspace";
export const metadata: Metadata = {
  title: "Try the interactive financial dashboard demo",
  description: "Build a sample watchlist and explore portfolio widgets without an account or API key. A hands-on introduction for students and newer investors.",
  alternates: { canonical: "/demo" },
};
export default function DemoPage() { return <DemoWorkspace />; }

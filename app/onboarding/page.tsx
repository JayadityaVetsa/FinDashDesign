"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // Not logged in — send to login
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
      setChecking(false);
    });
  }, [router]);

  if (checking || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent-blue)]" />
      </div>
    );
  }

  return (
    <OnboardingFlow
      userId={userId}
      onComplete={() => router.push("/dashboard")}
    />
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/authClient";
import OnboardingFlow from "@/components/OnboardingFlow";
import AuthGate from "@/components/AuthGate";
export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    auth.getSession().then(session => {
      if (mounted && session) setUserId(session.user.id);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  return <AuthGate>{userId && <OnboardingFlow userId={userId} onComplete={() => router.replace("/dashboard")} />}</AuthGate>;
}

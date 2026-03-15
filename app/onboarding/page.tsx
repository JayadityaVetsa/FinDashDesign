"use client";

import { useRouter } from "next/navigation";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = (apiKey: string, preset: string) => {
    // Redirect to dashboard - the dashboard will load the preset
    router.push("/dashboard");
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}

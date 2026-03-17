"use client";

import { useState } from "react";
import { Check, ExternalLink, ArrowRight } from "lucide-react";
import { ApiClient } from "@/lib/apiClient";
import { WIDGET_PRESETS } from "@/lib/widgetConfig";
import { createSeedDashboards } from "@/lib/widgetConfig";
import {
  upsertProfile,
  seedDashboards,
} from "@/lib/supabaseData";

type OnboardingFlowProps = {
  userId: string;
  onComplete: () => void;
};

export default function OnboardingFlow({
  userId,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Step 2 — verify API key                                         */
  /* ---------------------------------------------------------------- */
  const handleVerify = async () => {
    if (!apiKey.trim()) {
      setVerifyError("Please enter an API key");
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const client = new ApiClient({ apiKey: apiKey.trim() });
      await client.getQuote("AAPL"); // quick validation call
      setStep(3);
    } catch (error: any) {
      setVerifyError(error.message || "Invalid API key");
    } finally {
      setVerifying(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 3 — save everything to Supabase and finish                  */
  /* ---------------------------------------------------------------- */
  const handleComplete = async () => {
    if (!selectedPreset) return;

    setSaving(true);
    try {
      // 1. Save profile (API key + mark onboarding complete)
      await upsertProfile(userId, {
        finnhub_key: apiKey.trim(),
        onboarding_completed: true,
      });

      // 2. Seed dashboards for this user
      const seeds = createSeedDashboards();
      const created = await seedDashboards(userId, seeds);

      // 3. Set the first dashboard as active
      if (created.length > 0) {
        await upsertProfile(userId, {
          active_dashboard_id: created[0].id,
        });
      }

      onComplete();
    } catch (err: any) {
      console.error("Onboarding save failed:", err);
      setVerifyError(
        "Failed to save your settings. Please try again."
      );
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-2xl font-bold text-white shadow-lg">
            F
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              FinDash
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Set up your workspace
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step
                  ? "w-8 bg-[var(--accent-blue)]"
                  : s < step
                  ? "w-4 bg-[var(--accent-blue)]/50"
                  : "w-4 bg-[var(--border)]"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Get API Key */}
        {step === 1 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Get your free Finnhub API key
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                FinDash uses Finnhub to fetch real-time financial data. You&apos;ll
                need a free API key to get started.
              </p>
            </div>
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Register at Finnhub
              <ExternalLink className="h-4 w-4" />
            </a>
            <div className="mt-6">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-[var(--accent-blue)] hover:underline"
              >
                I already have an API key →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verify API Key */}
        {step === 2 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Enter your API key
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Paste your Finnhub API key below. We&apos;ll verify it&apos;s working.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setVerifyError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify();
                  }}
                  className="mono w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
                  placeholder="Enter Finnhub API key"
                />
                {verifyError && (
                  <p className="mt-2 text-sm text-[var(--accent-red)]">
                    {verifyError}
                  </p>
                )}
                {!verifyError && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Your API key is stored securely in your Supabase profile and
                    is never shared with third parties.
                  </p>
                )}
              </div>
              <button
                onClick={handleVerify}
                disabled={verifying || !apiKey.trim()}
                className="w-full rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify & Continue"}
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Choose Style */}
        {step === 3 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Choose your investor style
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Pick a starting preset. You can always add, remove, or rearrange
                widgets later.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(WIDGET_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    selectedPreset === key
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-active)]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {preset.name}
                    </h3>
                    {selectedPreset === key && (
                      <Check className="h-5 w-5 text-[var(--accent-blue)]" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!selectedPreset || saving}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Complete Setup"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

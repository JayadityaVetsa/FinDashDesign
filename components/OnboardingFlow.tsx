"use client";

import { useState } from "react";
import { Check, ExternalLink, ArrowRight } from "lucide-react";
import { ApiClient } from "@/lib/apiClient";
import { WIDGET_PRESETS, type WidgetType } from "@/lib/widgetConfig";
import { writeStorage, storageKeys } from "@/lib/storage";

type OnboardingFlowProps = {
  onComplete: (apiKey: string, preset: string) => void;
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      setVerifyError("Please enter an API key");
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      const client = new ApiClient({ apiKey: apiKey.trim() });
      await client.getQuote("AAPL"); // Test with a simple call
      setStep(3); // Advance to preset selection
    } catch (error: any) {
      setVerifyError(error.message || "Invalid API key");
    } finally {
      setVerifying(false);
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
  };

  const handleComplete = () => {
    if (!selectedPreset) return;
    writeStorage(storageKeys.finnhubKey, apiKey.trim());
    writeStorage(storageKeys.layoutPreset, selectedPreset);
    onComplete(apiKey.trim(), selectedPreset);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-blue)] text-2xl font-bold text-white shadow-lg">
            F
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">FinDash</h1>
        </div>

        {/* Step 1: Get API Key */}
        {step === 1 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Get your free Finnhub API key
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                FinDash uses Finnhub to fetch real-time financial data. You'll need a free API key to get started.
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
                Paste your Finnhub API key below. We'll verify it's working.
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
                Select a layout preset that matches how you invest.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(WIDGET_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
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
                disabled={!selectedPreset}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Complete Setup
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

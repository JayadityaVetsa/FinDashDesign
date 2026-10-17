"use client";
import { Analytics } from "@vercel/analytics/next";
import { publicAnalyticsUrl } from "@/lib/publicAnalytics";
export default function PublicAnalytics() {
  return <Analytics beforeSend={event => {
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return null;
    const url = publicAnalyticsUrl(event.url);
    return url ? { ...event, url } : null;
  }} />;
}

/**
 * PROTOTYPE ONLY — remove before merging.
 *
 * Lets reviewers compare callout styles in mock
 * mode (`npm run dev:mock`) by setting a localStorage entry, e.g.
 *   localStorage.setItem(
 *     "openhands-enterprise-cta-preview",
 *     JSON.stringify({ variant: "card" }),
 *   );
 * Outside mock mode the override is ignored.
 */
export type EnterpriseCalloutVariant = "inline" | "footer" | "card";

interface EnterpriseCtaPreview {
  variant?: EnterpriseCalloutVariant;
}

export const ENTERPRISE_CTA_PREVIEW_STORAGE_KEY =
  "openhands-enterprise-cta-preview";

export function readEnterpriseCtaPreview(): EnterpriseCtaPreview {
  if (import.meta.env.VITE_MOCK_API !== "true") return {};
  try {
    const raw = window.localStorage.getItem(ENTERPRISE_CTA_PREVIEW_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EnterpriseCtaPreview) : {};
  } catch {
    return {};
  }
}

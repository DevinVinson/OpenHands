/**
 * PROTOTYPE ONLY — remove before merging.
 *
 * Lets reviewers compare callout styles and Git-callout placements in mock
 * mode (`npm run dev:mock`) by setting a localStorage entry, e.g.
 *   localStorage.setItem(
 *     "openhands-enterprise-cta-preview",
 *     JSON.stringify({ variant: "card", gitPlacement: "mcp_page" }),
 *   );
 * Outside mock mode the override is ignored.
 */
export type EnterpriseCalloutVariant = "inline" | "footer" | "card";

export type ManagedGitPlacement =
  "secrets_settings" | "git_settings" | "mcp_page";

interface EnterpriseCtaPreview {
  variant?: EnterpriseCalloutVariant;
  gitPlacement?: ManagedGitPlacement;
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

/** Default placement for the managed-Git callout. */
export const DEFAULT_MANAGED_GIT_PLACEMENT: ManagedGitPlacement =
  "secrets_settings";

export function getManagedGitPlacement(): ManagedGitPlacement {
  return (
    readEnterpriseCtaPreview().gitPlacement ?? DEFAULT_MANAGED_GIT_PLACEMENT
  );
}

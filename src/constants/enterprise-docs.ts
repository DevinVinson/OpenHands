import { I18nKey } from "#/i18n/declaration";

const DOCS_BASE_URL = "https://docs.openhands.dev";

/** Official docs pages the enterprise callouts link to. */
export const ENTERPRISE_DOCS_URLS = {
  editionComparison: `${DOCS_BASE_URL}/enterprise/enterprise-vs-oss`,
  integrations: `${DOCS_BASE_URL}/enterprise/integrations/overview`,
  gitIntegrations: `${DOCS_BASE_URL}/enterprise/integrations/overview#git-providers`,
  secretsManagement: `${DOCS_BASE_URL}/enterprise/secrets-management`,
  automations: `${DOCS_BASE_URL}/enterprise/automations`,
} as const;

/**
 * Who is looking at a callout, derived from the active backend:
 * - `local`: an Agent Canvas local or agent-server backend.
 * - `cloud`: OpenHands Cloud (hosted), which already has organizations,
 *   managed integrations and shared secrets.
 * - `enterprise`: a self-hosted OpenHands Enterprise instance, or a Canvas
 *   locked to a Cloud host. Never shown any callout.
 */
export type EnterpriseCalloutAudience = "local" | "cloud" | "enterprise";

/** Stable identifier for one callout; also the telemetry `cta_id`. */
export type EnterpriseCalloutId =
  | "compare_options"
  | "team_setup"
  | "integrations"
  | "managed_git"
  | "org_secrets"
  | "org_automations";

/** Where a callout is rendered; also the telemetry `surface`. */
export type EnterpriseCalloutSurface =
  | "backend_chooser"
  | "settings_sidebar"
  | "mcp_page"
  | "git_settings"
  | "secrets_settings"
  | "responder_modal";

export interface EnterpriseCalloutDefinition {
  bodyKey: I18nKey;
  linkKey: I18nKey;
  href: string;
  /** Audiences that do not already have the capability being described. */
  audiences: readonly EnterpriseCalloutAudience[];
}

export const ENTERPRISE_CALLOUTS: Record<
  EnterpriseCalloutId,
  EnterpriseCalloutDefinition
> = {
  // Self-hosting is relevant to Cloud users too; only Enterprise has it.
  compare_options: {
    bodyKey: I18nKey.ENTERPRISE_CTA$COMPARE_OPTIONS_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$COMPARE_OPTIONS_LINK,
    href: ENTERPRISE_DOCS_URLS.editionComparison,
    audiences: ["local", "cloud"],
  },
  team_setup: {
    bodyKey: I18nKey.ENTERPRISE_CTA$TEAM_SETUP_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$COMPARE_OPTIONS_LINK,
    href: ENTERPRISE_DOCS_URLS.editionComparison,
    audiences: ["local"],
  },
  integrations: {
    bodyKey: I18nKey.ENTERPRISE_CTA$INTEGRATIONS_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$INTEGRATIONS_LINK,
    href: ENTERPRISE_DOCS_URLS.integrations,
    audiences: ["local"],
  },
  managed_git: {
    bodyKey: I18nKey.ENTERPRISE_CTA$MANAGED_GIT_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$INTEGRATIONS_LINK,
    href: ENTERPRISE_DOCS_URLS.gitIntegrations,
    audiences: ["local"],
  },
  org_secrets: {
    bodyKey: I18nKey.ENTERPRISE_CTA$ORG_SECRETS_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$ORG_SECRETS_LINK,
    href: ENTERPRISE_DOCS_URLS.secretsManagement,
    audiences: ["local"],
  },
  org_automations: {
    bodyKey: I18nKey.ENTERPRISE_CTA$ORG_AUTOMATIONS_BODY,
    linkKey: I18nKey.ENTERPRISE_CTA$ORG_AUTOMATIONS_LINK,
    href: ENTERPRISE_DOCS_URLS.automations,
    audiences: ["local", "cloud"],
  },
};

/** Secret names that look like a hand-managed Git provider token. */
const GIT_TOKEN_SECRET_PATTERN = /^(GITHUB|GITLAB|BITBUCKET|AZURE_DEVOPS)_/i;

export function isGitTokenSecretName(name: string): boolean {
  return GIT_TOKEN_SECRET_PATTERN.test(name);
}

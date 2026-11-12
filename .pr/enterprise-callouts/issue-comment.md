## Prototype: contextual Enterprise/Cloud docs callouts

I prototyped the audit candidates on a branch (`feat/enterprise-docs-callouts`) so we can react to real UI instead of mockups. All screenshots are from mock mode with a **local** backend. Each spot has a default style and at least one alternative; feedback on placement, style and copy is welcome.

**How it works**
- One shared, non-blocking `EnterpriseDocsCallout`: an icon, one sentence and an external docs link. Localized in all 16 locales, and the link's accessible description is the sentence, so a "Learn more"-style label still makes sense on its own.
- **Visibility follows the connected backend**, so nobody is prompted about something they already have:

  | Callout | Local / agent-server | OpenHands Cloud | Self-hosted Enterprise or locked-to-Cloud |
  |---|---|---|---|
  | Compare options (backend chooser) | ✓ | ✓ | — |
  | Org automations (responder modal) | ✓ | ✓ | — |
  | Integrations, managed Git, org secrets, team setup | ✓ | — | — |

  Nothing renders while a Cloud backend's deployment mode is still loading.
- **Copy checked against the current docs.** Capabilities shared with Cloud (orgs/roles, one-click integrations, OAuth Git) say "OpenHands Cloud and Enterprise". Only SAML SSO and self-hosting are framed as Enterprise. Nothing implies that secrets, MCP, self-hosting or automations are missing from open source.
- **Telemetry:** one typed event, `enterprise_docs_link_clicked`, with enum `cta_id` and `surface` values and no raw URLs. Each callout also has a stable `data-testid="enterprise-callout-<cta_id>"` for PostHog toolbar/heatmap targeting.

---

### 1. Backend chooser: "Setting up OpenHands for a team?" → Enterprise vs. OSS comparison
Default: full-width footer under the connection options.
<!-- 1-backend-chooser.png -->
Alternative: card style.
<!-- 1-backend-chooser-card.png -->
> Separate copy issue: the Advanced → Host hint says "your self-hosted OpenHands **Cloud** deployment". The docs call that OpenHands Enterprise.

### 2. MCP page: built-in event-driven integrations → Integrations overview
Default: inline note under the page description.
<!-- 2-mcp.png -->
Alternative: card.
<!-- 2-mcp-card.png -->

### 3. Managed Git (OAuth) connections: where should this live?
The original idea was **Application › Git Settings**, but that section only sets the commit name/email, not authentication. Three placements to compare:

**a. Secrets, shown only when a `GITHUB_*` / `GITLAB_*` / `BITBUCKET_*` / `AZURE_DEVOPS_*` secret exists** *(current default: it appears for people who are actually managing tokens by hand)*
<!-- 4-secrets.png (second line) -->
**b. Git Settings** (original idea)
<!-- 3b-managed-git-in-git-settings.png -->
**c. MCP page**, next to the integrations note
<!-- 3c-managed-git-on-mcp-page.png -->

### 4. Secrets: organization-wide secrets → Enterprise secrets management
Default: inline under the subtitle (this screenshot also shows 3a).
<!-- 4-secrets.png -->
Alternative: card.
<!-- 4-secrets-card.png -->

### 5. Responder deployment modal: running responders on your own infrastructure → Enterprise automations / service accounts
Default: full-width footer link. The modal code already reserves a `user-cloud` target, so a third "Self-host with Enterprise" card is a possible follow-up, but a footer seems proportionate for now.
<!-- 5-responder-modal.png -->
Alternative: card.
<!-- 5-responder-modal-card.png -->

### 6. Settings sidebar: multi-user, RBAC and SSO (new; fills the gap for orgs/roles/SSO)
A small persistent note under "These settings are synced from…", visible on every settings page.
<!-- 6-settings-sidebar.png -->
> It's long for the narrow sidebar. A shorter version could be just "Using OpenHands with a team? Compare options ↗".

---

**Questions for reviewers**
1. Inline text or card? The cards are more noticeable but compete with page content; inline is my default.
2. Which placement for managed Git (3a / 3b / 3c)?
3. Keep the sidebar note (6), or shorten it?

**Not covered yet:** first-run onboarding ("Add a backend" wizard), Automations list empty state, and the "self-hosted OpenHands Cloud" wording fix above. Unit tests cover the visibility matrix, click tracking and the Git-token heuristic.

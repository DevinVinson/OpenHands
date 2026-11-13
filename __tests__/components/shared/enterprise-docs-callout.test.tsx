import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnterpriseDocsCallout } from "#/components/shared/enterprise-docs-callout";
import { ENTERPRISE_DOCS_URLS } from "#/constants/enterprise-docs";

const { backendKind, cloudConfig, lockedHost, trackEvent } = vi.hoisted(() => ({
  backendKind: { current: "local" as "local" | "cloud" },
  cloudConfig: vi.fn(),
  lockedHost: vi.fn(() => null as string | null),
  trackEvent: vi.fn(),
}));

vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackend: () => ({
    backend: {
      id: "backend-1",
      kind: backendKind.current,
      host: "http://127.0.0.1:8000",
      name: "Local",
    },
    orgId: null,
  }),
}));
vi.mock("#/hooks/query/use-cloud-integrations-config", () => ({
  useCloudIntegrationsConfig: () => cloudConfig(),
}));
vi.mock("#/api/agent-server-config", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getLockedCloudHost: () => lockedHost(),
}));
vi.mock("#/services/telemetry", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  trackEvent,
}));

function renderCallouts() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <EnterpriseDocsCallout
        ctaId="compare_options"
        surface="backend_chooser"
      />
      <EnterpriseDocsCallout ctaId="org_secrets" surface="secrets_settings" />
    </QueryClientProvider>,
  );
}

describe("EnterpriseDocsCallout", () => {
  beforeEach(() => {
    backendKind.current = "local";
    cloudConfig.mockReturnValue({ data: undefined, isLoading: false });
    lockedHost.mockReturnValue(null);
    trackEvent.mockClear();
  });

  it.each([
    // [case, backend kind, cloud config, locked host, callouts shown]
    ["a local backend", "local", undefined, null, true],
    ["OpenHands Cloud", "cloud", { deploymentMode: "cloud" }, null, true],
    [
      "a self-hosted Enterprise instance",
      "cloud",
      { deploymentMode: "self_hosted" },
      null,
      false,
    ],
    [
      "Canvas locked to a Cloud host",
      "local",
      undefined,
      "https://app.example.com",
      false,
    ],
  ] as const)(
    "shows callouts only when %s is not Enterprise",
    (_name, kind, data, locked, isShown) => {
      backendKind.current = kind;
      cloudConfig.mockReturnValue({ data, isLoading: false });
      lockedHost.mockReturnValue(locked);

      renderCallouts();

      expect(
        screen.queryAllByTestId(/^enterprise-callout-[a-z_]+$/),
      ).toHaveLength(isShown ? 2 : 0);
    },
  );

  it("waits for a Cloud backend's deployment mode before showing anything", () => {
    backendKind.current = "cloud";
    cloudConfig.mockReturnValue({ data: undefined, isLoading: true });

    renderCallouts();

    expect(
      screen.queryByTestId(/^enterprise-callout-/),
    ).not.toBeInTheDocument();
  });

  it("opens the docs in a new tab and records which callout was clicked", async () => {
    const user = userEvent.setup();
    renderCallouts();

    const link = screen.getByTestId("enterprise-callout-org_secrets-link");
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);

    expect(link).toHaveAttribute(
      "href",
      ENTERPRISE_DOCS_URLS.secretsManagement,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAccessibleDescription("ENTERPRISE_CTA$ORG_SECRETS_BODY");
    expect(trackEvent).toHaveBeenCalledWith(
      "enterprise_docs_link_clicked",
      expect.objectContaining({
        cta_id: "org_secrets",
        surface: "secrets_settings",
        is_external: true,
      }),
    );
  });
});

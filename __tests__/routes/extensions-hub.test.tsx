import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const mockUseBreakpoint = vi.fn();

vi.mock("react-router", () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props);
    return null;
  },
}));

vi.mock("#/hooks/use-breakpoint", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#/hooks/use-breakpoint")>()),
  useBreakpoint: () => mockUseBreakpoint(),
}));

vi.mock("#/components/features/skills/extensions-mobile-hub", () => ({
  ExtensionsMobileHub: () => <div data-testid="extensions-mobile-hub" />,
}));

vi.mock("#/routes/not-found", () => ({
  default: () => <div data-testid="not-found-screen" />,
}));

import ExtensionsHub from "#/routes/extensions-hub";
import { FeaturePolicyProvider } from "#/feature-policy/feature-policy-context";

describe("ExtensionsHub", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseBreakpoint.mockReturnValue(false);
  });

  it("redirects desktop Customize navigation to MCP Servers", () => {
    render(<ExtensionsHub />);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/mcp", replace: true });
  });

  // @spec FP-004 — Customize lands on the first section the operator left on
  it("redirects to the next enabled section when MCP is off", () => {
    render(
      <FeaturePolicyProvider
        policy={{ version: 1, disabled: ["customize.mcp"] }}
      >
        <ExtensionsHub />
      </FeaturePolicyProvider>,
    );

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/skills", replace: true });
  });

  it("renders the not-found page when every section is off", () => {
    const { getByTestId } = render(
      <FeaturePolicyProvider
        policy={{
          version: 1,
          disabled: [
            "customize.mcp",
            "customize.skills",
            "customize.plugins",
            "customize.apps",
          ],
        }}
      >
        <ExtensionsHub />
      </FeaturePolicyProvider>,
    );

    expect(getByTestId("not-found-screen")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

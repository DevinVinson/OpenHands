import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturePolicyProvider } from "#/feature-policy/feature-policy-context";
import { RequireFeature } from "#/routes/require-feature";
import { renderWithProviders } from "../../test-utils";

// @spec FP-004 — A route whose feature is off renders the not-found page
describe("RequireFeature", () => {
  it("renders the page when its feature is on", () => {
    renderWithProviders(
      <RequireFeature feature="customize.plugins">
        <div data-testid="plugins-page" />
      </RequireFeature>,
    );

    expect(screen.getByTestId("plugins-page")).toBeInTheDocument();
  });

  it("renders the not-found page when its feature is off", () => {
    renderWithProviders(
      <FeaturePolicyProvider
        policy={{ version: 1, disabled: ["customize.plugins"] }}
      >
        <RequireFeature feature="customize.plugins">
          <div data-testid="plugins-page" />
        </RequireFeature>
      </FeaturePolicyProvider>,
    );

    expect(screen.getByTestId("not-found-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("plugins-page")).not.toBeInTheDocument();
  });
});

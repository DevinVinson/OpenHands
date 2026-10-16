import { afterEach, describe, expect, it, vi } from "vitest";

import { createCommandMenuItems } from "#/components/features/command-menu/command-menu-items";
import { OSS_NAV_ITEMS } from "#/constants/settings-nav";
import type { FeatureId } from "#/feature-policy/feature-policy";

/**
 * The automation entry's title, description, and keywords are the interface
 * manifest's. Without one there is no copy to show and no surface to reach,
 * so the entry is not offered at all.
 */
vi.mock("#/manifests/manifest-sources", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#/manifests/manifest-sources")>();
  return { ...actual, AUTOMATION_INTERFACE_CANDIDATE: undefined };
});

describe("the command menu without an admitted interface manifest", () => {
  it("omits the automations entry and keeps the rest", () => {
    // Act
    const items = createCommandMenuItems({ toggleSidebar: vi.fn() });

    // Assert
    expect(items.some((item) => item.id === "automations")).toBe(false);
    expect(items.some((item) => item.id === "new-chat")).toBe(true);
  });
});

const settingsItemIds = (items: ReturnType<typeof createCommandMenuItems>) =>
  items.filter((item) => item.group === "settings").map((item) => item.id);

/**
 * Locked to a Cloud host (SaaS / self-hosted OHE) the settings sidebar lists
 * only the Application page; the command menu must not re-expose the pages
 * that sidebar unlists.
 */
describe("the command menu settings group", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists every settings page when not locked to a Cloud host", () => {
    // Act
    const items = createCommandMenuItems({ toggleSidebar: vi.fn() });

    // Assert
    expect(settingsItemIds(items)).toEqual([
      "settings",
      "agent-settings",
      "llm-settings",
      "meta-llm-settings",
      "condenser-settings",
      "agent-context-settings",
      "verification-settings",
      "app-settings",
      "secrets-settings",
    ]);
  });

  it("offers an entry for every page the settings nav lists", () => {
    // Act
    const routes = createCommandMenuItems({ toggleSidebar: vi.fn() }).map(
      (item) => item.to,
    );

    // Assert
    expect(routes).toEqual(
      expect.arrayContaining(OSS_NAV_ITEMS.map((navItem) => navItem.to)),
    );
  });

  it("keeps only Settings and Application when locked to a Cloud host", () => {
    // Arrange
    vi.stubEnv("VITE_LOCK_TO_CLOUD", "https://app.all-hands.dev");

    // Act
    const items = createCommandMenuItems({ toggleSidebar: vi.fn() });

    // Assert
    expect(settingsItemIds(items)).toEqual(["settings", "app-settings"]);
    expect(items.map((item) => item.id)).toEqual([
      "new-chat",
      "customize",
      "mcp",
      "settings",
      "app-settings",
      "toggle-sidebar",
    ]);
  });
});

// @spec FP-004 — The command menu does not reach pages the operator turned off
describe("the command menu under an operator feature policy", () => {
  it("omits entries for disabled pages and an empty Customize", () => {
    // Arrange
    const disabled = new Set<FeatureId>([
      "llmProfiles.manage",
      "customize.mcp",
    ]);

    // Act
    const ids = createCommandMenuItems({
      toggleSidebar: vi.fn(),
      featurePolicy: { isEnabled: (id) => !disabled.has(id) },
      hasCustomizeSection: false,
    }).map((item) => item.id);

    // Assert
    expect(ids).not.toContain("llm-settings");
    expect(ids).not.toContain("meta-llm-settings");
    expect(ids).not.toContain("mcp");
    expect(ids).not.toContain("customize");
    expect(ids).toContain("agent-settings");
  });
});

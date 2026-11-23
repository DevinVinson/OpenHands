/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useNavigation } from "#/context/navigation-context";
import { cn } from "#/utils/utils";
import {
  SIDEBAR_ICON_BUTTON_CLASS,
  SIDEBAR_ROW_INTERACTIVE_CLASS,
  navInteractiveTransitionClassName,
} from "#/components/features/sidebar/sidebar-layout";
import {
  DEFAULT_FACTORY_SECTION,
  FACTORIES_PATH,
  FACTORY_NAV_GROUPS,
  factoryPath,
  isFactorySection,
  type FactorySection,
} from "./factory-data";
import { useFactoryStore } from "./factory-store";
import { CreateFactoryModal } from "./create-factory-modal";

/** Which section a factory URL belongs to; drill-downs light up their parent. */
function activeSectionFor(
  currentPath: string,
  factoryId: string,
): FactorySection | null {
  const prefix = `${FACTORIES_PATH}/${encodeURIComponent(factoryId)}`;
  if (currentPath !== prefix && !currentPath.startsWith(`${prefix}/`)) {
    return null;
  }
  const [first] = currentPath.slice(prefix.length).split("/").filter(Boolean);
  if (!first) return DEFAULT_FACTORY_SECTION;
  return isFactorySection(first) ? first : DEFAULT_FACTORY_SECTION;
}

/**
 * PROTOTYPE: the "Factories" group in the expanded sidebar. Each factory
 * expands into its sections, mirroring the Agent Canvas wireframe.
 */
export function SidebarFactoriesSection({ collapsed }: { collapsed: boolean }) {
  const factories = useFactoryStore((s) => s.factories);
  const expandedId = useFactoryStore((s) => s.expandedId);
  const setExpanded = useFactoryStore((s) => s.setExpanded);
  const { currentPath, navigate } = useNavigation();
  const [creating, setCreating] = React.useState(false);

  if (collapsed) return null;

  return (
    <div
      data-testid="sidebar-factories-section"
      className="flex max-h-[45vh] shrink-0 flex-col overflow-y-auto pr-2.5 pt-3"
    >
      <div className="flex h-7 items-center justify-between pl-2.5 text-xs font-medium text-muted">
        <span>Factories</span>
        <button
          type="button"
          aria-label="Create factory"
          onClick={() => setCreating(true)}
          className={cn(
            SIDEBAR_ICON_BUTTON_CLASS,
            "size-6 text-muted hover:bg-surface-raised hover:text-contrast",
          )}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {factories.length === 0 ? (
        <NavigationLink
          to={FACTORIES_PATH}
          className="rounded-md px-2.5 py-2 text-xs text-muted hover:bg-surface-raised hover:text-content"
        >
          No factories yet — create one
        </NavigationLink>
      ) : null}
      {factories.map((f) => {
        const open = expandedId === f.id;
        const active = activeSectionFor(currentPath, f.id);
        return (
          <div key={f.id}>
            <button
              type="button"
              aria-expanded={open}
              data-testid={`sidebar-factory-${f.id}`}
              onClick={() => {
                if (!open) {
                  setExpanded(f.id);
                  if (active === null) navigate(factoryPath(f.id));
                } else {
                  setExpanded(null);
                }
              }}
              className={cn(
                "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm",
                navInteractiveTransitionClassName,
                "text-content hover:bg-surface-raised",
              )}
            >
              <span className="grid size-4.5 shrink-0 place-items-center rounded bg-contrast text-3xs font-bold text-canvas-base">
                {f.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-left font-medium">
                {f.name}
              </span>
              {open ? (
                <ChevronDown className="size-3.5 text-muted" />
              ) : (
                <ChevronRight className="size-3.5 text-muted" />
              )}
            </button>
            {open ? (
              <div className="mb-1 ml-4.5 border-l border-border pl-2">
                {FACTORY_NAV_GROUPS.map((group, gi) => (
                  <div key={gi} className={cn(gi > 0 && "mt-2")}>
                    {group.label ? (
                      <div className="px-2.5 pb-0.5 text-2xs text-muted/80">
                        {group.label}
                      </div>
                    ) : null}
                    {group.items.map((item) => {
                      const isActive = active === item.section;
                      return (
                        <NavigationLink
                          key={item.section}
                          to={factoryPath(f.id, item.section)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex h-8 items-center gap-2 rounded-md px-2.5 text-xs-plus",
                            navInteractiveTransitionClassName,
                            isActive
                              ? SIDEBAR_ROW_INTERACTIVE_CLASS.active
                              : SIDEBAR_ROW_INTERACTIVE_CLASS.idle,
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {item.count ? (
                            <span className="rounded-full border border-border px-1.5 text-3xs text-muted">
                              {item.count}
                            </span>
                          ) : null}
                        </NavigationLink>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {creating ? (
        <CreateFactoryModal onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

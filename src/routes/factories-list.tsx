/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ChevronRight, Factory as FactoryIcon, Plus } from "lucide-react";
import { useNavigation } from "#/context/navigation-context";
import { useFactoryStore } from "#/components/features/factories/factory-store";
import {
  AGENTS,
  EXTERNAL_REFS,
  factoryPath,
} from "#/components/features/factories/factory-data";
import {
  Badge,
  Button,
  Card,
  Muted,
  PageHeading,
  SectionTitle,
} from "#/components/features/factories/factory-ui";
import { CreateFactoryModal } from "#/components/features/factories/create-factory-modal";

export default function FactoriesListRoute() {
  const factories = useFactoryStore((s) => s.factories);
  const setExpanded = useFactoryStore((s) => s.setExpanded);
  const reset = useFactoryStore((s) => s.reset);
  const { navigate } = useNavigation();
  const [creating, setCreating] = React.useState(false);

  return (
    <div
      data-testid="factories-list"
      className="h-full overflow-auto bg-canvas-base"
    >
      <div className="mx-auto max-w-5xl px-6 py-9 md:px-10">
        <PageHeading
          title="Factories"
          subtitle="Select a factory to explore its work, workflows, and agents."
          actions={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Create factory
            </Button>
          }
        />
        {factories.length === 0 ? (
          <div
            data-testid="factories-empty"
            className="mt-6 rounded-xl border border-dashed border-border px-6 py-14 text-center"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <FactoryIcon className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-content">
              Create your first factory
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              A factory is a repeatable workflow aimed at an outcome, like
              driving CVEs to zero or taking issues to reviewed PRs. It groups
              the agents, automations and work that get you there.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="size-4" /> Create factory
              </Button>
              <Button variant="ghost" onClick={reset}>
                Restore demo factory
              </Button>
            </div>
          </div>
        ) : null}
        {factories.length > 0 ? (
          <SectionTitle
            right={
              <Muted>
                {factories.length}{" "}
                {factories.length === 1 ? "factory" : "factories"}
              </Muted>
            }
          >
            Your factories
          </SectionTitle>
        ) : null}
        <div className="flex flex-col gap-3">
          {factories.map((f) => (
            <Card
              key={f.id}
              onClick={() => {
                setExpanded(f.id);
                navigate(factoryPath(f.id));
              }}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FactoryIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-content">
                    {f.name}
                  </div>
                  <Muted className="mt-0.5 truncate">
                    {f.goal ||
                      f.description ||
                      "Coordinate work across agents, automations and repositories"}
                  </Muted>
                </div>
                <div className="flex-1" />
                <Badge tone="good">Online</Badge>
                <ChevronRight className="size-4 text-muted" />
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="flex gap-2 text-xs text-muted">
                <span>{f.repositories.length} repositories</span>
                <span>·</span>
                <span>{AGENTS.length} agents</span>
                <span>·</span>
                <span>{EXTERNAL_REFS.length} issues & PRs</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {creating ? (
        <CreateFactoryModal onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

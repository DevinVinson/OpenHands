/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ChevronRight, Factory as FactoryIcon, Plus } from "lucide-react";
import { useNavigation } from "#/context/navigation-context";
import { useFactoryStore } from "#/components/features/factories/factory-store";
import {
  WORKERS,
  WORK_ITEMS,
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
                    {f.description ||
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
                <span>{WORKERS.length} workers</span>
                <span>·</span>
                <span>{WORK_ITEMS.length} work items</span>
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

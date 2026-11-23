/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { useNavigation } from "#/context/navigation-context";
import {
  AGENTS,
  AUTOMATIONS,
  BLOCKER_PATTERNS,
  EXTERNAL_REFS,
  FACTORY_CONVERSATIONS,
  THROUGHPUT,
  WORK_LOG,
  factoryAgentPath,
  factoryPath,
  factoryRefPath,
  findAgent,
  findRef,
  type AttentionItem,
  type Factory,
  type FactorySection,
} from "../factory-data";
import {
  Badge,
  Bars,
  Button,
  Card,
  CardTitle,
  Muted,
  PageHeading,
  Row,
  SectionTitle,
  useFactoryDrawer,
} from "../factory-ui";
import { LogEntryRow } from "./stream-pages";

export interface FactoryPageProps {
  factory: Factory;
}

export const eyebrow = (f: Factory) => `${f.name} / Factory`;

export function useOpenAttention(factory: Factory) {
  const { open, demo, close } = useFactoryDrawer();
  const { navigate } = useNavigation();
  return (a: AttentionItem) =>
    open(
      a.title,
      <>
        <div className="flex gap-1.5">
          <Badge tone="warn">{a.kind}</Badge>
          <Badge>{findRef(a.refId)?.label ?? a.refId}</Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-content">{a.detail}</p>
        <p className="mt-3 text-sm text-muted">
          This work is paused for human input. Review the context, submit a
          decision, and the factory picks the work back up.
        </p>
        {a.kind === "Question" ? (
          <textarea
            className="mt-4 min-h-24 w-full rounded-md border border-border bg-canvas-base p-2 text-sm text-content"
            placeholder="Type your answer…"
          />
        ) : null}
        <div className="my-4 h-px bg-border" />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              close();
              navigate(factoryRefPath(factory.id, a.refId));
            }}
          >
            Open {findRef(a.refId)?.type === "pr" ? "PR" : "issue"}
          </Button>
          <div className="flex-1" />
          <Button onClick={() => demo("Request changes")}>
            Request changes
          </Button>
          <Button variant="primary" onClick={() => demo("Approve")}>
            {a.kind === "Question" ? "Send answer" : "Approve"}
          </Button>
        </div>
      </>,
    );
}

export function OverviewPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const orchestrator = findAgent(factory.orchestratorId);
  const go = (section: FactorySection) =>
    navigate(factoryPath(factory.id, section));

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title={factory.name}
        subtitle={factory.description || "Factory overview"}
        actions={
          <>
            <Button onClick={() => demo("Edit goal and KPIs")}>
              Edit goal & KPIs
            </Button>
            <Button variant="primary" onClick={() => go("stream")}>
              Open work stream
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
              Goal
            </div>
            <p className="mt-1.5 text-base leading-relaxed text-content">
              {factory.goal || "No goal set yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {factory.owner ? <Badge>Owner · {factory.owner}</Badge> : null}
            <Badge>{factory.tag}</Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {factory.kpis.length ? (
            factory.kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-border px-3 py-2.5"
              >
                <Muted>{k.label}</Muted>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-content">
                    {k.value}
                  </span>
                  <Badge tone={k.onTrack ? "good" : "warn"}>
                    target {k.target}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <button
              type="button"
              onClick={() => demo("Add a KPI")}
              className="cursor-pointer rounded-lg border border-dashed border-border px-3 py-4 text-left text-sm text-muted hover:text-content"
            >
              + Add a KPI to measure this factory against its goal
            </button>
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Primary agent</CardTitle>
          {orchestrator ? (
            <>
              <button
                type="button"
                onClick={() =>
                  navigate(factoryAgentPath(factory.id, orchestrator.id))
                }
                className="flex w-full cursor-pointer items-center gap-3 text-left"
              >
                <div className="grid size-9 place-items-center rounded-lg border border-border bg-surface-raised text-xs font-bold text-muted">
                  FC
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-content">
                    {orchestrator.name}
                  </div>
                  <Muted>acts as {orchestrator.runsAs}</Muted>
                </div>
              </button>
              <p className="mt-3 text-sm text-muted">
                Watching 5 blocked items · applied 3 rules today · next summary
                at 17:00
              </p>
            </>
          ) : (
            <>
              <Muted>
                No orchestrator. This factory is driven by its automations.
              </Muted>
              <div className="mt-3">
                <Button size="sm" onClick={() => go("agents")}>
                  Assign a primary agent
                </Button>
              </div>
            </>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center">
            <h3 className="text-sm font-semibold text-content">Flow health</h3>
            <div className="flex-1" />
            <Button size="sm" onClick={() => go("operator")}>
              Operator view →
            </Button>
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-content">87%</span>
            <Muted>moved without a person this week</Muted>
          </div>
          {BLOCKER_PATTERNS.filter((p) => p.blockedNow > 0)
            .slice(0, 3)
            .map((p) => (
              <Row key={p.id} onClick={() => go("operator")}>
                <div>
                  <div className="font-medium text-content">{p.cause}</div>
                  <Muted className="mt-1">{p.blockedNow} blocked now</Muted>
                </div>
                <Badge
                  tone={
                    p.coverage === "Covered"
                      ? "good"
                      : p.coverage === "Partial"
                        ? "warn"
                        : "bad"
                  }
                >
                  {p.coverage}
                </Badge>
              </Row>
            ))}
        </Card>
        <Card>
          <CardTitle>Merged PRs · last 30 days</CardTitle>
          <Bars values={THROUGHPUT} />
          <div className="mt-2 flex justify-between text-2xs text-muted">
            <span>Oct 24</span>
            <span>Nov 23</span>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["Agents", AGENTS.length, "agents"],
            ["Automations", AUTOMATIONS.length, "automations"],
            [
              "Active conversations",
              FACTORY_CONVERSATIONS.filter((c) => c.status !== "Idle").length,
              "conversations",
            ],
            ["Issues & PRs", EXTERNAL_REFS.length, "stream"],
          ] as const
        ).map(([label, count, section]) => (
          <Card key={label} tight onClick={() => go(section)}>
            <Muted>{label}</Muted>
            <div className="mt-1 text-2xl font-semibold text-content">
              {count}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle
        right={
          <Button size="sm" onClick={() => go("stream")}>
            Full work stream →
          </Button>
        }
      >
        Recent activity
      </SectionTitle>
      <Card>
        {WORK_LOG.slice(0, 5).map((e) => (
          <LogEntryRow key={e.id} entry={e} factoryId={factory.id} />
        ))}
      </Card>
    </>
  );
}

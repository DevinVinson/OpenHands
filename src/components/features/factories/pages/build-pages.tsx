/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { cn } from "#/utils/utils";
import { useNavigation } from "#/context/navigation-context";
import {
  AUTOMATIONS,
  BLUEPRINT_STAGES,
  AGENTS,
  factoryAgentPath,
  type AutomationRecord,
  type BlueprintStage,
  type Agent,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Field,
  Muted,
  Note,
  PageHeading,
  Pill,
  SectionTitle,
  Table,
  useFactoryDrawer,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";

export function BlueprintPage({ factory }: FactoryPageProps) {
  const { open, demo } = useFactoryDrawer();
  const [selected, setSelected] = React.useState<string | null>(null);

  const openStage = (s: BlueprintStage) => {
    setSelected(s.name);
    open(
      `${s.name} ${s.gate ? "gate" : "stage"}`,
      <>
        <Field label={s.gate ? "Approver" : "Assigned agent"}>
          {s.gate ? "Factory maintainers" : s.agent}
        </Field>
        <Field label="Procedure">
          <div className="min-h-24 text-muted">
            {s.gate
              ? "Pause the work item until a maintainer approves the plan. Attach the spec, risk analysis and open questions."
              : "Describe the work this stage must perform, its required inputs, and the outputs needed before a transition."}
          </div>
        </Field>
        <Field label="Transition on success">Next stage</Field>
        <Field label="Transition on revisions">Previous stage</Field>
        <div className="my-4 h-px bg-border" />
        <Button variant="primary" onClick={() => demo("Edit stage")}>
          Edit stage
        </Button>
      </>,
    );
  };

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Workflow blueprint"
        subtitle="Define who handles each stage, how work moves, and where people approve."
        actions={
          <Button variant="primary" onClick={() => demo("Edit workflow")}>
            Edit workflow
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="good">Published v1.4</Badge>
        <Badge>8 transitions</Badge>
        <Badge>2 human gates</Badge>
        <div className="flex-1" />
        <Muted>Select a node to inspect its settings</Muted>
      </div>
      <div
        className="overflow-auto rounded-xl border border-border p-8"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-border) 0.8px, transparent 0.8px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="flex min-w-[1010px] items-center">
          {BLUEPRINT_STAGES.map((s, i) => (
            <React.Fragment key={s.name}>
              {i > 0 ? (
                <div className="relative h-px w-8 shrink-0 bg-muted/50">
                  <span className="absolute -right-0.5 -top-2.5 text-muted">
                    ›
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => openStage(s)}
                className={cn(
                  "min-h-28 w-36 shrink-0 cursor-pointer rounded-lg border p-3 text-left shadow-sm transition-colors",
                  s.gate
                    ? "border-warning/50 bg-warning-soft/60"
                    : "border-border bg-canvas-base hover:border-contrast/30",
                  selected === s.name && "outline-2 outline-primary",
                )}
              >
                <div className="text-3xs text-muted">
                  {s.num} · {s.gate ? "GATE" : "STAGE"}
                </div>
                <div className="mb-1.5 mt-2 text-sm font-semibold text-content">
                  {s.name}
                </div>
                <div className="text-2xs text-muted">{s.agent}</div>
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <div className="max-w-sm">
            <Note>
              ↶ Review findings can route work back to implementation,
              preserving the agent conversation and attached evidence.
            </Note>
          </div>
          <div className="max-w-sm">
            <Note>
              ◇ Human gates pause work until an answer is recorded; approval is
              not the same as repository merge authorization.
            </Note>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          [
            "Entry rules",
            "Choose stages from event type, labels and confidence",
          ],
          ["Transition policy", "Explicit conditions and revision loops"],
          ["Versioning", "New work uses the active Blueprint version"],
        ].map(([t, d]) => (
          <Card key={t} onClick={() => demo(t)}>
            <CardTitle>{t}</CardTitle>
            <Muted>{d}</Muted>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AutomationsPage({ factory }: FactoryPageProps) {
  const { open, demo } = useFactoryDrawer();
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(AUTOMATIONS.map((a) => [a.name, a.enabled])),
  );

  const openAutomation = (a: AutomationRecord) =>
    open(
      a.name,
      <>
        <Field label="Trigger">{a.trigger}</Field>
        <Field label="Event filters">
          <div>Repository: api-service</div>
          <div>Branch: main</div>
        </Field>
        <Field label="Target">
          {a.agent} → enters Blueprint at <b>Triage</b>
        </Field>
        <div className="mt-4 text-xs font-semibold text-muted">Execution</div>
        <p className="mt-1 text-sm text-content">
          Run once for every matching event; deduplicate retries using the event
          identity.
        </p>
        <div className="my-4 h-px bg-border" />
        <Button variant="primary" onClick={() => demo("Edit automation")}>
          Edit automation
        </Button>
      </>,
    );

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Automations"
        subtitle="Events, filters and schedules determine what starts factory work."
        actions={
          <Button variant="primary" onClick={() => demo("New automation")}>
            New automation
          </Button>
        }
      />
      <Table<AutomationRecord>
        rows={AUTOMATIONS}
        rowKey={(r) => r.name}
        onRowClick={openAutomation}
        columns={[
          {
            header: "Name",
            width: "28%",
            render: (r) => <span className="font-medium">{r.name}</span>,
          },
          { header: "Trigger", render: (r) => r.trigger },
          { header: "Target agent", render: (r) => r.agent },
          {
            header: "Status",
            render: (r) => (
              <button
                type="button"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setEnabled((s) => ({ ...s, [r.name]: !s[r.name] }));
                }}
              >
                <Badge tone={enabled[r.name] ? "good" : "neutral"}>
                  {enabled[r.name] ? "On" : "Off"}
                </Badge>
              </button>
            ),
          },
          { header: "Last 30d", render: (r) => `${r.runs} runs` },
        ]}
      />
      <SectionTitle
        right={
          <Button size="sm" onClick={() => demo("Add webhook")}>
            Add webhook
          </Button>
        }
      >
        Webhooks
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Incident receiver", "/api/hooks/incident · signed payload"],
          ["Deployment events", "/api/hooks/deploy · 7 deliveries today"],
        ].map(([t, d]) => (
          <Card key={t}>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-semibold text-content">{t}</div>
                <Muted className="mt-1">{d}</Muted>
              </div>
              <div className="flex-1" />
              <Badge tone="good">Healthy</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AgentsPage({ factory }: FactoryPageProps) {
  const { demo } = useFactoryDrawer();
  const { navigate } = useNavigation();
  const openAgent = (w: Agent) => navigate(factoryAgentPath(factory.id, w.id));

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Agents"
        subtitle="Reusable agent profiles with explicit responsibilities and resource scopes."
        actions={
          <Button variant="primary" onClick={() => demo("New agent")}>
            New agent
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((w) => (
          <Card key={w.id} onClick={() => openAgent(w)} className="min-h-48">
            <div className="flex items-center">
              <div className="grid size-9 place-items-center rounded-lg border border-border bg-surface-raised text-xs font-bold text-muted">
                {w.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1" />
              <Badge tone="info">{w.active} active</Badge>
            </div>
            <div className="mt-3 text-sm font-semibold text-content">
              {w.name}
            </div>
            <Muted className="mt-1 min-h-8">{w.description}</Muted>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill>{w.model}</Pill>
              <Pill>{w.scope}</Pill>
              <Pill>
                <span className="font-mono">{w.profile.name}</span>
              </Pill>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

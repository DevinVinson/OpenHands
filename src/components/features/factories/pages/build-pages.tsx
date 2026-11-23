/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { useNavigation } from "#/context/navigation-context";
import {
  AUTOMATIONS,
  ADD_ON_STATIONS,
  FACTORY_SETTINGS,
  AGENTS,
  factoryAgentPath,
  type AutomationRecord,
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
  type Tone,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";

const PHASE_LABEL: Record<AutomationRecord["phase"], string> = {
  "Phase 1": "Phase 1",
  "Add-on": "Skill add-on",
  Catalog: "Automation catalog",
  Concept: "Concept · not built yet",
};

const PHASE_TONE: Record<AutomationRecord["phase"], Tone> = {
  "Phase 1": "info",
  "Add-on": "good",
  Catalog: "neutral",
  Concept: "warn",
};

const ADD_GROUPS: {
  phases: AutomationRecord["phase"][];
  title: string;
  hint: string;
}[] = [
  {
    phases: ["Add-on", "Catalog"],
    title: "Ready to add",
    hint: "Software-factory add-on and other catalog bundles",
  },
  {
    phases: ["Concept"],
    title: "Example stations",
    hint: "Concepts for this kind of factory, not in the catalog yet",
  },
];

function StationDetail({
  a,
  installed,
}: {
  a: AutomationRecord;
  installed: boolean;
}) {
  const { demo } = useFactoryDrawer();
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={PHASE_TONE[a.phase]}>{PHASE_LABEL[a.phase]}</Badge>
        {installed ? <Badge>software-factory</Badge> : null}
        <Badge>
          {a.needsProfile ? "Uses agent profile" : "Catalog defaults"}
        </Badge>
      </div>
      <Field
        label={a.phase === "Concept" ? "Proposed catalog id" : "Catalog bundle"}
      >
        <span className="font-mono">{a.catalogId}</span>
      </Field>
      <Field label="Schedule">
        {a.schedule}{" "}
        {a.cron !== "webhook" ? (
          <span className="font-mono text-muted">({a.cron})</span>
        ) : null}
      </Field>
      <Field label="Starts on">{a.trigger}</Field>
      <Field label="Produces">{a.outcome}</Field>
      <Field label="Runs as">{a.agent}</Field>
      {a.confirm ? (
        <div className="mt-4">
          <Note>
            <b>
              {a.phase === "Concept"
                ? "Setup would ask:"
                : "The skill asks before adding it:"}
            </b>{" "}
            {a.confirm}
          </Note>
        </div>
      ) : null}
      <div className="my-4 h-px bg-border" />
      {installed ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => demo("Tune station")}>
            Tune
          </Button>
          <Button onClick={() => demo("Verify: dispatch once and report")}>
            Verify
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={() =>
            demo(
              a.phase === "Concept"
                ? `Propose ${a.name} for the catalog`
                : `Add ${a.name}`,
            )
          }
        >
          {a.phase === "Concept" ? "Request this station" : "Add station"}
        </Button>
      )}
    </>
  );
}

export function AutomationsPage({ factory }: FactoryPageProps) {
  const { open, demo } = useFactoryDrawer();
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(AUTOMATIONS.map((a) => [a.name, a.enabled])),
  );
  const openStation = (a: AutomationRecord, installed: boolean) =>
    open(a.name, <StationDetail a={a} installed={installed} />);

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Automations"
        subtitle="The stations the software-factory skill set up: each is an automation-catalog bundle tagged software-factory."
        actions={
          <>
            <Button
              onClick={() => demo("Run /software-factory to tune or extend")}
            >
              Run /software-factory
            </Button>
            <Button variant="primary" onClick={() => demo("New automation")}>
              New automation
            </Button>
          </>
        }
      />
      <Table<AutomationRecord>
        rows={AUTOMATIONS}
        rowKey={(r) => r.catalogId}
        onRowClick={(r) => openStation(r, true)}
        columns={[
          {
            header: "Station",
            width: "22%",
            render: (r) => (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-medium">
                  {r.name}
                </div>
                <Muted className="mt-0.5 truncate font-mono">
                  {r.catalogId}
                </Muted>
              </div>
            ),
          },
          {
            header: "Starts on",
            width: "30%",
            render: (r) => <span className="text-muted">{r.trigger}</span>,
          },
          { header: "Schedule", render: (r) => r.schedule },
          { header: "Agent", render: (r) => r.agent },
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>How work flows</CardTitle>
          <ol className="flex flex-wrap items-center gap-2 text-sm text-content">
            {[
              "Issue triage marks it ready",
              "Label it openhands",
              "Issue to PR opens a draft PR",
              "PR reviewer reviews it",
              "QA changes exercises it",
              "Watchdog merges when green",
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                {i > 0 ? <span className="text-muted">→</span> : null}
                <span className="rounded-md border border-border px-2 py-1">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <Muted className="mt-3">
            The stale-CI closer warns on, then closes, PRs whose CI keeps
            failing, so abandoned work doesn&apos;t pile up.
          </Muted>
        </Card>
        <Card>
          <div className="mb-2 flex items-center">
            <h3 className="text-sm font-semibold text-content">
              Settings in effect
            </h3>
            <div className="flex-1" />
            <Button size="sm" onClick={() => demo("Tune factory settings")}>
              Tune
            </Button>
          </div>
          {FACTORY_SETTINGS.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-1 text-xs">
              <span className="text-muted">{k}</span>
              <span className="text-right font-mono text-content">{v}</span>
            </div>
          ))}
        </Card>
      </div>

      {ADD_GROUPS.map((g) => (
        <React.Fragment key={g.title}>
          <SectionTitle right={<Muted>{g.hint}</Muted>}>
            {g.title === "Ready to add" ? "Add a station" : g.title}
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ADD_ON_STATIONS.filter((r) => g.phases.includes(r.phase)).map(
              (r) => (
                <Card key={r.catalogId} onClick={() => openStation(r, false)}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 text-sm font-semibold text-content">
                      {r.name}
                    </div>
                    <Badge tone={PHASE_TONE[r.phase]}>
                      {r.phase === "Concept"
                        ? "Concept"
                        : r.phase === "Add-on"
                          ? "Skill add-on"
                          : "Catalog"}
                    </Badge>
                  </div>
                  <Muted className="mt-1 min-h-12">{r.outcome}</Muted>
                  <div className="mt-3 flex items-center gap-2">
                    <Muted className="flex-1">
                      {r.schedule} · {r.agent}
                    </Muted>
                  </div>
                </Card>
              ),
            )}
          </div>
        </React.Fragment>
      ))}
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
              {w.orchestrator ? <Badge tone="good">Primary agent</Badge> : null}
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

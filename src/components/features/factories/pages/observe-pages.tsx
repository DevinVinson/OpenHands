/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { useNavigation } from "#/context/navigation-context";
import {
  RUNS,
  factoryRunPath,
  type RunRecord,
  type RunStatus,
} from "../factory-data";
import {
  Badge,
  Bars,
  Button,
  Callout,
  Card,
  FilterChips,
  Muted,
  PageHeading,
  Row,
  SectionTitle,
  Table,
  useFactoryDrawer,
  type Tone,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";

export function runTone(status: RunStatus): Tone {
  switch (status) {
    case "Complete":
      return "good";
    case "Blocked":
    case "Failed":
      return "bad";
    case "Waiting":
      return "warn";
    default:
      return "info";
  }
}

type RunFilter = "All" | "Active" | "Complete" | "Blocked";

export function RunsPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const [filter, setFilter] = React.useState<RunFilter>("All");
  const [query, setQuery] = React.useState("");
  const rows = RUNS.filter(
    (r) =>
      (filter === "All" ||
        (filter === "Active" &&
          (r.status === "Working" || r.status === "Waiting")) ||
        r.status === filter) &&
      `${r.id} ${r.task} ${r.agent}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Agent runs"
        subtitle="Every execution has its own timeline, cost, output and parent work item."
        actions={
          <Button variant="primary" onClick={() => demo("Start run")}>
            Start run
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterChips<RunFilter>
          value={filter}
          onChange={setFilter}
          options={(["All", "Active", "Complete", "Blocked"] as const).map(
            (v) => ({ value: v, label: v }),
          )}
        />
        <div className="flex-1" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56 rounded-md border border-border bg-canvas-base px-3 py-1.5 text-sm text-content"
          placeholder="Search runs…"
        />
      </div>
      <Table<RunRecord>
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(factoryRunPath(factory.id, r.id))}
        columns={[
          {
            header: "Run",
            render: (r) => <span className="text-muted">{r.id}</span>,
          },
          {
            header: "Task",
            width: "27%",
            render: (r) => <span className="font-medium">{r.task}</span>,
          },
          { header: "Agent", render: (r) => r.agent },
          {
            header: "Status",
            render: (r) => <Badge tone={runTone(r.status)}>{r.status}</Badge>,
          },
          { header: "Duration", render: (r) => r.duration },
          { header: "Est. cost", render: (r) => r.cost },
        ]}
      />
      <Callout>
        Runs are executions, not work items. One work item can contain a
        coordinating run and several child agent runs. Keep the distinction
        visible in navigation and reporting.
      </Callout>
    </>
  );
}

export function QualityPage({ factory }: FactoryPageProps) {
  const { demo } = useFactoryDrawer();
  const scorers = [
    ["Code correctness", "Tests, compilation and acceptance criteria", "94%"],
    ["Verification evidence", "Reproducible screenshots, logs or video", "88%"],
    ["Review readiness", "PR scope, risk and documentation", "91%"],
  ];
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Quality & scorers"
        subtitle="Evaluate the evidence from completed work before changing factory behavior."
        actions={
          <Button variant="primary" onClick={() => demo("New scorer")}>
            New scorer
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Correctness", "94%", "Across 85 completed runs"],
          [
            "Validation completeness",
            "88%",
            "Evidence-backed tests and checks",
          ],
          ["PR review readiness", "91%", "No blocking findings at handoff"],
        ].map(([l, v, h]) => (
          <Card key={l}>
            <div className="text-xs font-medium text-muted">{l}</div>
            <div className="my-1 text-3xl font-semibold text-content">{v}</div>
            <Muted>{h}</Muted>
            <Bars values={[50, 62, 58, 74, 76, 82, 90]} height="h-14" />
          </Card>
        ))}
      </div>
      <SectionTitle>Scorer definitions</SectionTitle>
      <Table<string[]>
        rows={scorers}
        rowKey={(r) => r[0]}
        onRowClick={(r) => demo(r[0])}
        columns={[
          {
            header: "Scorer",
            render: (r) => <span className="font-medium">{r[0]}</span>,
          },
          { header: "Criterion", width: "40%", render: (r) => r[1] },
          { header: "Last 30 days", render: (r) => `${r[2]} passing` },
          { header: "Automatic", render: () => <Badge tone="good">Yes</Badge> },
        ]}
      />
      <SectionTitle>Self-improvement proposals</SectionTitle>
      <Card>
        {[
          [
            "Add test-artifact requirement to QA agent",
            "Proposed by evaluator",
            "Needs review",
          ],
          [
            "Tighten retry policy for failed CI automations",
            "Suggested from 12 failure traces",
            "Draft",
          ],
        ].map(([t, d, s]) => (
          <Row key={t} onClick={() => demo(t)}>
            <div>
              <div className="font-medium text-content">{t}</div>
              <Muted className="mt-1">{d}</Muted>
            </div>
            <Badge tone="warn">{s}</Badge>
          </Row>
        ))}
      </Card>
    </>
  );
}

export function BenchmarksPage({ factory }: FactoryPageProps) {
  const { demo } = useFactoryDrawer();
  const configs = [
    ["Configuration A", "95%", "$4.90 / task", 640, 25],
    ["Configuration B", "91%", "$2.12 / task", 290, 74],
    ["Configuration C", "87%", "$1.40 / task", 160, 119],
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Benchmarks"
        subtitle="Compare quality, cost and duration on the same representative tasks."
        actions={
          <Button variant="primary" onClick={() => demo("New benchmark")}>
            New benchmark
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <div className="text-sm font-semibold text-content">
              Implementation: model comparison
            </div>
            <Muted className="mt-1">
              4 fixed tasks × 3 configurations · evaluated Nov 21
            </Muted>
          </div>
          <div className="flex-1" />
          <Badge tone="good">Completed</Badge>
          <Button size="sm" onClick={() => demo("Run benchmark again")}>
            Run again
          </Button>
        </div>
        <div className="my-4 h-px bg-border" />
        <div className="grid gap-3 md:grid-cols-3">
          {configs.map(([name, score, cost], i) => (
            <Card
              key={name}
              tight
              className={i === 0 ? "bg-surface-raised/50" : undefined}
            >
              <Muted>{name}</Muted>
              <div className="my-1 text-2xl font-semibold text-content">
                {score}
              </div>
              <Muted>{cost}</Muted>
              {i === 0 ? (
                <div className="mt-2">
                  <Badge tone="info">Highest quality</Badge>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
        <SectionTitle>Quality vs. average cost</SectionTitle>
        <svg
          viewBox="0 0 800 190"
          className="h-48 w-full text-muted"
          role="img"
          aria-label="Quality versus cost scatter plot"
        >
          <line
            x1="50"
            y1="170"
            x2="775"
            y2="170"
            stroke="currentColor"
            opacity=".4"
          />
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="170"
            stroke="currentColor"
            opacity=".4"
          />
          <line
            x1="50"
            y1="64"
            x2="775"
            y2="64"
            stroke="currentColor"
            opacity=".12"
          />
          <line
            x1="50"
            y1="115"
            x2="775"
            y2="115"
            stroke="currentColor"
            opacity=".12"
          />
          {configs.map(([name, , , x, y]) => (
            <g key={name}>
              <circle cx={x} cy={y} r="7" className="fill-primary" />
              <text x={x + 14} y={y + 4} fontSize="12" fill="currentColor">
                {name.slice(-1)}
              </text>
            </g>
          ))}
          <text x="350" y="188" fontSize="11" fill="currentColor">
            Lower cost → Higher cost
          </text>
        </svg>
      </Card>
      <SectionTitle>Benchmark suites</SectionTitle>
      <Table<string[]>
        rows={[
          [
            "Implementation regression",
            "Implementation Agent",
            "12",
            "Yesterday",
          ],
          ["PR review quality", "Review Agent", "8", "2 days ago"],
          ["Issue classification", "Triage Agent", "17", "Last week"],
        ]}
        rowKey={(r) => r[0]}
        onRowClick={(r) => demo(r[0])}
        columns={[
          {
            header: "Suite",
            render: (r) => <span className="font-medium">{r[0]}</span>,
          },
          { header: "Assigned agent", render: (r) => r[1] },
          { header: "Tasks", render: (r) => r[2] },
          { header: "Last run", render: (r) => r[3] },
        ]}
      />
    </>
  );
}

/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "#/utils/utils";
import { useNavigation } from "#/context/navigation-context";
import {
  DEFINITION_FILES,
  FACTORY_YAML,
  RUNS,
  factoryPath,
  factoryRunPath,
  factoryWorkItemPath,
  findRun,
  findWorkItem,
  WORK_STAGES,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  CodeBox,
  Muted,
  PageHeading,
  Pill,
  Row,
  SectionTitle,
  Stat,
  Timeline,
  useFactoryDrawer,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";
import { runTone } from "./observe-pages";

function ArtifactList({ items }: { items: string[] }) {
  const { demo } = useFactoryDrawer();
  return (
    <>
      {items.map((a) => (
        <Row key={a} onClick={() => demo(a)}>
          <span className="text-content">{a}</span>
          <ArrowUpRight className="size-3.5 text-muted" />
        </Row>
      ))}
    </>
  );
}

export function WorkItemPage({
  factory,
  itemId,
}: FactoryPageProps & { itemId?: string }) {
  const item = findWorkItem(itemId);
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const stageLabel =
    WORK_STAGES.find((s) => s.stage === item.stage)?.label ?? item.stage;
  const runs = RUNS.filter((r) => r.workItemId === item.id);
  const shownRuns = runs.length ? runs : RUNS.slice(1, 3);

  return (
    <>
      <PageHeading
        backTo={factoryPath(factory.id, "queue")}
        backLabel="Work queue"
        eyebrow={eyebrow(factory)}
        title={`${item.id} · ${item.title}`}
        subtitle="Single work item spanning planning, agent runs, and final review."
        actions={
          <Button onClick={() => demo("Originating issue")}>
            View originating issue
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone="info">{stageLabel}</Badge>
        {item.stage === "plan" ? (
          <Badge tone="warn">Needs spec approval</Badge>
        ) : null}
        <Muted>{item.source}</Muted>
        <div className="flex-1" />
        <Badge>Owned by {item.agent}</Badge>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Card>
            <CardTitle>Work item context</CardTitle>
            <p className="text-sm leading-relaxed text-content">
              Clarify the expected behavior, document the change, and propose
              the implementation plan for approval before any code is written.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill>{item.source.split(" · ")[0]} issue</Pill>
              <Pill>{item.source.split(" · ")[1]}</Pill>
              <Pill>security-review</Pill>
            </div>
          </Card>
          <SectionTitle>Workflow activity</SectionTitle>
          <Card>
            <Timeline
              events={[
                {
                  title: `Received from ${item.source.split(" · ")[0]}`,
                  detail: "Automated issue intake saved all original context",
                  done: true,
                },
                {
                  title: "Triage complete",
                  detail: "Classified as medium risk, requires a written spec",
                  done: true,
                },
                {
                  title: "Planning in progress",
                  detail: "Planner created proposal and open questions",
                  done: true,
                },
                {
                  title: "Approval needed",
                  detail: "Reviewer to accept spec before implementation",
                },
              ]}
            />
          </Card>
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <Card>
            <CardTitle>Next action</CardTitle>
            <Badge tone="warn">Waiting for approval</Badge>
            <p className="my-3 text-sm text-content">
              Review the implementation plan before the build agent begins
              writing code.
            </p>
            <Button
              variant="primary"
              onClick={() => demo("Review specification")}
            >
              Review specification
            </Button>
            <div className="my-4 h-px bg-border" />
            <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
              Artifacts
            </div>
            <ArtifactList
              items={[
                "Implementation plan",
                "Risk analysis",
                "Source issue",
                "Agent session",
              ]}
            />
          </Card>
          <Card className="mt-4">
            <CardTitle>Agent runs</CardTitle>
            {shownRuns.map((r) => (
              <Row
                key={r.id}
                onClick={() => navigate(factoryRunPath(factory.id, r.id))}
              >
                <span className="text-content">
                  {r.id} · {r.agent}
                </span>
                <Badge tone={runTone(r.status)}>{r.status}</Badge>
              </Row>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

export function RunDetailPage({
  factory,
  runId,
}: FactoryPageProps & { runId?: string }) {
  const run = findRun(runId);
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  return (
    <>
      <PageHeading
        backTo={factoryPath(factory.id, "runs")}
        backLabel="Runs"
        eyebrow={eyebrow(factory)}
        title={`${run.id} · ${run.task}`}
        subtitle={
          <>
            Work item{" "}
            <button
              type="button"
              className="cursor-pointer text-link underline"
              onClick={() =>
                navigate(factoryWorkItemPath(factory.id, run.workItemId))
              }
            >
              {run.workItemId}
            </button>{" "}
            / {run.agent} / started {run.duration} ago
          </>
        }
        actions={<Button onClick={() => demo("Stop run")}>Stop run</Button>}
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat small label="Status" value={run.status} />
        <Stat small label="Duration" value={run.duration} />
        <Stat small label="Estimated cost" value={run.cost} />
        <Stat small label="Related runs" value="2 child runs" />
      </div>
      <div className="mt-5 flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Card>
            <div className="mb-2 flex items-center">
              <h3 className="text-sm font-semibold text-content">
                Execution timeline
              </h3>
              <div className="flex-1" />
              <Badge tone={runTone(run.status)}>
                {run.status === "Working" ? "Live" : run.status}
              </Badge>
            </div>
            <Timeline
              events={[
                {
                  title: "Workspace initialized",
                  detail: "Cloned web-app and installed dependencies",
                  done: true,
                },
                {
                  title: "Changes proposed",
                  detail: "Updated labels and accessibility attributes",
                  done: true,
                },
                {
                  title: "Tests executing",
                  detail: "Running unit tests and keyboard-navigation suite",
                  done: true,
                },
                {
                  title: "Verification pending",
                  detail: "Review screenshots and collect test results",
                },
              ]}
            />
          </Card>
          <Card className="mt-4">
            <CardTitle>Latest agent output</CardTitle>
            <CodeBox>{`$ npm run test:ui
✓ 42 component tests passed
✓ keyboard navigation test passed
$ npm run lint
✓ no violations

Preparing change summary and PR artifacts…`}</CodeBox>
          </Card>
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <Card>
            <CardTitle>Run context</CardTitle>
            <Muted>Agent</Muted>
            <p className="mb-3 mt-0.5 text-sm text-content">{run.agent}</p>
            <Muted>Harness / model</Muted>
            <p className="mb-3 mt-0.5 text-sm text-content">
              OpenHands agent · coding-model
            </p>
            <Muted>Branch</Muted>
            <p className="mt-0.5 text-sm text-content">agent/a11y-labels</p>
            <div className="my-4 h-px bg-border" />
            <Button
              variant="primary"
              onClick={() => navigate("/conversations")}
            >
              Open agent conversation
            </Button>
          </Card>
          <Card className="mt-4">
            <CardTitle>Artifacts</CardTitle>
            <ArtifactList
              items={[
                "Proposed diff",
                "Test report",
                "Screenshot evidence",
                "Draft pull request",
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

type SettingsTab = "overview" | "definitions" | "integrations" | "permissions";

export function SettingsPage({ factory }: FactoryPageProps) {
  const { demo } = useFactoryDrawer();
  const [tab, setTab] = React.useState<SettingsTab>("overview");
  const [file, setFile] = React.useState(DEFINITION_FILES[0]);
  const tabs: SettingsTab[] = [
    "overview",
    "definitions",
    "integrations",
    "permissions",
  ];

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Factory configuration"
        subtitle="Repository access, connection settings and version-controlled definitions."
        actions={
          <Button variant="primary" onClick={() => demo("Publish changes")}>
            Publish changes
          </Button>
        }
      />
      <div role="tablist" className="mb-5 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-sm capitalize",
              tab === t
                ? "border-primary font-medium text-content"
                : "border-transparent text-muted hover:text-content",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardTitle>Factory identity</CardTitle>
            <Muted>Name</Muted>
            <p className="mb-3 mt-0.5 text-sm text-content">{factory.name}</p>
            <Muted>Orchestrator</Muted>
            <p className="mb-3 mt-0.5 text-sm text-content">@{factory.id}</p>
            <Muted>Description</Muted>
            <p className="mt-0.5 text-sm text-content">
              {factory.description || "—"}
            </p>
          </Card>
          <Card>
            <CardTitle>Repository scope</CardTitle>
            {factory.repositories.map((r) => (
              <Row key={r}>
                <span className="text-content">{r}</span>
                <Badge tone="good">Connected</Badge>
              </Row>
            ))}
            <div className="mt-4">
              <Button onClick={() => demo("Add repository")}>
                Add repository
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "definitions" ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full shrink-0 lg:w-72">
            <Card>
              <CardTitle>Definition files</CardTitle>
              {DEFINITION_FILES.map((f) => (
                <Row key={f} onClick={() => setFile(f)}>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      f === file ? "text-content" : "text-muted",
                    )}
                  >
                    {f}
                  </span>
                  <span className="text-muted">›</span>
                </Row>
              ))}
            </Card>
          </div>
          <div className="min-w-0 flex-1">
            <Card>
              <div className="mb-3 flex items-center">
                <h3 className="font-mono text-sm font-semibold text-content">
                  {file}
                </h3>
                <div className="flex-1" />
                <Badge tone="good">v1.4 published</Badge>
              </div>
              <CodeBox>
                {file === "factory.yaml"
                  ? FACTORY_YAML
                  : `# ${file}\n# Version-controlled definition (prototype placeholder)`}
              </CodeBox>
            </Card>
          </div>
        </div>
      ) : null}
      {tab === "integrations" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["GitHub", "Source control + PRs"],
            ["Linear", "Issues and planning"],
            ["Slack", "Notifications + approvals"],
            ["Sentry", "Incident webhook"],
            ["MCP servers", "Runtime tools"],
          ].map(([n, d]) => (
            <Card key={n} onClick={() => demo(n)}>
              <CardTitle>{n}</CardTitle>
              <Muted className="mb-3">{d}</Muted>
              <Badge tone="good">Connected</Badge>
            </Card>
          ))}
        </div>
      ) : null}
      {tab === "permissions" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Read-only agent", "Inspect and search repositories"],
            ["Implementation agent", "Write branches and create PRs"],
            ["Review agent", "Read diffs and create reviews"],
            ["QA agent", "Run tests and create artifacts"],
          ].map(([n, d]) => (
            <Card key={n} onClick={() => demo(n)}>
              <CardTitle>{n}</CardTitle>
              <Muted>{d}</Muted>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}

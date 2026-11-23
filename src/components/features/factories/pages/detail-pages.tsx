/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "#/utils/utils";
import { useNavigation } from "#/context/navigation-context";
import {
  DEFINITION_FILES,
  FACTORY_YAML,
  factoryPath,
  factoryRefPath,
  findAgent,
  findRef,
  findRun,
  type Factory,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  CodeBox,
  Muted,
  PageHeading,
  Row,
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
            {findRef(run.refId)?.type === "pr" ? "PR" : "Issue"}{" "}
            <button
              type="button"
              className="cursor-pointer text-link underline"
              onClick={() => navigate(factoryRefPath(factory.id, run.refId))}
            >
              {findRef(run.refId)?.label ?? run.refId}
            </button>{" "}
            / {run.agent} / started {run.duration} ago
          </>
        }
        actions={
          <>
            <Button onClick={() => demo("Open trace in Laminar")}>
              Open in Laminar <ArrowUpRight className="size-3.5" />
            </Button>
            <Button onClick={() => demo("Stop run")}>Stop run</Button>
          </>
        }
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

function factoryYaml(f: Factory) {
  const kpis = f.kpis.length
    ? f.kpis
        .map((k) => `  - name: ${k.label}\n    target: "${k.target}"`)
        .join("\n")
    : "  []";
  return `schemaVersion: v1alpha1
name: ${f.id}
description: ${f.description || '""'}
goal: >
  ${f.goal || "TBD"}
kpis:
${kpis}
owner: ${f.owner || "unassigned"}
tag: ${f.tag}
orchestrator: ${f.orchestratorId ?? "null"}
repositories:
${f.repositories.map((r) => `  - ${r}`).join("\n")}
integrations: [${f.integrations.join(", ")}]
${FACTORY_YAML.slice(FACTORY_YAML.indexOf("blueprint:"))}`;
}

export function SettingsPage({
  factory,
  onDelete,
}: FactoryPageProps & { onDelete?: () => void }) {
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
            {(
              [
                ["Name", factory.name],
                ["Description", factory.description || "—"],
                ["Goal", factory.goal || "—"],
                ["Owner / team", factory.owner || "—"],
                ["Tag", factory.tag],
                [
                  "Primary agent",
                  findAgent(factory.orchestratorId)?.name ?? "None (optional)",
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="mb-3">
                <Muted>{k}</Muted>
                <p className="mt-0.5 text-sm text-content">{v}</p>
              </div>
            ))}
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
          <Card className="md:col-span-2">
            <CardTitle>Danger zone</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Muted className="flex-1">
                Deleting removes the factory from Canvas. Its definition stays
                in {factory.definitionsRepo}.
              </Muted>
              <Button onClick={onDelete}>Delete factory</Button>
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "definitions" ? (
        <>
          <Card className="mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Muted>Definition repository</Muted>
                <div className="mt-0.5 font-mono text-sm text-content">
                  {factory.definitionsRepo}/{factory.definitionsPath}
                </div>
              </div>
              <div className="flex-1" />
              <Badge tone="good">In sync · main @ 3f9c2a1</Badge>
              <Button
                size="sm"
                onClick={() => demo("Open pull request with changes")}
              >
                Changes open as a PR
              </Button>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              {[
                [
                  "3f9c2a1",
                  "Add stale-review rule",
                  "Factory Coordinator",
                  "2h",
                ],
                [
                  "a71e0d4",
                  "Tighten QA evidence requirement",
                  "Priya S.",
                  "1d",
                ],
                [
                  "09bd5c3",
                  "Initial factory from creation flow",
                  "Canvas",
                  "6d",
                ],
              ].map(([sha, msg, who, when]) => (
                <div key={sha} className="flex gap-3 py-1 text-xs">
                  <span className="font-mono text-muted">{sha}</span>
                  <span className="flex-1 text-content">{msg}</span>
                  <span className="text-muted">
                    {who} · {when}
                  </span>
                </div>
              ))}
            </div>
          </Card>
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
                    ? factoryYaml(factory)
                    : `# ${file}\n# Version-controlled definition (prototype placeholder)`}
                </CodeBox>
              </Card>
            </div>
          </div>
        </>
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

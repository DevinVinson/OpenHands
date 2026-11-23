/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import {
  AlertTriangle,
  Cable,
  Plus,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "#/utils/utils";
import { useNavigation } from "#/context/navigation-context";
import {
  AGENTS,
  AUTOMATIONS,
  AVAILABLE_INTEGRATIONS,
  RESOLUTION_RULES,
  WORKFLOW_EDGES,
  WORKFLOW_NODES,
  WORKFLOW_NODE_H,
  WORKFLOW_NODE_W,
  factoryAgentPath,
  factoryPath,
  type EdgeKind,
  type WorkflowEdge,
  type WorkflowNode,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  Muted,
  Note,
  PageHeading,
  useFactoryDrawer,
  type Tone,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";
import {
  NewRuleButton,
  ResolutionRulesList,
  useRuleSwitches,
} from "./operations";

const CANVAS_PAD = 40;

/** Free slots for integrations dropped onto the canvas. */
const FREE_SLOTS = [
  { x: 940, y: 30 },
  { x: 1160, y: 30 },
  { x: 1380, y: 30 },
  { x: 90, y: 420 },
];

const EDGE_STYLE: Record<
  EdgeKind,
  { label: string; dash?: string; className: string; hint: string }
> = {
  trigger: {
    label: "Integration ↔ automation",
    className: "text-primary",
    hint: "What the automation watches and writes back to",
  },
  runs: {
    label: "Automation runs station",
    dash: "3 3",
    className: "text-primary",
    hint: "The automation that carries out this station",
  },
  work: {
    label: "Work",
    className: "text-muted",
    hint: "Hands work to the next station",
  },
  context: {
    label: "Context",
    dash: "6 5",
    className: "text-info",
    hint: "Read for context while the station works",
  },
  notify: {
    label: "Ask / notify",
    dash: "2 5",
    className: "text-warning",
    hint: "Where the station asks people or reports",
  },
};

const KIND_TONE: Record<WorkflowNode["kind"], Tone> = {
  integration: "neutral",
  automation: "info",
  stage: "info",
  gate: "warn",
  outcome: "good",
};

const KIND_LABEL: Record<WorkflowNode["kind"], string> = {
  integration: "Integration",
  automation: "Automation",
  stage: "Station",
  gate: "Human gate",
  outcome: "Outcome",
};

/** What each automation writes back to its integration. */
const WRITES: Record<string, string> = {
  "github-issue-triage": "Labels, priority and acceptance criteria on issues",
  "github-issue-to-pr": "Branches and draft PRs; replies to review feedback",
  "qa-changes": "QA report comment with evidence on the PR",
  "github-pr-reviewer": "Reviews and inline comments",
  "github-delivery-watchdog": "Merges green, independently reviewed PRs",
  "github-stale-ci-pr-closer": "Warning comments, then closes the PR",
};

const LANES = [
  [210, "Stations"],
  [400, "Automations"],
  [580, "Code host"],
] as const;

const size = (n: WorkflowNode) => ({
  w: n.w ?? WORKFLOW_NODE_W,
  h: n.h ?? WORKFLOW_NODE_H,
});

/** Anchors and a curve between two nodes; vertical when stacked. */
function edgeGeometry(from: WorkflowNode, to: WorkflowNode) {
  const f = size(from);
  const t = size(to);
  const fcx = from.x + f.w / 2;
  const tcx = to.x + t.w / 2;
  const wide = f.w > 400 || t.w > 400;
  const vertical = wide || Math.abs(to.y - from.y) > Math.abs(tcx - fcx) * 0.9;

  if (vertical) {
    const clampX = (x: number, n: WorkflowNode) =>
      Math.min(Math.max(x, n.x + 24), n.x + size(n).w - 24);
    // A wide bar anchors under or over the other node's centre.
    const sx = f.w > 400 ? clampX(tcx, from) : fcx;
    const tx = t.w > 400 ? clampX(fcx, to) : tcx;
    const down = to.y > from.y;
    const sy = down ? from.y + f.h : from.y;
    const ty = down ? to.y : to.y + t.h;
    const dy = (ty - sy) / 2;
    return {
      d: `M ${sx} ${sy} C ${sx} ${sy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`,
      tx,
      ty,
      mx: (sx + tx) / 2,
      my: (sy + ty) / 2,
    };
  }
  const sx = from.x + f.w;
  const sy = from.y + f.h / 2;
  const tx = to.x;
  const ty = to.y + t.h / 2;
  const dx = Math.max(40, Math.abs(tx - sx) / 2);
  return {
    d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`,
    tx,
    ty,
    mx: (sx + tx) / 2,
    my: (sy + ty) / 2,
  };
}

function defaultKind(from: WorkflowNode, to: WorkflowNode): EdgeKind {
  if (from.kind === "integration" && to.kind === "automation") return "trigger";
  if (from.kind === "automation") return "runs";
  if (from.kind !== "integration") return "work";
  if (to.kind === "gate") return "notify";
  return to.id === "triage" ? "work" : "context";
}

function IntegrationMark({ label }: { label: string }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-contrast text-2xs font-bold text-canvas-base">
      {label.slice(0, 1)}
    </span>
  );
}

function PanelLink({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <Muted>{label}</Muted>
      <div className="text-content">{value}</div>
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 w-full cursor-pointer rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-surface-raised"
    >
      {body}
    </button>
  ) : (
    <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm">
      {body}
    </div>
  );
}

function EdgeSwatch({ className, dash }: { className: string; dash?: string }) {
  return (
    <svg width="26" height="6" className={className}>
      <line
        x1="0"
        y1="3"
        x2="26"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={dash}
      />
    </svg>
  );
}

export function WorkflowsPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const [nodes, setNodes] = React.useState<WorkflowNode[]>(WORKFLOW_NODES);
  const [edges, setEdges] = React.useState<WorkflowEdge[]>(WORKFLOW_EDGES);
  const [selectedId, setSelectedId] = React.useState("github");
  const [connecting, setConnecting] = React.useState(false);
  const [connectFrom, setConnectFrom] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [showLabels, setShowLabels] = React.useState(true);
  const rules = useRuleSwitches();

  const byId = React.useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const canvasW =
    nodes.reduce((m, n) => Math.max(m, n.x + size(n).w), 0) + CANVAS_PAD;
  const canvasH =
    nodes.reduce((m, n) => Math.max(m, n.y + size(n).h), 0) + CANVAS_PAD;
  const selected = byId[selectedId];

  const addEdge = (from: string, to: string) => {
    if (from === to) return;
    if (edges.some((e) => e.from === from && e.to === to)) return;
    setEdges((es) => [
      ...es,
      {
        id: `e-${from}-${to}`,
        from,
        to,
        kind: defaultKind(byId[from], byId[to]),
      },
    ]);
    setDirty(true);
  };
  const removeEdge = (id: string) => {
    setEdges((es) => es.filter((e) => e.id !== id));
    setDirty(true);
  };
  const setEdgeKind = (id: string, kind: EdgeKind) => {
    setEdges((es) => es.map((e) => (e.id === id ? { ...e, kind } : e)));
    setDirty(true);
  };
  const removeNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
    setSelectedId("github");
    setDirty(true);
  };
  const addIntegration = (i: (typeof AVAILABLE_INTEGRATIONS)[number]) => {
    const taken = new Set(nodes.map((n) => `${n.x},${n.y}`));
    const slot = FREE_SLOTS.find((s) => !taken.has(`${s.x},${s.y}`)) ?? {
      x: 30,
      y: 30,
    };
    setNodes((ns) => [...ns, { ...i, kind: "integration", ...slot }]);
    setSelectedId(i.id);
    setAddOpen(false);
    setDirty(true);
  };

  const onNodeClick = (id: string) => {
    if (connecting) {
      if (!connectFrom) {
        setConnectFrom(id);
        return;
      }
      addEdge(connectFrom, id);
      setConnectFrom(null);
      setConnecting(false);
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
  };

  const inputs = edges.filter((e) => e.to === selectedId);
  const outputs = edges.filter((e) => e.from === selectedId);
  const gaps = inputs.filter((e) => e.gap);
  const connectable = nodes.filter(
    (n) =>
      n.id !== selectedId &&
      !inputs.some((e) => e.from === n.id) &&
      n.kind !== "outcome",
  );
  const agent = AGENTS.find((a) => a.name === selected?.detail);
  const automation =
    selected?.kind === "automation"
      ? AUTOMATIONS.find((a) => a.catalogId === selected.detail)
      : undefined;
  const runsBy = inputs
    .filter((e) => e.kind === "runs")
    .map((e) => byId[e.from])
    .filter(Boolean);
  const usedBy =
    selected?.kind === "integration"
      ? outputs
          .filter((e) => e.kind === "trigger")
          .map((e) => byId[e.to])
          .filter(Boolean)
      : [];
  const notOnCanvas = AVAILABLE_INTEGRATIONS.filter((i) => !byId[i.id]);
  const gapCount = edges.filter((e) => e.gap).length;

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Workflows"
        subtitle="See how automations connect your integrations to each station: what they watch, what they write back, and which station they carry out."
        actions={
          <>
            <div className="relative">
              <Button
                onClick={() => setAddOpen((o) => !o)}
                aria-expanded={addOpen}
              >
                <Plus className="size-3.5" /> Add integration
              </Button>
              {addOpen ? (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-canvas-base p-1 shadow-lg">
                  {notOnCanvas.length ? (
                    notOnCanvas.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => addIntegration(i)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-content hover:bg-surface-raised"
                      >
                        <IntegrationMark label={i.label} />
                        <span className="flex-1">{i.label}</span>
                        <span className="text-xs text-muted">{i.detail}</span>
                      </button>
                    ))
                  ) : (
                    <Muted className="p-2">All integrations are placed.</Muted>
                  )}
                </div>
              ) : null}
            </div>
            <Button
              aria-pressed={connecting}
              onClick={() => {
                setConnecting((c) => !c);
                setConnectFrom(null);
              }}
              className={cn(connecting && "border-primary text-primary")}
            >
              <Cable className="size-3.5" /> {connecting ? "Cancel" : "Connect"}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                demo("Publish: open a PR to the factory definition repo")
              }
            >
              Publish
            </Button>
          </>
        }
      />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="good">Published v1.4</Badge>
        {dirty ? <Badge tone="warn">Unpublished changes</Badge> : null}
        {gapCount ? (
          <Badge tone="bad">
            {gapCount} {gapCount === 1 ? "connection" : "connections"} not
            automated
          </Badge>
        ) : null}
        <Muted className="font-mono">
          {factory.definitionsRepo}/{factory.definitionsPath}workflows.yaml
        </Muted>
        <div className="flex-1" />
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Show triggers
        </label>
      </div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {(Object.keys(EDGE_STYLE) as EdgeKind[]).map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1.5 text-xs text-muted"
            title={EDGE_STYLE[k].hint}
          >
            <EdgeSwatch
              className={EDGE_STYLE[k].className}
              dash={EDGE_STYLE[k].dash}
            />
            {EDGE_STYLE[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <EdgeSwatch className="text-danger" dash="4 4" />
          Not automated yet
        </span>
      </div>
      {connecting ? (
        <div className="mb-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-content">
          {connectFrom
            ? `Now click where ${byId[connectFrom]?.label} should connect to.`
            : "Click where the connection starts. Integration → automation makes a trigger; automation → station makes it run that station."}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row">
        <div
          className="min-w-0 flex-1 overflow-auto rounded-xl border border-border"
          style={{
            backgroundImage:
              "radial-gradient(var(--color-border) 0.8px, transparent 0.8px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="relative" style={{ width: canvasW, height: canvasH }}>
            {LANES.map(([y, label]) => (
              <div
                key={label}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-border"
                style={{ top: y }}
              >
                <span
                  className="absolute pt-0.5 text-3xs uppercase tracking-wider text-muted"
                  style={{ left: 8 }}
                >
                  {label}
                </span>
              </div>
            ))}
            <svg
              width={canvasW}
              height={canvasH}
              className="pointer-events-none absolute inset-0"
              aria-hidden
            >
              {edges.map((e) => {
                const from = byId[e.from];
                const to = byId[e.to];
                if (!from || !to) return null;
                const { d, tx, ty } = edgeGeometry(from, to);
                const touches = e.from === selectedId || e.to === selectedId;
                const style = EDGE_STYLE[e.kind];
                return (
                  <g
                    key={e.id}
                    className={e.gap ? "text-danger" : style.className}
                    opacity={touches ? 1 : 0.28}
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={touches ? 2 : 1.5}
                      strokeDasharray={e.gap ? "4 4" : style.dash}
                    />
                    <circle cx={tx} cy={ty} r="3.5" fill="currentColor" />
                  </g>
                );
              })}
            </svg>
            {edges.map((e) => {
              const from = byId[e.from];
              const to = byId[e.to];
              if (!from || !to) return null;
              const text = e.gap ? "not automated" : e.label;
              if (!text || (!showLabels && !e.gap)) return null;
              const { mx, my } = edgeGeometry(from, to);
              const touches = e.from === selectedId || e.to === selectedId;
              return (
                <div
                  key={`l-${e.id}`}
                  className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-3xs",
                    e.gap
                      ? "border-danger/40 bg-danger-soft text-danger-soft-foreground"
                      : "border-primary/30 bg-canvas-base text-content",
                    !touches && "opacity-60",
                  )}
                  style={{ left: mx, top: my }}
                >
                  {e.gap ? (
                    <AlertTriangle className="-mt-px mr-0.5 inline size-2.5" />
                  ) : null}
                  {text}
                </div>
              );
            })}
            {nodes.map((n) => {
              const isSelected = n.id === selectedId;
              const isFrom = n.id === connectFrom;
              const { w, h } = size(n);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onNodeClick(n.id)}
                  aria-pressed={isSelected}
                  style={{ left: n.x, top: n.y, width: w, height: h }}
                  className={cn(
                    "absolute flex cursor-pointer flex-col justify-center rounded-lg border px-3 text-left shadow-sm transition-colors",
                    n.kind === "gate"
                      ? "border-warning/50 bg-warning-soft"
                      : n.kind === "outcome"
                        ? "border-success/40 bg-success-soft"
                        : n.kind === "automation"
                          ? "border-primary/50 bg-canvas-base"
                          : n.kind === "integration"
                            ? "border-dashed border-border bg-canvas-base"
                            : "border-border bg-canvas-base",
                    "hover:border-contrast/40",
                    isSelected && "outline-2 outline-primary",
                    isFrom && "outline-2 outline-dashed outline-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {n.kind === "integration" ? (
                      <IntegrationMark label={n.label} />
                    ) : null}
                    {n.kind === "automation" ? (
                      <Zap className="size-3.5 shrink-0 text-primary" />
                    ) : null}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-content">
                        {n.label}
                      </div>
                      <div
                        className={cn(
                          "truncate text-2xs text-muted",
                          n.kind === "automation" && "font-mono",
                        )}
                      >
                        {n.detail}
                      </div>
                    </div>
                  </div>
                  {RESOLUTION_RULES.some((r) => r.stationId === n.id) ? (
                    <span className="absolute -right-2 -top-2 inline-flex items-center gap-0.5 rounded-full border border-success/40 bg-success-soft px-1.5 py-0.5 text-3xs text-success-soft-foreground">
                      <ShieldCheck className="size-2.5" />
                      {
                        RESOLUTION_RULES.filter((r) => r.stationId === n.id)
                          .length
                      }{" "}
                      rule
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <Card className="w-full shrink-0 self-start xl:w-80">
            <div className="flex items-start gap-2">
              {selected.kind === "integration" ? (
                <IntegrationMark label={selected.label} />
              ) : null}
              {selected.kind === "automation" ? (
                <Zap className="mt-1 size-4 shrink-0 text-primary" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-content">
                  {selected.label}
                </div>
                <Muted
                  className={cn(selected.kind === "automation" && "font-mono")}
                >
                  {selected.detail}
                </Muted>
              </div>
              <Badge tone={KIND_TONE[selected.kind]}>
                {KIND_LABEL[selected.kind]}
              </Badge>
            </div>

            {automation ? (
              <>
                <PanelLink
                  label="Schedule"
                  value={`${automation.schedule}${automation.cron !== "webhook" ? ` (${automation.cron})` : ""}`}
                />
                <PanelLink label="Starts on" value={automation.trigger} />
                <PanelLink
                  label="Writes back"
                  value={WRITES[automation.catalogId] ?? automation.outcome}
                />
                <PanelLink
                  label="Agent"
                  value={automation.agent}
                  onClick={() => {
                    const a = AGENTS.find((x) => x.name === automation.agent);
                    if (a) navigate(factoryAgentPath(factory.id, a.id));
                  }}
                />
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(factoryPath(factory.id, "automations"))
                    }
                  >
                    Open in Automations
                  </Button>
                </div>
              </>
            ) : null}

            {(selected.kind === "stage" || selected.kind === "gate") &&
            agent ? (
              <PanelLink
                label="Agent"
                value={
                  <>
                    {agent.name} ·{" "}
                    <span className="font-mono text-xs">
                      {agent.profile.name}
                    </span>
                  </>
                }
                onClick={() => navigate(factoryAgentPath(factory.id, agent.id))}
              />
            ) : null}
            {selected.kind === "stage" ? (
              runsBy.length ? (
                <PanelLink
                  label="Run by automation"
                  value={runsBy.map((n) => n.label).join(", ")}
                  onClick={() => setSelectedId(runsBy[0].id)}
                />
              ) : (
                <div className="mt-3">
                  <Note>
                    No automation runs this station; the primary agent hands
                    work to {selected.detail} directly.
                  </Note>
                </div>
              )
            ) : null}
            {gaps.length ? (
              <div className="mt-3 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-danger-soft-foreground">
                {gaps.map((g) => (
                  <p key={g.id} className="mb-1 last:mb-0">
                    <b>{byId[g.from]?.label}:</b> {g.gap}
                  </p>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    navigate(factoryPath(factory.id, "automations"))
                  }
                  className="mt-1 cursor-pointer font-medium underline"
                >
                  Add a station
                </button>
              </div>
            ) : null}

            {selected.kind === "integration" ? (
              <PanelLink
                label="Automations using it"
                value={
                  usedBy.length
                    ? usedBy.map((n) => n.label).join(", ")
                    : "None. Work from here isn't automated yet."
                }
              />
            ) : null}
            {selected.kind === "integration" &&
            !usedBy.length &&
            outputs.some((e) => e.gap) ? (
              <PanelLink
                label="Suggested station"
                value={
                  selected.id === "linear"
                    ? "Linear issue to GitHub PR · Linear triage assistant"
                    : "Error to issue (concept)"
                }
                onClick={() => navigate(factoryPath(factory.id, "automations"))}
              />
            ) : null}
            {selected.kind === "stage" || selected.kind === "gate" ? (
              <div className="mt-4">
                <div className="mb-1 flex items-center text-2xs font-semibold uppercase tracking-wider text-muted">
                  <ShieldCheck className="mr-1 size-3" /> Rules guarding this
                  station
                </div>
                <ResolutionRulesList
                  stationId={selected.id}
                  enabled={rules.enabled}
                  onToggle={rules.toggle}
                />
              </div>
            ) : null}
            {selected.kind === "gate" ? (
              <PanelLink label="Approvers" value="Factory maintainers" />
            ) : null}

            {(
              [
                ["Inputs", inputs, "from"],
                ["Outputs", outputs, "to"],
              ] as const
            ).map(([title, list, end]) =>
              !list.length && selected.kind === "integration" ? null : (
                <div key={title} className="mt-4">
                  <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted">
                    {title} ({list.length})
                  </div>
                  {list.length ? (
                    list.map((e) => {
                      const other = byId[e[end]];
                      return (
                        <div
                          key={e.id}
                          className="flex items-center gap-2 border-b border-border py-1.5 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(other.id)}
                            className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-content hover:underline"
                            title={e.label}
                          >
                            {other?.label}
                            {e.label ? (
                              <span className="ml-1 text-2xs text-muted">
                                {e.label}
                              </span>
                            ) : null}
                          </button>
                          <select
                            aria-label={`Connection type for ${other?.label}`}
                            value={e.kind}
                            onChange={(ev) =>
                              setEdgeKind(e.id, ev.target.value as EdgeKind)
                            }
                            className="w-24 rounded border border-border bg-canvas-base px-1 py-0.5 text-xs text-content"
                          >
                            {(Object.keys(EDGE_STYLE) as EdgeKind[]).map(
                              (k) => (
                                <option key={k} value={k}>
                                  {EDGE_STYLE[k].label}
                                </option>
                              ),
                            )}
                          </select>
                          <button
                            type="button"
                            aria-label={`Remove connection with ${other?.label}`}
                            onClick={() => removeEdge(e.id)}
                            className="cursor-pointer rounded p-1 text-muted hover:bg-surface-raised hover:text-content"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <Muted>None</Muted>
                  )}
                </div>
              ),
            )}

            {selected.kind !== "integration" ? (
              <div className="mt-3">
                <select
                  aria-label="Add an input"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addEdge(e.target.value, selected.id);
                  }}
                  className="w-full rounded-md border border-border bg-canvas-base px-2 py-1.5 text-sm text-content"
                >
                  <option value="">+ Add an input…</option>
                  {connectable.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({KIND_LABEL[n.kind].toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selected.kind === "integration" && selected.id !== "github" ? (
              <div className="mt-4">
                <Button size="sm" onClick={() => removeNode(selected.id)}>
                  <Trash2 className="size-3.5" /> Remove from workflow
                </Button>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>

      <Card className="mt-4">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="size-4 text-success" />
          <h3 className="text-sm font-semibold text-content">
            Resolution rules
          </h3>
          <Muted>
            How the workflow clears its own blockers, station by station.
          </Muted>
          <div className="flex-1" />
          <NewRuleButton size="sm" />
        </div>
        <ResolutionRulesList
          enabled={rules.enabled}
          onToggle={rules.toggle}
          onSelectStation={setSelectedId}
        />
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Note>
          ↯ Each automation sits between an integration and a station: it
          watches the integration, does the station&apos;s work, and writes the
          result back.
        </Note>
        <Note>
          ◇ Human gates pause work until a decision is recorded; approval is not
          merge authorization.
        </Note>
        <Note>
          ⎇ The workflow is a file in the factory&apos;s definition repo;
          publishing opens a PR, and new work uses the published version.
        </Note>
      </div>
    </>
  );
}

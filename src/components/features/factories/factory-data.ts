/**
 * Static wireframe data for the Factories prototype.
 *
 * PROTOTYPE: nothing here is fetched from a backend. These records exist so
 * the Factories UI can be clicked through and discussed; the real contracts
 * belong in the Agent Server / TypeScript client.
 */

export const FACTORIES_PATH = "/factories";

export type FactorySection =
  | "overview"
  | "queue"
  | "attention"
  | "blueprint"
  | "automations"
  | "workers"
  | "runs"
  | "quality"
  | "benchmarks"
  | "settings";

export const DEFAULT_FACTORY_SECTION: FactorySection = "overview";

export function factoryPath(factoryId: string, section?: FactorySection) {
  const base = `${FACTORIES_PATH}/${encodeURIComponent(factoryId)}`;
  return section && section !== DEFAULT_FACTORY_SECTION
    ? `${base}/${section}`
    : base;
}

export function factoryWorkItemPath(factoryId: string, itemId: string) {
  return `${factoryPath(factoryId)}/work/${encodeURIComponent(itemId)}`;
}

export function factoryRunPath(factoryId: string, runId: string) {
  return `${factoryPath(factoryId)}/runs/${encodeURIComponent(runId)}`;
}

export interface FactoryNavItem {
  section: FactorySection;
  label: string;
  count?: number;
}

export interface FactoryNavGroup {
  label?: string;
  items: FactoryNavItem[];
}

/** Sidebar children shown under an expanded factory. */
export const FACTORY_NAV_GROUPS: FactoryNavGroup[] = [
  {
    items: [
      { section: "overview", label: "Overview" },
      { section: "queue", label: "Work queue", count: 9 },
      { section: "attention", label: "Needs attention", count: 3 },
    ],
  },
  {
    label: "Build",
    items: [
      { section: "blueprint", label: "Workflow blueprint" },
      { section: "automations", label: "Automations", count: 6 },
      { section: "workers", label: "Workers", count: 5 },
    ],
  },
  {
    label: "Observe",
    items: [
      { section: "runs", label: "Runs", count: 24 },
      { section: "quality", label: "Quality & scorers" },
      { section: "benchmarks", label: "Benchmarks" },
    ],
  },
  {
    items: [{ section: "settings", label: "Configuration" }],
  },
];

export const FACTORY_SECTIONS = FACTORY_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.section),
);

export function isFactorySection(value: unknown): value is FactorySection {
  return FACTORY_SECTIONS.includes(value as FactorySection);
}

export interface Factory {
  id: string;
  name: string;
  description: string;
  repositories: string[];
}

export const SEED_FACTORIES: Factory[] = [
  {
    id: "demo-factory",
    name: "DemoFactory",
    description: "Build, verify and review product changes.",
    repositories: ["org/web-app", "org/api-service"],
  },
];

export type WorkStage = "triage" | "plan" | "build" | "verify" | "review";
export type Priority = "High" | "Medium" | "Low";

export const WORK_STAGES: { stage: WorkStage; label: string }[] = [
  { stage: "triage", label: "Inbox & triage" },
  { stage: "plan", label: "Planning" },
  { stage: "build", label: "Building" },
  { stage: "verify", label: "Verification" },
  { stage: "review", label: "Review & ship" },
];

export interface WorkItem {
  id: string;
  title: string;
  source: string;
  stage: WorkStage;
  priority: Priority;
  age: string;
  worker: string;
}

export const WORK_ITEMS: WorkItem[] = [
  [
    "SF-1042",
    "Fix duplicate webhook deliveries",
    "GitHub · api-service",
    "triage",
    "High",
    "1m",
  ],
  [
    "SF-1048",
    "Investigate sporadic auth timeouts",
    "Sentry · web-app",
    "triage",
    "Medium",
    "8m",
  ],
  [
    "SF-1036",
    "Document organization permissions",
    "Jira · platform",
    "plan",
    "Medium",
    "24m",
  ],
  [
    "SF-1031",
    "Improve retry behavior for failed jobs",
    "Linear · api-service",
    "plan",
    "Low",
    "1h",
  ],
  [
    "SF-1023",
    "Implement accessible labels in editor",
    "GitHub · web-app",
    "build",
    "Medium",
    "2h",
  ],
  [
    "SF-1018",
    "Update webhook payload schema",
    "Linear · api-service",
    "build",
    "High",
    "3h",
  ],
  [
    "SF-1027",
    "Regression verification for CI failures",
    "GitHub · api-service",
    "verify",
    "Medium",
    "5h",
  ],
  [
    "SF-1009",
    "Review PR #811 test coverage",
    "GitHub · web-app",
    "review",
    "High",
    "8h",
  ],
  [
    "SF-1013",
    "Approve change to token renewal",
    "Linear · api-service",
    "review",
    "High",
    "1d",
  ],
].map(([id, title, source, stage, priority, age]) => ({
  id,
  title,
  source,
  stage: stage as WorkStage,
  priority: priority as Priority,
  age,
  worker:
    stage === "build"
      ? "Implementation Agent"
      : stage === "review"
        ? "Review Agent"
        : stage === "verify"
          ? "QA Agent"
          : stage === "triage"
            ? "Triage Agent"
            : "Planner",
}));

export function findWorkItem(id: string | undefined) {
  return WORK_ITEMS.find((w) => w.id === id) ?? WORK_ITEMS[2];
}

export type AttentionKind = "Spec approval" | "Question" | "PR review";

export interface AttentionItem {
  id: string;
  title: string;
  kind: AttentionKind;
  workItemId: string;
  age: string;
  action: string;
  detail: string;
}

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    title: "Review proposed retry policy",
    kind: "Spec approval",
    workItemId: "SF-1036",
    age: "18m",
    action: "Review spec",
    detail:
      "The Planner drafted a spec for organization permissions and retry semantics. Implementation is gated on your approval.",
  },
  {
    id: "att-2",
    title: "Define expected auth retry behavior",
    kind: "Question",
    workItemId: "SF-1048",
    age: "39m",
    action: "Answer",
    detail:
      "Should an expired token trigger a silent refresh and retry, or surface a sign-in prompt to the user?",
  },
  {
    id: "att-3",
    title: "Approve PR #811 accessibility fixes",
    kind: "PR review",
    workItemId: "SF-1009",
    age: "2h",
    action: "Review PR",
    detail:
      "Review Agent found no blocking issues. 42 component tests and the keyboard-navigation suite passed.",
  },
];

export interface Worker {
  id: string;
  name: string;
  description: string;
  model: string;
  scope: string;
  active: number;
}

export const WORKERS: Worker[] = [
  {
    id: "triage",
    name: "Triage Agent",
    description: "Analyze, classify and route incoming work",
    model: "fast-model",
    scope: "Read-only",
    active: 3,
  },
  {
    id: "planner",
    name: "Planner",
    description: "Investigate requirements, create plans, ask questions",
    model: "frontier-model",
    scope: "Read-only",
    active: 2,
  },
  {
    id: "implementation",
    name: "Implementation Agent",
    description: "Create branches, patches, tests and PRs",
    model: "coding-model",
    scope: "Read/write",
    active: 4,
  },
  {
    id: "qa",
    name: "QA Agent",
    description: "Run tests, inspect artifacts and record verification",
    model: "frontier-model",
    scope: "Test/containers",
    active: 1,
  },
  {
    id: "review",
    name: "Review Agent",
    description: "Independent PR review and risk assessment",
    model: "reasoning-model",
    scope: "Review-only",
    active: 2,
  },
];

export interface AutomationRecord {
  name: string;
  trigger: string;
  worker: string;
  enabled: boolean;
  runs: number;
}

export const AUTOMATIONS: AutomationRecord[] = [
  {
    name: "Issue opened",
    trigger: "GitHub · issue opened",
    worker: "Triage Agent",
    enabled: true,
    runs: 26,
  },
  {
    name: "PR opened or updated",
    trigger: "GitHub · PR event",
    worker: "Review Agent",
    enabled: true,
    runs: 18,
  },
  {
    name: "Nightly dependency scan",
    trigger: "Schedule · 02:00 UTC",
    worker: "Triage Agent",
    enabled: true,
    runs: 7,
  },
  {
    name: "Failed CI workflow",
    trigger: "GitHub · workflow failed",
    worker: "Implementation Agent",
    enabled: true,
    runs: 14,
  },
  {
    name: "Incident alert",
    trigger: "Webhook · incident.created",
    worker: "Triage Agent",
    enabled: true,
    runs: 4,
  },
  {
    name: "Weekly improvement digest",
    trigger: "Schedule · Monday 08:00",
    worker: "Planner",
    enabled: false,
    runs: 1,
  },
];

export type RunStatus =
  "Working" | "Waiting" | "Complete" | "Blocked" | "Failed";

export interface RunRecord {
  id: string;
  task: string;
  workItemId: string;
  worker: string;
  status: RunStatus;
  duration: string;
  cost: string;
}

export const RUNS: RunRecord[] = [
  {
    id: "RUN-411",
    task: "Implement accessible labels",
    workItemId: "SF-1023",
    worker: "Implementation Agent",
    status: "Working",
    duration: "6m",
    cost: "$1.82",
  },
  {
    id: "RUN-410",
    task: "Plan retry policy",
    workItemId: "SF-1036",
    worker: "Planner",
    status: "Waiting",
    duration: "14m",
    cost: "$0.62",
  },
  {
    id: "RUN-409",
    task: "Review token renewal PR",
    workItemId: "SF-1013",
    worker: "Review Agent",
    status: "Complete",
    duration: "8m",
    cost: "$0.49",
  },
  {
    id: "RUN-408",
    task: "Failed CI workflow",
    workItemId: "SF-1027",
    worker: "Implementation Agent",
    status: "Blocked",
    duration: "24m",
    cost: "$3.06",
  },
  {
    id: "RUN-407",
    task: "Investigate auth regression",
    workItemId: "SF-1048",
    worker: "Triage Agent",
    status: "Complete",
    duration: "3m",
    cost: "$0.21",
  },
  {
    id: "RUN-406",
    task: "Test API pagination change",
    workItemId: "SF-1018",
    worker: "QA Agent",
    status: "Complete",
    duration: "10m",
    cost: "$0.75",
  },
];

export function findRun(id: string | undefined) {
  return RUNS.find((r) => r.id === id) ?? RUNS[0];
}

export interface BlueprintStage {
  num: string;
  name: string;
  worker: string;
  gate?: boolean;
}

export const BLUEPRINT_STAGES: BlueprintStage[] = [
  { num: "01", name: "Triage", worker: "Triage Agent" },
  { num: "02", name: "Plan", worker: "Planner" },
  { num: "03", name: "Approval", worker: "Human gate", gate: true },
  { num: "04", name: "Implement", worker: "Implementation Agent" },
  { num: "05", name: "Verify", worker: "QA Agent" },
  { num: "06", name: "Review", worker: "Review Agent" },
];

export const THROUGHPUT = [
  40, 50, 42, 58, 61, 50, 70, 68, 75, 66, 81, 78, 90, 83, 92, 86, 98, 90, 95,
  99,
];

export const DEFINITION_FILES = [
  "factory.yaml",
  "blueprint.yaml",
  "workers/triage.md",
  "workers/implementation.md",
  "automations/pr-review.yaml",
  "scorers/quality.yaml",
];

export const FACTORY_YAML = `schemaVersion: v1alpha1
name: product-engineering
repositories:
  - org/web-app
  - org/api-service

blueprint:
  stages:
    - triage
    - plan
    - implementation
    - verification
    - review

workers:
  - triage
  - planner
  - implementation
  - qa
  - reviewer`;

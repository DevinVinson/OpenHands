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
  | "operator"
  | "blueprint"
  | "automations"
  | "agents"
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
      { section: "operator", label: "Operator view", count: 5 },
    ],
  },
  {
    label: "Build",
    items: [
      { section: "blueprint", label: "Workflow blueprint" },
      { section: "automations", label: "Automations", count: 6 },
      { section: "agents", label: "Agents", count: 5 },
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
  agent: string;
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
  agent:
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

export type RuleCoverage = "Covered" | "Partial" | "No rule";

/**
 * A recurring reason work stops moving, grouped by cause rather than by
 * individual work item, so it can be resolved once with a rule.
 */
export interface BlockerPattern {
  id: string;
  cause: string;
  stage: string;
  blockedNow: number;
  last7d: number;
  autoResolved: number;
  coverage: RuleCoverage;
  ruleId?: string;
  example: string;
  suggestion: string;
}

export const BLOCKER_PATTERNS: BlockerPattern[] = [
  {
    id: "flaky-ci",
    cause: "Flaky CI failure",
    stage: "Verify",
    blockedNow: 1,
    last7d: 14,
    autoResolved: 12,
    coverage: "Covered",
    ruleId: "retry-flaky",
    example: "SF-1027 · Regression verification for CI failures",
    suggestion: "Rule is working. 2 of 14 escalated after retries ran out.",
  },
  {
    id: "spec-approval",
    cause: "Spec waiting on approval gate",
    stage: "Approval",
    blockedNow: 2,
    last7d: 9,
    autoResolved: 0,
    coverage: "No rule",
    example: "SF-1036 · Document organization permissions",
    suggestion:
      "8 of the last 9 low-risk documentation specs were approved unchanged. Auto-approve low-risk docs specs and notify the owner.",
  },
  {
    id: "ambiguous-req",
    cause: "Ambiguous requirements",
    stage: "Plan",
    blockedNow: 1,
    last7d: 6,
    autoResolved: 4,
    coverage: "Partial",
    ruleId: "ask-author",
    example: "SF-1048 · Investigate sporadic auth timeouts",
    suggestion:
      "Planner asks the issue author, but nothing happens if they don't reply. Add an escalation after 4h.",
  },
  {
    id: "missing-access",
    cause: "Missing repository or secret access",
    stage: "Implement",
    blockedNow: 0,
    last7d: 3,
    autoResolved: 0,
    coverage: "No rule",
    example: "SF-1018 · Update webhook payload schema",
    suggestion:
      "Request access from the repository owner automatically and park the item until it's granted.",
  },
  {
    id: "budget",
    cause: "Run exceeded cost budget",
    stage: "Implement",
    blockedNow: 1,
    last7d: 2,
    autoResolved: 1,
    coverage: "Covered",
    ruleId: "budget-split",
    example: "RUN-408 · Failed CI workflow",
    suggestion: "Rule splits the work item and re-plans when a run hits $5.",
  },
];

export interface ResolutionRule {
  id: string;
  name: string;
  when: string;
  then: string;
  escalate: string;
  enabled: boolean;
  hits7d: number;
  successRate: string;
}

export const RESOLUTION_RULES: ResolutionRule[] = [
  {
    id: "retry-flaky",
    name: "Retry flaky CI",
    when: "CI fails on a test marked flaky, or passes on main",
    then: "Re-run up to 2×, then send back to Implementation with the logs",
    escalate: "After 3 failures → #factory-ops",
    enabled: true,
    hits7d: 14,
    successRate: "86%",
  },
  {
    id: "ask-author",
    name: "Clarify with issue author",
    when: "Planner confidence < 0.6 on requirements",
    then: "Planner posts questions on the source issue and waits",
    escalate: "Not set",
    enabled: true,
    hits7d: 6,
    successRate: "67%",
  },
  {
    id: "budget-split",
    name: "Split over-budget work",
    when: "A run's estimated cost passes $5",
    then: "Pause, split the work item and re-plan smaller steps",
    escalate: "Second overrun → factory owner",
    enabled: true,
    hits7d: 2,
    successRate: "50%",
  },
  {
    id: "stale-review",
    name: "Nudge stale reviews",
    when: "A PR waits in Review for more than 24h",
    then: "Re-request review from CODEOWNERS and post in Slack",
    escalate: "After 48h → engineering manager",
    enabled: false,
    hits7d: 0,
    successRate: "—",
  },
];

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  scope: string;
  active: number;
  /** Agent profile backing this agent: it sets the agent's scope. */
  profile: {
    name: string;
    tools: string[];
    instructions: string;
  };
}

export const AGENTS: Agent[] = [
  {
    id: "triage",
    name: "Triage Agent",
    description: "Analyze, classify and route incoming work",
    model: "fast-model",
    scope: "Read-only",
    active: 3,
    profile: {
      name: "factory-triage",
      tools: ["terminal", "task_tracker"],
      instructions:
        "Classify each incoming item by type, risk and affected repository. Never modify files. Route to the Blueprint stage that matches the classification.",
    },
  },
  {
    id: "planner",
    name: "Planner",
    description: "Investigate requirements, create plans, ask questions",
    model: "frontier-model",
    scope: "Read-only",
    active: 2,
    profile: {
      name: "factory-planner",
      tools: ["terminal", "file_editor", "task_tracker", "browser_tool_set"],
      instructions:
        "Produce a written spec with acceptance criteria and open questions. Ask the issue author when requirements are ambiguous. Do not write code.",
    },
  },
  {
    id: "implementation",
    name: "Implementation Agent",
    description: "Create branches, patches, tests and PRs",
    model: "coding-model",
    scope: "Read/write",
    active: 4,
    profile: {
      name: "factory-implementation",
      tools: ["terminal", "file_editor", "task_tracker"],
      instructions:
        "Implement the approved spec on an agent/* branch. Add or update tests for every behavior change and open a draft PR with a change summary.",
    },
  },
  {
    id: "qa",
    name: "QA Agent",
    description: "Run tests, inspect artifacts and record verification",
    model: "frontier-model",
    scope: "Test/containers",
    active: 1,
    profile: {
      name: "factory-qa",
      tools: ["terminal", "browser_tool_set", "task_tracker"],
      instructions:
        "Run the full test suite and exercise the change in a browser. Attach logs and screenshots as evidence. Fail the stage if evidence is missing.",
    },
  },
  {
    id: "review",
    name: "Review Agent",
    description: "Independent PR review and risk assessment",
    model: "reasoning-model",
    scope: "Review-only",
    active: 2,
    profile: {
      name: "factory-review",
      tools: ["terminal", "file_editor"],
      instructions:
        "Review the PR independently of the implementer. Flag risk, scope creep and missing tests. Never push commits to the branch.",
    },
  },
];

export function findAgent(id: string | undefined) {
  return AGENTS.find((a) => a.id === id);
}

export function factoryAgentPath(factoryId: string, agentId: string) {
  return `${factoryPath(factoryId, "agents")}/${encodeURIComponent(agentId)}`;
}

export interface AutomationRecord {
  name: string;
  trigger: string;
  agent: string;
  enabled: boolean;
  runs: number;
}

export const AUTOMATIONS: AutomationRecord[] = [
  {
    name: "Issue opened",
    trigger: "GitHub · issue opened",
    agent: "Triage Agent",
    enabled: true,
    runs: 26,
  },
  {
    name: "PR opened or updated",
    trigger: "GitHub · PR event",
    agent: "Review Agent",
    enabled: true,
    runs: 18,
  },
  {
    name: "Nightly dependency scan",
    trigger: "Schedule · 02:00 UTC",
    agent: "Triage Agent",
    enabled: true,
    runs: 7,
  },
  {
    name: "Failed CI workflow",
    trigger: "GitHub · workflow failed",
    agent: "Implementation Agent",
    enabled: true,
    runs: 14,
  },
  {
    name: "Incident alert",
    trigger: "Webhook · incident.created",
    agent: "Triage Agent",
    enabled: true,
    runs: 4,
  },
  {
    name: "Weekly improvement digest",
    trigger: "Schedule · Monday 08:00",
    agent: "Planner",
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
  agent: string;
  status: RunStatus;
  duration: string;
  cost: string;
}

export const RUNS: RunRecord[] = [
  {
    id: "RUN-411",
    task: "Implement accessible labels",
    workItemId: "SF-1023",
    agent: "Implementation Agent",
    status: "Working",
    duration: "6m",
    cost: "$1.82",
  },
  {
    id: "RUN-410",
    task: "Plan retry policy",
    workItemId: "SF-1036",
    agent: "Planner",
    status: "Waiting",
    duration: "14m",
    cost: "$0.62",
  },
  {
    id: "RUN-409",
    task: "Review token renewal PR",
    workItemId: "SF-1013",
    agent: "Review Agent",
    status: "Complete",
    duration: "8m",
    cost: "$0.49",
  },
  {
    id: "RUN-408",
    task: "Failed CI workflow",
    workItemId: "SF-1027",
    agent: "Implementation Agent",
    status: "Blocked",
    duration: "24m",
    cost: "$3.06",
  },
  {
    id: "RUN-407",
    task: "Investigate auth regression",
    workItemId: "SF-1048",
    agent: "Triage Agent",
    status: "Complete",
    duration: "3m",
    cost: "$0.21",
  },
  {
    id: "RUN-406",
    task: "Test API pagination change",
    workItemId: "SF-1018",
    agent: "QA Agent",
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
  agent: string;
  gate?: boolean;
}

export const BLUEPRINT_STAGES: BlueprintStage[] = [
  { num: "01", name: "Triage", agent: "Triage Agent" },
  { num: "02", name: "Plan", agent: "Planner" },
  { num: "03", name: "Approval", agent: "Human gate", gate: true },
  { num: "04", name: "Implement", agent: "Implementation Agent" },
  { num: "05", name: "Verify", agent: "QA Agent" },
  { num: "06", name: "Review", agent: "Review Agent" },
];

export const THROUGHPUT = [
  40, 50, 42, 58, 61, 50, 70, 68, 75, 66, 81, 78, 90, 83, 92, 86, 98, 90, 95,
  99,
];

export const DEFINITION_FILES = [
  "factory.yaml",
  "blueprint.yaml",
  "agents/triage.md",
  "agents/implementation.md",
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

agents:
  - triage
  - planner
  - implementation
  - qa
  - reviewer`;

/**
 * Static wireframe data for the Factories prototype.
 *
 * PROTOTYPE: nothing here is fetched from a backend. These records exist so
 * the Factories UI can be clicked through and discussed; the real contracts
 * belong in the Agent Server / TypeScript client.
 *
 * Core M1 unit: a factory work log (event stream) whose entries reference
 * thin issue / PR records. There is no separate "work item" object.
 */

export const FACTORIES_PATH = "/factories";

export type FactorySection =
  | "overview"
  | "stream"
  | "conversations"
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

/** Detail for one issue / PR reference, drilled into from the Work stream. */
export function factoryRefPath(factoryId: string, refId: string) {
  return `${factoryPath(factoryId, "stream")}/${encodeURIComponent(refId)}`;
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
      { section: "stream", label: "Work stream" },
      { section: "conversations", label: "Conversations", count: 4 },
      { section: "operator", label: "Operator view", count: 5 },
    ],
  },
  {
    label: "Build",
    items: [
      { section: "blueprint", label: "Workflow blueprint" },
      { section: "automations", label: "Automations", count: 6 },
      { section: "agents", label: "Agents", count: 6 },
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

export interface Kpi {
  label: string;
  value: string;
  target: string;
  onTrack: boolean;
}

export interface Factory {
  id: string;
  name: string;
  description: string;
  goal: string;
  kpis: Kpi[];
  owner: string;
  tag: string;
  repositories: string[];
  /** Where the factory's version-controlled definition lives. */
  definitionsRepo: string;
  definitionsPath: string;
  integrations: string[];
  /** Optional primary agent / orchestrator (an agent id). */
  orchestratorId?: string;
}

export const SEED_FACTORIES: Factory[] = [
  {
    id: "demo-factory",
    name: "DemoFactory",
    description: "Build, verify and review product changes.",
    goal: "Take incoming user issues from triage to a reviewed pull request without a person repairing the pipeline.",
    kpis: [
      {
        label: "Issues → merged PR",
        value: "27",
        target: "30 / month",
        onTrack: false,
      },
      {
        label: "Median time to PR",
        value: "6.4h",
        target: "< 8h",
        onTrack: true,
      },
      {
        label: "Cost per merged PR",
        value: "$18.42",
        target: "< $25",
        onTrack: true,
      },
    ],
    owner: "Platform team",
    tag: "factory:demo",
    repositories: ["org/web-app", "org/api-service"],
    definitionsRepo: "org/factories",
    definitionsPath: "demo-factory/",
    integrations: ["GitHub", "Linear", "Jira", "Sentry", "Slack"],
    orchestratorId: "coordinator",
  },
];

export const INTEGRATION_OPTIONS = [
  "GitHub",
  "GitLab",
  "Jira",
  "Linear",
  "Sentry",
  "Slack",
];

export const DEFINITION_REPO_OPTIONS = [
  "org/factories",
  "org/platform-config",
  "org/web-app",
  "org/api-service",
];

/* ------------------------------------------------------------------ */
/* Issues & PRs: thin external references                              */
/* ------------------------------------------------------------------ */

export type RefType = "issue" | "pr";
export type RefRelation = "Created" | "Worked on";

export interface ExternalRef {
  id: string;
  type: RefType;
  provider: "GitHub" | "Linear" | "Jira" | "Sentry";
  /** How the provider labels it, e.g. `api-service#482`. */
  label: string;
  title: string;
  state: string;
  relation: RefRelation;
  /** Snapshot age. */
  updated: string;
  /** Artifacts the factory produced against this reference. */
  produced?: string[];
}

export const EXTERNAL_REFS: ExternalRef[] = [
  {
    id: "api-482",
    type: "issue",
    provider: "GitHub",
    label: "api-service#482",
    title: "Duplicate webhook deliveries",
    state: "Open",
    relation: "Worked on",
    updated: "1m",
    produced: ["Triage summary"],
  },
  {
    id: "web-3f1",
    type: "issue",
    provider: "Sentry",
    label: "WEB-3F1",
    title: "Sporadic auth timeouts",
    state: "Open",
    relation: "Worked on",
    updated: "8m",
    produced: ["Reproduction notes"],
  },
  {
    id: "plat-317",
    type: "issue",
    provider: "Jira",
    label: "PLAT-317",
    title: "Document organization permissions",
    state: "In progress",
    relation: "Worked on",
    updated: "24m",
    produced: ["Product spec", "Risk analysis"],
  },
  {
    id: "eng-212",
    type: "issue",
    provider: "Linear",
    label: "ENG-212",
    title: "Improve retry behavior for failed jobs",
    state: "Open",
    relation: "Created",
    updated: "1h",
  },
  {
    id: "web-811",
    type: "pr",
    provider: "GitHub",
    label: "web-app#811",
    title: "Accessible labels in editor",
    state: "In review",
    relation: "Created",
    updated: "2h",
    produced: ["Test report", "Screenshot evidence"],
  },
  {
    id: "api-819",
    type: "pr",
    provider: "GitHub",
    label: "api-service#819",
    title: "Update webhook payload schema",
    state: "Draft",
    relation: "Created",
    updated: "3h",
  },
  {
    id: "api-477",
    type: "issue",
    provider: "GitHub",
    label: "api-service#477",
    title: "Flaky retry test fails CI on main",
    state: "Open",
    relation: "Worked on",
    updated: "5h",
    produced: ["QA run"],
  },
  {
    id: "api-806",
    type: "pr",
    provider: "GitHub",
    label: "api-service#806",
    title: "Token renewal change",
    state: "Merged",
    relation: "Created",
    updated: "1d",
    produced: ["Review notes"],
  },
];

export function findRef(id: string | undefined) {
  return EXTERNAL_REFS.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */
/* Work log / event stream                                             */
/* ------------------------------------------------------------------ */

export type LogSource = "agent" | "automation" | "human" | "system";
export type LogEntryType =
  "event" | "status" | "handoff" | "blocker" | "decision" | "note";

export interface WorkLogEntry {
  id: string;
  /** Minutes ago, for filtering by period. */
  minutesAgo: number;
  when: string;
  source: LogSource;
  sourceName: string;
  type: LogEntryType;
  summary: string;
  refId?: string;
  runId?: string;
  conversation?: string;
}

export const WORK_LOG: WorkLogEntry[] = [
  {
    id: "l1",
    minutesAgo: 1,
    when: "1m",
    source: "automation",
    sourceName: "Issue opened",
    type: "event",
    summary: "New issue received and handed to Triage Agent",
    refId: "api-482",
  },
  {
    id: "l2",
    minutesAgo: 3,
    when: "3m",
    source: "agent",
    sourceName: "Triage Agent",
    type: "status",
    summary: "Classified as bug · high priority · api-service",
    refId: "api-482",
    runId: "RUN-412",
  },
  {
    id: "l3",
    minutesAgo: 8,
    when: "8m",
    source: "automation",
    sourceName: "Incident alert",
    type: "event",
    summary: "Sentry alert linked to an existing issue",
    refId: "web-3f1",
  },
  {
    id: "l4",
    minutesAgo: 14,
    when: "14m",
    source: "agent",
    sourceName: "Planner",
    type: "blocker",
    summary:
      "Requirements ambiguous: asked the issue author about retry behavior",
    refId: "web-3f1",
    runId: "RUN-407",
  },
  {
    id: "l5",
    minutesAgo: 18,
    when: "18m",
    source: "agent",
    sourceName: "Planner",
    type: "handoff",
    summary: "Spec drafted; waiting at the approval gate",
    refId: "plat-317",
    runId: "RUN-410",
  },
  {
    id: "l6",
    minutesAgo: 41,
    when: "41m",
    source: "system",
    sourceName: "Rule · Retry flaky CI",
    type: "decision",
    summary: "CI failure matched a flaky test; re-run 1 of 2 started",
    refId: "api-477",
    runId: "RUN-408",
  },
  {
    id: "l7",
    minutesAgo: 62,
    when: "1h",
    source: "agent",
    sourceName: "Factory Coordinator",
    type: "event",
    summary: "Opened follow-up issue for retry behavior found during triage",
    refId: "eng-212",
  },
  {
    id: "l8",
    minutesAgo: 120,
    when: "2h",
    source: "agent",
    sourceName: "Implementation Agent",
    type: "status",
    summary: "Opened PR with 42 passing component tests",
    refId: "web-811",
    runId: "RUN-411",
  },
  {
    id: "l9",
    minutesAgo: 130,
    when: "2h",
    source: "agent",
    sourceName: "Review Agent",
    type: "handoff",
    summary: "No blocking findings; requested human review",
    refId: "web-811",
    runId: "RUN-409",
  },
  {
    id: "l10",
    minutesAgo: 180,
    when: "3h",
    source: "agent",
    sourceName: "Implementation Agent",
    type: "status",
    summary: "Draft PR opened for payload schema change",
    refId: "api-819",
    runId: "RUN-406",
  },
  {
    id: "l11",
    minutesAgo: 300,
    when: "5h",
    source: "human",
    sourceName: "Devon M.",
    type: "decision",
    summary: "Marked merge authorization as always-human for api-service",
  },
  {
    id: "l12",
    minutesAgo: 1440,
    when: "1d",
    source: "human",
    sourceName: "Priya S.",
    type: "decision",
    summary: "Approved and merged token renewal change",
    refId: "api-806",
  },
  {
    id: "l13",
    minutesAgo: 1500,
    when: "1d",
    source: "agent",
    sourceName: "Factory Coordinator",
    type: "note",
    summary:
      "Daily summary: 6 PRs opened, 3 merged, 2 blockers resolved by rules",
  },
];

/* ------------------------------------------------------------------ */
/* Conversations attached to the factory                               */
/* ------------------------------------------------------------------ */

export interface FactoryConversation {
  id: string;
  title: string;
  agent: string;
  status: "Running" | "Waiting" | "Idle";
  refId?: string;
  updated: string;
}

export const FACTORY_CONVERSATIONS: FactoryConversation[] = [
  {
    id: "c1",
    title: "Triage api-service#482",
    agent: "Triage Agent",
    status: "Running",
    refId: "api-482",
    updated: "now",
  },
  {
    id: "c2",
    title: "Implement accessible labels",
    agent: "Implementation Agent",
    status: "Running",
    refId: "web-811",
    updated: "6m",
  },
  {
    id: "c3",
    title: "Plan PLAT-317 permissions spec",
    agent: "Planner",
    status: "Waiting",
    refId: "plat-317",
    updated: "18m",
  },
  {
    id: "c4",
    title: "Coordinate today's queue",
    agent: "Factory Coordinator",
    status: "Idle",
    updated: "1h",
  },
];

export type AttentionKind = "Spec approval" | "Question" | "PR review";

export interface AttentionItem {
  id: string;
  title: string;
  kind: AttentionKind;
  refId: string;
  age: string;
  action: string;
  detail: string;
}

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    title: "Review proposed retry policy",
    kind: "Spec approval",
    refId: "plat-317",
    age: "18m",
    action: "Review spec",
    detail:
      "The Planner drafted a spec for organization permissions and retry semantics. Implementation is gated on your approval.",
  },
  {
    id: "att-2",
    title: "Define expected auth retry behavior",
    kind: "Question",
    refId: "web-3f1",
    age: "39m",
    action: "Answer",
    detail:
      "Should an expired token trigger a silent refresh and retry, or surface a sign-in prompt to the user?",
  },
  {
    id: "att-3",
    title: "Approve PR #811 accessibility fixes",
    kind: "PR review",
    refId: "web-811",
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
    example: "api-service#477 · Flaky retry test fails CI on main",
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
    example: "PLAT-317 · Document organization permissions",
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
    example: "WEB-3F1 · Sporadic auth timeouts",
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
    example: "api-service#819 · Update webhook payload schema",
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
  /** The factory's primary agent / orchestrator. */
  orchestrator?: boolean;
  /** OHE: service account the agent acts as, instead of the person who set it up. */
  runsAs?: string;
  /** Agent profile backing this agent: it sets the agent's scope. */
  profile: {
    name: string;
    tools: string[];
    instructions: string;
  };
}

export const AGENTS: Agent[] = [
  {
    id: "coordinator",
    name: "Factory Coordinator",
    description: "Watches the work stream, notices stuck work and routes it",
    model: "reasoning-model",
    scope: "Read-only + issues",
    active: 1,
    orchestrator: true,
    runsAs: "demofactory[bot]",
    profile: {
      name: "factory-coordinator",
      tools: ["terminal", "task_tracker"],
      instructions:
        "Own the factory's goal. Watch the work log, detect stalled work, apply resolution rules, and escalate only what no rule covers. Post a daily summary.",
    },
  },
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

export interface RecommendedAutomation {
  name: string;
  why: string;
  agent: string;
}

/** From the template library, for this kind of factory. */
export const RECOMMENDED_AUTOMATIONS: RecommendedAutomation[] = [
  {
    name: "Stale PR nudge",
    why: "PRs wait 26h on average in review",
    agent: "Factory Coordinator",
  },
  {
    name: "Slack health report",
    why: "Daily summary of the work stream to #factory-ops",
    agent: "Factory Coordinator",
  },
  {
    name: "Dependency CVE monitor",
    why: "2 repositories have no security scanning",
    agent: "Triage Agent",
  },
];

export type RunStatus =
  "Working" | "Waiting" | "Complete" | "Blocked" | "Failed";

export interface RunRecord {
  id: string;
  task: string;
  refId: string;
  agent: string;
  status: RunStatus;
  duration: string;
  cost: string;
}

export const RUNS: RunRecord[] = [
  {
    id: "RUN-411",
    task: "Implement accessible labels",
    refId: "web-811",
    agent: "Implementation Agent",
    status: "Working",
    duration: "6m",
    cost: "$1.82",
  },
  {
    id: "RUN-410",
    task: "Plan retry policy",
    refId: "plat-317",
    agent: "Planner",
    status: "Waiting",
    duration: "14m",
    cost: "$0.62",
  },
  {
    id: "RUN-409",
    task: "Review token renewal PR",
    refId: "api-806",
    agent: "Review Agent",
    status: "Complete",
    duration: "8m",
    cost: "$0.49",
  },
  {
    id: "RUN-408",
    task: "Failed CI workflow",
    refId: "api-477",
    agent: "Implementation Agent",
    status: "Blocked",
    duration: "24m",
    cost: "$3.06",
  },
  {
    id: "RUN-407",
    task: "Investigate auth regression",
    refId: "web-3f1",
    agent: "Triage Agent",
    status: "Complete",
    duration: "3m",
    cost: "$0.21",
  },
  {
    id: "RUN-406",
    task: "Test API pagination change",
    refId: "api-819",
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
  - coordinator
  - triage
  - planner
  - implementation
  - qa
  - reviewer`;

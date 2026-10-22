import type { OpenHandsEvent } from "#/types/agent-server/core";
import type {
  Project,
  ProjectAutomationIdea,
  ProjectPlanPayload,
  ProjectRecordConversation,
} from "#/types/project";

/** Fence language the setup agent uses to hand the plan back to Canvas. */
export const PROJECT_PLAN_FENCE = "openhands-project";

/** Server-side conversation tag key mirroring project membership (local). */
export const PROJECT_TAG_KEY = "canvasproject";

const PLAN_SCHEMA = `{
  "title": "short project name",
  "goal": "one or two sentences",
  "success_criteria": ["observable outcome", "..."],
  "repositories": ["owner/repo", "..."],
  "specialists": [
    {"name": "Researcher", "role": "what they own", "profile": "existing agent profile name or null", "skills": ["skill"], "proposed": false}
  ],
  "automations": [
    {"name": "Watch issues", "trigger": "issue updated in owner/repo", "purpose": "respond to new comments"}
  ],
  "tasks": [
    {"title": "small, reviewable step", "status": "todo|in_progress|review|done", "specialist": "Researcher"}
  ],
  "needs_you": ["decision or question that is blocked on the user"]
}`;

/**
 * First message sent into the origin conversation when the user turns it into
 * a project. It asks the agent to run a short setup interview, then emit the
 * agreed plan as a fenced JSON block the project page can read.
 */
export function buildProjectSetupPrompt(profileNames: string[]): string {
  const profiles =
    profileNames.length > 0
      ? profileNames.map((name) => `- ${name}`).join("\n")
      : "- (none yet)";
  return [
    "I'd like to turn this conversation into a project, because the work needs more time and steps than a single thread.",
    "",
    "Please help me set it up. Using what we've discussed so far, briefly ask me (only what you can't infer):",
    "1. What is the final goal?",
    "2. What will success look like (observable outcomes)?",
    "3. Which repositories does this involve?",
    "",
    "Then propose:",
    "- Specialists for research, implementation, QA, or review. Prefer these existing agent profiles where they fit, and suggest new profiles (with skills and a short prompt) only where none fit:",
    profiles,
    "- Small automations that would help (for example: create issues across repos, then watch each issue and respond to changes).",
    "- A first task breakdown in small, reviewable steps.",
    "",
    `Whenever we agree on (or later change) the plan, include it in your reply as a fenced \`\`\`${PROJECT_PLAN_FENCE} block containing JSON with this shape:`,
    "```json",
    PLAN_SCHEMA,
    "```",
    "Keep updating that block as tasks move, so the project board stays current. Don't start implementation until I approve the plan.",
  ].join("\n");
}

/** Context handed to a conversation started from inside a project. */
export function buildProjectTaskPrompt(
  project: Project,
  taskTitle: string,
  specialist?: string | null,
): string {
  return [
    `You are working on one task within the project "${project.title}".`,
    project.goal ? `Project goal: ${project.goal}` : "",
    project.successCriteria.length
      ? `Success looks like:\n${project.successCriteria.map((c) => `- ${c}`).join("\n")}`
      : "",
    project.repositories.length
      ? `Repositories: ${project.repositories.join(", ")}`
      : "",
    specialist ? `Your role on this project: ${specialist}.` : "",
    "",
    `Task: ${taskTitle}`,
    "",
    "Keep the scope to this task. When you are done, summarize what changed and anything that needs the user's review.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Task title for turning a suggested automation into real setup work. */
export function buildAutomationTaskTitle(
  automation: ProjectAutomationIdea,
): string {
  return `Set up an automation "${automation.name}" (trigger: ${automation.trigger}) to ${automation.purpose}.`;
}

/** Prompt for a fresh agent asked to review a resolved project's record. */
export function buildProjectReviewPrompt(project: Project): string {
  return [
    `Review this completed project record and tell me what went well, what didn't, and how I could run a similar project (including which specialists and automations to reuse).`,
    "",
    project.record?.markdown ?? buildProjectRecordMarkdown(project, []),
  ].join("\n");
}

function textOfEvent(event: OpenHandsEvent): string {
  const parts: string[] = [];
  const e = event as unknown as {
    llm_message?: {
      role?: string;
      content?: { type: string; text?: string }[];
    };
    action?: { message?: unknown; text?: unknown };
  };
  if (
    e.llm_message?.role === "assistant" &&
    Array.isArray(e.llm_message.content)
  ) {
    for (const c of e.llm_message.content) {
      if (c.type === "text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  if (typeof e.action?.message === "string") parts.push(e.action.message);
  if (typeof e.action?.text === "string") parts.push(e.action.text);
  return parts.join("\n");
}

const FENCE_RE = new RegExp(
  "```" + PROJECT_PLAN_FENCE + "\\s*\\n([\\s\\S]*?)```",
  "g",
);

/** Parse the last `openhands-project` block in a piece of agent text. */
export function parseProjectPlan(text: string): ProjectPlanPayload | null {
  const matches = [...text.matchAll(FENCE_RE)];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(matches[i][1]);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // A malformed block falls through to an earlier one.
    }
  }
  return null;
}

/** Newest plan block across a page of events (any order). */
export function findLatestProjectPlan(
  events: OpenHandsEvent[],
): ProjectPlanPayload | null {
  const sorted = [...events].sort((a, b) =>
    String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")),
  );
  for (const event of sorted) {
    const plan = parseProjectPlan(textOfEvent(event));
    if (plan) return plan;
  }
  return null;
}

/** Last assistant-authored text in a page of events, trimmed for a record. */
export function findLastAgentSummary(events: OpenHandsEvent[]): string | null {
  const sorted = [...events].sort((a, b) =>
    String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")),
  );
  for (const event of sorted) {
    const text = textOfEvent(event).replace(FENCE_RE, "").trim();
    if (text) return text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
  }
  return null;
}

/** Self-contained Markdown record of a project, for archive and review. */
export function buildProjectRecordMarkdown(
  project: Project,
  conversations: ProjectRecordConversation[],
): string {
  const list = (items: string[]) =>
    items.length ? items.map((item) => `- ${item}`).join("\n") : "- (none)";
  const lines = [
    `# Project: ${project.title}`,
    "",
    `- Started: ${project.createdAt}`,
    `- Resolved: ${project.completedAt ?? new Date().toISOString()}`,
    "",
    "## Goal",
    project.goal || "(not set)",
    "",
    "## Success criteria",
    list(project.successCriteria),
    "",
    "## Repositories",
    list(project.repositories),
    "",
    "## Specialists",
    list(
      project.specialists.map(
        (s) =>
          `**${s.name}** — ${s.role}${s.profile ? ` (profile: ${s.profile})` : ""}${s.proposed ? " _(proposed)_" : ""}`,
      ),
    ),
    "",
    "## Automations",
    list(
      project.automations.map(
        (a) => `**${a.name}** — ${a.trigger}: ${a.purpose}`,
      ),
    ),
    "",
    "## Tasks",
    list(
      project.tasks.map(
        (t) =>
          `[${t.status}] ${t.title}${t.specialist ? ` — ${t.specialist}` : ""}`,
      ),
    ),
    "",
    "## Conversations",
  ];
  if (conversations.length === 0) lines.push("- (none)");
  for (const c of conversations) {
    lines.push(
      `### ${c.parentId ? "↳ " : ""}${c.title} (\`${c.id}\`)`,
      c.lastSummary ? c.lastSummary : "_No agent summary available._",
      "",
    );
  }
  return lines.join("\n");
}

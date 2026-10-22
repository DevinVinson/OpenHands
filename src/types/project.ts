/**
 * Projects (prototype): a durable, user-owned grouping that grows out of a
 * single conversation. A project keeps the agreed plan, a small task board,
 * the conversations (and their sub-agent conversations) that belong to it, and
 * — once resolved — a self-contained record that survives deleted
 * conversations so a later agent can review the whole arc.
 */

export const PROJECT_STATUSES = ["setup", "active", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TASK_STATUSES = [
  "todo",
  "in_progress",
  "review",
  "done",
] as const;
export type ProjectTaskStatus = (typeof PROJECT_TASK_STATUSES)[number];

export interface ProjectTask {
  id: string;
  title: string;
  status: ProjectTaskStatus;
  /** Specialist (agent profile name) the agent or user assigned. */
  specialist?: string | null;
  /** Conversation working on this task, once delegated. */
  conversationId?: string | null;
}

/** A specialist the setup agent suggested; may map to an existing profile. */
export interface ProjectSpecialist {
  name: string;
  role: string;
  /** Existing agent profile name, when the suggestion reuses one. */
  profile?: string | null;
  skills?: string[];
  /** True when the agent proposes creating this profile. */
  proposed?: boolean;
}

export interface ProjectAutomationIdea {
  name: string;
  trigger: string;
  purpose: string;
}

export interface ProjectRecordConversation {
  id: string;
  title: string;
  parentId: string | null;
  lastSummary: string | null;
}

/**
 * Durable snapshot captured when the project is resolved. Everything a later
 * reviewer needs is inlined here so it does not depend on conversations that
 * may since have been deleted.
 */
export interface ProjectRecord {
  capturedAt: string;
  markdown: string;
  conversations: ProjectRecordConversation[];
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** The conversation the project was created from; the setup thread. */
  originConversationId: string;
  /** Every top-level conversation in the project, origin first. */
  conversationIds: string[];
  goal: string;
  successCriteria: string[];
  repositories: string[];
  specialists: ProjectSpecialist[];
  automations: ProjectAutomationIdea[];
  tasks: ProjectTask[];
  /** Decisions or questions the agent flagged as needing the user. */
  needsYou: string[];
  record: ProjectRecord | null;
}

/** Shape the setup agent emits inside an `openhands-project` fenced block. */
export interface ProjectPlanPayload {
  title?: string;
  goal?: string;
  success_criteria?: string[];
  repositories?: string[];
  specialists?: ProjectSpecialist[];
  automations?: ProjectAutomationIdea[];
  tasks?: { title: string; status?: ProjectTaskStatus; specialist?: string }[];
  needs_you?: string[];
}

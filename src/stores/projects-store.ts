import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Project,
  ProjectPlanPayload,
  ProjectRecord,
  ProjectTask,
  ProjectTaskStatus,
} from "#/types/project";
import { PROJECT_TASK_STATUSES } from "#/types/project";

/**
 * Sole owner of project state (prototype). Projects are scoped per backend id
 * like pinned conversations, because the conversations they reference only
 * exist on that backend. Membership is mirrored onto local conversations as a
 * `project` tag by `useTurnConversationIntoProject`, but this store is the
 * writer of record.
 */
interface ProjectsState {
  projectsByBackendId: Record<string, Project[]>;
}

interface CreateProjectInput {
  title: string;
  originConversationId: string;
}

interface ProjectsActions {
  createProject: (backendId: string, input: CreateProjectInput) => Project;
  updateProject: (
    backendId: string,
    projectId: string,
    patch: Partial<Omit<Project, "id" | "createdAt">>,
  ) => void;
  applyPlan: (
    backendId: string,
    projectId: string,
    plan: ProjectPlanPayload,
  ) => void;
  addConversation: (
    backendId: string,
    projectId: string,
    conversationId: string,
  ) => void;
  addTask: (backendId: string, projectId: string, title: string) => void;
  updateTask: (
    backendId: string,
    projectId: string,
    taskId: string,
    patch: Partial<Omit<ProjectTask, "id">>,
  ) => void;
  removeTask: (backendId: string, projectId: string, taskId: string) => void;
  completeProject: (
    backendId: string,
    projectId: string,
    record: ProjectRecord,
  ) => void;
  reopenProject: (backendId: string, projectId: string) => void;
  deleteProject: (backendId: string, projectId: string) => void;
}

type ProjectsStore = ProjectsState & ProjectsActions;

const now = () => new Date().toISOString();

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);

const isTaskStatus = (value: unknown): value is ProjectTaskStatus =>
  typeof value === "string" &&
  (PROJECT_TASK_STATUSES as readonly string[]).includes(value);

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set) => {
      const mutate = (
        backendId: string,
        projectId: string,
        fn: (project: Project) => Project,
      ) =>
        set((state) => {
          const list = state.projectsByBackendId[backendId] ?? [];
          return {
            projectsByBackendId: {
              ...state.projectsByBackendId,
              [backendId]: list.map((p) =>
                p.id === projectId ? { ...fn(p), updatedAt: now() } : p,
              ),
            },
          };
        });

      return {
        projectsByBackendId: {},

        createProject: (backendId, { title, originConversationId }) => {
          const timestamp = now();
          const project: Project = {
            id: newId(),
            title,
            status: "setup",
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: null,
            originConversationId,
            conversationIds: [originConversationId],
            goal: "",
            successCriteria: [],
            repositories: [],
            specialists: [],
            automations: [],
            tasks: [],
            needsYou: [],
            record: null,
          };
          set((state) => ({
            projectsByBackendId: {
              ...state.projectsByBackendId,
              [backendId]: [
                project,
                ...(state.projectsByBackendId[backendId] ?? []),
              ],
            },
          }));
          return project;
        },

        updateProject: (backendId, projectId, patch) =>
          mutate(backendId, projectId, (p) => ({ ...p, ...patch })),

        // The agent's plan replaces the planning fields wholesale, but tasks
        // merge by title so a re-sync keeps the user's board moves and any
        // conversation already delegated to a card.
        applyPlan: (backendId, projectId, plan) =>
          mutate(backendId, projectId, (p) => {
            const existingByTitle = new Map(
              p.tasks.map((task) => [task.title.trim().toLowerCase(), task]),
            );
            const planTasks: ProjectTask[] = (plan.tasks ?? [])
              .filter((task) => task?.title?.trim())
              .map((task) => {
                const existing = existingByTitle.get(
                  task.title.trim().toLowerCase(),
                );
                if (existing) return existing;
                return {
                  id: newId(),
                  title: task.title.trim(),
                  status: isTaskStatus(task.status) ? task.status : "todo",
                  specialist: task.specialist ?? null,
                  conversationId: null,
                };
              });
            const planTitles = new Set(
              planTasks.map((task) => task.title.trim().toLowerCase()),
            );
            const userTasks = p.tasks.filter(
              (task) => !planTitles.has(task.title.trim().toLowerCase()),
            );
            return {
              ...p,
              title: plan.title?.trim() || p.title,
              status: p.status === "setup" ? "active" : p.status,
              goal: plan.goal ?? p.goal,
              successCriteria: plan.success_criteria ?? p.successCriteria,
              repositories: plan.repositories ?? p.repositories,
              specialists: plan.specialists ?? p.specialists,
              automations: plan.automations ?? p.automations,
              needsYou: plan.needs_you ?? p.needsYou,
              tasks: [...planTasks, ...userTasks],
            };
          }),

        addConversation: (backendId, projectId, conversationId) =>
          mutate(backendId, projectId, (p) =>
            p.conversationIds.includes(conversationId)
              ? p
              : {
                  ...p,
                  conversationIds: [...p.conversationIds, conversationId],
                },
          ),

        addTask: (backendId, projectId, title) =>
          mutate(backendId, projectId, (p) => ({
            ...p,
            tasks: [
              ...p.tasks,
              { id: newId(), title, status: "todo", conversationId: null },
            ],
          })),

        updateTask: (backendId, projectId, taskId, patch) =>
          mutate(backendId, projectId, (p) => ({
            ...p,
            tasks: p.tasks.map((task) =>
              task.id === taskId ? { ...task, ...patch } : task,
            ),
          })),

        removeTask: (backendId, projectId, taskId) =>
          mutate(backendId, projectId, (p) => ({
            ...p,
            tasks: p.tasks.filter((task) => task.id !== taskId),
          })),

        completeProject: (backendId, projectId, record) =>
          mutate(backendId, projectId, (p) => ({
            ...p,
            status: "completed",
            completedAt: now(),
            record,
          })),

        reopenProject: (backendId, projectId) =>
          mutate(backendId, projectId, (p) => ({
            ...p,
            status: "active",
            completedAt: null,
          })),

        deleteProject: (backendId, projectId) =>
          set((state) => ({
            projectsByBackendId: {
              ...state.projectsByBackendId,
              [backendId]: (state.projectsByBackendId[backendId] ?? []).filter(
                (p) => p.id !== projectId,
              ),
            },
          })),
      };
    },
    {
      name: "projects",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): ProjectsState => ({
        projectsByBackendId: state.projectsByBackendId,
      }),
    },
  ),
);

const EMPTY: Project[] = [];

export const selectBackendProjects =
  (backendId: string) =>
  (state: ProjectsStore): Project[] =>
    state.projectsByBackendId[backendId] ?? EMPTY;

import React from "react";
import { useQuery } from "@tanstack/react-query";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import EventService from "#/api/event-service/event-service.api";
import AgentProfilesService from "#/api/agent-profiles-service/agent-profiles-service.api";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useNavigation } from "#/context/navigation-context";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import {
  selectBackendProjects,
  useProjectsStore,
} from "#/stores/projects-store";
import type { Project, ProjectRecordConversation } from "#/types/project";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import {
  PROJECT_TAG_KEY,
  buildProjectRecordMarkdown,
  buildProjectSetupPrompt,
  buildProjectTaskPrompt,
  findLastAgentSummary,
  findLatestProjectPlan,
} from "#/utils/project-prompts";

export const projectPath = (projectId: string) => `/projects/${projectId}`;

// Poll faster while the setup agent is drafting so the page fills in promptly.
const PLAN_POLL_MS = 10_000;
const SETUP_POLL_MS = 4_000;
const CONVERSATIONS_POLL_MS = 15_000;
const EVENT_PAGE = 100;

/** Projects for the active backend, split into open and resolved. */
export function useBackendProjects() {
  const { backend } = useActiveBackend();
  const projects = useProjectsStore(selectBackendProjects(backend.id));
  return React.useMemo(
    () => ({
      backendId: backend.id,
      all: projects,
      open: projects.filter((p) => p.status !== "completed"),
      completed: projects.filter((p) => p.status === "completed"),
    }),
    [backend.id, projects],
  );
}

export function useProject(projectId: string | undefined) {
  const { all, backendId } = useBackendProjects();
  return {
    backendId,
    project: all.find((p) => p.id === projectId) ?? null,
  };
}

/** The open project (if any) a conversation already belongs to. */
export function useProjectForConversation(conversationId: string | undefined) {
  const { all } = useBackendProjects();
  if (!conversationId) return null;
  return all.find((p) => p.conversationIds.includes(conversationId)) ?? null;
}

async function fetchRecentEvents(
  conversation: AppConversation | null,
): Promise<OpenHandsEvent[]> {
  if (!conversation) return [];
  const page = await EventService.searchEvents(
    conversation.id,
    conversation.conversation_url ?? null,
    conversation.session_api_key ?? null,
    { limit: EVENT_PAGE, sortOrder: "TIMESTAMP_DESC" },
  );
  return Array.isArray(page.items) ? page.items : [];
}

/**
 * Creates the project, mirrors membership as a server tag on local backends,
 * and kicks off the setup interview inside the origin conversation.
 */
export function useTurnConversationIntoProject() {
  const { backend } = useActiveBackend();
  const { navigate } = useNavigation();
  const createProject = useProjectsStore((s) => s.createProject);

  return React.useCallback(
    async (
      conversation: {
        id: string;
        title?: string | null;
        tags?: Record<string, string> | null;
      },
      // From the conversation view the user stays in the chat, where the
      // setup message and the agent's work on it are visible.
      { stayInConversation = false }: { stayInConversation?: boolean } = {},
    ) => {
      const project = createProject(backend.id, {
        title: conversation.title?.trim() || "Untitled project",
        originConversationId: conversation.id,
      });
      if (!stayInConversation) navigate(projectPath(project.id));

      if (backend.kind === "local") {
        AgentServerConversationService.updateConversationTags(conversation.id, {
          ...(conversation.tags ?? {}),
          [PROJECT_TAG_KEY]: project.id,
        }).catch(() => {
          // Membership still lives in the store; the tag is a mirror.
        });
      }

      // Fetched on demand so the header button adds no query to every
      // conversation view; the prompt still works without profile names.
      const profileNames = await AgentProfilesService.listProfiles()
        .then((res) => res.profiles.map((p) => p.name))
        .catch(() => []);
      await AgentServerConversationService.sendMessage(conversation.id, {
        role: "user",
        content: [
          { type: "text", text: buildProjectSetupPrompt(profileNames) },
        ],
      });
      return project;
    },
    [backend.id, backend.kind, createProject, navigate],
  );
}

/** Top-level and sub-agent conversations in a project, as a flat tree. */
export function useProjectConversations(project: Project | null) {
  const { backend, orgId } = useActiveBackend();
  const ids = project?.conversationIds ?? [];
  return useQuery({
    queryKey: ["projects", "conversations", backend.id, orgId, ids],
    enabled: ids.length > 0,
    refetchInterval:
      project?.status === "setup" ? SETUP_POLL_MS : CONVERSATIONS_POLL_MS,
    queryFn: async () => {
      const top = (
        await AgentServerConversationService.batchGetAppConversations(ids)
      ).filter((c): c is AppConversation => !!c);
      const byId = new Map(top.map((c) => [c.id, c]));
      const parentOf = new Map<string, string>();
      for (const c of top) {
        for (const childId of c.sub_conversation_ids ?? []) {
          parentOf.set(childId, c.id);
        }
      }
      const missing = [...parentOf.keys()].filter((id) => !byId.has(id));
      if (missing.length > 0) {
        const children =
          await AgentServerConversationService.batchGetAppConversations(
            missing,
          );
        for (const child of children) if (child) byId.set(child.id, child);
      }
      // Depth-first: each project conversation followed by its sub-agents.
      const rows: { conversation: AppConversation; parentId: string | null }[] =
        [];
      const visit = (id: string, parentId: string | null) => {
        const c = byId.get(id);
        if (!c || rows.some((r) => r.conversation.id === id)) return;
        rows.push({ conversation: c, parentId });
        for (const childId of c.sub_conversation_ids ?? []) visit(childId, id);
      };
      for (const c of top) if (!parentOf.has(c.id)) visit(c.id, null);
      for (const c of top) visit(c.id, parentOf.get(c.id) ?? null);
      return rows;
    },
  });
}

/**
 * Polls the origin conversation for the newest `openhands-project` block and
 * applies it, so the board follows the setup agent without a manual step.
 */
export function useProjectPlanSync(project: Project | null, backendId: string) {
  const applyPlan = useProjectsStore((s) => s.applyPlan);
  const lastApplied = React.useRef<string | null>(null);
  const originId = project?.originConversationId;
  const query = useQuery({
    queryKey: ["projects", "plan", backendId, originId],
    enabled: !!originId && project?.status !== "completed",
    refetchInterval: project?.status === "setup" ? SETUP_POLL_MS : PLAN_POLL_MS,
    queryFn: async () => {
      const [conversation] =
        await AgentServerConversationService.batchGetAppConversations([
          originId!,
        ]);
      return findLatestProjectPlan(await fetchRecentEvents(conversation));
    },
  });

  React.useEffect(() => {
    if (!project || !query.data) return;
    const serialized = JSON.stringify(query.data);
    if (serialized === lastApplied.current) return;
    lastApplied.current = serialized;
    applyPlan(backendId, project.id, query.data);
  }, [applyPlan, backendId, project, query.data]);

  return query;
}

/** Starts a project conversation, optionally for a board task and specialist. */
export function useStartProjectConversation(
  project: Project | null,
  backendId: string,
) {
  const backendKind = useActiveBackend().backend.kind;
  const { mutateAsync } = useCreateConversation();
  const { navigate } = useNavigation();
  const { data: profiles } = useAgentProfiles();
  const addConversation = useProjectsStore((s) => s.addConversation);
  const updateTask = useProjectsStore((s) => s.updateTask);

  return React.useCallback(
    async (options: {
      taskId?: string;
      taskTitle: string;
      specialist?: string | null;
    }) => {
      if (!project) return;
      const specialist = project.specialists.find(
        (s) => s.name === options.specialist,
      );
      const profileName = specialist?.profile ?? options.specialist ?? null;
      const profile = (profiles?.profiles ?? []).find(
        (p) => p.name === profileName,
      );
      // The agent-server rejects a child whose workspace differs from its
      // parent's, so local project conversations share the origin's
      // directory (as `launch_child_conversation` does for `shared`).
      const workingDir =
        backendKind === "local"
          ? await AgentServerConversationService.resolveConversationWorkingDir(
              project.originConversationId,
            )
          : undefined;
      const result = await mutateAsync({
        ...(workingDir
          ? { workingDir, workspaceMode: "local_repo" as const }
          : {}),
        query: buildProjectTaskPrompt(
          project,
          options.taskTitle,
          options.specialist,
        ),
        // Sub-agent link: the origin conversation lists this one as a child.
        parentConversationId: project.originConversationId,
        agentProfileId: profile?.id ?? undefined,
        entryPoint: "project",
      });
      // A Cloud `task-` id is not a conversation yet; the origin's
      // sub-conversation link still surfaces it once the sandbox is ready.
      if (!result.conversation_id.startsWith("task-")) {
        addConversation(backendId, project.id, result.conversation_id);
      }
      if (options.taskId) {
        updateTask(backendId, project.id, options.taskId, {
          status: "in_progress",
          conversationId: result.conversation_id,
        });
      }
      navigate(`/conversations/${result.conversation_id}`);
    },
    [
      backendKind,
      addConversation,
      backendId,
      mutateAsync,
      navigate,
      profiles,
      project,
      updateTask,
    ],
  );
}

/**
 * Captures a durable record (plan, board, and each conversation's last agent
 * summary) and moves the project to the archive.
 */
export function useCompleteProject(backendId: string) {
  const completeProject = useProjectsStore((s) => s.completeProject);
  return React.useCallback(
    async (
      project: Project,
      rows: { conversation: AppConversation; parentId: string | null }[],
    ) => {
      const conversations: ProjectRecordConversation[] = await Promise.all(
        rows.map(async ({ conversation, parentId }) => {
          let lastSummary: string | null = null;
          try {
            lastSummary = findLastAgentSummary(
              await fetchRecentEvents(conversation),
            );
          } catch {
            lastSummary = null;
          }
          return {
            id: conversation.id,
            title: conversation.title ?? conversation.id,
            parentId,
            lastSummary,
          };
        }),
      );
      const markdown = buildProjectRecordMarkdown(project, conversations);
      completeProject(backendId, project.id, {
        capturedAt: new Date().toISOString(),
        markdown,
        conversations,
      });
    },
    [backendId, completeProject],
  );
}

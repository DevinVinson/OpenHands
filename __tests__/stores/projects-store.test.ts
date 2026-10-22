import { beforeEach, describe, expect, it } from "vitest";
import { useProjectsStore } from "#/stores/projects-store";
import { findLatestProjectPlan } from "#/utils/project-prompts";
import type { OpenHandsEvent } from "#/types/agent-server/core";

const BACKEND = "local-a";

const agentMessage = (text: string, timestamp: string) =>
  ({
    id: timestamp,
    timestamp,
    source: "agent",
    llm_message: { role: "assistant", content: [{ type: "text", text }] },
  }) as unknown as OpenHandsEvent;

const planBlock = (plan: object) =>
  `Here is the plan.\n\`\`\`openhands-project\n${JSON.stringify(plan)}\n\`\`\``;

describe("projects", () => {
  beforeEach(() => {
    useProjectsStore.setState({ projectsByBackendId: {} });
  });

  it("reads the newest openhands-project block from agent messages", () => {
    const events = [
      agentMessage(planBlock({ goal: "new" }), "2026-10-22T10:00:00"),
      agentMessage(planBlock({ goal: "old" }), "2026-10-22T09:00:00"),
      agentMessage(
        "```openhands-project\n{not json\n```",
        "2026-10-22T11:00:00",
      ),
    ];

    expect(findLatestProjectPlan(events)?.goal).toBe("new");
  });

  it("activates the project and keeps board moves and user tasks across plan re-syncs", () => {
    const store = useProjectsStore.getState();
    const project = store.createProject(BACKEND, {
      title: "Conversation",
      originConversationId: "c1",
    });

    store.applyPlan(BACKEND, project.id, {
      title: "Dark mode",
      tasks: [{ title: "Add tokens" }, { title: "Add toggle" }],
    });
    const [tokens] =
      useProjectsStore.getState().projectsByBackendId[BACKEND][0].tasks;
    store.updateTask(BACKEND, project.id, tokens.id, { status: "review" });
    store.addTask(BACKEND, project.id, "User-added task");
    store.applyPlan(BACKEND, project.id, {
      tasks: [{ title: "add tokens", status: "todo" }, { title: "Write docs" }],
    });

    const updated = useProjectsStore.getState().projectsByBackendId[BACKEND][0];
    expect(updated.status).toBe("active");
    expect(updated.title).toBe("Dark mode");
    expect(updated.tasks.map((t) => [t.title, t.status])).toEqual([
      ["Add tokens", "review"],
      ["Write docs", "todo"],
      ["Add toggle", "todo"],
      ["User-added task", "todo"],
    ]);
  });
});

import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Play, Plus, Trash2 } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useProjectsStore } from "#/stores/projects-store";
import {
  PROJECT_TASK_STATUSES,
  type Project,
  type ProjectTask,
  type ProjectTaskStatus,
} from "#/types/project";
import { cn } from "#/utils/utils";

const COLUMN_LABEL: Record<ProjectTaskStatus, I18nKey> = {
  todo: I18nKey.PROJECTS$TASK_TODO,
  in_progress: I18nKey.PROJECTS$TASK_IN_PROGRESS,
  review: I18nKey.PROJECTS$TASK_REVIEW,
  done: I18nKey.PROJECTS$TASK_DONE,
};

// The drag payload is a task id under this project-scoped MIME type, so a drop
// from anywhere else on the page is ignored.
const DRAG_TYPE = "application/x-openhands-project-task";

const iconButtonClass =
  "inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted hover:bg-surface-raised hover:text-contrast";

interface ProjectBoardProps {
  project: Project;
  backendId: string;
  readOnly: boolean;
  onStartTask: (task: ProjectTask) => void;
}

export function ProjectBoard({
  project,
  backendId,
  readOnly,
  onStartTask,
}: ProjectBoardProps) {
  const { t } = useTranslation("openhands");
  const addTask = useProjectsStore((s) => s.addTask);
  const updateTask = useProjectsStore((s) => s.updateTask);
  const removeTask = useProjectsStore((s) => s.removeTask);
  const [draft, setDraft] = React.useState("");
  const [dragOver, setDragOver] = React.useState<ProjectTaskStatus | null>(
    null,
  );

  const submitDraft = (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    addTask(backendId, project.id, title);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      {!readOnly ? (
        <form onSubmit={submitDraft} className="flex gap-2">
          <input
            data-testid="project-add-task-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t(I18nKey.PROJECTS$ADD_TASK_PLACEHOLDER)}
            aria-label={t(I18nKey.PROJECTS$ADD_TASK)}
            className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm text-content placeholder:text-text-dim focus:border-contrast/40 focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t(I18nKey.PROJECTS$ADD_TASK)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 text-sm text-content hover:bg-surface"
          >
            <Plus className="size-4" aria-hidden />
            {t(I18nKey.PROJECTS$ADD_TASK)}
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PROJECT_TASK_STATUSES.map((status) => {
          const tasks = project.tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              data-testid={`project-column-${status}`}
              aria-label={t(COLUMN_LABEL[status])}
              onDragOver={(event) => {
                if (readOnly || !event.dataTransfer.types.includes(DRAG_TYPE))
                  return;
                event.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => {
                setDragOver(null);
                const taskId = event.dataTransfer.getData(DRAG_TYPE);
                if (taskId)
                  updateTask(backendId, project.id, taskId, { status });
              }}
              className={cn(
                "flex min-h-32 flex-col gap-2 rounded-lg border border-border-subtle bg-surface/40 p-2",
                dragOver === status && "border-contrast/40 bg-surface",
              )}
            >
              <h3 className="flex items-center justify-between px-1 text-xs font-medium text-muted">
                {t(COLUMN_LABEL[status])}
                <span className="text-text-dim">{tasks.length}</span>
              </h3>
              {tasks.map((task) => (
                <article
                  key={task.id}
                  data-testid={`project-task-${task.id}`}
                  draggable={!readOnly}
                  onDragStart={(event) =>
                    event.dataTransfer.setData(DRAG_TYPE, task.id)
                  }
                  className={cn(
                    "group rounded-md border border-border bg-base-secondary p-2 text-sm text-content",
                    !readOnly && "cursor-grab active:cursor-grabbing",
                  )}
                >
                  <p className="break-words">{task.title}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="min-w-0 flex-1 truncate text-xs text-text-dim">
                      {task.specialist ?? t(I18nKey.PROJECTS$UNASSIGNED)}
                    </span>
                    {task.conversationId ? (
                      <NavigationLink
                        to={`/conversations/${task.conversationId}`}
                        aria-label={t(I18nKey.PROJECTS$OPEN_TASK_CONVERSATION)}
                        title={t(I18nKey.PROJECTS$OPEN_TASK_CONVERSATION)}
                        className={iconButtonClass}
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </NavigationLink>
                    ) : null}
                    {!readOnly && !task.conversationId ? (
                      <button
                        type="button"
                        data-testid={`project-task-start-${task.id}`}
                        onClick={() => onStartTask(task)}
                        aria-label={t(I18nKey.PROJECTS$START_TASK)}
                        title={t(I18nKey.PROJECTS$START_TASK)}
                        className={iconButtonClass}
                      >
                        <Play className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                    {!readOnly ? (
                      <>
                        <select
                          value={task.status}
                          aria-label={t(I18nKey.PROJECTS$MOVE_TASK)}
                          onChange={(event) =>
                            updateTask(backendId, project.id, task.id, {
                              status: event.target.value as ProjectTaskStatus,
                            })
                          }
                          className="h-6 max-w-24 cursor-pointer rounded border border-border bg-transparent px-1 text-xs text-muted"
                        >
                          {PROJECT_TASK_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {t(COLUMN_LABEL[option])}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            removeTask(backendId, project.id, task.id)
                          }
                          aria-label={t(I18nKey.PROJECTS$REMOVE_TASK)}
                          title={t(I18nKey.PROJECTS$REMOVE_TASK)}
                          className={iconButtonClass}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
              {tasks.length === 0 ? (
                <p className="px-1 py-2 text-xs text-text-dim">
                  {t(I18nKey.PROJECTS$EMPTY_BOARD)}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

import React from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Archive,
  ArchiveRestore,
  Bot,
  Download,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Trash2,
  Workflow,
} from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { NavigationLink } from "#/components/shared/navigation-link";
import { BrandButton } from "#/components/features/settings/brand-button";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { ProjectBoard } from "#/components/features/projects/project-board";
import {
  ProjectSetupProgress,
  ProjectSetupSkeleton,
} from "#/components/features/projects/project-setup-progress";
import { isExecutionActive } from "#/utils/status";
import {
  ProjectStatusDot,
  projectStatusLabelKey,
} from "#/components/features/projects/project-status-dot";
import { useNavigation } from "#/context/navigation-context";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import {
  useCompleteProject,
  useProject,
  useProjectConversations,
  useProjectPlanSync,
  useStartProjectConversation,
} from "#/hooks/use-projects";
import { useProjectsStore } from "#/stores/projects-store";
import {
  buildAutomationTaskTitle,
  buildProjectReviewPrompt,
} from "#/utils/project-prompts";
import {
  displayErrorToast,
  displaySuccessToast,
} from "#/utils/custom-toast-handlers";
import { cn } from "#/utils/utils";

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-text-dim">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-content">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const SETUP_GRACE_MS = 15_000;

export default function ProjectDetailRoute() {
  const { projectId } = useParams();
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const { project, backendId } = useProject(projectId);
  const reopenProject = useProjectsStore((s) => s.reopenProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const { data: conversationRows = [] } = useProjectConversations(project);
  useProjectPlanSync(project, backendId);
  const startConversation = useStartProjectConversation(project, backendId);
  const completeProject = useCompleteProject(backendId);
  const { mutateAsync: createConversation } = useCreateConversation();
  const [isCompleting, setIsCompleting] = React.useState(false);

  // Re-render while setting up so the just-created grace window expires even
  // when polling returns unchanged data.
  const [now, setNow] = React.useState(() => Date.now());
  const inSetup = project?.status === "setup";
  React.useEffect(() => {
    if (!inSetup) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(id);
  }, [inSetup]);

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-muted">{t(I18nKey.PROJECTS$NOT_FOUND)}</p>
        <NavigationLink
          to="/projects"
          className="mt-2 inline-block text-sm text-content underline"
        >
          {t(I18nKey.PROJECTS$ALL_PROJECTS)}
        </NavigationLink>
      </div>
    );
  }

  const isCompleted = project.status === "completed";
  const isSetup = project.status === "setup";
  const workingCount = conversationRows.filter(({ conversation }) =>
    isExecutionActive(conversation.execution_status),
  ).length;
  const origin = conversationRows.find(
    ({ conversation }) => conversation.id === project.originConversationId,
  )?.conversation;
  // Right after "Turn into project" the setup message may not have reached
  // the runtime yet, so treat a missing or just-created origin as working.
  const isSetupAgentWorking =
    !origin ||
    isExecutionActive(origin.execution_status) ||
    now - Date.parse(project.createdAt) < SETUP_GRACE_MS;
  const openSetupConversation = () =>
    navigate(`/conversations/${project.originConversationId}`);
  const start = (
    taskTitle: string,
    specialist?: string | null,
    taskId?: string,
  ) =>
    startConversation({ taskTitle, specialist, taskId }).catch(() => undefined);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeProject(project, conversationRows);
      displaySuccessToast(t(I18nKey.PROJECTS$COMPLETED_TOAST));
    } catch {
      displayErrorToast(t(I18nKey.PROJECTS$NOT_FOUND));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadRecord = () => {
    const markdown = project.record?.markdown;
    if (!markdown) return;
    const url = URL.createObjectURL(
      new Blob([markdown], { type: "text/markdown" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.title.replace(/[^\w-]+/g, "-").toLowerCase()}-project.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleReview = async () => {
    const result = await createConversation({
      query: buildProjectReviewPrompt(project),
      entryPoint: "project-review",
    });
    navigate(`/conversations/${result.conversation_id}`);
  };

  const handleDelete = () => {
    if (!window.confirm(t(I18nKey.PROJECTS$CONFIRM_DELETE))) return;
    deleteProject(backendId, project.id);
    navigate("/projects");
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-64">
            <NavigationLink
              to="/projects"
              className="text-xs text-text-dim hover:text-contrast"
            >
              {t(I18nKey.PROJECTS$ALL_PROJECTS)}
            </NavigationLink>
            <h1
              data-testid="project-title"
              className="mt-1 text-xl font-semibold text-content"
            >
              {project.title}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <ProjectStatusDot status={project.status} />
              {t(projectStatusLabelKey(project.status))}
              {workingCount > 0 ? (
                <span
                  data-testid="project-background-work"
                  className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-content"
                >
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  {t(I18nKey.PROJECTS$BACKGROUND_WORK)}
                  <span className="text-text-dim">{workingCount}</span>
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BrandButton
              type="button"
              variant="secondary"
              onClick={() =>
                navigate(`/conversations/${project.originConversationId}`)
              }
              startContent={<MessageSquare className="size-4" aria-hidden />}
            >
              {t(I18nKey.PROJECTS$OPEN_SETUP_CONVERSATION)}
            </BrandButton>
            {isCompleted ? (
              <>
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadRecord}
                  startContent={<Download className="size-4" aria-hidden />}
                >
                  {t(I18nKey.PROJECTS$DOWNLOAD_RECORD)}
                </BrandButton>
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={handleReview}
                  startContent={<Bot className="size-4" aria-hidden />}
                >
                  {t(I18nKey.PROJECTS$REVIEW_WITH_AGENT)}
                </BrandButton>
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={() => reopenProject(backendId, project.id)}
                  startContent={
                    <ArchiveRestore className="size-4" aria-hidden />
                  }
                >
                  {t(I18nKey.PROJECTS$REOPEN)}
                </BrandButton>
              </>
            ) : (
              <BrandButton
                testId="project-mark-complete"
                type="button"
                variant="primary"
                isDisabled={isCompleting}
                aria-busy={isCompleting}
                onClick={handleComplete}
                startContent={<Archive className="size-4" aria-hidden />}
              >
                {t(I18nKey.PROJECTS$MARK_COMPLETE)}
              </BrandButton>
            )}
            <BrandButton
              type="button"
              variant="ghost-danger"
              onClick={handleDelete}
              ariaLabel={t(I18nKey.PROJECTS$DELETE)}
              startContent={<Trash2 className="size-4" aria-hidden />}
            />
          </div>
        </div>

        {isSetup ? (
          <ProjectSetupProgress
            isAgentWorking={isSetupAgentWorking}
            onOpenConversation={openSetupConversation}
          />
        ) : null}

        {project.needsYou.length > 0 && !isCompleted ? (
          <Section
            title={t(I18nKey.PROJECTS$NEEDS_YOU)}
            className="rounded-md border border-accent/40 bg-accent/10 p-3"
          >
            <BulletList items={project.needsYou} />
          </Section>
        ) : null}

        {isSetup ? <ProjectSetupSkeleton /> : null}

        {/* Overview */}
        {!isSetup ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Section title={t(I18nKey.PROJECTS$GOAL)}>
                <p className="text-sm text-content">{project.goal || "—"}</p>
              </Section>
              <Section title={t(I18nKey.PROJECTS$SUCCESS_CRITERIA)}>
                <BulletList items={project.successCriteria} />
              </Section>
              <Section title={t(I18nKey.PROJECTS$REPOSITORIES)}>
                <BulletList items={project.repositories} />
              </Section>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Section title={t(I18nKey.PROJECTS$SPECIALISTS)}>
                {project.specialists.length === 0 ? (
                  <p className="text-sm text-text-dim">—</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {project.specialists.map((s) => (
                      <li
                        key={s.name}
                        className="rounded-md border border-border-subtle p-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-muted" aria-hidden />
                          <span className="font-medium text-content">
                            {s.name}
                          </span>
                          {s.profile ? (
                            <NavigationLink
                              to="/settings/agents"
                              className="rounded bg-surface-raised px-1.5 text-xs text-muted hover:text-contrast"
                            >
                              {s.profile}
                            </NavigationLink>
                          ) : null}
                          {s.proposed ? (
                            <span className="rounded bg-warning/15 px-1.5 text-xs text-content">
                              {t(I18nKey.PROJECTS$PROPOSED)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-muted">{s.role}</p>
                        {s.skills?.length ? (
                          <p className="mt-1 text-xs text-text-dim">
                            {s.skills.join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title={t(I18nKey.PROJECTS$AUTOMATIONS)}>
                {project.automations.length === 0 ? (
                  <p className="text-sm text-text-dim">—</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {project.automations.map((a) => (
                      <li
                        key={a.name}
                        className="flex items-start gap-2 rounded-md border border-border-subtle p-2 text-sm"
                      >
                        <Workflow
                          className="mt-0.5 size-4 shrink-0 text-muted"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-content">{a.name}</p>
                          <p className="text-muted">
                            {a.trigger} — {a.purpose}
                          </p>
                        </div>
                        {!isCompleted ? (
                          <button
                            type="button"
                            onClick={() => start(buildAutomationTaskTitle(a))}
                            className="shrink-0 cursor-pointer rounded border border-border px-2 py-0.5 text-xs text-content hover:bg-surface"
                          >
                            {t(I18nKey.PROJECTS$CREATE_AUTOMATION)}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* Board */}
            <Section title={t(I18nKey.PROJECTS$BOARD)}>
              <ProjectBoard
                project={project}
                backendId={backendId}
                readOnly={isCompleted}
                onStartTask={(task) =>
                  start(task.title, task.specialist, task.id)
                }
              />
            </Section>
          </>
        ) : null}

        {/* Conversations */}
        <Section title={t(I18nKey.PROJECTS$CONVERSATIONS)}>
          <ul
            data-testid="project-conversations"
            className="divide-y divide-border-subtle rounded-md border border-border-subtle"
          >
            {conversationRows.map(({ conversation, parentId }) => (
              <li key={conversation.id}>
                <NavigationLink
                  to={`/conversations/${conversation.id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm text-content hover:bg-surface",
                    parentId && "pl-8",
                  )}
                >
                  {parentId ? (
                    <Bot className="size-4 shrink-0 text-muted" aria-hidden />
                  ) : (
                    <MessageSquare
                      className="size-4 shrink-0 text-muted"
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {conversation.title || conversation.id}
                  </span>
                  <span className="shrink-0 text-xs text-text-dim">
                    {conversation.id === project.originConversationId
                      ? t(I18nKey.PROJECTS$ORIGIN)
                      : parentId
                        ? t(I18nKey.PROJECTS$SUB_AGENT)
                        : null}
                  </span>
                </NavigationLink>
              </li>
            ))}
            {conversationRows.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-dim">
                {t(I18nKey.PROJECTS$NO_CONVERSATIONS)}
              </li>
            ) : null}
          </ul>
          {!isCompleted ? (
            <div>
              <BrandButton
                type="button"
                variant="secondary"
                onClick={() => start(project.goal || project.title)}
                startContent={
                  <MessageSquarePlus className="size-4" aria-hidden />
                }
              >
                {t(I18nKey.PROJECTS$NEW_CONVERSATION)}
              </BrandButton>
            </div>
          ) : null}
        </Section>

        {project.record ? (
          <Section title={t(I18nKey.PROJECTS$RECORD)}>
            <div className="rounded-md border border-border-subtle p-4 text-sm">
              <MarkdownRenderer content={project.record.markdown} />
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

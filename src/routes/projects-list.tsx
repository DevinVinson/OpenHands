import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { NavigationLink } from "#/components/shared/navigation-link";
import {
  ProjectStatusDot,
  projectStatusLabelKey,
} from "#/components/features/projects/project-status-dot";
import { projectPath, useBackendProjects } from "#/hooks/use-projects";
import type { Project } from "#/types/project";

function ProjectRow({ project }: { project: Project }) {
  const { t } = useTranslation("openhands");
  const done = project.tasks.filter((task) => task.status === "done").length;
  return (
    <li>
      <NavigationLink
        to={projectPath(project.id)}
        className="flex items-center gap-3 rounded-md border border-border-subtle px-3 py-2.5 text-sm hover:bg-surface"
      >
        <ProjectStatusDot status={project.status} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-content">{project.title}</span>
          {project.goal ? (
            <span className="block truncate text-xs text-muted">
              {project.goal}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs text-text-dim">
          {project.tasks.length > 0
            ? t(I18nKey.PROJECTS$TASK_COUNT, {
                done,
                total: project.tasks.length,
              })
            : t(projectStatusLabelKey(project.status))}
        </span>
      </NavigationLink>
    </li>
  );
}

export default function ProjectsListRoute() {
  const { t } = useTranslation("openhands");
  const { open, completed } = useBackendProjects();

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-content">
            {t(I18nKey.PROJECTS$SECTION_TITLE)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t(I18nKey.PROJECTS$LIST_SUBTITLE)}
          </p>
        </div>
        {open.length === 0 && completed.length === 0 ? (
          <p className="text-sm text-text-dim">
            {t(I18nKey.PROJECTS$EMPTY_LIST)}
          </p>
        ) : null}
        {open.length > 0 ? (
          <ul data-testid="projects-open" className="flex flex-col gap-2">
            {open.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </ul>
        ) : null}
        {completed.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted">
              {t(I18nKey.PROJECTS$STATUS_COMPLETED)}
            </h2>
            <ul
              data-testid="projects-completed"
              className="flex flex-col gap-2"
            >
              {completed.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { FolderKanban } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useNavigation } from "#/context/navigation-context";
import { projectPath, useBackendProjects } from "#/hooks/use-projects";
import { cn } from "#/utils/utils";
import { SidebarNavLink } from "#/components/features/sidebar/sidebar-nav-link";
import { ProjectStatusDot } from "./project-status-dot";

const ICON_SIZE = 18;

/**
 * Left-rail Projects section, above conversations. Only open projects are
 * listed; the section disappears entirely when there are none, and resolved
 * projects live behind the "All projects" page.
 */
export function SidebarProjectsSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("openhands");
  const { open } = useBackendProjects();
  const { currentPath } = useNavigation();

  if (open.length === 0) return null;

  if (collapsed) {
    return (
      <nav className="flex w-full shrink-0 flex-col items-stretch">
        <SidebarNavLink
          to="/projects"
          label={t(I18nKey.PROJECTS$SECTION_TITLE)}
          testId="sidebar-projects-link"
          collapsed
          icon={<FolderKanban width={ICON_SIZE} height={ICON_SIZE} />}
        />
      </nav>
    );
  }

  return (
    <section
      data-testid="sidebar-projects-section"
      className="mb-1 shrink-0 border-b border-border-subtle pb-2 pr-2.5"
    >
      <NavigationLink
        to="/projects"
        className="flex items-center gap-1.5 py-1.5 pl-2 text-sm font-normal text-muted hover:text-contrast"
      >
        <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t(I18nKey.PROJECTS$SECTION_TITLE)}
      </NavigationLink>
      <ul className="space-y-0.5">
        {open.map((project) => {
          const to = projectPath(project.id);
          const active = currentPath === to;
          const done = project.tasks.filter(
            (task) => task.status === "done",
          ).length;
          return (
            <li key={project.id}>
              <NavigationLink
                to={to}
                data-testid={`sidebar-project-${project.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md py-1.5 pl-2 pr-2 text-sm",
                  active
                    ? "bg-surface text-contrast"
                    : "text-content hover:bg-surface",
                )}
              >
                <ProjectStatusDot status={project.status} />
                <span className="min-w-0 flex-1 truncate">{project.title}</span>
                {project.tasks.length > 0 ? (
                  <span className="shrink-0 text-xs text-text-dim">
                    {t(I18nKey.PROJECTS$TASK_COUNT, {
                      done,
                      total: project.tasks.length,
                    })}
                  </span>
                ) : null}
              </NavigationLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

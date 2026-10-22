import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { ProjectStatus } from "#/types/project";
import { cn } from "#/utils/utils";

const STATUS_LABEL: Record<ProjectStatus, I18nKey> = {
  setup: I18nKey.PROJECTS$STATUS_SETUP,
  active: I18nKey.PROJECTS$STATUS_ACTIVE,
  completed: I18nKey.PROJECTS$STATUS_COMPLETED,
};

export function projectStatusLabelKey(status: ProjectStatus): I18nKey {
  return STATUS_LABEL[status];
}

export function ProjectStatusDot({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation("openhands");
  return (
    <span
      role="img"
      aria-label={t(STATUS_LABEL[status])}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        status === "setup" && "bg-warning",
        status === "active" && "bg-success",
        status === "completed" && "bg-text-dim",
      )}
    />
  );
}

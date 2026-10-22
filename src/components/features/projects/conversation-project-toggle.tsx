import React from "react";
import { FolderKanban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useIsArchivedConversation } from "#/hooks/use-is-archived-conversation";
import { useNavigation } from "#/context/navigation-context";
import {
  projectPath,
  useProjectForConversation,
  useTurnConversationIntoProject,
} from "#/hooks/use-projects";
import {
  displayErrorToast,
  displaySuccessToastWithLink,
} from "#/utils/custom-toast-handlers";
import { cn } from "#/utils/utils";
import {
  formControlBorderClassName,
  formControlMutedHoverClassName,
  formControlTransitionClassName,
} from "#/utils/form-control-classes";

// Matches the neighbouring Git actions header button.
const BUTTON_CLASSNAME = cn(
  "inline-flex h-7 min-h-7 w-fit shrink-0 cursor-pointer items-center justify-center gap-1.5 px-2.5",
  "rounded-md text-xs font-normal leading-none",
  formControlBorderClassName,
  formControlTransitionClassName,
  "text-muted",
  formControlMutedHoverClassName,
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * Conversation header control: turns this conversation into a project, or
 * opens the project it already belongs to. Turning stays in the chat so the
 * user watches the agent pick up the setup message.
 */
export function ConversationProjectToggle() {
  const { t } = useTranslation("openhands");
  const { data: conversation } = useActiveConversation();
  const isArchived = useIsArchivedConversation();
  const { navigate } = useNavigation();
  const project = useProjectForConversation(conversation?.id);
  const turnIntoProject = useTurnConversationIntoProject();
  const [isStarting, setIsStarting] = React.useState(false);

  if (!conversation || (isArchived && !project)) return null;

  const handleClick = async () => {
    if (project) {
      navigate(projectPath(project.id));
      return;
    }
    setIsStarting(true);
    try {
      const created = await turnIntoProject(conversation, {
        stayInConversation: true,
      });
      displaySuccessToastWithLink(
        t(I18nKey.PROJECTS$SETUP_STARTED),
        t(I18nKey.PROJECTS$OPEN_PROJECT),
        projectPath(created.id),
      );
    } catch {
      displayErrorToast(t(I18nKey.PROJECTS$SETUP_FAILED));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="conversation-project-toggle"
      onClick={handleClick}
      disabled={isStarting}
      aria-busy={isStarting}
      className={BUTTON_CLASSNAME}
    >
      <FolderKanban className="size-4 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">
        {project
          ? t(I18nKey.PROJECTS$OPEN_PROJECT)
          : t(I18nKey.PROJECTS$TURN_INTO_PROJECT)}
      </span>
    </button>
  );
}

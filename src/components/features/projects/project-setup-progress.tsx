import { useTranslation } from "react-i18next";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { BrandButton } from "#/components/features/settings/brand-button";
import { cn } from "#/utils/utils";

interface ProjectSetupProgressProps {
  /** True while the setup agent is running (or the setup message is in flight). */
  isAgentWorking: boolean;
  onOpenConversation: () => void;
}

/**
 * Explains an empty project page during setup: either the agent is drafting
 * the plan in the background, or it has stopped to ask the user something.
 */
export function ProjectSetupProgress({
  isAgentWorking,
  onOpenConversation,
}: ProjectSetupProgressProps) {
  const { t } = useTranslation("openhands");
  return (
    <div
      data-testid="project-setup-progress"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border p-3",
        isAgentWorking
          ? "border-border bg-surface"
          : "border-warning/40 bg-warning/10",
      )}
    >
      {isAgentWorking ? (
        <Loader2
          className="size-5 shrink-0 animate-spin text-muted"
          aria-hidden
        />
      ) : (
        <MessageCircleQuestion
          className="size-5 shrink-0 text-warning"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-medium text-content">
          {isAgentWorking
            ? t(I18nKey.PROJECTS$AGENT_WORKING)
            : t(I18nKey.PROJECTS$AGENT_WAITING)}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {isAgentWorking
            ? t(I18nKey.PROJECTS$AGENT_WORKING_DETAIL)
            : t(I18nKey.PROJECTS$AGENT_WAITING_DETAIL)}
        </p>
      </div>
      <BrandButton
        testId="project-setup-open-conversation"
        type="button"
        variant={isAgentWorking ? "secondary" : "primary"}
        onClick={onOpenConversation}
      >
        {isAgentWorking
          ? t(I18nKey.PROJECTS$WATCH_SETUP)
          : t(I18nKey.PROJECTS$ANSWER_SETUP)}
      </BrandButton>
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-3 animate-pulse rounded bg-surface-raised", className)}
    />
  );
}

/** Placeholder layout for the plan and board while setup is in progress. */
export function ProjectSetupSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonLine className="w-24" />
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-4/5" />
            <SkeletonLine className="w-3/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex min-h-32 flex-col gap-2 rounded-lg border border-border-subtle p-2"
          >
            <SkeletonLine className="w-20" />
            <div className="h-14 animate-pulse rounded-md bg-surface-raised" />
            {i === 0 ? (
              <div className="h-14 animate-pulse rounded-md bg-surface-raised" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

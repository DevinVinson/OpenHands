import React from "react";
import { useFeaturePolicy } from "#/feature-policy/feature-policy-context";

/**
 * localStorage key persisting whether the welcome onboarding flow has
 * been completed (or skipped). Once present, the modal won't auto-show
 * again on subsequent visits.
 */
export const ONBOARDING_COMPLETED_STORAGE_KEY = "openhands-onboarded";

function readCompletedFromStorage(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) !== null
    );
  } catch {
    // Inaccessible localStorage (private mode, SSR, …) — assume the
    // user has already onboarded so we don't loop on every render.
    return true;
  }
}

/**
 * Tracks whether the welcome onboarding modal has been completed.
 * Onboarding sets the agent and LLM on the backend, so when the operator
 * locked those settings the setup is theirs and counts as done.
 * The hook returns the current `isCompleted` flag plus an imperative
 * `markCompleted()` callback. State is mirrored to localStorage and
 * synced across tabs via the `storage` event.
 */
export function useOnboardingCompletion() {
  const [isCompleted, setIsCompleted] = React.useState<boolean>(() =>
    readCompletedFromStorage(),
  );

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ONBOARDING_COMPLETED_STORAGE_KEY) return;
      setIsCompleted(readCompletedFromStorage());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const featurePolicy = useFeaturePolicy();
  // @spec FP-006 — The operator prepared the agent and LLM; users skip setup.
  const operatorOwnsSetup =
    !featurePolicy.isEnabled("llmProfiles.manage") ||
    !featurePolicy.isEnabled("agentProfiles.manage");

  const markCompleted = React.useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, "1");
    } catch {
      // best-effort; we still flip the in-memory flag below.
    }
    setIsCompleted(true);
  }, []);

  return {
    isCompleted: isCompleted || operatorOwnsSetup,
    markCompleted,
  } as const;
}

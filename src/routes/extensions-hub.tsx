import { Navigate } from "react-router";
import {
  SETTINGS_COMPACT_MAX_WIDTH,
  useBreakpoint,
} from "#/hooks/use-breakpoint";
import { ExtensionsMobileHub } from "#/components/features/skills/extensions-mobile-hub";
import { getEnabledExtensionNavItems } from "#/components/features/skills/extensions-navigation";
import { useFeaturePolicy } from "#/feature-policy/feature-policy-context";
import NotFoundRoute from "./not-found";

export default function ExtensionsHub() {
  const isMobile = useBreakpoint(SETTINGS_COMPACT_MAX_WIDTH);
  const featurePolicy = useFeaturePolicy();
  const [landing] = getEnabledExtensionNavItems(featurePolicy);

  // @spec FP-004 — With every Customize section off there is no hub.
  if (!landing) {
    return <NotFoundRoute />;
  }

  if (isMobile) {
    return <ExtensionsMobileHub />;
  }

  return <Navigate to={landing.to} replace />;
}

import type React from "react";
import type { FeatureId } from "#/feature-policy/feature-policy";
import { useFeaturePolicy } from "#/feature-policy/feature-policy-context";
import NotFoundRoute from "./not-found";

// @spec FP-004 — A route whose feature is off renders the not-found page.
export function RequireFeature({
  feature,
  children,
}: {
  feature: FeatureId;
  children: React.ReactNode;
}) {
  const featurePolicy = useFeaturePolicy();
  return featurePolicy.isEnabled(feature) ? children : <NotFoundRoute />;
}

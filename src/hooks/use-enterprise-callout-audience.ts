import { getLockedCloudHost } from "#/api/agent-server-config";
import type { EnterpriseCalloutAudience } from "#/constants/enterprise-docs";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useCloudIntegrationsConfig } from "#/hooks/query/use-cloud-integrations-config";

/**
 * Which edition the active backend already provides, so callouts only point
 * at capabilities the user does not have. Returns null while a Cloud
 * backend's deployment mode is still loading, so nothing flashes in and out.
 */
export function useEnterpriseCalloutAudience(): EnterpriseCalloutAudience | null {
  const { backend } = useActiveBackend();
  const { data: config, isLoading } = useCloudIntegrationsConfig();

  if (getLockedCloudHost() !== null) return "enterprise";
  if (backend.kind === "local") return "local";
  if (isLoading) return null;
  return config?.deploymentMode === "self_hosted" ? "enterprise" : "cloud";
}

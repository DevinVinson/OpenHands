/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import {
  AgentSettingsScreen,
  type AgentSettingsSaveControl,
} from "#/routes/agent-settings";
import { ProfileNameInput } from "#/components/features/settings/llm-profiles/profile-name-input";
import { SettingsDropdownInput } from "#/components/features/settings/settings-dropdown-input";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import type { SettingsValue } from "#/types/settings";
import { useNavigation } from "#/context/navigation-context";
import {
  AUTOMATIONS,
  WORKFLOW_NODES,
  RUNS,
  factoryPath,
  factoryRunPath,
  findAgent,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Muted,
  PageHeading,
  Row,
  useFactoryDrawer,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";
import { runTone } from "./observe-pages";

/**
 * PROTOTYPE: a factory agent opens its Agent profile — the same editor as
 * Settings → Agent profiles — seeded from mock profile data, with the
 * factory context (where the profile is used) alongside it. Saving is a
 * placeholder; nothing is written to the backend.
 */
export function AgentProfilePage({
  factory,
  agentId,
}: FactoryPageProps & { agentId?: string }) {
  const agent = findAgent(agentId);
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const { data: llmProfilesData } = useLlmProfiles();
  const [profileName, setProfileName] = React.useState(
    agent?.profile.name ?? "",
  );
  const [saveControl, setSaveControl] =
    React.useState<AgentSettingsSaveControl | null>(null);

  const llmItems = React.useMemo(() => {
    const live = (llmProfilesData?.profiles ?? []).map((p) => ({
      key: p.name,
      label: p.model ? `${p.name} (${p.model})` : p.name,
    }));
    if (!agent) return live;
    return live.some((i) => i.key === agent.model)
      ? live
      : [{ key: agent.model, label: agent.model }, ...live];
  }, [llmProfilesData, agent]);
  const [llmRef, setLlmRef] = React.useState(agent?.model ?? "");

  const override = React.useMemo<Record<string, SettingsValue> | null>(
    () =>
      agent
        ? {
            agent_kind: "openhands",
            tools: agent.profile.tools.map((name) => ({
              name,
            })) as unknown as SettingsValue,
            system_message_suffix: agent.profile.instructions,
            mcp_server_refs: null,
            secret_refs: null,
          }
        : null,
    [agent],
  );

  if (!agent) {
    return (
      <PageHeading
        backTo={factoryPath(factory.id, "agents")}
        backLabel="Agents"
        title="Agent not found"
      />
    );
  }

  const stages = WORKFLOW_NODES.filter(
    (n) => n.kind === "stage" && n.detail === agent.name,
  );
  const automations = AUTOMATIONS.filter((a) => a.agent === agent.name);
  const runs = RUNS.filter((r) => r.agent === agent.name);

  return (
    <>
      <PageHeading
        backTo={factoryPath(factory.id, "agents")}
        backLabel="Agents"
        eyebrow={eyebrow(factory)}
        title={agent.name}
        subtitle={
          <>
            Agent profile{" "}
            <span className="font-mono">{agent.profile.name}</span> · sets what
            this agent can use in every conversation and automation it runs.
          </>
        }
        actions={
          <>
            <Button onClick={() => navigate("/settings/agents")}>
              Open in Settings
            </Button>
            <Button
              variant="primary"
              onClick={() => demo("Save agent profile")}
            >
              Save profile
            </Button>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {agent.orchestrator ? <Badge tone="good">Primary agent</Badge> : null}
        <Badge tone="info">{agent.active} active</Badge>
        <Badge>{agent.scope}</Badge>
        <Badge>{agent.model}</Badge>
        {saveControl?.isDirty ? (
          <Badge tone="warn">Unsaved changes</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* The existing Agent profile editor, embedded as-is. */}
        <div className="min-w-0 flex-1">
          <Card className="p-6">
            <div className="flex flex-col gap-6">
              <ProfileNameInput
                testId="factory-agent-profile-name"
                value={profileName}
                onChange={setProfileName}
                isRequired
              />
              <AgentSettingsScreen
                key={agent.id}
                agentSettingsOverride={override}
                onSaveControlChange={setSaveControl}
                llmPicker={
                  <SettingsDropdownInput
                    testId="factory-agent-profile-llm"
                    name="factory-agent-profile-llm"
                    label="LLM profile"
                    items={llmItems}
                    selectedKey={llmRef}
                    onSelectionChange={(key) => key && setLlmRef(String(key))}
                  />
                }
              />
            </div>
          </Card>
        </div>

        {/* Factory context: where this profile's scope applies. */}
        <div className="w-full shrink-0 lg:w-80">
          <Card>
            <CardTitle>Used in this factory</CardTitle>
            <Muted className="mb-2">Workflow stations</Muted>
            {stages.length ? (
              stages.map((s) => (
                <Row
                  key={s.id}
                  onClick={() => navigate(factoryPath(factory.id, "workflows"))}
                >
                  <span className="text-content">{s.label}</span>
                  <span className="text-muted">›</span>
                </Row>
              ))
            ) : (
              <Muted className="mb-3">Not assigned to a stage</Muted>
            )}
            <Muted className="mb-2 mt-4">Automations</Muted>
            {automations.length ? (
              automations.map((a) => (
                <Row
                  key={a.name}
                  onClick={() =>
                    navigate(factoryPath(factory.id, "automations"))
                  }
                >
                  <span className="text-content">{a.name}</span>
                  <Badge tone={a.enabled ? "good" : "neutral"}>
                    {a.enabled ? "On" : "Off"}
                  </Badge>
                </Row>
              ))
            ) : (
              <Muted>No automations target this agent</Muted>
            )}
          </Card>
          <Card className="mt-4">
            <CardTitle>Recent runs</CardTitle>
            {runs.length ? (
              runs.map((r) => (
                <Row
                  key={r.id}
                  onClick={() => navigate(factoryRunPath(factory.id, r.id))}
                >
                  <span className="truncate text-content">
                    {r.id} · {r.task}
                  </span>
                  <Badge tone={runTone(r.status)}>{r.status}</Badge>
                </Row>
              ))
            ) : (
              <Muted>No runs yet</Muted>
            )}
          </Card>
          <Card className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-content">Runs as</h3>
              <Badge tone="info">OHE</Badge>
            </div>
            <div className="rounded-md border border-border px-3 py-2 font-mono text-sm text-content">
              {agent.runsAs ?? "Person who started the run"}
            </div>
            <Muted className="mt-2">
              A service account makes commits, comments and PRs attributable to
              the factory instead of whoever set it up.
            </Muted>
            <div className="mt-3">
              <Button size="sm" onClick={() => demo("Choose service account")}>
                {agent.runsAs ? "Change account" : "Use a service account"}
              </Button>
            </div>
          </Card>
          <Card className="mt-4">
            <CardTitle>Scope changes</CardTitle>
            <Muted>
              Edits apply to new runs. Runs in progress keep the profile they
              started with. Benchmark the change before publishing.
            </Muted>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => navigate(factoryPath(factory.id, "benchmarks"))}
              >
                Benchmark this profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

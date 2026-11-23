/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ArrowUpRight, GitPullRequest, CircleDot } from "lucide-react";
import { cn } from "#/utils/utils";
import { useNavigation } from "#/context/navigation-context";
import {
  EXTERNAL_REFS,
  FACTORY_CONVERSATIONS,
  RUNS,
  WORK_LOG,
  factoryPath,
  factoryRefPath,
  factoryRunPath,
  findRef,
  type ExternalRef,
  type FactoryConversation,
  type LogEntryType,
  type LogSource,
  type WorkLogEntry,
} from "../factory-data";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  FilterChips,
  Muted,
  PageHeading,
  Row,
  Table,
  useFactoryDrawer,
  type Tone,
} from "../factory-ui";
import { eyebrow, type FactoryPageProps } from "./overview-pages";
import { runTone } from "./observe-pages";

const ENTRY_TONE: Record<LogEntryType, Tone> = {
  event: "neutral",
  status: "info",
  handoff: "info",
  blocker: "bad",
  decision: "good",
  note: "neutral",
};

const SOURCE_LABEL: Record<LogSource, string> = {
  agent: "Agent",
  automation: "Automation",
  human: "Person",
  system: "System",
};

function RefIcon({ type }: { type: ExternalRef["type"] }) {
  return type === "pr" ? (
    <GitPullRequest className="size-3.5 shrink-0 text-muted" />
  ) : (
    <CircleDot className="size-3.5 shrink-0 text-muted" />
  );
}

export function refStateTone(state: string): Tone {
  if (state === "Merged") return "good";
  if (state === "In review" || state === "In progress") return "info";
  if (state === "Draft") return "neutral";
  return "warn";
}

/** One work-log line; shared by the stream, ref detail and overview. */
export function LogEntryRow({
  entry,
  factoryId,
  showRef = true,
}: {
  entry: WorkLogEntry;
  factoryId: string;
  showRef?: boolean;
}) {
  const { navigate } = useNavigation();
  const ref = findRef(entry.refId);
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <div className="w-10 shrink-0 pt-0.5 text-right text-xs text-muted">
        {entry.when}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={ENTRY_TONE[entry.type]}>{entry.type}</Badge>
          <span className="text-xs text-muted">
            {SOURCE_LABEL[entry.source]} · {entry.sourceName}
          </span>
        </div>
        <div className="mt-1 text-sm text-content">{entry.summary}</div>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
          {showRef && ref ? (
            <button
              type="button"
              onClick={() => navigate(factoryRefPath(factoryId, ref.id))}
              className="inline-flex cursor-pointer items-center gap-1 text-link hover:underline"
            >
              <RefIcon type={ref.type} />
              {ref.label}
            </button>
          ) : null}
          {entry.runId ? (
            <button
              type="button"
              onClick={() => navigate(factoryRunPath(factoryId, entry.runId!))}
              className="cursor-pointer text-link hover:underline"
            >
              {entry.runId}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type Period = "1h" | "24h" | "7d";
type StreamTab = "activity" | "refs";
type RefFilter = "all" | "issue" | "pr" | "created";

const PERIOD_MINUTES: Record<Period, number> = {
  "1h": 60,
  "24h": 1440,
  "7d": 10080,
};

export function WorkStreamPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const [tab, setTab] = React.useState<StreamTab>("activity");
  const [period, setPeriod] = React.useState<Period>("24h");
  const [source, setSource] = React.useState<LogSource | "all">("all");
  const [refFilter, setRefFilter] = React.useState<RefFilter>("all");

  const entries = WORK_LOG.filter(
    (e) =>
      e.minutesAgo <= PERIOD_MINUTES[period] &&
      (source === "all" || e.source === source),
  );
  const refs = EXTERNAL_REFS.filter(
    (r) =>
      refFilter === "all" ||
      (refFilter === "created"
        ? r.relation === "Created"
        : r.type === refFilter),
  );

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Work stream"
        subtitle="Everything that entered, ran, stalled or shipped in this factory, and the issues and PRs it touched."
        actions={
          <Button onClick={() => demo("Add a note to the work log")}>
            Add note
          </Button>
        }
      />
      <div role="tablist" className="mb-5 flex gap-1 border-b border-border">
        {(
          [
            ["activity", "Activity"],
            ["refs", `Issues & PRs (${EXTERNAL_REFS.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-sm",
              tab === key
                ? "border-primary font-medium text-content"
                : "border-transparent text-muted hover:text-content",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "activity" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FilterChips<Period>
              value={period}
              onChange={setPeriod}
              options={[
                { value: "1h", label: "Last hour" },
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7 days" },
              ]}
            />
            <FilterChips<LogSource | "all">
              value={source}
              onChange={setSource}
              options={[
                { value: "all", label: "All sources" },
                { value: "agent", label: "Agents" },
                { value: "automation", label: "Automations" },
                { value: "human", label: "People" },
                { value: "system", label: "Rules & system" },
              ]}
            />
            <div className="flex-1" />
            <Muted>{entries.length} entries</Muted>
          </div>
          <Card>
            {entries.length ? (
              entries.map((e) => (
                <LogEntryRow key={e.id} entry={e} factoryId={factory.id} />
              ))
            ) : (
              <Muted className="py-6 text-center">
                Nothing in this period.
              </Muted>
            )}
          </Card>
          <Callout>
            The work log is append-only. Agents, automations, rules and people
            all write to it, and every entry can reference an issue, PR, run or
            conversation, so the factory can answer “what happened to X?”.
          </Callout>
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FilterChips<RefFilter>
              value={refFilter}
              onChange={setRefFilter}
              options={[
                { value: "all", label: "All" },
                { value: "issue", label: "Issues" },
                { value: "pr", label: "Pull requests" },
                { value: "created", label: "Created by factory" },
              ]}
            />
            <div className="flex-1" />
            <Muted>{refs.length} references</Muted>
          </div>
          <Table<ExternalRef>
            rows={refs}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(factoryRefPath(factory.id, r.id))}
            columns={[
              {
                header: "Reference",
                width: "40%",
                render: (r) => (
                  <div className="flex min-w-0 items-center gap-2">
                    <RefIcon type={r.type} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.title}</div>
                      <Muted className="mt-0.5">
                        {r.provider} · {r.label}
                      </Muted>
                    </div>
                  </div>
                ),
              },
              {
                header: "State",
                render: (r) => (
                  <Badge tone={refStateTone(r.state)}>{r.state}</Badge>
                ),
              },
              { header: "Factory", render: (r) => r.relation },
              {
                header: "Produced",
                render: (r) => (
                  <span className="text-muted">
                    {r.produced?.join(", ") ?? "—"}
                  </span>
                ),
              },
              { header: "Updated", render: (r) => r.updated },
            ]}
          />
        </>
      )}
    </>
  );
}

export function RefDetailPage({
  factory,
  refId,
}: FactoryPageProps & { refId?: string }) {
  const ref = findRef(refId) ?? EXTERNAL_REFS[2];
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const entries = WORK_LOG.filter((e) => e.refId === ref.id);
  const runs = RUNS.filter((r) => r.refId === ref.id);
  const conversations = FACTORY_CONVERSATIONS.filter((c) => c.refId === ref.id);

  return (
    <>
      <PageHeading
        backTo={factoryPath(factory.id, "stream")}
        backLabel="Work stream"
        eyebrow={eyebrow(factory)}
        title={
          <span className="inline-flex items-center gap-2">
            <RefIcon type={ref.type} />
            {ref.title}
          </span>
        }
        subtitle={`${ref.provider} · ${ref.label} · ${ref.relation === "Created" ? "created by this factory" : "worked on by this factory"}`}
        actions={
          <Button onClick={() => demo(`Open ${ref.label} in ${ref.provider}`)}>
            Open in {ref.provider} <ArrowUpRight className="size-3.5" />
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={refStateTone(ref.state)}>{ref.state}</Badge>
        <Badge>{ref.type === "pr" ? "Pull request" : "Issue"}</Badge>
        <Muted>State snapshot {ref.updated} ago</Muted>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Card>
            <CardTitle>Work log for {ref.label}</CardTitle>
            {entries.length ? (
              entries.map((e) => (
                <LogEntryRow
                  key={e.id}
                  entry={e}
                  factoryId={factory.id}
                  showRef={false}
                />
              ))
            ) : (
              <Muted>No entries yet.</Muted>
            )}
          </Card>
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <Card>
            <CardTitle>Produced by the factory</CardTitle>
            {ref.produced?.length ? (
              ref.produced.map((p) => (
                <Row key={p} onClick={() => demo(p)}>
                  <span className="text-content">{p}</span>
                  <ArrowUpRight className="size-3.5 text-muted" />
                </Row>
              ))
            ) : (
              <Muted>Nothing yet</Muted>
            )}
          </Card>
          <Card className="mt-4">
            <CardTitle>Runs</CardTitle>
            {runs.length ? (
              runs.map((r) => (
                <Row
                  key={r.id}
                  onClick={() => navigate(factoryRunPath(factory.id, r.id))}
                >
                  <span className="text-content">
                    {r.id} · {r.agent}
                  </span>
                  <Badge tone={runTone(r.status)}>{r.status}</Badge>
                </Row>
              ))
            ) : (
              <Muted>No runs</Muted>
            )}
          </Card>
          <Card className="mt-4">
            <CardTitle>Conversations</CardTitle>
            {conversations.length ? (
              conversations.map((c) => (
                <Row key={c.id} onClick={() => navigate("/conversations")}>
                  <span className="truncate text-content">{c.title}</span>
                  <Badge tone={conversationTone(c.status)}>{c.status}</Badge>
                </Row>
              ))
            ) : (
              <Muted>None attached</Muted>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function conversationTone(status: FactoryConversation["status"]): Tone {
  if (status === "Running") return "info";
  if (status === "Waiting") return "warn";
  return "neutral";
}

export function ConversationsPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Conversations"
        subtitle="What the factory's agents are doing right now, without hunting through the full conversation list."
        actions={
          <Button
            variant="primary"
            onClick={() => demo("Start a conversation in this factory")}
          >
            New conversation
          </Button>
        }
      />
      <Table<FactoryConversation>
        rows={FACTORY_CONVERSATIONS}
        rowKey={(c) => c.id}
        onRowClick={() => navigate("/conversations")}
        columns={[
          {
            header: "Conversation",
            width: "36%",
            render: (c) => <span className="font-medium">{c.title}</span>,
          },
          { header: "Agent", render: (c) => c.agent },
          {
            header: "Status",
            render: (c) => (
              <Badge tone={conversationTone(c.status)}>{c.status}</Badge>
            ),
          },
          {
            header: "Reference",
            render: (c) => {
              const ref = findRef(c.refId);
              return ref ? (
                <button
                  type="button"
                  className="cursor-pointer text-link hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(factoryRefPath(factory.id, ref.id));
                  }}
                >
                  {ref.label}
                </button>
              ) : (
                <span className="text-muted">—</span>
              );
            },
          },
          { header: "Updated", render: (c) => c.updated },
        ]}
      />
      <Callout>
        Conversations carry the factory tag ({factory.tag}), so the main sidebar
        can also group them by factory.
      </Callout>
    </>
  );
}

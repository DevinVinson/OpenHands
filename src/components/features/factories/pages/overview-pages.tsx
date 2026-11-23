/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigation } from "#/context/navigation-context";
import {
  ATTENTION_ITEMS,
  THROUGHPUT,
  WORK_ITEMS,
  WORK_STAGES,
  factoryPath,
  factoryWorkItemPath,
  type AttentionItem,
  type Factory,
  type WorkItem,
} from "../factory-data";
import {
  Badge,
  Bars,
  Button,
  Callout,
  Card,
  CardTitle,
  FilterChips,
  Muted,
  PageHeading,
  Row,
  SectionTitle,
  Stat,
  Table,
  useFactoryDrawer,
} from "../factory-ui";

export interface FactoryPageProps {
  factory: Factory;
}

export const eyebrow = (f: Factory) => `${f.name} / Factory`;

function useOpenWorkItem(factory: Factory) {
  const { open, close } = useFactoryDrawer();
  const { navigate } = useNavigation();
  return (item: WorkItem) =>
    open(
      item.title,
      <>
        <Muted>
          {item.id} · {item.source}
        </Muted>
        <div className="mt-3 flex gap-1.5">
          <Badge tone={item.priority === "High" ? "warn" : "neutral"}>
            {item.priority}
          </Badge>
          <Badge tone="info">{item.stage}</Badge>
        </div>
        <div className="my-4 h-px bg-border" />
        <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
          Next action
        </div>
        <p className="mt-1 text-sm text-content">
          Continue this work through its current stage and verify the required
          evidence before handoff.
        </p>
        <div className="mt-4 text-2xs font-semibold uppercase tracking-wider text-muted">
          Assigned worker
        </div>
        <p className="mt-1 text-sm text-content">{item.worker}</p>
        <div className="my-4 h-px bg-border" />
        <Button
          variant="primary"
          onClick={() => {
            close();
            navigate(factoryWorkItemPath(factory.id, item.id));
          }}
        >
          Open work item
        </Button>
      </>,
    );
}

function useOpenAttention(factory: Factory) {
  const { open, demo, close } = useFactoryDrawer();
  const { navigate } = useNavigation();
  return (a: AttentionItem) =>
    open(
      a.title,
      <>
        <div className="flex gap-1.5">
          <Badge tone="warn">{a.kind}</Badge>
          <Badge>{a.workItemId}</Badge>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-content">{a.detail}</p>
        <p className="mt-3 text-sm text-muted">
          This work is paused for human input. Review the context, submit a
          decision and return to the work item.
        </p>
        {a.kind === "Question" ? (
          <textarea
            className="mt-4 min-h-24 w-full rounded-md border border-border bg-canvas-base p-2 text-sm text-content"
            placeholder="Type your answer…"
          />
        ) : null}
        <div className="my-4 h-px bg-border" />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              close();
              navigate(factoryWorkItemPath(factory.id, a.workItemId));
            }}
          >
            Open work item
          </Button>
          <div className="flex-1" />
          <Button onClick={() => demo("Request changes")}>
            Request changes
          </Button>
          <Button variant="primary" onClick={() => demo("Approve")}>
            {a.kind === "Question" ? "Send answer" : "Approve"}
          </Button>
        </div>
      </>,
    );
}

export function OverviewPage({ factory }: FactoryPageProps) {
  const { navigate } = useNavigation();
  const { demo } = useFactoryDrawer();
  const openAttention = useOpenAttention(factory);
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Factory overview"
        subtitle="A shared control room for the work moving through your software factory."
        actions={
          <Button variant="primary" onClick={() => demo("New work item")}>
            New work item
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Active work" value="9" hint="Across 2 repositories" />
        <Stat
          label="Needs a decision"
          value="3"
          hint="2 approvals · 1 question"
        />
        <Stat label="PRs merged" value="27" hint="+18% against prior period" />
        <Stat
          label="Median cost / PR"
          value="$18.42"
          hint="Compute + inference estimate"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Throughput · last 30 days</CardTitle>
          <Bars values={THROUGHPUT} />
          <div className="mt-2 flex justify-between text-2xs text-muted">
            <span>Oct 24</span>
            <span>Nov 23</span>
          </div>
        </Card>
        <Card>
          <CardTitle>Factory attention</CardTitle>
          {ATTENTION_ITEMS.map((a) => (
            <Row key={a.id} onClick={() => openAttention(a)}>
              <div>
                <div className="font-medium text-content">{a.title}</div>
                <Muted className="mt-1">{a.kind}</Muted>
              </div>
              <Badge tone="warn">{a.action}</Badge>
            </Row>
          ))}
        </Card>
      </div>
      <SectionTitle
        right={
          <Button
            size="sm"
            onClick={() => navigate(factoryPath(factory.id, "queue"))}
          >
            Open full work queue →
          </Button>
        }
      >
        Production line
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {WORK_STAGES.map((s, i) => (
          <Card
            key={s.stage}
            tight
            onClick={() => navigate(factoryPath(factory.id, "queue"))}
          >
            <Muted>0{i + 1}</Muted>
            <div className="mt-1.5 text-sm font-medium text-content">
              {s.label}
            </div>
            <div className="mt-1 text-2xl font-semibold text-content">
              {WORK_ITEMS.filter((w) => w.stage === s.stage).length}
            </div>
            <Muted>work items</Muted>
          </Card>
        ))}
      </div>
    </>
  );
}

type QueueFilter = "all" | "high" | "mine";

export function QueuePage({ factory }: FactoryPageProps) {
  const [filter, setFilter] = React.useState<QueueFilter>("all");
  const { demo } = useFactoryDrawer();
  const openWork = useOpenWorkItem(factory);
  const visible = WORK_ITEMS.filter(
    (w) =>
      filter === "all" ||
      (filter === "high" && w.priority === "High") ||
      (filter === "mine" && (w.stage === "review" || w.stage === "plan")),
  );
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Work queue"
        subtitle="Follow each work item from intake to a verified deliverable."
        actions={
          <Button variant="primary" onClick={() => demo("Add work")}>
            Add work
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterChips<QueueFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All work" },
            { value: "high", label: "High priority" },
            { value: "mine", label: "Waiting on me" },
          ]}
        />
        <div className="flex-1" />
        <Muted>{visible.length} work items</Muted>
      </div>
      <div className="grid grid-cols-[repeat(5,minmax(190px,1fr))] gap-3 overflow-x-auto pb-2">
        {WORK_STAGES.map((lane) => {
          const items = visible.filter((w) => w.stage === lane.stage);
          return (
            <div
              key={lane.stage}
              className="min-h-105 rounded-xl border border-border bg-surface-raised/30 p-2.5"
            >
              <div className="flex items-center justify-between px-1 pb-3 pt-1 text-sm font-semibold text-content">
                <span>{lane.label}</span>
                <Badge>{items.length}</Badge>
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => openWork(w)}
                    className="cursor-pointer rounded-lg border border-border bg-canvas-base p-3 text-left shadow-sm transition-colors hover:border-contrast/30"
                  >
                    <Muted>
                      {w.id} · {w.age}
                    </Muted>
                    <div className="mt-2 text-sm font-medium leading-snug text-content">
                      {w.title}
                    </div>
                    <Muted className="mt-1.5">{w.source}</Muted>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge tone={w.priority === "High" ? "warn" : "neutral"}>
                        {w.priority}
                      </Badge>
                      <ChevronRight className="size-3.5 text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function AttentionPage({ factory }: FactoryPageProps) {
  const { demo } = useFactoryDrawer();
  const openAttention = useOpenAttention(factory);
  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Needs your attention"
        subtitle="Resolve decisions and unblock work without opening individual runs."
        actions={
          <Button onClick={() => demo("Completed decisions")}>
            View completed
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Waiting on you" value="3" />
        <Stat label="Approval requests" value="2" />
        <Stat label="Unanswered questions" value="1" />
      </div>
      <SectionTitle>Decisions waiting on you</SectionTitle>
      <Table<AttentionItem>
        rows={ATTENTION_ITEMS}
        rowKey={(r) => r.id}
        onRowClick={openAttention}
        columns={[
          {
            header: "Request",
            width: "44%",
            render: (r) => <span className="font-medium">{r.title}</span>,
          },
          {
            header: "Type",
            render: (r) => <Badge tone="warn">{r.kind}</Badge>,
          },
          { header: "Origin", render: (r) => r.workItemId },
          { header: "Age", render: (r) => r.age },
          {
            header: "Action",
            render: (r) => (
              <span className="text-link underline">{r.action}</span>
            ),
          },
        ]}
      />
      <Callout>
        Design rule: an approval is attached to a work item and a Blueprint
        gate, not to a standalone chat message. A reviewer can see the evidence
        and downstream impact before deciding.
      </Callout>
    </>
  );
}

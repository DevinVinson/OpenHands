/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import {
  ATTENTION_ITEMS,
  BLOCKER_PATTERNS,
  RESOLUTION_RULES,
  type BlockerPattern,
  type ResolutionRule,
  type RuleCoverage,
} from "../factory-data";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  Field,
  Muted,
  Note,
  PageHeading,
  Row,
  SectionTitle,
  Stat,
  Table,
  useFactoryDrawer,
  type Tone,
} from "../factory-ui";
import {
  eyebrow,
  useOpenAttention,
  type FactoryPageProps,
} from "./overview-pages";

const COVERAGE_TONE: Record<RuleCoverage, Tone> = {
  Covered: "good",
  Partial: "warn",
  "No rule": "bad",
};

const COVERAGE_ACTION: Record<RuleCoverage, string> = {
  Covered: "Edit rule",
  Partial: "Improve rule",
  "No rule": "Define rule",
};

function findRule(id?: string) {
  return RESOLUTION_RULES.find((r) => r.id === id);
}

/** Placeholder rule builder shared by every "define / edit rule" entry. */
function RuleBuilder({
  rule,
  pattern,
}: {
  rule?: ResolutionRule;
  pattern?: BlockerPattern;
}) {
  const { demo } = useFactoryDrawer();
  return (
    <>
      {pattern ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={COVERAGE_TONE[pattern.coverage]}>
              {pattern.coverage}
            </Badge>
            <Badge>{pattern.stage}</Badge>
            <Badge>{pattern.last7d} times in 7 days</Badge>
          </div>
          <div className="mt-4">
            <Note>
              <b>Suggested by the factory:</b> {pattern.suggestion}
            </Note>
          </div>
          <Muted className="mt-3">Latest example: {pattern.example}</Muted>
        </>
      ) : null}
      <div className="mt-5 text-2xs font-semibold uppercase tracking-wider text-muted">
        Resolution rule
      </div>
      <Field label="When">
        {rule?.when ??
          (pattern
            ? `Work is blocked by “${pattern.cause}”`
            : "Choose a blocker condition…")}
      </Field>
      <Field label="Then">
        <div className="text-muted">
          {rule?.then ??
            "Choose an action: retry, reroute to a stage, ask a person on the source thread, auto-approve within limits…"}
        </div>
      </Field>
      <Field label="Escalate if unresolved">
        <div className="text-muted">
          {rule?.escalate && rule.escalate !== "Not set"
            ? rule.escalate
            : "After [4h] → [factory owner] via [Slack]"}
        </div>
      </Field>
      <Field label="Guardrails">
        <div className="text-muted">
          Only for risk ≤ Medium · never bypasses merge authorization
        </div>
      </Field>
      <div className="my-4 h-px bg-border" />
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => demo("Save rule")}>
          {rule ? "Save rule" : "Create rule"}
        </Button>
        <Button onClick={() => demo("Dry run against last 30 days")}>
          Dry run on last 30 days
        </Button>
        {pattern && pattern.blockedNow > 0 ? (
          <Button
            variant="ghost"
            onClick={() => demo("Resolve current items once")}
          >
            Resolve {pattern.blockedNow} now, once
          </Button>
        ) : null}
      </div>
    </>
  );
}

export function OperatorPage({ factory }: FactoryPageProps) {
  const { open, demo } = useFactoryDrawer();
  const openEscalation = useOpenAttention(factory);
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(RESOLUTION_RULES.map((r) => [r.id, r.enabled])),
  );

  const openPattern = (p: BlockerPattern) =>
    open(p.cause, <RuleBuilder pattern={p} rule={findRule(p.ruleId)} />);
  const openRule = (r: ResolutionRule) =>
    open(r.name, <RuleBuilder rule={r} />);
  const newRule = () => open("New resolution rule", <RuleBuilder />);

  return (
    <>
      <PageHeading
        eyebrow={eyebrow(factory)}
        title="Operator view"
        subtitle="Keep work moving. Resolve recurring blockers with rules instead of one-off interventions."
        actions={
          <>
            <Button onClick={() => demo("Escalation policy")}>
              Escalation policy
            </Button>
            <Button variant="primary" onClick={newRule}>
              New rule
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Moved without a person"
          value="87%"
          hint="Work items this week that never waited on a human"
        />
        <Stat label="Blocked right now" value="5" hint="Across 4 causes" />
        <Stat
          label="Auto-resolved by rules"
          value="17"
          hint="Last 7 days · up from 9"
        />
        <Stat
          label="Escalated to people"
          value="3"
          hint="Each one is a candidate for a rule"
        />
      </div>

      <SectionTitle right={<Muted>Grouped by cause, not by work item</Muted>}>
        Blocker patterns
      </SectionTitle>
      <Table<BlockerPattern>
        rows={BLOCKER_PATTERNS}
        rowKey={(p) => p.id}
        onRowClick={openPattern}
        columns={[
          {
            header: "Cause",
            width: "34%",
            render: (p) => (
              <div className="min-w-0">
                <div className="truncate font-medium">{p.cause}</div>
                <Muted className="mt-0.5 truncate">{p.example}</Muted>
              </div>
            ),
          },
          { header: "Stage", render: (p) => p.stage },
          {
            header: "Blocked now",
            render: (p) =>
              p.blockedNow ? (
                <Badge tone="warn">{p.blockedNow}</Badge>
              ) : (
                <span className="text-muted">0</span>
              ),
          },
          {
            header: "Last 7 days",
            render: (p) => (
              <span>
                {p.last7d}
                <span className="text-muted"> · {p.autoResolved} auto</span>
              </span>
            ),
          },
          {
            header: "Rule",
            render: (p) => (
              <Badge tone={COVERAGE_TONE[p.coverage]}>{p.coverage}</Badge>
            ),
          },
          {
            header: "",
            render: (p) => (
              <span className="text-link underline">
                {COVERAGE_ACTION[p.coverage]}
              </span>
            ),
          },
        ]}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="mb-1 flex items-center">
            <h3 className="text-sm font-semibold text-content">
              Resolution rules
            </h3>
            <div className="flex-1" />
            <Button size="sm" onClick={newRule}>
              New rule
            </Button>
          </div>
          {RESOLUTION_RULES.map((r) => (
            <Row key={r.id} onClick={() => openRule(r)}>
              <div className="min-w-0">
                <div className="font-medium text-content">{r.name}</div>
                <Muted className="mt-1 truncate">
                  When {r.when.charAt(0).toLowerCase() + r.when.slice(1)} →{" "}
                  {r.then.charAt(0).toLowerCase() + r.then.slice(1)}
                </Muted>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Muted>
                  {r.hits7d} hits · {r.successRate}
                </Muted>
                <span
                  role="switch"
                  aria-checked={enabled[r.id]}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnabled((s) => ({ ...s, [r.id]: !s[r.id] }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      setEnabled((s) => ({ ...s, [r.id]: !s[r.id] }));
                    }
                  }}
                >
                  <Badge tone={enabled[r.id] ? "good" : "neutral"}>
                    {enabled[r.id] ? "On" : "Off"}
                  </Badge>
                </span>
              </div>
            </Row>
          ))}
        </Card>
        <Card>
          <CardTitle>Escalation policy</CardTitle>
          {[
            ["Default owner", "Factory maintainers"],
            ["Channel", "Slack · #factory-ops"],
            ["Escalate after", "4h blocked without a rule"],
            ["Quiet hours", "20:00–08:00 · hold non-urgent"],
            ["Always human", "Merge authorization, prod secrets"],
          ].map(([k, v]) => (
            <div key={k} className="mb-2.5">
              <Muted>{k}</Muted>
              <div className="mt-0.5 text-sm text-content">{v}</div>
            </div>
          ))}
          <Button size="sm" onClick={() => demo("Escalation policy")}>
            Configure
          </Button>
        </Card>
      </div>

      <SectionTitle right={<Muted>Residual cases that no rule handled</Muted>}>
        Escalated to people
      </SectionTitle>
      <Card>
        {ATTENTION_ITEMS.map((a) => (
          <Row key={a.id}>
            <div className="min-w-0">
              <div className="font-medium text-content">{a.title}</div>
              <Muted className="mt-1">
                {a.kind} · {a.workItemId} · waiting {a.age}
              </Muted>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" onClick={() => openEscalation(a)}>
                Resolve once
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  open(
                    `Rule from: ${a.title}`,
                    <RuleBuilder
                      pattern={BLOCKER_PATTERNS.find((p) =>
                        a.kind === "Question"
                          ? p.id === "ambiguous-req"
                          : p.id === "spec-approval",
                      )}
                    />,
                  )
                }
              >
                Make a rule
              </Button>
            </div>
          </Row>
        ))}
      </Card>
      <Callout>
        Design rule: an escalation should either become a rule so it never needs
        a person again, or be explicitly marked as requiring human judgment
        (e.g. merge authorization). The goal is a factory that keeps moving, not
        an inbox of interventions.
      </Callout>
    </>
  );
}

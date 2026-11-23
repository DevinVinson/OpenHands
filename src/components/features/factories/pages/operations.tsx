/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import {
  ATTENTION_ITEMS,
  BLOCKER_PATTERNS,
  RESOLUTION_RULES,
  WORKFLOW_NODES,
  findRef,
  type Factory,
  type BlockerPattern,
  type ResolutionRule,
  type RuleCoverage,
} from "../factory-data";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Field,
  Muted,
  Note,
  Row,
  Stat,
  useFactoryDrawer,
  type Tone,
} from "../factory-ui";
import { useOpenAttention } from "./overview-pages";

/**
 * Operator building blocks: flow numbers, escalations and blocker patterns
 * live on the Overview; resolution rules live in Workflows; the escalation
 * policy lives in Configuration.
 */

export const COVERAGE_TONE: Record<RuleCoverage, Tone> = {
  Covered: "good",
  Partial: "warn",
  "No rule": "bad",
};

const COVERAGE_ACTION: Record<RuleCoverage, string> = {
  Covered: "Edit rule",
  Partial: "Improve rule",
  "No rule": "Define rule",
};

export function findRule(id?: string) {
  return RESOLUTION_RULES.find((r) => r.id === id);
}

export function stationLabel(id: string) {
  return WORKFLOW_NODES.find((n) => n.id === id)?.label ?? id;
}

/** Placeholder rule builder shared by every "define / edit rule" entry. */
export function RuleBuilder({
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
      <Field label="Guards station">
        {rule ? stationLabel(rule.stationId) : (pattern?.stage ?? "Choose…")}
      </Field>
      <Field label="When">
        {rule?.when ??
          (pattern
            ? `Work is blocked by “${pattern.cause}”`
            : "Choose a blocker condition…")}
      </Field>
      <Field label="Then">
        <div className="text-muted">
          {rule?.then ??
            "Choose an action: retry, reroute to a station, ask a person on the source thread, auto-approve within limits…"}
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

export function FlowStats() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Stat
        label="Moved without a person"
        value="87%"
        hint="Never waited on a human this week"
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
        hint="Each is a candidate for a rule"
      />
    </div>
  );
}

export function EscalationsCard({ factory }: { factory: Factory }) {
  const { open } = useFactoryDrawer();
  const openEscalation = useOpenAttention(factory);
  if (!ATTENTION_ITEMS.length) return null;
  return (
    <Card className="border-warning/40">
      <div className="mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-content">
            Human intervention
          </h3>
          <Badge tone="warn">{ATTENTION_ITEMS.length}</Badge>
        </div>
        <Muted className="mt-0.5">
          Work no rule could resolve. Each one is a candidate for a new rule.
        </Muted>
      </div>
      {ATTENTION_ITEMS.map((a) => (
        <Row key={a.id}>
          <div className="min-w-0">
            <div className="truncate font-medium text-content">{a.title}</div>
            <Muted className="mt-1 truncate">
              {a.kind} · {findRef(a.refId)?.label ?? a.refId} · waiting {a.age}
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
  );
}

/** Blocker causes as a compact list: each row opens the rule editor. */
export function BlockerPatternsCard({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const { open } = useFactoryDrawer();
  const openPattern = (p: BlockerPattern) =>
    open(p.cause, <RuleBuilder pattern={p} rule={findRule(p.ruleId)} />);
  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-content">
            Why work gets stuck
          </h3>
          <Muted className="mt-0.5">
            Grouped by cause, not by item · last 7 days
          </Muted>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {BLOCKER_PATTERNS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => openPattern(p)}
          className="flex w-full cursor-pointer items-center gap-4 border-b border-border py-3 text-left text-sm last:border-b-0 hover:bg-surface-raised/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-content">
                {p.cause}
              </span>
              {p.blockedNow ? (
                <Badge tone="warn">{p.blockedNow} blocked</Badge>
              ) : null}
            </div>
            <Muted className="mt-0.5 truncate">
              {p.stage} · {p.last7d} times · {p.autoResolved} auto-resolved
            </Muted>
          </div>
          <div className="flex w-40 shrink-0 items-center justify-end gap-3">
            <Badge tone={COVERAGE_TONE[p.coverage]}>{p.coverage}</Badge>
            <span className="w-20 text-right text-xs text-link">
              {COVERAGE_ACTION[p.coverage]}
            </span>
          </div>
        </button>
      ))}
    </Card>
  );
}

/** Resolution rules with on/off switches, optionally scoped to a station. */
export function ResolutionRulesList({
  stationId,
  enabled,
  onToggle,
  onSelectStation,
}: {
  stationId?: string;
  enabled: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectStation?: (id: string) => void;
}) {
  const { open } = useFactoryDrawer();
  const rules = stationId
    ? RESOLUTION_RULES.filter((r) => r.stationId === stationId)
    : RESOLUTION_RULES;
  if (!rules.length) return <Muted>No rules guard this station yet.</Muted>;
  return (
    <>
      {rules.map((r) => (
        <Row key={r.id} onClick={() => open(r.name, <RuleBuilder rule={r} />)}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-content">
              {r.name}
              {!stationId ? (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStation?.(r.stationId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onSelectStation?.(r.stationId);
                    }
                  }}
                >
                  <Badge>{stationLabel(r.stationId)}</Badge>
                </span>
              ) : null}
            </div>
            <Muted className="mt-1 truncate">
              When {r.when.charAt(0).toLowerCase() + r.when.slice(1)} →{" "}
              {r.then.charAt(0).toLowerCase() + r.then.slice(1)}
            </Muted>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {!stationId ? (
              <Muted>
                {r.hits7d} hits · {r.successRate}
              </Muted>
            ) : null}
            <span
              role="switch"
              aria-checked={enabled[r.id]}
              aria-label={`${r.name} on or off`}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(r.id);
              }}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(r.id);
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
    </>
  );
}

export function NewRuleButton({ size }: { size?: "sm" | "md" }) {
  const { open } = useFactoryDrawer();
  return (
    <Button
      size={size}
      onClick={() => open("New resolution rule", <RuleBuilder />)}
    >
      New rule
    </Button>
  );
}

export function EscalationPolicyCard() {
  const { demo } = useFactoryDrawer();
  return (
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
  );
}

export function useRuleSwitches() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(RESOLUTION_RULES.map((r) => [r.id, r.enabled])),
  );
  const toggle = (id: string) => setEnabled((s) => ({ ...s, [id]: !s[id] }));
  return { enabled, toggle };
}

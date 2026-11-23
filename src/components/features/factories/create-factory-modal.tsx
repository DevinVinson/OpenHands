/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { Check, X } from "lucide-react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { useNavigation } from "#/context/navigation-context";
import { cn } from "#/utils/utils";
import { useFactoryStore } from "./factory-store";
import {
  DEFINITION_REPO_OPTIONS,
  INTEGRATION_OPTIONS,
  factoryPath,
  type Kpi,
} from "./factory-data";
import { Button } from "./factory-ui";

const STEPS = ["Outcome", "Definition repo", "Connect"] as const;
const WORK_REPOS = ["org/web-app", "org/api-service", "org/mobile"];
const NEW_REPO = "__new__";

const inputClass =
  "w-full rounded-md border border-border bg-canvas-base px-3 py-2 text-sm text-content";

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 mt-4 block text-xs font-semibold text-muted"
    >
      {children}
    </label>
  );
}

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-sm",
        checked
          ? "border-primary/60 bg-primary/5 text-content"
          : "border-border text-muted hover:text-content",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded border",
          checked
            ? "border-primary bg-primary text-on-accent"
            : "border-border",
        )}
      >
        {checked ? <Check className="size-3" /> : null}
      </span>
      {children}
    </button>
  );
}

export function CreateFactoryModal({ onClose }: { onClose: () => void }) {
  const createFactory = useFactoryStore((s) => s.createFactory);
  const { navigate } = useNavigation();
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [kpis, setKpis] = React.useState<{ label: string; target: string }[]>([
    { label: "", target: "" },
  ]);
  const [defRepo, setDefRepo] = React.useState(DEFINITION_REPO_OPTIONS[0]);
  const [newRepoName, setNewRepoName] = React.useState("org/factories");
  const [defPath, setDefPath] = React.useState("");
  const [integrations, setIntegrations] = React.useState<string[]>([
    "GitHub",
    "Slack",
  ]);
  const [repos, setRepos] = React.useState<string[]>([WORK_REPOS[0]]);
  const [withCoordinator, setWithCoordinator] = React.useState(true);
  const nameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "my-factory";
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const canContinue = step === 0 ? name.trim().length > 0 : true;

  const finish = () => {
    const factory = createFactory({
      name: name.trim(),
      description: description.trim(),
      goal: goal.trim(),
      owner: owner.trim(),
      kpis: kpis
        .filter((k) => k.label.trim())
        .map<Kpi>((k) => ({
          label: k.label.trim(),
          target: k.target.trim() || "—",
          value: "—",
          onTrack: true,
        })),
      repositories: repos,
      definitionsRepo: defRepo === NEW_REPO ? newRepoName : defRepo,
      definitionsPath: defPath.trim() || `${slug}/`,
      integrations,
      orchestratorId: withCoordinator ? "coordinator" : undefined,
    });
    onClose();
    navigate(factoryPath(factory.id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) {
      nameRef.current?.focus();
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  return (
    <ModalBackdrop onClose={onClose} aria-label="Create factory">
      <form
        onSubmit={submit}
        data-testid="create-factory-modal"
        className="max-h-[90vh] w-[min(560px,92vw)] overflow-auto rounded-xl border border-border bg-canvas-base p-6 shadow-2xl"
      >
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content">Create factory</h2>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-content"
          >
            <X className="size-4" />
          </button>
        </div>
        <ol className="mt-3 flex gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className={cn(
                  "h-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-border",
                )}
              />
              <div
                className={cn(
                  "mt-1.5 text-xs",
                  i === step ? "font-medium text-content" : "text-muted",
                )}
              >
                {i + 1}. {label}
              </div>
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <>
            <p className="mt-4 text-sm text-muted">
              Start from the outcome this factory exists to drive.
            </p>
            <Label htmlFor="factory-name">Factory name</Label>
            <input
              id="factory-name"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="CVE remediation"
              className={inputClass}
            />
            <Label htmlFor="factory-goal">Goal</Label>
            <textarea
              id="factory-goal"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Drive open critical CVEs in our services to zero within 14 days"
              className={cn(inputClass, "resize-y")}
            />
            <Label>
              KPIs <span className="font-normal">(optional)</span>
            </Label>
            <div className="flex flex-col gap-2">
              {kpis.map((k, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    aria-label={`KPI ${i + 1} name`}
                    value={k.label}
                    onChange={(e) =>
                      setKpis(
                        kpis.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Open critical CVEs"
                    className={inputClass}
                  />
                  <input
                    aria-label={`KPI ${i + 1} target`}
                    value={k.target}
                    onChange={(e) =>
                      setKpis(
                        kpis.map((x, j) =>
                          j === i ? { ...x, target: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Target, e.g. 0"
                    className={cn(inputClass, "w-40")}
                  />
                </div>
              ))}
              {kpis.length < 3 ? (
                <button
                  type="button"
                  onClick={() => setKpis([...kpis, { label: "", target: "" }])}
                  className="cursor-pointer self-start text-xs text-link hover:underline"
                >
                  + Add KPI
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="factory-owner">Owner / team</Label>
                <input
                  id="factory-owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Security team"
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="factory-description">Description</Label>
                <input
                  id="factory-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will this factory do?"
                  className={inputClass}
                />
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="mt-4 text-sm text-muted">
              Everything that makes up this factory (goal, agents, automations,
              blueprint) is stored as files in a repository. Changes made in
              Canvas open as pull requests.
            </p>
            <Label>Repository</Label>
            <div className="flex flex-col gap-2">
              {[...DEFINITION_REPO_OPTIONS, NEW_REPO].map((r) => (
                <CheckRow
                  key={r}
                  checked={defRepo === r}
                  onToggle={() => setDefRepo(r)}
                >
                  {r === NEW_REPO ? (
                    "Create a new repository"
                  ) : (
                    <span className="font-mono">{r}</span>
                  )}
                </CheckRow>
              ))}
            </div>
            {defRepo === NEW_REPO ? (
              <>
                <Label htmlFor="factory-new-repo">New repository name</Label>
                <input
                  id="factory-new-repo"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className={cn(inputClass, "font-mono")}
                />
              </>
            ) : null}
            <Label htmlFor="factory-def-path">Folder</Label>
            <input
              id="factory-def-path"
              value={defPath}
              onChange={(e) => setDefPath(e.target.value)}
              placeholder={`${slug}/`}
              className={cn(inputClass, "font-mono")}
            />
            <pre className="mt-3 rounded-lg bg-surface-deep p-3 font-mono text-xs leading-relaxed text-muted">
              {`${defRepo === NEW_REPO ? newRepoName : defRepo}/${defPath.trim() || `${slug}/`}
├── factory.yaml      # name, goal, KPIs, owner
├── blueprint.yaml
├── agents/
└── automations/`}
            </pre>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="mt-4 text-sm text-muted">
              Where work comes from and where it goes.
            </p>
            <Label>Integrations</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INTEGRATION_OPTIONS.map((i) => (
                <CheckRow
                  key={i}
                  checked={integrations.includes(i)}
                  onToggle={() => setIntegrations(toggle(integrations, i))}
                >
                  {i}
                </CheckRow>
              ))}
            </div>
            <Label>Repositories the factory works on</Label>
            <div className="flex flex-col gap-2">
              {WORK_REPOS.map((r) => (
                <CheckRow
                  key={r}
                  checked={repos.includes(r)}
                  onToggle={() => setRepos(toggle(repos, r))}
                >
                  <span className="font-mono">{r}</span>
                </CheckRow>
              ))}
            </div>
            <Label>Primary agent</Label>
            <CheckRow
              checked={withCoordinator}
              onToggle={() => setWithCoordinator(!withCoordinator)}
            >
              Add a Factory Coordinator to watch the work stream and route stuck
              work (optional)
            </CheckRow>
          </>
        ) : null}

        <div className="mt-6 flex items-center gap-2">
          {step > 0 ? (
            <Button onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <Button onClick={onClose}>Cancel</Button>
          )}
          <div className="flex-1" />
          <Button variant="primary" type="submit" disabled={!canContinue}>
            {step < STEPS.length - 1 ? "Continue" : "Create factory"}
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

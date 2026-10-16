# PRD: Startup feature policy

Status: Draft proposal

## Goal

Let an operator decide at startup which Agent Canvas features are available. An operator can set up a full-featured instance — workspaces, LLM profiles, agent profiles, extensions — then restart it with a policy that removes the ability to change that setup, while users keep everything they need to work in it.

Example: a small VM serving a few users behind the operator's own authorization. Users chat, edit, run, and debug against a prepared workspace with a prepared LLM and agent profile, but cannot add workspaces, switch backends or profiles, or install plugins.

## Current problem

Canvas has a few one-off startup switches (`lockToCloud`, auth-required, do-not-track), each injected separately by `scripts/static-server.mjs`. There is no general way to turn individual features off, so locking down an instance means forking or patching Canvas.

## Startup configuration

```sh
AGENT_CANVAS_FEATURES='{"version":1,"disabled":["backends.switch","workspaces.add","llmProfiles.switch","agentProfiles.switch","customize.plugins"]}'
# or
AGENT_CANVAS_FEATURES_FILE=/etc/agent-canvas/policy.json
```

| Setting | Default | Behavior |
| --- | --- | --- |
| `AGENT_CANVAS_FEATURES` | unset | Inline JSON policy document. |
| `AGENT_CANVAS_FEATURES_FILE` | unset | Path to a JSON file containing the same document. |

Policy document:

```json
{
  "version": 1,
  "disabled": ["workspaces.add", "llmProfiles.switch"]
}
```

Every feature is on unless its ID appears in `disabled`. With no configuration, Canvas behaves exactly as today. Configuration is read at application startup, including when serving a previously built web bundle; changing it requires a restart, never a rebuild.

## Requirements

- **FP-001 — Single policy source.** The launcher (static server used by the npm CLI and Docker entrypoint, and Electron startup) resolves the policy once and injects it into the page as `window.__AGENT_CANVAS_FEATURE_POLICY__`, following the existing runtime-injection pattern. Development builds accept `VITE_AGENT_CANVAS_FEATURES`. Embedded Canvas receives the resolved policy from its host. In the frontend, one module owns the policy and exposes it through a single hook; components never read the window global or environment directly.
- **FP-002 — Fail closed on invalid configuration.** Setting both variables, an unreadable file, invalid JSON, an unsupported `version`, or an unknown feature ID stops startup with a clear error naming the problem. An invalid policy must never silently fall back to full functionality.
- **FP-003 — Capability-named, stable IDs.** Feature IDs describe a user capability, not a UI component (`workspaces.add`, not `workspaceDropdown.addButton`), so they survive UI reorganization and can be enforced by a server. IDs are documented with their meaning and are never renamed; retired IDs remain accepted and are marked deprecated.
- **FP-004 — Initial feature catalog.**

  | ID | Disables |
  | --- | --- |
  | `backends.switch` | Selecting a different backend. |
  | `backends.manage` | Adding, editing, and removing backends. |
  | `workspaces.add` | Adding workspaces, including folder browsing. |
  | `workspaces.manage` | Removing workspaces. |
  | `llmProfiles.switch` | Changing the LLM profile from the chat input. |
  | `llmProfiles.manage` | LLM and meta-LLM settings pages. |
  | `agentProfiles.switch` | Choosing an agent profile when starting a conversation. |
  | `agentProfiles.manage` | Agent profile settings pages. |
  | `customize.skills` | Customize > Skills. |
  | `customize.plugins` | Customize > Plugins, and picking plugins for a new conversation. |
  | `customize.mcp` | Customize > MCP. |
  | `customize.apps` | Customize > Apps and extension pages. |

  Further IDs (secrets, automations, other settings pages) are added as needed under FP-003.
- **FP-005 — Presentation.** There is no single rule for how a disabled feature looks. Each feature chooses what fits it — removing a control, showing the current value read-only, or blocking a route. The only shared expectation is that a disabled feature offers no working way to perform its capability, and turning it off does not leave broken or empty UI behind.
- **FP-006 — Locked state is the prepared state.** Disabling a switch or manage capability preserves whatever is currently active; it does not reset, pick a new default, or migrate state. Workspaces, LLM profiles, and agent profiles are stored on the backend, so setup done before locking applies to every user. With `backends.switch` disabled, a browser with no saved backend uses the seeded default backend; a browser holding a different saved active backend is returned to the default.
- **FP-007 — Backend-neutral policy document.** The policy document is a standalone contract, not Canvas-internal state. An operator can pass the same JSON or file to a backend at startup, and a backend may disable its own routes for the same IDs. Canvas does not depend on backend enforcement and behaves the same against Local Agent Server, Cloud, or another backend. How each ID maps to backend routes is owned by that backend.
- **FP-008 — Not a security boundary.** Documentation states plainly that Canvas-side policy controls the product surface only. A user with the session key can call backend APIs directly, and the agent has shell access in its runtime. Operators who need enforcement must also apply the policy on the backend (FP-007) or at their own proxy.
- **FP-009 — Frontend gating API.** Code checks the policy through one API:

  ```ts
  const featurePolicy = useFeaturePolicy();

  if (!featurePolicy.isEnabled("backends.switch")) return <BackendRow backend={active} />;

  const items = OSS_NAV_ITEMS.filter((item) => !item.feature || featurePolicy.isEnabled(item.feature));
  ```

  - `useFeaturePolicy()` reads a React context whose default value is the injected policy, so standalone Canvas needs no provider. Embedded Canvas passes an optional `featurePolicy` prop to `AgentServerUIProviders`, and tests wrap components in `FeaturePolicyProvider`.
  - The returned object is used both in components and in loops and callbacks, so list-driven UI (settings navigation, Customize tiles) uses the same API as single checks. There is no second boolean hook.
  - Feature IDs appear as string literals at every call site, including `feature: "<id>"` fields on list items, never through a constant or variable, so searching for an ID finds every place it is gated. A `FeatureId` union type catches typos at compile time.
  - Each capability is gated once, where it is already decided (for example `canSwitchProfile` in `use-chat-input-llm-profile-state.ts`), and components keep consuming the existing boolean. Gates are not repeated on each button.
  - Known IDs live in `config/features.json` with a description of each, readable by the launcher (FP-002) and by backends (FP-007). Adding an ID means adding it there and to `FeatureId`.
  - Names use "feature policy", not "feature flag", to avoid confusion with Cloud's server-sent `WebClientFeatureFlags`.
  - The `frontend-development` skill guide documents how to gate a feature and add an ID.

## Scope and ownership

V1 covers policy loading, validation, injection, the feature catalog in FP-004, and Canvas-side hiding. Per-user or per-role policies, allow-list mode, named presets (for example `"locked"`), and runtime policy changes without restart are deferred.

Canvas owns the policy format, startup consumption, and UI behavior. Backend enforcement of the same IDs belongs to each backend — for the Agent Server, `software-agent-sdk`. A later extension may let a backend advertise its effective policy so Canvas hides the union of both; that requires a new backend contract and is out of scope for V1.

## Acceptance

1. With no configuration, Canvas behaves exactly as today.
2. Each FP-004 ID, disabled alone, removes the user's ability to perform that capability without affecting other features.
3. A combined policy matching the example VM scenario lets a user start conversations, chat, edit files, use the terminal, and debug in the prepared workspace with the prepared profiles, without any path to change them.
4. Each FP-002 failure stops startup with a specific error.
5. Changing the policy and restarting changes behavior without rebuilding, for the npm launcher, Docker image, Electron app, and embedded Canvas.
6. Locking an instance after setup preserves its workspaces, profiles, and active backend (FP-006). Verify across Local and Cloud backends, OpenHands and ACP agents, and standalone and embedded Canvas.

## References

- Feature ID list: `config/features.json` (new).
- Runtime injection: `scripts/static-server.mjs` (`makeConfigInjectionScript`), `docker/entrypoint.sh`.
- Existing startup lock precedent: `getLockedCloudHost()` in `src/api/agent-server-config.ts`.
- Gated entry points: `src/components/features/backends/backend-selector.tsx`, `src/components/features/home/workspace-dropdown/`, `src/hooks/use-chat-input-llm-profile-state.ts`, `src/components/features/chat/components/chat-input-actions.tsx`, `src/constants/settings-nav.tsx`, `src/routes.ts`.
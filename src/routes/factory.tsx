/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { useParams } from "react-router";
import {
  DEFAULT_FACTORY_SECTION,
  FACTORIES_PATH,
  isFactorySection,
  type FactorySection,
} from "#/components/features/factories/factory-data";
import {
  useFactory,
  useFactoryStore,
} from "#/components/features/factories/factory-store";
import {
  Button,
  FactoryDrawerProvider,
} from "#/components/features/factories/factory-ui";
import {
  type FactoryPageProps,
  OverviewPage,
} from "#/components/features/factories/pages/overview-pages";
import {
  AutomationsPage,
  AgentsPage,
} from "#/components/features/factories/pages/build-pages";
import {
  BenchmarksPage,
  QualityPage,
  RunsPage,
} from "#/components/features/factories/pages/observe-pages";
import {
  RunDetailPage,
  SettingsPage,
} from "#/components/features/factories/pages/detail-pages";
import { AgentProfilePage } from "#/components/features/factories/pages/agent-profile-page";
import {
  ConversationsPage,
  RefDetailPage,
  WorkStreamPage,
} from "#/components/features/factories/pages/stream-pages";
import { WorkflowsPage } from "#/components/features/factories/pages/workflows-page";
import { useNavigation } from "#/context/navigation-context";

const SECTION_PAGES: Record<
  FactorySection,
  (props: FactoryPageProps) => React.ReactElement
> = {
  overview: OverviewPage,
  stream: WorkStreamPage,
  conversations: ConversationsPage,
  workflows: WorkflowsPage,
  automations: AutomationsPage,
  agents: AgentsPage,
  runs: RunsPage,
  quality: QualityPage,
  benchmarks: BenchmarksPage,
  settings: SettingsPage,
};

/**
 * PROTOTYPE: `/factories/:factoryId/*`.
 * - ``            → overview
 * - `<section>`   → a top-level factory section
 * - `work/<id>`   → work item detail (drill-down from the queue)
 * - `runs/<id>`   → run detail (drill-down from runs)
 */
export default function FactoryRoute() {
  const { factoryId, "*": splat = "" } = useParams();
  const factory = useFactory(factoryId);
  const setExpanded = useFactoryStore((s) => s.setExpanded);
  const deleteFactory = useFactoryStore((s) => s.deleteFactory);
  const { navigate } = useNavigation();
  const [first, second] = splat.split("/").filter(Boolean);

  React.useEffect(() => {
    if (factory) setExpanded(factory.id);
  }, [factory?.id, setExpanded]);

  let content: React.ReactNode;
  if (!factory) {
    content = (
      <div className="py-20 text-center">
        <h1 className="text-sm font-medium text-content">Factory not found</h1>
        <div className="mt-4">
          <Button onClick={() => navigate(FACTORIES_PATH)}>
            Back to factories
          </Button>
        </div>
      </div>
    );
  } else if (first === "stream" && second) {
    content = <RefDetailPage factory={factory} refId={second} />;
  } else if (first === "agents" && second) {
    content = <AgentProfilePage factory={factory} agentId={second} />;
  } else if (first === "runs" && second) {
    content = <RunDetailPage factory={factory} runId={second} />;
  } else {
    const section = isFactorySection(first) ? first : DEFAULT_FACTORY_SECTION;
    const Page = SECTION_PAGES[section];
    content =
      section === "settings" ? (
        <SettingsPage
          factory={factory}
          onDelete={() => {
            deleteFactory(factory.id);
            navigate(FACTORIES_PATH);
          }}
        />
      ) : (
        <Page factory={factory} />
      );
  }

  return (
    <FactoryDrawerProvider>
      <div
        data-testid="factory-page"
        className="h-full overflow-auto bg-canvas-base"
      >
        <div className="mx-auto max-w-370 px-6 py-9 md:px-10">{content}</div>
      </div>
    </FactoryDrawerProvider>
  );
}

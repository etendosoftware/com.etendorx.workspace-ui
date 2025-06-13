"use client";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import Tabs from "@/components/window/Tabs";
import { SelectedProvider } from "@/contexts/selected";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useSelected } from "@/hooks/useSelected";
import { useWindowTabMetadata } from "@/hooks/useWindowTabMetadata";

function TabsContainer() {
  const { groupedTabs } = useMetadataContext();
  const { activeLevels } = useSelected();

  useWindowTabMetadata();

  const firstExpandedIndex = groupedTabs.findIndex((tabs) => activeLevels.includes(tabs[0].tabLevel));

  return (
    <div className="flex flex-col w-full h-full max-h-full">
      {groupedTabs.map((tabs, index) => {
        const isTopGroup = index === firstExpandedIndex && firstExpandedIndex !== -1;

        return <Tabs key={tabs[0].id} tabs={tabs} isTopGroup={isTopGroup} />;
      })}
    </div>
  );
}

export default function WindowPage() {
  const { loading, window, error } = useMetadataContext();

  if (loading) {
    return <Loading />;
  }

  if (error || !window) {
    return <ErrorDisplay title={error?.message ?? "Something went wrong"} />;
  }

  return (
    <SelectedProvider tabs={window.tabs}>
      <TabsContainer />
    </SelectedProvider>
  );
}

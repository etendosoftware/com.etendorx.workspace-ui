import { useState, useEffect } from "react";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import type { GraphEventListener } from "@/data/graph";
import { useSelected } from "@/hooks/useSelected";

export const useSelectedRecords = (tab?: Tab) => {
  const { graph } = useSelected();
  const [selected, setSelected] = useState(() => {
    const selected = graph.getSelectedMultiple(tab);

    return selected || [];
  });

  useEffect(() => {
    if (!tab) return;

    const handleSelectMultiple: GraphEventListener<"selectedMultiple"> = (eventTab, records) => {
      if (tab.id === eventTab.id) {
        setSelected(records);
      }
    };

    const handleUnselectMultiple: GraphEventListener<"unselectedMultiple"> = (eventTab) => {
      if (tab.id === eventTab.id) {
        setSelected([]);
      }
    };

    graph //
      .addListener("selectedMultiple", handleSelectMultiple)
      .addListener("unselectedMultiple", handleUnselectMultiple);

    return () => {
      graph //
        .removeListener("selectedMultiple", handleSelectMultiple)
        .removeListener("unselectedMultiple", handleUnselectMultiple);
    };
  }, [graph, tab]);

  return selected;
};

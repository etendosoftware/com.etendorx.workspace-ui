import { useState, useEffect } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { GraphEventListener } from "@/data/graph";
import { useSelected } from "./useSelected";

export const useSelectedRecord = (tab?: Tab) => {
  const { graph } = useSelected();
  const [selected, setSelected] = useState(graph.getSelected(tab));

  useEffect(() => {
    if (!tab) return;

    const handleSelect: GraphEventListener<"selected"> = (eventTab, record) => {
      if (tab.id === eventTab.id) {
        setSelected(record);
      }
    };

    const handleUnselect: GraphEventListener<"unselected"> = (eventTab) => {
      if (tab.id === eventTab.id) {
        setSelected(undefined);
      }
    };

    graph //
      .addListener("selected", handleSelect)
      .addListener("unselected", handleUnselect);

    return () => {
      graph //
        .removeListener("selected", handleSelect)
        .removeListener("unselected", handleUnselect);
    };
  }, [graph, tab]);

  return selected;
};

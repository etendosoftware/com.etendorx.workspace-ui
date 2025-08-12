/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useState, useEffect } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
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

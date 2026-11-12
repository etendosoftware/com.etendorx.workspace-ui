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

import { useEffect, useMemo, useState } from "react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import type { Graph, GraphEventListener } from "@/data/graph";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";
import { sameRecord } from "@/utils/sameRecords";
import { type AncestorSnapshot, toAncestorSnapshot } from "@/utils/tabDisplayLogic/ancestorContext";
import { useSelected } from "./useSelected";

type SelectedRecords = (EntityData | undefined)[];

/** The tab and every tab above it, from the tab up to the root. */
const getTabChain = (graph: Graph<Tab>, tab: Tab | null | undefined): Tab[] => {
  const chain: Tab[] = [];
  for (let current = tab ?? undefined; current; current = graph.getParent(current)) {
    chain.push(current);
  }
  return chain;
};

const readSelectedRecords = (graph: Graph<Tab>, chain: Tab[]): SelectedRecords =>
  chain.map((tab) => graph.getSelected(tab));

const haveSameRecords = (a: SelectedRecords, b: SelectedRecords): boolean =>
  a.length === b.length && a.every((record, index) => sameRecord(record, b[index]));

/**
 * Snapshots of a tab and all its ancestors, from the tab up to the root: selected record, unsaved
 * form values and the context the server computed for that record. Classic evaluates child tab
 * display logic with all of them (`getContextInfo` merges every parent view's context).
 *
 * @param tab - Direct parent of the tabs whose display logic is evaluated.
 */
export function useAncestorTabSnapshots(tab: Tab | null | undefined): AncestorSnapshot[] {
  const { graph } = useSelected();
  const windowIdentifier = useCurrentWindowIdentifier() ?? "";
  const chain = useMemo(() => getTabChain(graph, tab), [graph, tab]);
  const [records, setRecords] = useState(() => readSelectedRecords(graph, chain));

  useEffect(() => {
    const refresh = () =>
      setRecords((previous) => {
        const next = readSelectedRecords(graph, chain);
        return haveSameRecords(previous, next) ? previous : next;
      });
    const onSelectionChange: GraphEventListener<"selected"> & GraphEventListener<"unselected"> = (eventTab) => {
      if (chain.some((chainTab) => chainTab.id === eventTab.id)) {
        refresh();
      }
    };

    refresh();
    graph.addListener("selected", onSelectionChange).addListener("unselected", onSelectionChange);
    return () => {
      graph.removeListener("selected", onSelectionChange).removeListener("unselected", onSelectionChange);
    };
  }, [graph, chain]);

  const liveEntries = useLiveTabValuesStore((state) => state.entries[windowIdentifier]);
  const selectionEntries = useLiveTabValuesStore((state) => state.selectionEntries[windowIdentifier]);

  return useMemo(
    () =>
      chain.map((chainTab, index) =>
        toAncestorSnapshot(chainTab, records[index], liveEntries?.[chainTab.id], selectionEntries?.[chainTab.id])
      ),
    [chain, records, liveEntries, selectionEntries]
  );
}

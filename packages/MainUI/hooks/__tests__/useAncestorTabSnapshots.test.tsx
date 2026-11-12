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

import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useAncestorTabSnapshots } from "../useAncestorTabSnapshots";
import { SelectContext } from "@/contexts/selected";
import Graph from "@/data/graph";
import { useLiveTabValuesStore } from "@/stores/liveTabValuesStore";

const WINDOW_IDENTIFIER = "win-143";

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "win-143",
}));

const createTab = (id: string, tabLevel: number, parentTabId?: string): Tab =>
  ({ id, name: id, window: "143", tabLevel, parentTabId, fields: {}, parentColumns: [] }) as unknown as Tab;

const headerTab = createTab("header", 0);
const linesTab = createTab("lines", 1, "header");
const relatedTab = createTab("related", 2, "lines");

const ORDER: EntityData = { id: "O1", documentNo: "50013" };
const SERVICE_LINE: EntityData = { id: "L1", lineNo: 10 };
const ITEM_LINE: EntityData = { id: "L2", lineNo: 20 };

let graph: Graph<Tab>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <SelectContext.Provider value={{ graph }}>{children}</SelectContext.Provider>
);

const renderSnapshots = (tab: Tab | null) => renderHook(() => useAncestorTabSnapshots(tab), { wrapper });

const store = () => useLiveTabValuesStore.getState();

describe("useAncestorTabSnapshots", () => {
  beforeEach(() => {
    useLiveTabValuesStore.setState({ entries: {}, selectionEntries: {} });
    graph = new Graph([headerTab, linesTab, relatedTab]);
    graph.setSelected(headerTab, ORDER);
    graph.setSelected(linesTab, SERVICE_LINE);
  });

  it("returns no snapshots without a tab", () => {
    const { result } = renderSnapshots(null);

    expect(result.current).toEqual([]);
  });

  it("returns the tab and every ancestor with their selected records, closest first", () => {
    const { result } = renderSnapshots(linesTab);

    expect(result.current.map(({ tab, values }) => [tab.id, values])).toEqual([
      ["lines", SERVICE_LINE],
      ["header", ORDER],
    ]);
  });

  it("follows a new selection in any tab of the chain", () => {
    const { result } = renderSnapshots(linesTab);

    act(() => graph.setSelected(linesTab, ITEM_LINE));

    expect(result.current[0].values).toBe(ITEM_LINE);
  });

  it("drops the record of a tab that gets unselected", () => {
    const { result } = renderSnapshots(linesTab);

    act(() => graph.clearSelected(linesTab));

    expect(result.current[0].values).toBeUndefined();
  });

  it("ignores selection changes of tabs outside the chain", () => {
    const { result } = renderSnapshots(linesTab);
    const before = result.current;

    act(() => graph.setSelected(relatedTab, { id: "X1" }));

    expect(result.current).toBe(before);
  });

  it("includes the live values and the context published for the selected records", () => {
    const { result } = renderSnapshots(linesTab);

    act(() => {
      store().publishTabValues(WINDOW_IDENTIFIER, headerTab.id, { recordId: "O1", values: { documentNo: "50014" } });
      store().publishSelectionContext(WINDOW_IDENTIFIER, linesTab.id, { recordId: "L1", values: { PRODUCTTYPE: "S" } });
    });

    expect(result.current[0].auxiliaryInputs).toEqual({ PRODUCTTYPE: "S" });
    expect(result.current[1].values).toEqual({ id: "O1", documentNo: "50014" });
  });
});

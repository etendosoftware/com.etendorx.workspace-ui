/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */
import { renderHook } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useItemActions } from "../useItemType";

const buildItem = (overrides: Partial<Menu>): Menu => ({ id: "MENU_ID", name: "Menu Name", ...overrides });

const renderItemActions = () => {
  const callbacks = { onWindowClick: jest.fn(), onReportClick: jest.fn(), onProcessClick: jest.fn() };
  const { result } = renderHook(() => useItemActions(callbacks));
  return { handleItemClick: result.current, ...callbacks };
};

describe("useItemActions", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("routes External entries with a URL through the window click callback", () => {
    const { handleItemClick, onWindowClick, onReportClick, onProcessClick } = renderItemActions();
    const item = buildItem({ type: "External", url: "example.com" });

    handleItemClick(item);

    expect(onWindowClick).toHaveBeenCalledWith(item);
    expect(onReportClick).not.toHaveBeenCalled();
    expect(onProcessClick).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("ignores External entries without a URL", () => {
    const { handleItemClick, onWindowClick } = renderItemActions();

    handleItemClick(buildItem({ type: "External", url: null }));

    expect(onWindowClick).not.toHaveBeenCalled();
  });

  it.each([
    ["Window", { windowId: "143" }, "onWindowClick"],
    ["View", {}, "onWindowClick"],
    ["Report", {}, "onReportClick"],
    ["Process", {}, "onProcessClick"],
    ["ProcessManual", {}, "onProcessClick"],
    ["ProcessDefinition", {}, "onProcessClick"],
    ["Form", {}, "onProcessClick"],
  ] as const)("keeps routing %s entries as before", (type, overrides, expectedCallback) => {
    const actions = renderItemActions();
    const item = buildItem({ type, ...overrides });

    actions.handleItemClick(item);

    expect(actions[expectedCallback]).toHaveBeenCalledWith(item);
  });

  it("still rejects unknown entry types", () => {
    const { handleItemClick, onWindowClick, onReportClick, onProcessClick } = renderItemActions();

    handleItemClick(buildItem({ type: "Summary" }));

    expect(onWindowClick).not.toHaveBeenCalled();
    expect(onReportClick).not.toHaveBeenCalled();
    expect(onProcessClick).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});

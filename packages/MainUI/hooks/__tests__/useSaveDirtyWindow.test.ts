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

import { renderHook } from "@testing-library/react";
import { useSaveDirtyWindow } from "../useSaveDirtyWindow";
import { useWindowStore } from "@/stores/windowStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";
import type { SaveOptions } from "@/contexts/ToolbarContext";

const WINDOW_IDENTIFIER = "143_1000";
const HEADER_TAB = "header";
const LINES_TAB = "lines";
const SILENT_SAVE: SaveOptions = { showModal: false };

const formKey = (tabId: string) => buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, tabId);
const tableKey = (tabId: string) => buildDirtySourceKey(DIRTY_SOURCE_KINDS.TABLE, tabId);

describe("useSaveDirtyWindow", () => {
  /** Seeds the window with two tabs, the root one first in the hierarchy. */
  const seedWindow = (dirtySources: Record<string, boolean>) => {
    useWindowStore.setState({
      dirtyWindows: { [WINDOW_IDENTIFIER]: dirtySources },
      windows: {
        [WINDOW_IDENTIFIER]: {
          windowId: "143",
          windowIdentifier: WINDOW_IDENTIFIER,
          title: "Sales Order",
          isActive: true,
          initialized: true,
          navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: true },
          tabs: {
            [HEADER_TAB]: { level: 0 },
            [LINES_TAB]: { level: 1 },
            // biome-ignore lint/suspicious/noExplicitAny: partial tab state is enough here
          } as any,
        },
        // biome-ignore lint/suspicious/noExplicitAny: partial window state is enough here
      } as any,
    });
  };

  /** Registers a `wrappedSave` per tab and records the order they are called in. */
  const seedToolbar = (results: Record<string, boolean>) => {
    const callOrder: string[] = [];
    const byTabId = Object.fromEntries(
      Object.entries(results).map(([tabId, succeeds]) => [
        tabId,
        {
          wrappedSave: jest.fn(async () => {
            callOrder.push(tabId);
            return succeeds;
          }),
        },
      ])
    );
    // biome-ignore lint/suspicious/noExplicitAny: only wrappedSave is read by the hook
    useToolbarStore.setState({ byTabId: byTabId as any });
    return { callOrder, byTabId };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({ dirtyWindows: {}, windows: {} });
    useToolbarStore.setState({ byTabId: {} });
  });

  it("saves every dirty form from the root tab down to the child", async () => {
    seedWindow({ [formKey(LINES_TAB)]: true, [formKey(HEADER_TAB)]: true });
    const { callOrder, byTabId } = seedToolbar({ [HEADER_TAB]: true, [LINES_TAB]: true });
    const { result } = renderHook(() => useSaveDirtyWindow());

    await expect(result.current.saveWindow(WINDOW_IDENTIFIER)).resolves.toBe(true);

    expect(callOrder).toEqual([HEADER_TAB, LINES_TAB]);
    expect(byTabId[HEADER_TAB].wrappedSave).toHaveBeenCalledWith(SILENT_SAVE);
  });

  it("stops at the first save that fails", async () => {
    seedWindow({ [formKey(HEADER_TAB)]: true, [formKey(LINES_TAB)]: true });
    const { callOrder } = seedToolbar({ [HEADER_TAB]: false, [LINES_TAB]: true });
    const { result } = renderHook(() => useSaveDirtyWindow());

    await expect(result.current.saveWindow(WINDOW_IDENTIFIER)).resolves.toBe(false);

    expect(callOrder).toEqual([HEADER_TAB]);
  });

  it("ignores inline grid sources, whose save is not exposed", async () => {
    seedWindow({ [tableKey(LINES_TAB)]: true });
    const { callOrder } = seedToolbar({ [LINES_TAB]: true });
    const { result } = renderHook(() => useSaveDirtyWindow());

    await expect(result.current.saveWindow(WINDOW_IDENTIFIER)).resolves.toBe(true);

    expect(callOrder).toEqual([]);
  });

  it("skips tabs that no longer have a registered save", async () => {
    seedWindow({ [formKey(HEADER_TAB)]: true, [formKey(LINES_TAB)]: true });
    const { callOrder } = seedToolbar({ [LINES_TAB]: true });
    const { result } = renderHook(() => useSaveDirtyWindow());

    await expect(result.current.saveWindow(WINDOW_IDENTIFIER)).resolves.toBe(true);

    expect(callOrder).toEqual([LINES_TAB]);
  });

  it("succeeds trivially for a window with nothing dirty", async () => {
    seedWindow({});
    seedToolbar({ [HEADER_TAB]: true });
    const { result } = renderHook(() => useSaveDirtyWindow());

    await expect(result.current.saveWindow(WINDOW_IDENTIFIER)).resolves.toBe(true);
  });
});

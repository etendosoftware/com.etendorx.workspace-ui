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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

jest.mock("@/contexts/tab");

import { act, renderHook } from "@testing-library/react";
import { useTabContext } from "@/contexts/tab";
import { useToolbarStore } from "@/stores/toolbarStore";
import { TOOLBAR_ACTION_OWNERS } from "@/utils/toolbar/actionOwnership";
import { useToolbarCommands } from "../ToolbarContext";

const TAB_ID = "commands-test-tab";

describe("useToolbarCommands", () => {
  beforeEach(() => {
    (useTabContext as jest.Mock).mockReturnValue({ tab: { id: TAB_ID, tabLevel: 0 } });
    act(() => useToolbarStore.getState().initTab(TAB_ID));
  });

  afterEach(() => {
    act(() => useToolbarStore.getState().destroyTab(TAB_ID));
  });

  it("does not re-render and keeps the same commands when toolbar state changes", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useToolbarCommands();
    });
    const first = result.current;
    const rendersBefore = renders;

    act(() => {
      useToolbarStore.getState().setSaveButtonState(TAB_ID, (prev) => ({ ...prev, isSaving: true }));
      useToolbarStore.getState().registerRawActions(TAB_ID, { new: jest.fn() }, TOOLBAR_ACTION_OWNERS.FORM);
      useToolbarStore.getState().setIsImplicitFilterApplied(TAB_ID, true);
    });

    expect(renders).toBe(rendersBefore);
    expect(result.current).toBe(first);
  });

  it("runs the implementation registered when the command is called", () => {
    const { result } = renderHook(() => useToolbarCommands());
    const gridNew = jest.fn();
    const formNew = jest.fn();

    act(() => useToolbarStore.getState().registerRawActions(TAB_ID, { new: gridNew }, TOOLBAR_ACTION_OWNERS.GRID));
    result.current.onNew();
    expect(gridNew).toHaveBeenCalledTimes(1);

    // A higher-priority owner registered later wins, without re-reading the hook
    act(() => useToolbarStore.getState().registerRawActions(TAB_ID, { new: formNew }, TOOLBAR_ACTION_OWNERS.FORM));
    result.current.onNew();
    expect(formNew).toHaveBeenCalledTimes(1);
    expect(gridNew).toHaveBeenCalledTimes(1);

    const restore = jest.fn();
    act(() =>
      useToolbarStore.getState().registerRawActions(TAB_ID, { restoreSelection: restore }, TOOLBAR_ACTION_OWNERS.GRID)
    );
    result.current.onRestoreSelection("rec-1");
    expect(restore).toHaveBeenCalledWith("rec-1");

    const saveAndClose = jest.fn().mockResolvedValue(undefined);
    act(() => useToolbarStore.getState().registerRawActions(TAB_ID, { saveAndClose }, TOOLBAR_ACTION_OWNERS.FORM));
    result.current.onSaveAndClose();
    expect(saveAndClose).toHaveBeenCalledTimes(1);
  });

  it("saves through the wrapped save registered for the tab", async () => {
    const { result } = renderHook(() => useToolbarCommands());
    expect(await result.current.onSave({ showModal: false })).toBe(false);

    const wrappedSave = jest.fn().mockResolvedValue(true);
    act(() => useToolbarStore.getState().setWrappedSave(TAB_ID, wrappedSave));
    expect(await result.current.onSave({ showModal: false })).toBe(true);
    expect(wrappedSave).toHaveBeenCalledWith({ showModal: false });
  });

  it("writes registrations and flags to the tab's store slot", () => {
    const { result } = renderHook(() => useToolbarCommands());
    const refresh = jest.fn();

    act(() => {
      result.current.registerActions({ refresh }, TOOLBAR_ACTION_OWNERS.TAB);
      result.current.setIsAdvancedFilterApplied(true);
      result.current.setShouldOpenAttachmentModal(true);
    });

    const slot = useToolbarStore.getState().byTabId[TAB_ID];
    expect(slot?.actionsByOwner[TOOLBAR_ACTION_OWNERS.TAB].refresh).toBe(refresh);
    expect(slot?.isAdvancedFilterApplied).toBe(true);
    expect(slot?.shouldOpenAttachmentModal).toBe(true);

    act(() => result.current.unregisterActions(TOOLBAR_ACTION_OWNERS.TAB));
    expect(useToolbarStore.getState().byTabId[TAB_ID]?.actionsByOwner[TOOLBAR_ACTION_OWNERS.TAB].refresh).toBe(
      undefined
    );
  });
});

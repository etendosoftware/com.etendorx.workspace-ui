/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import { useTabSwitchGuard } from "../useTabSwitchGuard";
import { useWindowStore } from "@/stores/windowStore";
import { useToolbarStore } from "@/stores/toolbarStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const WINDOW_IDENTIFIER = "143_1";
const HEADER = "header";
const LINES = "lines";

let mockPolicy = { autosave: true, confirm: false };
const mockSaveWindow = jest.fn();

jest.mock("@/utils/autosave", () => ({ getAutosavePolicy: () => mockPolicy }));
jest.mock("@/hooks/useSaveDirtyWindow", () => ({ useSaveDirtyWindow: () => ({ saveWindow: mockSaveWindow }) }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const setDirty = (tabIds: string[]) => {
  const flags = Object.fromEntries(tabIds.map((id) => [buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, id), true]));
  act(() => {
    useWindowStore.setState({ dirtyWindows: tabIds.length ? { [WINDOW_IDENTIFIER]: flags } : {} });
  });
};

const renderGuard = () => {
  const move = jest.fn();
  const hook = renderHook(() => useTabSwitchGuard(WINDOW_IDENTIFIER, "143"));
  // The prompt is an element the tab strip renders: put it on screen to click its buttons
  const prompt = () => render(<ThemeProvider theme={theme}>{hook.result.current.prompt}</ThemeProvider>);
  return { hook, move, prompt };
};

describe("useTabSwitchGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPolicy = { autosave: true, confirm: false };
    mockSaveWindow.mockResolvedValue(true);
    useWindowStore.setState({ dirtyWindows: {} });
  });

  it("moves straight away when no other tab has unsaved changes", () => {
    const { hook, move } = renderGuard();

    act(() => hook.result.current.guardTabSwitch(LINES, move));

    expect(move).toHaveBeenCalledTimes(1);
    expect(mockSaveWindow).not.toHaveBeenCalled();
  });

  it("does not count the tab it moves to as one being left", () => {
    setDirty([LINES]);
    const { hook, move } = renderGuard();

    act(() => hook.result.current.guardTabSwitch(LINES, move));

    expect(move).toHaveBeenCalledTimes(1);
    expect(mockSaveWindow).not.toHaveBeenCalled();
  });

  it("saves the window and then moves when Autosave is on", async () => {
    setDirty([HEADER]);
    const { hook, move } = renderGuard();

    await act(async () => hook.result.current.guardTabSwitch(LINES, move));

    expect(mockSaveWindow).toHaveBeenCalledWith(WINDOW_IDENTIFIER);
    expect(move).toHaveBeenCalledTimes(1);
  });

  it("stays on the tab when the automatic save fails", async () => {
    mockSaveWindow.mockResolvedValue(false);
    setDirty([HEADER]);
    const { hook, move } = renderGuard();

    await act(async () => hook.result.current.guardTabSwitch(LINES, move));

    expect(mockSaveWindow).toHaveBeenCalledTimes(1);
    expect(move).not.toHaveBeenCalled();
  });

  it("asks first with Show Confirmation Default on; accepting saves and moves", async () => {
    mockPolicy = { autosave: true, confirm: true };
    setDirty([HEADER]);
    const { hook, move, prompt } = renderGuard();
    act(() => hook.result.current.guardTabSwitch(LINES, move));
    prompt();

    expect(move).not.toHaveBeenCalled();
    expect(screen.queryByTestId("SaveDiscardCancelModal__discard")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__save"));

    await waitFor(() => expect(move).toHaveBeenCalledTimes(1));
    expect(mockSaveWindow).toHaveBeenCalledTimes(1);
  });

  it("does not save or move when Autosave is off and the user cancels", () => {
    mockPolicy = { autosave: false, confirm: false };
    setDirty([HEADER]);
    const { hook, move, prompt } = renderGuard();
    act(() => hook.result.current.guardTabSwitch(LINES, move));
    prompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__cancel"));

    expect(mockSaveWindow).not.toHaveBeenCalled();
    expect(move).not.toHaveBeenCalled();
  });

  it("discards the tab it leaves and then moves when Autosave is off", () => {
    mockPolicy = { autosave: false, confirm: false };
    const discard = jest.fn();
    useToolbarStore.setState({
      byTabId: { [HEADER]: { actionsByOwner: { form: { discard } } } } as never,
    });
    setDirty([HEADER]);
    const { hook, move, prompt } = renderGuard();
    act(() => hook.result.current.guardTabSwitch(LINES, move));
    prompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__discard"));

    expect(discard).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledTimes(1);
  });
});

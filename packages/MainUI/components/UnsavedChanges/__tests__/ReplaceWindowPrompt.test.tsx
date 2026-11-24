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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import UnsavedChangesWindowsModal from "../UnsavedChangesWindowsModal";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const mockSaveWindow = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

jest.mock("@/hooks/useSaveDirtyWindow", () => ({
  useSaveDirtyWindow: () => ({ saveWindow: mockSaveWindow }),
}));

jest.mock("@/stores/metadataStore", () => ({
  useMetadataZustandStore: (selector: (state: unknown) => unknown) => selector({ windowsData: {} }),
}));

const ORDER_WINDOW = "143_1000";
const PARTNER_WINDOW = "180_2000";
const FORM_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, "header");

const createWindow = (windowIdentifier: string, title: string) => ({
  windowId: windowIdentifier.split("_")[0],
  windowIdentifier,
  title,
  isActive: false,
  initialized: true,
  navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: true },
  tabs: {},
});

describe("ReplaceWindowPrompt", () => {
  const onProceed = jest.fn();
  const onCancel = jest.fn();

  const renderPrompt = () =>
    render(
      <ThemeProvider theme={theme}>
        <UnsavedChangesWindowsModal />
      </ThemeProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({
      dirtyWindows: { [ORDER_WINDOW]: { [FORM_KEY]: true }, [PARTNER_WINDOW]: { [FORM_KEY]: true } },
      windows: {
        [ORDER_WINDOW]: createWindow(ORDER_WINDOW, "Sales Order"),
        [PARTNER_WINDOW]: createWindow(PARTNER_WINDOW, "Business Partner"),
        // biome-ignore lint/suspicious/noExplicitAny: partial window state is enough here
      } as any,
    });
    useUnsavedChangesStore.setState({ request: { onProceed, onCancel, windowIdentifier: ORDER_WINDOW } });
  });

  it("asks about the replaced window alone, not the exit menu of every window", () => {
    renderPrompt();

    expect(screen.getByText("unsavedChanges.transitionMessage")).toBeInTheDocument();
    expect(screen.queryByTestId("UnsavedChangesWindowsModal__discardAll")).not.toBeInTheDocument();
  });

  it("discarding runs the action without closing any window", () => {
    renderPrompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__discard"));

    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(Object.keys(useWindowStore.getState().windows)).toEqual([ORDER_WINDOW, PARTNER_WINDOW]);
    expect(useWindowStore.getState().dirtyWindows[PARTNER_WINDOW]).toEqual({ [FORM_KEY]: true });
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("saving the window runs the action once the save succeeds", async () => {
    mockSaveWindow.mockResolvedValue(true);
    renderPrompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__save"));

    await waitFor(() => expect(onProceed).toHaveBeenCalledTimes(1));
    expect(mockSaveWindow).toHaveBeenCalledWith(ORDER_WINDOW);
  });

  it("a failed save keeps the prompt open and tells the user", async () => {
    mockSaveWindow.mockResolvedValue(false);
    renderPrompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__save"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("unsavedChanges.saveFailed Sales Order"));
    expect(onProceed).not.toHaveBeenCalled();
    expect(useUnsavedChangesStore.getState().request).not.toBeNull();
  });

  it("cancelling keeps the window and its changes", () => {
    renderPrompt();

    fireEvent.click(screen.getByTestId("SaveDiscardCancelModal__cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onProceed).not.toHaveBeenCalled();
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });
});

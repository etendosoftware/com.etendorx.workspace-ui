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

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
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
const ORDER_TITLE = "Sales Order";
const PARTNER_TITLE = "Business Partner";
const HEADER_TAB = "header";
const LINES_TAB = "lines";

const formKey = (tabId: string) => buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, tabId);
const tableKey = (tabId: string) => buildDirtySourceKey(DIRTY_SOURCE_KINDS.TABLE, tabId);

const createWindow = (windowIdentifier: string, title: string) => ({
  windowId: windowIdentifier.split("_")[0],
  windowIdentifier,
  title,
  isActive: false,
  initialized: true,
  navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: true },
  tabs: { [HEADER_TAB]: { level: 0 }, [LINES_TAB]: { level: 1 } },
});

describe("UnsavedChangesWindowsModal", () => {
  const onProceed = jest.fn();
  const onCancel = jest.fn();

  const seedStore = (dirtyWindows: Record<string, Record<string, boolean>>) => {
    useWindowStore.setState({
      dirtyWindows,
      windows: {
        [ORDER_WINDOW]: createWindow(ORDER_WINDOW, ORDER_TITLE),
        [PARTNER_WINDOW]: createWindow(PARTNER_WINDOW, PARTNER_TITLE),
        // biome-ignore lint/suspicious/noExplicitAny: partial window state is enough here
      } as any,
    });
  };

  /** Drops a window's dirty flags, the way a successful save or a discard does. */
  const resolveWindow = (windowIdentifier: string) => {
    act(() => {
      const { dirtyWindows } = useWindowStore.getState();
      const next = { ...dirtyWindows };
      delete next[windowIdentifier];
      useWindowStore.setState({ dirtyWindows: next });
    });
  };

  const openRequest = () => {
    act(() => {
      useUnsavedChangesStore.getState().openRequest({ onProceed, onCancel });
    });
  };

  const renderModal = () =>
    render(
      <ThemeProvider theme={theme}>
        <UnsavedChangesWindowsModal />
      </ThemeProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveWindow.mockResolvedValue(true);
    useUnsavedChangesStore.setState({ request: null, bypassUnloadWarning: false });
    useWindowStore.setState({ cleanupWindow: jest.fn(), setWindowActive: jest.fn() });
    seedStore({ [ORDER_WINDOW]: { [formKey(HEADER_TAB)]: true } });
  });

  it("renders nothing while no exit is pending", () => {
    renderModal();

    expect(screen.queryByTestId("UnsavedChangesWindowsModal__modal")).not.toBeInTheDocument();
  });

  it("lists one row per dirty window", () => {
    seedStore({
      [ORDER_WINDOW]: { [formKey(HEADER_TAB)]: true },
      [PARTNER_WINDOW]: { [formKey(HEADER_TAB)]: true },
    });
    renderModal();
    openRequest();

    expect(screen.getByTestId(`UnsavedChangesWindowsModal__row-${ORDER_WINDOW}`)).toHaveTextContent(ORDER_TITLE);
    expect(screen.getByTestId(`UnsavedChangesWindowsModal__row-${PARTNER_WINDOW}`)).toHaveTextContent(PARTNER_TITLE);
  });

  it("offers Save only for windows with a form", () => {
    seedStore({
      [ORDER_WINDOW]: { [formKey(HEADER_TAB)]: true },
      [PARTNER_WINDOW]: { [tableKey(LINES_TAB)]: true },
    });
    renderModal();
    openRequest();

    expect(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`UnsavedChangesWindowsModal__save-${PARTNER_WINDOW}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`UnsavedChangesWindowsModal__discard-${PARTNER_WINDOW}`)).toBeInTheDocument();
  });

  it("saves the window when Save is pressed", async () => {
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`));

    await waitFor(() => expect(mockSaveWindow).toHaveBeenCalledWith(ORDER_WINDOW));
    expect(mockToastError).not.toHaveBeenCalled();
    expect(screen.queryByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).not.toBeInTheDocument();
  });

  // A window that is off screen cannot show its own error, so the row has to say it.
  it("reports a failed save on the row itself and keeps the exit blocked", async () => {
    mockSaveWindow.mockResolvedValue(false);
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`));

    await waitFor(() =>
      expect(screen.getByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).toBeInTheDocument()
    );
    expect(mockToastError).not.toHaveBeenCalled();
    expect(onProceed).not.toHaveBeenCalled();
  });

  it("takes the user to the window that failed and cancels the exit", async () => {
    const setWindowActive = jest.fn();
    useWindowStore.setState({ setWindowActive });
    mockSaveWindow.mockResolvedValue(false);
    renderModal();
    openRequest();
    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`));
    await waitFor(() =>
      expect(screen.getByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__open-${ORDER_WINDOW}`));

    expect(setWindowActive).toHaveBeenCalledWith({ windowIdentifier: ORDER_WINDOW });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onProceed).not.toHaveBeenCalled();
  });

  it("clears a previous failure once the save succeeds", async () => {
    mockSaveWindow.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    renderModal();
    openRequest();
    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`));
    await waitFor(() =>
      expect(screen.getByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__save-${ORDER_WINDOW}`));

    await waitFor(() =>
      expect(screen.queryByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).not.toBeInTheDocument()
    );
  });

  it("closes the window when Discard is pressed", () => {
    const cleanupWindow = jest.fn();
    useWindowStore.setState({ cleanupWindow });
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId(`UnsavedChangesWindowsModal__discard-${ORDER_WINDOW}`));

    expect(cleanupWindow).toHaveBeenCalledWith(ORDER_WINDOW);
  });

  // Resolving the last window must not fire the held-back action behind the user's back.
  it("waits for an explicit Continue once every window is resolved", async () => {
    renderModal();
    openRequest();

    resolveWindow(ORDER_WINDOW);

    await waitFor(() => expect(screen.getByTestId("UnsavedChangesWindowsModal__continue")).toBeInTheDocument());
    expect(screen.queryByTestId("UnsavedChangesWindowsModal__rows")).not.toBeInTheDocument();
    expect(onProceed).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__continue"));

    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("keeps Cancel available once every window is resolved", async () => {
    renderModal();
    openRequest();
    resolveWindow(ORDER_WINDOW);
    await waitFor(() => expect(screen.getByTestId("UnsavedChangesWindowsModal__continue")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onProceed).not.toHaveBeenCalled();
  });

  it("discards every window and continues in one click", async () => {
    const cleanupWindow = jest.fn();
    useWindowStore.setState({ cleanupWindow });
    seedStore({
      [ORDER_WINDOW]: { [formKey(HEADER_TAB)]: true },
      [PARTNER_WINDOW]: { [formKey(HEADER_TAB)]: true },
    });
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__discardAll"));

    expect(cleanupWindow).toHaveBeenCalledWith(ORDER_WINDOW);
    expect(cleanupWindow).toHaveBeenCalledWith(PARTNER_WINDOW);
    await waitFor(() => expect(onProceed).toHaveBeenCalledTimes(1));
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("saves every window and continues in one click", async () => {
    seedStore({
      [ORDER_WINDOW]: { [formKey(HEADER_TAB)]: true },
      [PARTNER_WINDOW]: { [formKey(HEADER_TAB)]: true },
    });
    mockSaveWindow.mockImplementation(async (windowIdentifier: string) => {
      resolveWindow(windowIdentifier);
      return true;
    });
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__saveAll"));

    await waitFor(() => expect(onProceed).toHaveBeenCalledTimes(1));
    expect(mockSaveWindow).toHaveBeenCalledWith(ORDER_WINDOW);
    expect(mockSaveWindow).toHaveBeenCalledWith(PARTNER_WINDOW);
  });

  it("does not continue when one of the bulk saves fails", async () => {
    mockSaveWindow.mockResolvedValue(false);
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__saveAll"));

    await waitFor(() =>
      expect(screen.getByTestId(`UnsavedChangesWindowsModal__error-${ORDER_WINDOW}`)).toBeInTheDocument()
    );
    expect(onProceed).not.toHaveBeenCalled();
  });

  // Inline grid rows cannot be saved from here, so a bulk save can never resolve them.
  it("disables the bulk save when no window has a form", () => {
    seedStore({ [ORDER_WINDOW]: { [tableKey(LINES_TAB)]: true } });
    renderModal();
    openRequest();

    expect(screen.getByTestId("UnsavedChangesWindowsModal__saveAll")).toBeDisabled();
  });

  it("keeps the session when Cancel is pressed", async () => {
    renderModal();
    openRequest();

    fireEvent.click(screen.getByTestId("UnsavedChangesWindowsModal__cancel"));

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(onProceed).not.toHaveBeenCalled();
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });
});

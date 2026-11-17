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
import UnsavedChangesTabGuardProvider, { useUnsavedChangesTabGuard } from "../UnsavedChangesTabGuard";
import { useWindowStore } from "@/stores/windowStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const TAB_ID = "header";
const WINDOW_IDENTIFIER = "143_1000";
const FORM_SOURCE_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, TAB_ID);

const SAVE_BUTTON = "SaveDiscardCancelModal__save";
const DISCARD_BUTTON = "SaveDiscardCancelModal__discard";
const CANCEL_BUTTON = "SaveDiscardCancelModal__cancel";
const TRIGGER = "trigger";

let mockPreferences: Record<string, string> = {};
const savePreferences = (prefs: Record<string, string>) => {
  mockPreferences = prefs;
};
const clearPreferences = () => {
  mockPreferences = {};
};

jest.mock("@/utils/propertyStore", () => ({
  // Same lookup as the real resolver: the window-scoped key wins over the global one
  resolvePreference: (key: string, windowId?: string) =>
    (windowId ? mockPreferences[`${key}_${windowId}`] : undefined) || mockPreferences[key],
}));

const mockOnSave = jest.fn();
const mockOnDiscard = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ tab: { id: "header", window: "143" } }),
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarCommands: () => ({ onSave: mockOnSave, onDiscard: mockOnDiscard }),
}));

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "143_1000",
}));

describe("UnsavedChangesTabGuardProvider", () => {
  const transition = jest.fn();
  const onCancel = jest.fn();

  /** Button that asks the guard to run `transition`. */
  const Consumer = ({ withCancel }: { withCancel: boolean }) => {
    const { guardTransition } = useUnsavedChangesTabGuard();
    const handleClick = () => {
      if (withCancel) {
        guardTransition(transition, onCancel);
        return;
      }
      guardTransition(transition);
    };
    return (
      <button type="button" data-testid={TRIGGER} onClick={handleClick}>
        go
      </button>
    );
  };

  const renderGuard = ({ withCancel = false } = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <UnsavedChangesTabGuardProvider>
          <Consumer withCancel={withCancel} />
        </UnsavedChangesTabGuardProvider>
      </ThemeProvider>
    );

  const setDirty = (isDirty: boolean) => {
    act(() => {
      useWindowStore.setState({
        dirtyWindows: isDirty ? { [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } } : {},
      });
    });
  };

  const triggerTransition = () => fireEvent.click(screen.getByTestId(TRIGGER));

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(true);
    useWindowStore.setState({ dirtyWindows: {} });
    // The prompt is what Autosave off shows; the autosave cases set their own preferences
    savePreferences({ Autosave: "N" });
  });

  afterAll(() => clearPreferences());

  it("runs the transition immediately when the tab is clean", () => {
    renderGuard();

    triggerTransition();

    expect(transition).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(SAVE_BUTTON)).not.toBeInTheDocument();
  });

  it("with Autosave off, asks the user instead of running the transition when the tab is dirty", () => {
    renderGuard();
    setDirty(true);

    triggerTransition();

    expect(transition).not.toHaveBeenCalled();
    expect(screen.getByTestId(SAVE_BUTTON)).toBeInTheDocument();
  });

  it("saves and then runs the transition", async () => {
    renderGuard();
    setDirty(true);
    triggerTransition();

    fireEvent.click(screen.getByTestId(SAVE_BUTTON));

    await waitFor(() => expect(mockOnSave).toHaveBeenCalledWith({ showModal: false }));
    expect(transition).toHaveBeenCalledTimes(1);
  });

  it("keeps the prompt open and does not transition when the save fails", async () => {
    mockOnSave.mockResolvedValue(false);
    renderGuard();
    setDirty(true);
    triggerTransition();

    fireEvent.click(screen.getByTestId(SAVE_BUTTON));

    await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    expect(transition).not.toHaveBeenCalled();
    expect(screen.getByTestId(SAVE_BUTTON)).toBeInTheDocument();
  });

  it("discards and then runs the transition", async () => {
    renderGuard();
    setDirty(true);
    triggerTransition();

    fireEvent.click(screen.getByTestId(DISCARD_BUTTON));

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(transition).toHaveBeenCalledTimes(1));
  });

  it("keeps the form and its changes when cancelled", async () => {
    renderGuard({ withCancel: true });
    setDirty(true);
    triggerTransition();

    fireEvent.click(screen.getByTestId(CANCEL_BUTTON));

    await waitFor(() => expect(screen.queryByTestId(CANCEL_BUTTON)).not.toBeInTheDocument());
    expect(transition).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnDiscard).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  describe("with the Autosave preferences (ETP-6302)", () => {
    it("saves and runs the transition without asking when Autosave is on (the default)", async () => {
      clearPreferences();
      renderGuard();
      setDirty(true);

      triggerTransition();

      await waitFor(() => expect(transition).toHaveBeenCalledTimes(1));
      expect(mockOnSave).toHaveBeenCalledWith({ showModal: false });
      expect(screen.queryByTestId(SAVE_BUTTON)).not.toBeInTheDocument();
    });

    it("stays where it is, with the changes kept, when the automatic save fails", async () => {
      clearPreferences();
      mockOnSave.mockResolvedValue(false);
      renderGuard({ withCancel: true });
      setDirty(true);

      triggerTransition();

      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
      expect(transition).not.toHaveBeenCalled();
      expect(mockOnDiscard).not.toHaveBeenCalled();
      expect(screen.queryByTestId(SAVE_BUTTON)).not.toBeInTheDocument();
    });

    it("saves once when the transition is requested again while the save is running", async () => {
      clearPreferences();
      let finishSave: (value: boolean) => void = () => {};
      mockOnSave.mockReturnValue(
        new Promise<boolean>((resolve) => {
          finishSave = resolve;
        })
      );
      renderGuard();
      setDirty(true);

      triggerTransition();
      triggerTransition();
      await act(async () => finishSave(true));

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(transition).toHaveBeenCalledTimes(1);
    });

    it("does nothing without changes, whatever the preferences say", () => {
      clearPreferences();
      renderGuard();

      triggerTransition();

      expect(transition).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("asks first, with no discard, when Show Confirmation Default is on; accepting saves and moves", async () => {
      savePreferences({ Autosave: "Y", ShowConfirmationDefault: "Y" });
      renderGuard();
      setDirty(true);

      triggerTransition();

      expect(transition).not.toHaveBeenCalled();
      expect(screen.getByText("unsavedChanges.autosaveMessage")).toBeInTheDocument();
      expect(screen.queryByTestId(DISCARD_BUTTON)).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId(SAVE_BUTTON));
      await waitFor(() => expect(transition).toHaveBeenCalledTimes(1));
      expect(mockOnSave).toHaveBeenCalledWith({ showModal: false });
    });

    it("stays, without saving, when the confirmation is cancelled", async () => {
      savePreferences({ Autosave: "Y", ShowConfirmationDefault: "Y" });
      renderGuard({ withCancel: true });
      setDirty(true);
      triggerTransition();

      fireEvent.click(screen.getByTestId(CANCEL_BUTTON));

      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(transition).not.toHaveBeenCalled();
    });

    it("ignores Show Confirmation Default when Autosave is off", () => {
      savePreferences({ Autosave: "N", ShowConfirmationDefault: "Y" });
      renderGuard();
      setDirty(true);

      triggerTransition();

      expect(screen.getByText("unsavedChanges.transitionMessage")).toBeInTheDocument();
      expect(screen.getByTestId(DISCARD_BUTTON)).toBeInTheDocument();
    });

    it("follows the preference of the window: off for one window does not change another", () => {
      savePreferences({ Autosave: "Y", Autosave_143: "N" });
      renderGuard();
      setDirty(true);

      triggerTransition();

      expect(screen.getByTestId(SAVE_BUTTON)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});

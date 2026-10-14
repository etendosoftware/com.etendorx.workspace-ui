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

const mockOnSave = jest.fn();
const mockOnDiscard = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ tab: { id: "header" } }),
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({ onSave: mockOnSave, onDiscard: mockOnDiscard }),
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
  });

  it("runs the transition immediately when the tab is clean", () => {
    renderGuard();

    triggerTransition();

    expect(transition).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(SAVE_BUTTON)).not.toBeInTheDocument();
  });

  it("asks the user instead of running the transition when the tab is dirty", () => {
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
});

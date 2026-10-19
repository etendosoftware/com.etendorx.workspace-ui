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

import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import SaveDiscardCancelModal, { type SaveDiscardCancelModalProps } from "../SaveDiscardCancelModal";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MESSAGE = "This record has unsaved changes.";
const SAVE_BUTTON = "SaveDiscardCancelModal__save";
const DISCARD_BUTTON = "SaveDiscardCancelModal__discard";
const CANCEL_BUTTON = "SaveDiscardCancelModal__cancel";

describe("SaveDiscardCancelModal", () => {
  const onSave = jest.fn();
  const onDiscard = jest.fn();
  const onCancel = jest.fn();

  const renderModal = (overrides: Partial<SaveDiscardCancelModalProps> = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <SaveDiscardCancelModal
          open
          message={MESSAGE}
          isSaving={false}
          onSave={onSave}
          onDiscard={onDiscard}
          onCancel={onCancel}
          {...overrides}
        />
      </ThemeProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while closed", () => {
    renderModal({ open: false });

    expect(screen.queryByTestId(SAVE_BUTTON)).not.toBeInTheDocument();
  });

  it("shows the message and the three choices", () => {
    renderModal();

    expect(screen.getByTestId("SaveDiscardCancelModal__message")).toHaveTextContent(MESSAGE);
    expect(screen.getByTestId(SAVE_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DISCARD_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(CANCEL_BUTTON)).toBeInTheDocument();
  });

  it.each([
    ["save", SAVE_BUTTON, () => onSave],
    ["discard", DISCARD_BUTTON, () => onDiscard],
    ["cancel", CANCEL_BUTTON, () => onCancel],
  ])("calls the %s handler", (_label, testId, getHandler) => {
    renderModal();

    fireEvent.click(screen.getByTestId(testId));

    expect(getHandler()).toHaveBeenCalledTimes(1);
  });

  it("disables save while a save is in flight", () => {
    renderModal({ isSaving: true });

    expect(screen.getByTestId(SAVE_BUTTON)).toBeDisabled();
  });

  it("labels the choices for a record by default", () => {
    renderModal();

    expect(screen.getByTestId(SAVE_BUTTON)).toHaveTextContent("unsavedChanges.saveChanges");
    expect(screen.getByTestId(DISCARD_BUTTON)).toHaveTextContent("unsavedChanges.discardChanges");
  });

  // The window-close prompt reuses this modal with wording of its own.
  it("takes over the title and the labels when the caller provides them", () => {
    renderModal({ title: "Close window", saveLabel: "Save and close", discardLabel: "Close window" });

    expect(screen.getByTestId(SAVE_BUTTON)).toHaveTextContent("Save and close");
    expect(screen.getByTestId(DISCARD_BUTTON)).toHaveTextContent("Close window");
    expect(screen.getByText("Close window", { selector: "p,span,h6" })).toBeInTheDocument();
  });
});

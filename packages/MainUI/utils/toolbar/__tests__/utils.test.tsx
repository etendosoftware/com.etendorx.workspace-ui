import { createButtonByType } from "../utils";
import { TOOLBAR_BUTTONS_ACTIONS } from "../constants";
import type { ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
import type { Tab } from "@workspaceui/api-client/src/api/types";

describe("Toolbar utils createButtonByType", () => {
  const defaultTab = { uIPattern: "STD" } as Tab;
  const defaultButton = {
    action: TOOLBAR_BUTTONS_ACTIONS.SAVE,
    name: "Save",
    active: true,
  } as ToolbarButtonMetadata;

  const defaultProps = {
    button: defaultButton,
    onAction: jest.fn(),
    isFormView: true,
    hasFormChanges: true,
    hasParentRecordSelected: true,
    tab: defaultTab,
    selectedRecordsLength: 0,
  };

  it("should disable save button when isSaving is true", () => {
    const result = createButtonByType({
      ...defaultProps,
      saveButtonState: { isSaving: true, isCalloutLoading: false },
    });
    expect(result.disabled).toBe(true);
  });

  it("should NOT disable save button when isCalloutLoading is true but isSaving is false", () => {
    const result = createButtonByType({
      ...defaultProps,
      saveButtonState: { isSaving: false, isCalloutLoading: true },
    });
    // This allows the user to click the button to trigger waitForIdle
    expect(result.disabled).toBe(false);
  });
});

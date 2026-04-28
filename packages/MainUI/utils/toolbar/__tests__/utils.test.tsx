import { createButtonByType, getButtonStyles, organizeButtonsBySection } from "../utils";
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

  it("should NOT show 'Loading callouts...' text when isCalloutLoading is true", () => {
    const result = createButtonByType({
      ...defaultProps,
      saveButtonState: { isSaving: false, isCalloutLoading: true },
    });
    // It should now return the default button name
    expect(result.iconText).toBe("Save");
  });
});

describe("getButtonStyles", () => {
  const makeButton = (action: string): ToolbarButtonMetadata =>
    ({
      action,
      name: action,
      active: true,
      section: "left",
      buttonType: "ACTION",
      windows: [],
    }) as ToolbarButtonMetadata;

  it("returns form-specific class when isFormView=true and action=NEW", () => {
    const result = getButtonStyles(makeButton(TOOLBAR_BUTTONS_ACTIONS.NEW), true);
    expect(result).toContain("toolbar-button-new-form");
  });

  it("returns standard NEW style when isFormView=false", () => {
    const result = getButtonStyles(makeButton(TOOLBAR_BUTTONS_ACTIONS.NEW), false);
    expect(result).toContain("toolbar-button-new");
    expect(result).not.toContain("toolbar-button-new-form");
  });

  it("returns SAVE style", () => {
    expect(getButtonStyles(makeButton(TOOLBAR_BUTTONS_ACTIONS.SAVE))).toContain("toolbar-button-save");
  });

  it("returns REFRESH style", () => {
    expect(getButtonStyles(makeButton(TOOLBAR_BUTTONS_ACTIONS.REFRESH))).toContain("toolbar-button-refresh");
  });

  it("returns undefined for unknown action", () => {
    expect(getButtonStyles(makeButton("UNKNOWN_ACTION"))).toBeUndefined();
  });
});

describe("organizeButtonsBySection", () => {
  const makeBtn = (action: string, section: "left" | "center" | "right", seqno?: number): ToolbarButtonMetadata =>
    ({
      id: action,
      action,
      name: action,
      active: true,
      section,
      seqno: seqno ?? null,
      buttonType: "ACTION",
      windows: [],
    }) as ToolbarButtonMetadata;

  it("distributes active buttons into correct sections", () => {
    const buttons = [
      makeBtn(TOOLBAR_BUTTONS_ACTIONS.NEW, "left"),
      makeBtn(TOOLBAR_BUTTONS_ACTIONS.SAVE, "left"),
      makeBtn(TOOLBAR_BUTTONS_ACTIONS.REFRESH, "right"),
    ];
    const result = organizeButtonsBySection(buttons, true);
    expect(result.left).toHaveLength(2);
    expect(result.right).toHaveLength(1);
    expect(result.center).toHaveLength(0);
  });

  it("excludes inactive buttons", () => {
    const inactive = { ...makeBtn(TOOLBAR_BUTTONS_ACTIONS.DELETE, "left"), active: false };
    const result = organizeButtonsBySection([inactive], false);
    expect(result.left).toHaveLength(0);
  });

  it("hides FIND button in form view", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.FIND, "left")], true);
    expect(result.left).toHaveLength(0);
  });

  it("shows FIND button in grid view", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.FIND, "left")], false);
    expect(result.left).toHaveLength(1);
  });

  it("hides SAVE button in grid view", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.SAVE, "left")], false);
    expect(result.left).toHaveLength(0);
  });

  it("hides FILTER button in form view", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.FILTER, "left")], true);
    expect(result.left).toHaveLength(0);
  });

  it("hides TOGGLE_TREE_VIEW when isTreeNodeView=false", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.TOGGLE_TREE_VIEW, "right")], false, false);
    expect(result.right).toHaveLength(0);
  });

  it("shows TOGGLE_TREE_VIEW when isTreeNodeView=true", () => {
    const result = organizeButtonsBySection([makeBtn(TOOLBAR_BUTTONS_ACTIONS.TOGGLE_TREE_VIEW, "right")], false, true);
    expect(result.right).toHaveLength(1);
  });

  it("hides COPILOT button when isCopilotInstalled=false", () => {
    const result = organizeButtonsBySection(
      [makeBtn(TOOLBAR_BUTTONS_ACTIONS.COPILOT, "right")],
      false,
      false,
      undefined,
      false
    );
    expect(result.right).toHaveLength(0);
  });

  it("shows COPILOT button when isCopilotInstalled=true", () => {
    const result = organizeButtonsBySection(
      [makeBtn(TOOLBAR_BUTTONS_ACTIONS.COPILOT, "right")],
      false,
      false,
      undefined,
      true
    );
    expect(result.right).toHaveLength(1);
  });

  it("sorts buttons within sections by seqno", () => {
    const buttons = [
      makeBtn(TOOLBAR_BUTTONS_ACTIONS.DELETE, "left", 20),
      makeBtn(TOOLBAR_BUTTONS_ACTIONS.NEW, "left", 10),
    ];
    const result = organizeButtonsBySection(buttons, true);
    expect(result.left[0].action).toBe(TOOLBAR_BUTTONS_ACTIONS.NEW);
    expect(result.left[1].action).toBe(TOOLBAR_BUTTONS_ACTIONS.DELETE);
  });
});

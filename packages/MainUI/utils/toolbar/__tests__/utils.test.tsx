import { createButtonByType, getButtonStyles, organizeButtonsBySection, getToolbarSections } from "../utils";
import { TOOLBAR_BUTTONS_ACTIONS, TOOLBAR_BUTTONS_TYPES } from "../constants";
import type { ToolbarButtonMetadata } from "@/hooks/Toolbar/types";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { UIPattern } from "@workspaceui/api-client/src/api/types";

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

  it("hides PRINT_RECORD when tab process identifier does not include Print", () => {
    const tab = { process$_identifier: "SomeOther" } as Tab;
    const result = organizeButtonsBySection(
      [makeBtn(TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD, "right")],
      false,
      false,
      tab
    );
    expect(result.right).toHaveLength(0);
  });

  it("shows PRINT_RECORD when tab process identifier includes Print", () => {
    const tab = { process$_identifier: "Print Document" } as Tab;
    const result = organizeButtonsBySection(
      [makeBtn(TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD, "right")],
      false,
      false,
      tab
    );
    expect(result.right).toHaveLength(1);
  });

  it("sorts by name when seqno is equal", () => {
    const a = { ...makeBtn(TOOLBAR_BUTTONS_ACTIONS.DELETE, "left", 10), name: "Zebra" };
    const b = { ...makeBtn(TOOLBAR_BUTTONS_ACTIONS.CANCEL, "left", 10), name: "Alpha" };
    const result = organizeButtonsBySection([a, b], true);
    expect(result.left[0].name).toBe("Alpha");
    expect(result.left[1].name).toBe("Zebra");
  });

  it("treats null seqno as max integer for sorting", () => {
    const a = makeBtn(TOOLBAR_BUTTONS_ACTIONS.DELETE, "left", undefined);
    const b = makeBtn(TOOLBAR_BUTTONS_ACTIONS.CANCEL, "left", 5);
    const result = organizeButtonsBySection([a, b], true);
    expect(result.left[0].action).toBe(TOOLBAR_BUTTONS_ACTIONS.CANCEL);
  });
});

describe("createButtonByType - extended", () => {
  const defaultTab = { uIPattern: "STD" } as Tab;
  const onAction = jest.fn();

  const makeButton = (overrides: Partial<ToolbarButtonMetadata> = {}): ToolbarButtonMetadata =>
    ({
      action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
      name: "Delete",
      active: true,
      section: "left",
      buttonType: TOOLBAR_BUTTONS_TYPES.ACTION,
      windows: [],
      ...overrides,
    }) as ToolbarButtonMetadata;

  const defaultProps = {
    onAction,
    isFormView: false,
    hasFormChanges: false,
    hasParentRecordSelected: true,
    tab: defaultTab,
    selectedRecordsLength: 1,
  };

  it("should disable DELETE when no record is selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.DELETE }),
      selectedRecordsLength: 0,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable DELETE on READ_ONLY pattern", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.DELETE }),
      tab: { uIPattern: UIPattern.READ_ONLY } as Tab,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable DELETE on EDIT_ONLY pattern", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.DELETE }),
      tab: { uIPattern: UIPattern.EDIT_ONLY } as Tab,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable NEW when no parent record is selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.NEW }),
      hasParentRecordSelected: false,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable CANCEL when not in form view and no record selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.CANCEL }),
      isFormView: false,
      selectedRecordsLength: 0,
    });
    expect(result.disabled).toBe(true);
  });

  it("should enable CANCEL in form view even without selected records", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.CANCEL }),
      isFormView: true,
      selectedRecordsLength: 0,
    });
    expect(result.disabled).toBe(false);
  });

  it("should disable COPILOT when not installed", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.COPILOT }),
      isCopilotInstalled: false,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable ATTACHMENT when no record selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.ATTACHMENT }),
      selectedRecordsLength: 0,
    });
    expect(result.disabled).toBe(true);
  });

  it("should disable COPY_RECORD when clone not enabled on tab", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD }),
      tab: { ...defaultTab, obuiappShowCloneButton: false } as any,
    });
    expect(result.disabled).toBe(true);
  });

  it("should enable COPY_RECORD when clone is enabled and record selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD }),
      tab: { ...defaultTab, obuiappShowCloneButton: true } as any,
    });
    expect(result.disabled).toBe(false);
  });

  it("should disable PRINT_RECORD when no record selected", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.PRINT_RECORD }),
      selectedRecordsLength: 0,
    });
    expect(result.disabled).toBe(true);
  });

  it("should show iconText for DROPDOWN button type", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.DROPDOWN,
        name: "Dropdown",
      }),
    });
    expect(result.iconText).toContain("Dropdown");
    expect(result.iconText).toContain("▼");
  });

  it("should show iconText for MODAL button with modalConfig title", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.MODAL,
        modalConfig: { title: "Modal Title" },
      } as any),
    });
    expect(result.iconText).toBe("Modal Title");
  });

  it("should use OPEN_DROPDOWN action for DROPDOWN button type click", () => {
    const mockAction = jest.fn();
    const result = createButtonByType({
      ...defaultProps,
      onAction: mockAction,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.DROPDOWN,
      }),
    });
    result.onClick?.();
    expect(mockAction).toHaveBeenCalledWith("OPEN_DROPDOWN", expect.anything(), undefined);
  });

  it("should use OPEN_MODAL action for MODAL button type click", () => {
    const mockAction = jest.fn();
    const result = createButtonByType({
      ...defaultProps,
      onAction: mockAction,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.MODAL,
      }),
    });
    result.onClick?.();
    expect(mockAction).toHaveBeenCalledWith("OPEN_MODAL", expect.anything());
  });

  it("should use TOGGLE action for TOGGLE button type click", () => {
    const mockAction = jest.fn();
    const result = createButtonByType({
      ...defaultProps,
      onAction: mockAction,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.TOGGLE,
      }),
    });
    result.onClick?.();
    expect(mockAction).toHaveBeenCalledWith("TOGGLE", expect.anything());
  });

  it("should use CUSTOM_ACTION for CUSTOM button type click", () => {
    const mockAction = jest.fn();
    const result = createButtonByType({
      ...defaultProps,
      onAction: mockAction,
      button: makeButton({
        action: TOOLBAR_BUTTONS_ACTIONS.DELETE,
        buttonType: TOOLBAR_BUTTONS_TYPES.CUSTOM,
      }),
    });
    result.onClick?.();
    expect(mockAction).toHaveBeenCalledWith("CUSTOM_ACTION", expect.anything(), undefined);
  });

  it("should set isPressed for FILTER when implicitFilterApplied", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.FILTER }),
      isImplicitFilterApplied: true,
    });
    expect(result.isPressed).toBe(true);
  });

  it("should set isPressed for ADVANCED_FILTERS when applied", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.ADVANCED_FILTERS }),
      isAdvancedFilterApplied: true,
    });
    expect(result.isPressed).toBe(true);
  });

  it("should set filter tooltip when showFilterTooltip is true", () => {
    const t = jest.fn().mockReturnValue("Filter active");
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.FILTER }),
      showFilterTooltip: true,
      t,
    });
    expect(result.tooltip).toBe("Filter active");
    expect(result.forceTooltipOpen).toBe(true);
  });

  it("should set share link tooltip when showShareLinkTooltip is true", () => {
    const t = jest.fn().mockReturnValue("Copied!");
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.SHARE_LINK }),
      showShareLinkTooltip: true,
      t,
    });
    expect(result.tooltip).toBe("Copied!");
    expect(result.forceTooltipOpen).toBe(true);
  });

  it("should use fallback text for filter tooltip when t is not provided", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.FILTER }),
      showFilterTooltip: true,
    });
    expect(result.tooltip).toBe("(Filtro activado)");
  });

  it("should use fallback text for share link tooltip when t is not provided", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.SHARE_LINK }),
      showShareLinkTooltip: true,
    });
    expect(result.tooltip).toBe("Copy!");
  });

  it("should not show iconText for NEW button in form view", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.NEW, name: "New" }),
      isFormView: true,
    });
    expect(result.iconText).toBeUndefined();
  });

  it("should show iconText for NEW button in grid view", () => {
    const result = createButtonByType({
      ...defaultProps,
      button: makeButton({ action: TOOLBAR_BUTTONS_ACTIONS.NEW, name: "New" }),
      isFormView: false,
    });
    expect(result.iconText).toBe("New");
  });
});

describe("getToolbarSections", () => {
  const defaultTab = { uIPattern: "STD" } as Tab;
  const onAction = jest.fn();

  const makeBtn = (action: string, section: "left" | "center" | "right"): ToolbarButtonMetadata =>
    ({
      id: action,
      action,
      name: action,
      active: true,
      section,
      buttonType: TOOLBAR_BUTTONS_TYPES.ACTION,
      windows: [],
    }) as ToolbarButtonMetadata;

  it("should return left, center, right sections with buttons and styles", () => {
    const buttons = [makeBtn(TOOLBAR_BUTTONS_ACTIONS.NEW, "left"), makeBtn(TOOLBAR_BUTTONS_ACTIONS.REFRESH, "right")];

    const result = getToolbarSections({
      buttons,
      onAction,
      isFormView: true,
      tab: defaultTab,
      selectedRecordsLength: 0,
    });

    expect(result.leftSection.buttons).toHaveLength(1);
    expect(result.rightSection.buttons).toHaveLength(1);
    expect(result.centerSection.buttons).toHaveLength(0);
    expect(result.leftSection.style).toBeDefined();
    expect(result.centerSection.style).toBeDefined();
    expect(result.rightSection.style).toBeDefined();
  });

  it("should apply button styles when available", () => {
    const buttons = [makeBtn(TOOLBAR_BUTTONS_ACTIONS.NEW, "left")];

    const result = getToolbarSections({
      buttons,
      onAction,
      isFormView: false,
      tab: defaultTab,
      selectedRecordsLength: 0,
    });

    expect(result.leftSection.buttons[0].className).toContain("toolbar-button-new");
  });

  it("should add badge for ATTACHMENT when record is selected and attachment count > 0", () => {
    const buttons = [makeBtn(TOOLBAR_BUTTONS_ACTIONS.ATTACHMENT, "right")];

    const result = getToolbarSections({
      buttons,
      onAction,
      isFormView: false,
      tab: defaultTab,
      selectedRecordsLength: 1,
      session: { _attachmentCount: 3 } as any,
    });

    expect(result.rightSection.buttons[0].badgeContent).toBe("3");
  });

  it("should not add badge for ATTACHMENT when no record is selected", () => {
    const buttons = [makeBtn(TOOLBAR_BUTTONS_ACTIONS.ATTACHMENT, "right")];

    const result = getToolbarSections({
      buttons,
      onAction,
      isFormView: false,
      tab: defaultTab,
      selectedRecordsLength: 0,
      session: { _attachmentCount: 3 } as any,
    });

    expect(result.rightSection.buttons[0].badgeContent).toBeUndefined();
  });
});

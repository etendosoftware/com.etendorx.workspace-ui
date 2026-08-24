import { UIPattern, type Tab } from "@workspaceui/api-client/src/api/types";
import {
  DEFAULT_SPLIT_STATE,
  GRID_FOCUS_TARGET_ATTRIBUTE,
  SPLIT_DEFAULT_TABLE_WIDTH,
  SPLIT_MAX_TABLE_WIDTH,
  SPLIT_MIN_TABLE_WIDTH,
  SPLIT_PANES,
  SPLIT_TABLE_WIDTH_CSS_VAR,
  TAB_VIEW_MODES,
  type TabViewMode,
  clampSplitTableWidth,
  getFocusBorderColor,
  getFormPaneClassName,
  getGridPaneClassName,
  getGridPaneStyle,
  getOtherSplitPane,
  getPaneTabIndex,
  getPanesContainerClassName,
  getPanesContainerStyle,
  getTabViewMode,
  isDualPaneMode,
  isGridPaneExclusive,
  isGridPaneVisible,
  isPaneFocused,
  isSplitViewAvailable,
  resolveGuardedSplitTarget,
  resolveSplitViewFormRecord,
  shouldPromptSplitViewChange,
  resolvePaneFocusTarget,
} from "../splitView";

const FOCUS_BORDER = "border-l-transparent";
const DUAL_PANE_MODES: TabViewMode[] = [TAB_VIEW_MODES.SPLIT, TAB_VIEW_MODES.TREE_SIDE_BY_SIDE];
const SINGLE_PANE_MODES: TabViewMode[] = [TAB_VIEW_MODES.GRID, TAB_VIEW_MODES.FORM];

const makeTab = (uIPattern: UIPattern): Pick<Tab, "uIPattern"> => ({ uIPattern });

describe("getTabViewMode", () => {
  const cases: Array<{
    shouldShowForm: boolean;
    isSplitEnabled: boolean;
    isTreeSideBySide: boolean;
    expected: string;
  }> = [
    { shouldShowForm: false, isSplitEnabled: false, isTreeSideBySide: false, expected: TAB_VIEW_MODES.GRID },
    { shouldShowForm: false, isSplitEnabled: true, isTreeSideBySide: false, expected: TAB_VIEW_MODES.GRID },
    { shouldShowForm: false, isSplitEnabled: false, isTreeSideBySide: true, expected: TAB_VIEW_MODES.GRID },
    { shouldShowForm: false, isSplitEnabled: true, isTreeSideBySide: true, expected: TAB_VIEW_MODES.GRID },
    { shouldShowForm: true, isSplitEnabled: false, isTreeSideBySide: false, expected: TAB_VIEW_MODES.FORM },
    { shouldShowForm: true, isSplitEnabled: true, isTreeSideBySide: false, expected: TAB_VIEW_MODES.SPLIT },
    {
      shouldShowForm: true,
      isSplitEnabled: false,
      isTreeSideBySide: true,
      expected: TAB_VIEW_MODES.TREE_SIDE_BY_SIDE,
    },
    // Split wins over the tree side-by-side layout: it is an explicit user choice.
    { shouldShowForm: true, isSplitEnabled: true, isTreeSideBySide: true, expected: TAB_VIEW_MODES.SPLIT },
  ];

  it.each(cases)(
    "form=$shouldShowForm split=$isSplitEnabled tree=$isTreeSideBySide → $expected",
    ({ shouldShowForm, isSplitEnabled, isTreeSideBySide, expected }) => {
      expect(getTabViewMode({ shouldShowForm, isSplitEnabled, isTreeSideBySide })).toBe(expected);
    }
  );
});

describe("clampSplitTableWidth", () => {
  it("keeps a value already inside the range", () => {
    expect(clampSplitTableWidth(42)).toBe(42);
  });

  it("clamps below the minimum", () => {
    expect(clampSplitTableWidth(SPLIT_MIN_TABLE_WIDTH - 5)).toBe(SPLIT_MIN_TABLE_WIDTH);
  });

  it("clamps above the maximum", () => {
    expect(clampSplitTableWidth(SPLIT_MAX_TABLE_WIDTH + 5)).toBe(SPLIT_MAX_TABLE_WIDTH);
  });

  it("falls back to the default for non-finite input", () => {
    expect(clampSplitTableWidth(Number.NaN)).toBe(SPLIT_DEFAULT_TABLE_WIDTH);
    expect(clampSplitTableWidth(Number.POSITIVE_INFINITY)).toBe(SPLIT_DEFAULT_TABLE_WIDTH);
  });
});

describe("isSplitViewAvailable", () => {
  it("is unavailable on single-record (EDIT_ONLY) tabs", () => {
    expect(isSplitViewAvailable(makeTab(UIPattern.EDIT_ONLY))).toBe(false);
  });

  it.each([UIPattern.STANDARD, UIPattern.READ_ONLY, UIPattern.EDIT_AND_DELETE_ONLY])(
    "is available for %s tabs",
    (pattern) => {
      expect(isSplitViewAvailable(makeTab(pattern))).toBe(true);
    }
  );
});

describe("pane visibility helpers", () => {
  it("shows the grid pane in every mode except the maximized form", () => {
    expect(isGridPaneVisible(TAB_VIEW_MODES.GRID)).toBe(true);
    expect(isGridPaneVisible(TAB_VIEW_MODES.SPLIT)).toBe(true);
    expect(isGridPaneVisible(TAB_VIEW_MODES.TREE_SIDE_BY_SIDE)).toBe(true);
    expect(isGridPaneVisible(TAB_VIEW_MODES.FORM)).toBe(false);
  });

  it("treats the grid as exclusive only in grid mode", () => {
    expect(isGridPaneExclusive(TAB_VIEW_MODES.GRID)).toBe(true);
    expect(isGridPaneExclusive(TAB_VIEW_MODES.SPLIT)).toBe(false);
    expect(isGridPaneExclusive(TAB_VIEW_MODES.TREE_SIDE_BY_SIDE)).toBe(false);
    expect(isGridPaneExclusive(TAB_VIEW_MODES.FORM)).toBe(false);
  });

  it.each(DUAL_PANE_MODES)("treats %s as a two-pane layout", (mode) => {
    expect(isDualPaneMode(mode)).toBe(true);
  });

  it.each(SINGLE_PANE_MODES)("treats %s as a single-pane layout", (mode) => {
    expect(isDualPaneMode(mode)).toBe(false);
  });
});

describe("getOtherSplitPane", () => {
  it("moves from the grid to the form and back", () => {
    expect(getOtherSplitPane(SPLIT_PANES.GRID)).toBe(SPLIT_PANES.FORM);
    expect(getOtherSplitPane(SPLIT_PANES.FORM)).toBe(SPLIT_PANES.GRID);
  });
});

describe("isPaneFocused", () => {
  const ALL_MODES: TabViewMode[] = [...DUAL_PANE_MODES, ...SINGLE_PANE_MODES];

  it.each(ALL_MODES)("never marks a pane of an unfocused tab (%s)", (mode) => {
    for (const pane of [SPLIT_PANES.GRID, SPLIT_PANES.FORM]) {
      expect(isPaneFocused({ mode, pane, isTabFocused: false, focusedPane: pane })).toBe(false);
    }
  });

  it.each(SINGLE_PANE_MODES)("keeps the indicator on the tab with a single pane on screen (%s)", (mode) => {
    // Only one pane is rendered, so the pre-split behaviour has to be preserved
    // whatever the tracked pane happens to be.
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.GRID, isTabFocused: true, focusedPane: SPLIT_PANES.FORM })).toBe(
      true
    );
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.FORM, isTabFocused: true, focusedPane: SPLIT_PANES.GRID })).toBe(
      true
    );
  });

  it.each(DUAL_PANE_MODES)("marks only the pane holding the focus (%s)", (mode) => {
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.FORM, isTabFocused: true, focusedPane: SPLIT_PANES.FORM })).toBe(
      true
    );
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.GRID, isTabFocused: true, focusedPane: SPLIT_PANES.FORM })).toBe(
      false
    );
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.GRID, isTabFocused: true, focusedPane: SPLIT_PANES.GRID })).toBe(
      true
    );
    expect(isPaneFocused({ mode, pane: SPLIT_PANES.FORM, isTabFocused: true, focusedPane: SPLIT_PANES.GRID })).toBe(
      false
    );
  });
});

describe("getPaneTabIndex", () => {
  it.each(DUAL_PANE_MODES)("makes the panes focusable in %s", (mode) => {
    expect(getPaneTabIndex(mode)).toBe(-1);
  });

  it.each(SINGLE_PANE_MODES)("leaves tabIndex out in %s", (mode) => {
    expect(getPaneTabIndex(mode)).toBeUndefined();
  });
});

describe("resolvePaneFocusTarget", () => {
  it("prefers the marked descendant", () => {
    const pane = document.createElement("div");
    const target = document.createElement("div");
    target.setAttribute(GRID_FOCUS_TARGET_ATTRIBUTE, "");
    pane.appendChild(target);

    expect(resolvePaneFocusTarget(pane)).toBe(target);
  });

  it("falls back to the pane itself when nothing is marked", () => {
    const pane = document.createElement("div");
    pane.appendChild(document.createElement("input"));

    expect(resolvePaneFocusTarget(pane)).toBe(pane);
  });
});

describe("class name helpers", () => {
  it("lays the panes out in a row only when both are on screen", () => {
    expect(getPanesContainerClassName(TAB_VIEW_MODES.SPLIT)).toContain("flex-row");
    expect(getPanesContainerClassName(TAB_VIEW_MODES.TREE_SIDE_BY_SIDE)).toContain("flex-row");
    expect(getPanesContainerClassName(TAB_VIEW_MODES.GRID)).toContain("flex-col");
    expect(getPanesContainerClassName(TAB_VIEW_MODES.FORM)).toContain("flex-col");
  });

  it("hides the grid pane only in the maximized form", () => {
    expect(getGridPaneClassName(TAB_VIEW_MODES.FORM, FOCUS_BORDER)).toContain("invisible");
    expect(getGridPaneClassName(TAB_VIEW_MODES.SPLIT, FOCUS_BORDER)).not.toContain("invisible");
    expect(getGridPaneClassName(TAB_VIEW_MODES.GRID, FOCUS_BORDER)).not.toContain("invisible");
  });

  it("keeps the fixed tree width exclusive to tree mode", () => {
    expect(getGridPaneClassName(TAB_VIEW_MODES.TREE_SIDE_BY_SIDE, FOCUS_BORDER)).toContain("w-[35%]");
    expect(getGridPaneClassName(TAB_VIEW_MODES.SPLIT, FOCUS_BORDER)).not.toContain("w-[35%]");
  });

  it.each([TAB_VIEW_MODES.GRID, ...DUAL_PANE_MODES])(
    "applies the focus border on the visible grid pane (%s)",
    (mode) => {
      expect(getGridPaneClassName(mode, FOCUS_BORDER)).toContain(FOCUS_BORDER);
      // Always laid out, so moving the focus between panes never shifts the divider.
      expect(getGridPaneClassName(mode, FOCUS_BORDER)).toContain("border-l-4");
    }
  );

  it.each([TAB_VIEW_MODES.GRID, ...DUAL_PANE_MODES])("keeps the browser ring off the grid pane (%s)", (mode) => {
    expect(getGridPaneClassName(mode, FOCUS_BORDER)).toContain("outline-none");
  });

  it("lets the form pane shrink below its content width", () => {
    expect(getFormPaneClassName(false)).toContain("min-w-0");
  });

  it("keeps the browser ring off the form pane", () => {
    expect(getFormPaneClassName(false)).toContain("outline-none");
  });

  it("marks the focused pane with the secondary border colour", () => {
    expect(getFocusBorderColor(true)).toContain("secondary-500");
    expect(getFocusBorderColor(false)).toBe("border-l-transparent");
    expect(getFormPaneClassName(true)).toContain("secondary-500");
  });
});

describe("split width styles", () => {
  it("drives the grid width from the CSS variable only in split view", () => {
    expect(getGridPaneStyle(TAB_VIEW_MODES.SPLIT)).toEqual({ width: `var(${SPLIT_TABLE_WIDTH_CSS_VAR})` });
    expect(getGridPaneStyle(TAB_VIEW_MODES.GRID)).toBeUndefined();
    expect(getGridPaneStyle(TAB_VIEW_MODES.FORM)).toBeUndefined();
    expect(getGridPaneStyle(TAB_VIEW_MODES.TREE_SIDE_BY_SIDE)).toBeUndefined();
  });

  it("seeds the CSS variable on the panes container", () => {
    expect(getPanesContainerStyle(37)).toEqual({ [SPLIT_TABLE_WIDTH_CSS_VAR]: "37%" });
  });
});

describe("DEFAULT_SPLIT_STATE", () => {
  it("starts disabled at the default proportion", () => {
    expect(DEFAULT_SPLIT_STATE).toEqual({ enabled: false, tableWidth: SPLIT_DEFAULT_TABLE_WIDTH });
  });

  it("is frozen so the shared fallback cannot be mutated by a consumer", () => {
    expect(Object.isFrozen(DEFAULT_SPLIT_STATE)).toBe(true);
  });
});

describe("resolveSplitViewFormRecord", () => {
  const CURRENT_RECORD = "record-1";
  const CLICKED_RECORD = "record-2";

  const resolve = (overrides: Partial<Parameters<typeof resolveSplitViewFormRecord>[0]> = {}) =>
    resolveSplitViewFormRecord({
      isSplitView: true,
      selectedRecordId: CLICKED_RECORD,
      currentRecordId: CURRENT_RECORD,
      hasFormChanges: false,
      isNewRecord: false,
      ...overrides,
    });

  it("follows the grid selection in split view", () => {
    expect(resolve()).toBe(CLICKED_RECORD);
  });

  it("stays put outside split view", () => {
    expect(resolve({ isSplitView: false })).toBeUndefined();
  });

  it("stays put when nothing is selected", () => {
    expect(resolve({ selectedRecordId: undefined })).toBeUndefined();
  });

  it("stays put when the form already shows that record", () => {
    expect(resolve({ selectedRecordId: CURRENT_RECORD })).toBeUndefined();
  });

  it("never discards unsaved changes", () => {
    expect(resolve({ hasFormChanges: true })).toBeUndefined();
  });

  it("never discards a record being created", () => {
    expect(resolve({ isNewRecord: true })).toBeUndefined();
  });
});

describe("shouldPromptSplitViewChange", () => {
  const CURRENT_RECORD = "record-1";
  const CLICKED_RECORD = "record-2";

  const shouldPrompt = (overrides: Record<string, unknown> = {}) =>
    shouldPromptSplitViewChange({
      isSplitView: true,
      selectedRecordId: CLICKED_RECORD,
      currentRecordId: CURRENT_RECORD,
      isDirty: true,
      ...overrides,
    });

  it("asks before leaving a record with unsaved changes", () => {
    expect(shouldPrompt()).toBe(true);
  });

  it("does not ask when the form is clean", () => {
    expect(shouldPrompt({ isDirty: false })).toBe(false);
  });

  it("does not ask outside split view", () => {
    expect(shouldPrompt({ isSplitView: false })).toBe(false);
  });

  it("does not ask when nothing is selected", () => {
    expect(shouldPrompt({ selectedRecordId: undefined })).toBe(false);
  });

  it("does not ask when the form already shows the selected record", () => {
    expect(shouldPrompt({ selectedRecordId: CURRENT_RECORD })).toBe(false);
  });
});

describe("resolveGuardedSplitTarget", () => {
  const FORM_RECORD = "record-1";
  const CLICKED_RECORD = "record-2";
  const NEWER_RECORD = "record-3";

  const resolveTarget = (overrides: Record<string, unknown> = {}) =>
    resolveGuardedSplitTarget({
      latestSelection: CLICKED_RECORD,
      promptedSelection: CLICKED_RECORD,
      formRecordId: FORM_RECORD,
      ...overrides,
    });

  it("keeps the clicked record when the grid did not move", () => {
    expect(resolveTarget()).toBe(CLICKED_RECORD);
  });

  it("follows a row selected while the prompt was open", () => {
    expect(resolveTarget({ latestSelection: NEWER_RECORD })).toBe(NEWER_RECORD);
  });

  // Saving re-selects the record it saved, which is the one the form already shows.
  it("ignores a selection that points back at the form record", () => {
    expect(resolveTarget({ latestSelection: FORM_RECORD })).toBe(CLICKED_RECORD);
  });

  it("falls back to the clicked record when nothing is selected", () => {
    expect(resolveTarget({ latestSelection: undefined })).toBe(CLICKED_RECORD);
  });

  it("keeps the clicked record when the form holds no record yet", () => {
    expect(resolveTarget({ formRecordId: undefined })).toBe(CLICKED_RECORD);
  });
});

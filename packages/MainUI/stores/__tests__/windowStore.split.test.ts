import { useWindowStore } from "@/stores/windowStore";
import { SPLIT_DEFAULT_TABLE_WIDTH, SPLIT_MAX_TABLE_WIDTH, SPLIT_MIN_TABLE_WIDTH } from "@/utils/window/splitView";
import { TAB_MODES, FORM_MODES } from "@/utils/url/constants";

const WINDOW_A = "window_a";
const WINDOW_B = "window_b";
const TAB_PARENT = "tab_parent";
const TAB_CHILD = "tab_child";
const RECORD_ID = "record_1";

const getSplit = (windowIdentifier: string, tabId: string) =>
  useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.split;

const getTab = (windowIdentifier: string, tabId: string) =>
  useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId];

/** Puts a tab in form view with split enabled at a non-default proportion. */
const seedSplitTabInFormView = (windowIdentifier: string, tabId: string, tableWidth = 65) => {
  const store = useWindowStore.getState();
  store.setTabFormState(windowIdentifier, tabId, {
    recordId: RECORD_ID,
    mode: TAB_MODES.FORM,
    formMode: FORM_MODES.EDIT,
  });
  store.setSelectedRecord(windowIdentifier, tabId, RECORD_ID);
  store.setTabSplitEnabled(windowIdentifier, tabId, true);
  store.setTabSplitTableWidth(windowIdentifier, tabId, tableWidth);
};

describe("windowStore — split view state", () => {
  beforeEach(() => {
    useWindowStore.getState().cleanState();
  });

  describe("defaults", () => {
    it("creates a tab with split disabled at the default proportion", () => {
      useWindowStore.getState().setTabSplitEnabled(WINDOW_A, TAB_PARENT, false);
      expect(getSplit(WINDOW_A, TAB_PARENT)).toEqual({ enabled: false, tableWidth: SPLIT_DEFAULT_TABLE_WIDTH });
    });

    it("creates the window and tab when they do not exist yet", () => {
      useWindowStore.getState().setTabSplitTableWidth(WINDOW_A, TAB_CHILD, 40, 1);
      expect(getTab(WINDOW_A, TAB_CHILD)?.level).toBe(1);
      expect(getSplit(WINDOW_A, TAB_CHILD)?.tableWidth).toBe(40);
    });
  });

  describe("setTabSplitTableWidth", () => {
    it("stores a width inside the supported range", () => {
      useWindowStore.getState().setTabSplitTableWidth(WINDOW_A, TAB_PARENT, 33);
      expect(getSplit(WINDOW_A, TAB_PARENT)?.tableWidth).toBe(33);
    });

    it("clamps a width outside the supported range", () => {
      const store = useWindowStore.getState();
      store.setTabSplitTableWidth(WINDOW_A, TAB_PARENT, 5);
      expect(getSplit(WINDOW_A, TAB_PARENT)?.tableWidth).toBe(SPLIT_MIN_TABLE_WIDTH);

      store.setTabSplitTableWidth(WINDOW_A, TAB_PARENT, 99);
      expect(getSplit(WINDOW_A, TAB_PARENT)?.tableWidth).toBe(SPLIT_MAX_TABLE_WIDTH);
    });

    it("does not disturb the enabled flag", () => {
      const store = useWindowStore.getState();
      store.setTabSplitEnabled(WINDOW_A, TAB_PARENT, true);
      store.setTabSplitTableWidth(WINDOW_A, TAB_PARENT, 30);
      expect(getSplit(WINDOW_A, TAB_PARENT)).toEqual({ enabled: true, tableWidth: 30 });
    });
  });

  describe("independence", () => {
    it("keeps a separate split state per tab of the same window", () => {
      const store = useWindowStore.getState();
      store.setTabSplitEnabled(WINDOW_A, TAB_PARENT, true);
      store.setTabSplitTableWidth(WINDOW_A, TAB_PARENT, 70);
      store.setTabSplitEnabled(WINDOW_A, TAB_CHILD, true);
      store.setTabSplitTableWidth(WINDOW_A, TAB_CHILD, 25);

      expect(getSplit(WINDOW_A, TAB_PARENT)).toEqual({ enabled: true, tableWidth: 70 });
      expect(getSplit(WINDOW_A, TAB_CHILD)).toEqual({ enabled: true, tableWidth: 25 });
    });

    it("keeps a separate split state per window for the same tab id", () => {
      const store = useWindowStore.getState();
      store.setTabSplitEnabled(WINDOW_A, TAB_PARENT, true);
      store.setTabSplitEnabled(WINDOW_B, TAB_PARENT, false);

      expect(getSplit(WINDOW_A, TAB_PARENT)?.enabled).toBe(true);
      expect(getSplit(WINDOW_B, TAB_PARENT)?.enabled).toBe(false);
    });
  });

  // The split cannot outlive its form: leaving it enabled would turn the next
  // double click on a row into a split instead of the maximized form. The
  // proportion is kept so that reopening the split restores the chosen width.
  describe("closing the form", () => {
    it("switches the split off but keeps the proportion (Escape / Cancel)", () => {
      seedSplitTabInFormView(WINDOW_A, TAB_PARENT);
      useWindowStore.getState().clearTabFormState(WINDOW_A, TAB_PARENT);

      expect(getTab(WINDOW_A, TAB_PARENT)?.form).toEqual({});
      expect(getSplit(WINDOW_A, TAB_PARENT)).toEqual({ enabled: false, tableWidth: 65 });
    });

    it("switches the split off on clearChildrenSelections (parent selection change)", () => {
      seedSplitTabInFormView(WINDOW_A, TAB_CHILD, 30);
      useWindowStore.getState().clearChildrenSelections(WINDOW_A, [TAB_CHILD], true);

      expect(getTab(WINDOW_A, TAB_CHILD)?.form).toEqual({});
      expect(getSplit(WINDOW_A, TAB_CHILD)).toEqual({ enabled: false, tableWidth: 30 });
    });

    it("only touches the children on setSelectedRecordAndClearChildren", () => {
      seedSplitTabInFormView(WINDOW_A, TAB_PARENT, 70);
      seedSplitTabInFormView(WINDOW_A, TAB_CHILD, 35);
      useWindowStore.getState().setSelectedRecordAndClearChildren(WINDOW_A, TAB_PARENT, "other_record", [TAB_CHILD]);

      // The parent keeps its own form, so its split stays on screen.
      expect(getSplit(WINDOW_A, TAB_PARENT)).toEqual({ enabled: true, tableWidth: 70 });
      expect(getTab(WINDOW_A, TAB_CHILD)?.form).toEqual({});
      expect(getSplit(WINDOW_A, TAB_CHILD)).toEqual({ enabled: false, tableWidth: 35 });
    });

    it("leaves a child in form view untouched while the parent record does not change", () => {
      seedSplitTabInFormView(WINDOW_A, TAB_CHILD, 45);
      useWindowStore.getState().clearChildrenSelections(WINDOW_A, [TAB_CHILD], false);

      expect(getSplit(WINDOW_A, TAB_CHILD)).toEqual({ enabled: true, tableWidth: 45 });
    });
  });

  describe("session scope", () => {
    it("is dropped together with the window", () => {
      seedSplitTabInFormView(WINDOW_A, TAB_PARENT);
      useWindowStore.getState().cleanupWindow(WINDOW_A);

      expect(useWindowStore.getState().windows[WINDOW_A]).toBeUndefined();
    });
  });
});

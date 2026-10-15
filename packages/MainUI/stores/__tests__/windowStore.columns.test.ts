import { useWindowStore } from "@/stores/windowStore";

const WINDOW_ID = "window_a";
const TAB_ID = "tab_parent";
const COLUMN = "Business Partner";
const PINNING = { left: ["mrt-row-select", "actions", COLUMN], right: [] };

const getTableState = () => useWindowStore.getState().windows[WINDOW_ID]?.tabs[TAB_ID]?.table;
const getNavigation = () => useWindowStore.getState().windows[WINDOW_ID]?.navigation;

describe("windowStore — column sizing, pinning and split heights", () => {
  beforeEach(() => {
    useWindowStore.getState().cleanState();
  });

  it("stores the column sizing of a tab, creating the tab when needed", () => {
    useWindowStore.getState().setTableSizing(WINDOW_ID, TAB_ID, { [COLUMN]: 240 }, 1);

    expect(getTableState()?.sizing).toEqual({ [COLUMN]: 240 });
    expect(useWindowStore.getState().windows[WINDOW_ID].tabs[TAB_ID].level).toBe(1);
  });

  it("stores the column pinning of a tab", () => {
    useWindowStore.getState().setTableColumnPinning(WINDOW_ID, TAB_ID, PINNING);

    expect(getTableState()?.pinning).toEqual(PINNING);
  });

  it("replaces the given table fields instead of merging them", () => {
    const store = useWindowStore.getState();
    store.setTableVisibility(WINDOW_ID, TAB_ID, { [COLUMN]: false });
    store.setTableSorting(WINDOW_ID, TAB_ID, [{ id: COLUMN, desc: true }]);

    store.applyTableViewState(WINDOW_ID, TAB_ID, { visibility: {}, sizing: { [COLUMN]: 90 } });

    expect(getTableState()?.visibility).toEqual({});
    expect(getTableState()?.sizing).toEqual({ [COLUMN]: 90 });
    expect(getTableState()?.sorting).toEqual([{ id: COLUMN, desc: true }]);
  });

  describe("split heights", () => {
    beforeEach(() => {
      useWindowStore.getState().setNavigationActiveLevels(WINDOW_ID, [0, 1]);
    });

    it("stores the height of a level keeping the other levels", () => {
      const store = useWindowStore.getState();
      store.setNavigationSplitHeight(WINDOW_ID, 1, 30);
      store.setNavigationSplitHeight(WINDOW_ID, 2, 60);

      expect(getNavigation()?.splitHeights).toEqual({ 1: 30, 2: 60 });
    });

    it("replaces every level height at once", () => {
      const store = useWindowStore.getState();
      store.setNavigationSplitHeight(WINDOW_ID, 1, 30);

      store.setNavigationSplitHeights(WINDOW_ID, { 2: 70 });

      expect(getNavigation()?.splitHeights).toEqual({ 2: 70 });
    });

    it("ignores heights of a window that is not open", () => {
      const store = useWindowStore.getState();
      store.setNavigationSplitHeight("missing", 1, 30);
      store.setNavigationSplitHeights("missing", { 1: 30 });

      expect(useWindowStore.getState().windows.missing).toBeUndefined();
    });
  });
});

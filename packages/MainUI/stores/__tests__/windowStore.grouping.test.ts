import { useWindowStore } from "@/stores/windowStore";

const WINDOW_ID = "window_a";
const TAB_ID = "tab_parent";
const GROUPED_COLUMN = "Business Partner";

const getTableState = () => useWindowStore.getState().windows[WINDOW_ID]?.tabs[TAB_ID]?.table;

describe("windowStore — table grouping", () => {
  beforeEach(() => {
    useWindowStore.getState().cleanState();
  });

  it("stores the grouping of a tab, creating the tab when needed", () => {
    useWindowStore.getState().setTableGrouping(WINDOW_ID, TAB_ID, [GROUPED_COLUMN], 1);

    expect(getTableState()?.grouping).toEqual([GROUPED_COLUMN]);
    expect(useWindowStore.getState().windows[WINDOW_ID].tabs[TAB_ID].level).toBe(1);
  });

  it("clears the grouping without touching the rest of the table state", () => {
    const store = useWindowStore.getState();
    store.setTableSorting(WINDOW_ID, TAB_ID, [{ id: GROUPED_COLUMN, desc: false }]);
    store.setTableGrouping(WINDOW_ID, TAB_ID, [GROUPED_COLUMN]);

    store.setTableGrouping(WINDOW_ID, TAB_ID, []);

    expect(getTableState()?.grouping).toEqual([]);
    expect(getTableState()?.sorting).toEqual([{ id: GROUPED_COLUMN, desc: false }]);
  });
});

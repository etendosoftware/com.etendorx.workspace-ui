import { act, renderHook } from "@testing-library/react";
import { useWindowStore } from "@/stores/windowStore";
import { clearGridConfiguration } from "@/utils/savedViews/gridConfiguration";
import type { AppliedViewState } from "@/utils/savedViews/types";
import { DEFAULT_COLUMN_PINNING } from "@/utils/table/columnState";
import { useApplyViewState } from "../useApplyViewState";

jest.mock("@/utils/savedViews/gridConfiguration", () => ({
  clearGridConfiguration: jest.fn(() => Promise.resolve()),
}));

const WINDOW_IDENTIFIER = "143_1";
const TAB_ID = "186";
const COLUMN = "Document No.";

const VIEW_STATE: AppliedViewState = {
  filters: [{ id: COLUMN, value: "100" }],
  visibility: { [COLUMN]: true },
  sorting: [{ id: COLUMN, desc: true }],
  order: [COLUMN],
  implicitFilterApplied: false,
  grouping: [],
  sizing: { [COLUMN]: 160 },
  pinning: { left: ["mrt-row-select", "actions", COLUMN], right: [] },
  layout: { splitHeights: { "1": 30 }, activeLevels: [1] },
  summaries: { [COLUMN]: "count" },
  treeView: true,
};

const getWindow = () => useWindowStore.getState().windows[WINDOW_IDENTIFIER];

/** Opens the window with parent and child shown and a custom child height, then renders the hook. */
const renderApplyViewState = (tabId = TAB_ID) => {
  const store = useWindowStore.getState();
  store.setNavigationActiveLevels(WINDOW_IDENTIFIER, [0, 1]);
  store.setNavigationSplitHeight(WINDOW_IDENTIFIER, 1, 70);
  return renderHook(() => useApplyViewState({ windowIdentifier: WINDOW_IDENTIFIER, tabId }));
};

describe("useApplyViewState", () => {
  beforeEach(() => {
    useWindowStore.getState().cleanState();
    jest.clearAllMocks();
  });

  it("captures the current window layout", () => {
    const { result } = renderApplyViewState();

    expect(result.current.currentLayout).toEqual({ splitHeights: { 1: 70 }, activeLevels: [0, 1] });
  });

  it("reopens the child panel at the saved height when the child is collapsed", () => {
    const { result } = renderApplyViewState();
    useWindowStore.getState().setNavigationActiveLevels(WINDOW_IDENTIFIER, [0]);

    act(() =>
      result.current.handleApplyView({ ...VIEW_STATE, layout: { splitHeights: { "1": 30 }, activeLevels: [0, 1] } })
    );

    expect(getWindow().navigation.activeLevels).toEqual([0, 1]);
    expect(getWindow().navigation.splitHeights).toEqual({ 1: 30 });
  });

  it("applies the grid state and the whole layout of a view the user picks", () => {
    const { result } = renderApplyViewState();

    act(() => result.current.handleApplyView(VIEW_STATE));

    const table = getWindow().tabs[TAB_ID].table;
    expect(table).toMatchObject({
      filters: VIEW_STATE.filters,
      visibility: VIEW_STATE.visibility,
      sorting: VIEW_STATE.sorting,
      order: VIEW_STATE.order,
      isImplicitFilterApplied: false,
      sizing: VIEW_STATE.sizing,
      pinning: VIEW_STATE.pinning,
      summaries: VIEW_STATE.summaries,
      treeView: true,
    });
    expect(getWindow().navigation.splitHeights).toEqual({ 1: 30 });
    expect(getWindow().navigation.activeLevels).toEqual([1]);
  });

  it("restores the default layout for a view without one", () => {
    const { result } = renderApplyViewState();
    useWindowStore.getState().setNavigationActiveLevels(WINDOW_IDENTIFIER, [1]);

    act(() => result.current.handleApplyView({ ...VIEW_STATE, layout: undefined, sizing: {}, pinning: {} }));

    expect(getWindow().navigation.splitHeights).toEqual({});
    expect(getWindow().navigation.activeLevels).toEqual([0, 1]);
    expect(getWindow().tabs[TAB_ID].table.sizing).toEqual({});
  });

  it("never moves the active levels when the default view is applied on open", () => {
    const { result } = renderApplyViewState();

    act(() => result.current.handleAutoApplyView(VIEW_STATE));

    expect(getWindow().navigation.splitHeights).toEqual({ 1: 30 });
    expect(getWindow().navigation.activeLevels).toEqual([0, 1]);
  });

  it("keeps the heights when the default view has no layout", () => {
    const { result } = renderApplyViewState();

    act(() => result.current.handleAutoApplyView({ ...VIEW_STATE, layout: undefined }));

    expect(getWindow().navigation.splitHeights).toEqual({ 1: 70 });
    expect(getWindow().tabs[TAB_ID].table.sizing).toEqual(VIEW_STATE.sizing);
  });

  it("falls back to the default grouping, widths, pinning and summaries", () => {
    const { result } = renderApplyViewState();
    const partialState = {
      ...VIEW_STATE,
      grouping: undefined,
      sizing: undefined,
      pinning: undefined,
      summaries: undefined,
      treeView: undefined,
    };

    act(() => result.current.handleApplyView(partialState as unknown as AppliedViewState));

    expect(getWindow().tabs[TAB_ID].table).toMatchObject({
      grouping: [],
      sizing: {},
      pinning: DEFAULT_COLUMN_PINNING,
      summaries: {},
      treeView: false,
    });
  });

  it("applies a stored column configuration", () => {
    const { result } = renderApplyViewState();

    act(() => result.current.handleApplyColumnConfiguration({ sizing: { [COLUMN]: 90 } }));

    expect(getWindow().tabs[TAB_ID].table.sizing).toEqual({ [COLUMN]: 90 });
  });

  it("clears the stored column configuration when going back to the standard view", () => {
    const { result } = renderApplyViewState();

    act(() => result.current.handleResetToStandard());

    expect(clearGridConfiguration).toHaveBeenCalledWith(WINDOW_IDENTIFIER, TAB_ID);
  });

  it("does nothing without a tab", () => {
    const { result } = renderApplyViewState("");

    act(() => {
      result.current.handleApplyView(VIEW_STATE);
      result.current.handleApplyColumnConfiguration({ sizing: {} });
      result.current.handleResetToStandard();
    });

    expect(getWindow().tabs).toEqual({});
    expect(clearGridConfiguration).not.toHaveBeenCalled();
  });
});

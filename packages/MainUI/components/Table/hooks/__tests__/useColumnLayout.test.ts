import { act, renderHook } from "@testing-library/react";
import { useWindowStore } from "@/stores/windowStore";
import { scheduleGridConfigurationSave } from "@/utils/savedViews/gridConfiguration";
import { DEFAULT_COLUMN_PINNING, FIXED_PINNED_COLUMNS } from "@/utils/table/columnState";
import { useColumnLayout } from "../useColumnLayout";

jest.mock("@/utils/savedViews/gridConfiguration", () => ({
  scheduleGridConfigurationSave: jest.fn(),
}));

const WINDOW_IDENTIFIER = "143_1";
const TAB_ID = "186";
const COLUMN_A = "Document No.";
const COLUMN_B = "Business Partner";

type HookProps = Parameters<typeof useColumnLayout>[0];

/** Renders the hook with sensible defaults; `overrides` replaces any parameter. */
const renderColumnLayout = (overrides: Partial<HookProps> = {}) => {
  const props: HookProps = {
    windowIdentifier: WINDOW_IDENTIFIER,
    tabId: TAB_ID,
    tabLevel: 0,
    columnOrder: [COLUMN_A, COLUMN_B],
    onColumnOrderChange: jest.fn(),
    ...overrides,
  };
  return { props, ...renderHook(() => useColumnLayout(props)) };
};

const getTableState = () => useWindowStore.getState().windows[WINDOW_IDENTIFIER]?.tabs[TAB_ID]?.table;

describe("useColumnLayout", () => {
  beforeEach(() => {
    useWindowStore.getState().cleanState();
    jest.clearAllMocks();
  });

  it("starts with default widths and only the fixed pinned columns", () => {
    const { result } = renderColumnLayout();

    expect(result.current.columnSizing).toEqual({});
    expect(result.current.columnPinning).toEqual(DEFAULT_COLUMN_PINNING);
  });

  it("stores a resize and schedules the save", () => {
    const { result } = renderColumnLayout();

    act(() => result.current.handleColumnSizingChange({ [COLUMN_A]: 200 }));

    expect(getTableState()?.sizing).toEqual({ [COLUMN_A]: 200 });
    expect(result.current.columnSizing).toEqual({ [COLUMN_A]: 200 });
    expect(scheduleGridConfigurationSave).toHaveBeenCalledWith(WINDOW_IDENTIFIER, TAB_ID);
  });

  it("keeps the fixed columns when the user pins one", () => {
    const { result } = renderColumnLayout();

    act(() => result.current.handleColumnPinningChange((prev) => ({ ...prev, left: [COLUMN_B] })));

    expect(result.current.columnPinning).toEqual({ left: [...FIXED_PINNED_COLUMNS, COLUMN_B], right: [] });
    expect(scheduleGridConfigurationSave).toHaveBeenCalledTimes(1);
  });

  it("schedules the save only for a reorder made by the user", () => {
    const { result, props } = renderColumnLayout();

    act(() => result.current.handleColumnOrderChange([COLUMN_A, COLUMN_B, "Total"]));
    expect(scheduleGridConfigurationSave).not.toHaveBeenCalled();

    act(() => result.current.handleColumnOrderChange((prev) => [...prev].reverse()));
    expect(props.onColumnOrderChange).toHaveBeenLastCalledWith([COLUMN_B, COLUMN_A]);
    expect(scheduleGridConfigurationSave).toHaveBeenCalledTimes(1);
  });

  it("does not schedule a save without a window", () => {
    const { result } = renderColumnLayout({ windowIdentifier: "" });

    act(() => result.current.scheduleColumnSave());

    expect(scheduleGridConfigurationSave).not.toHaveBeenCalled();
  });
});

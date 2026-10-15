import { act, renderHook } from "@testing-library/react";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import { clearPreferences, savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { GROUPING_ENABLED_PREFERENCE, GROUPING_MAX_RECORDS_PREFERENCE } from "@/utils/table/grouping";
import { useTableGrouping } from "../useTableGrouping";

const mockGetLabel = jest.fn((key: string) => key);
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ getLabel: mockGetLabel }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));

const WINDOW_ID = "143";
const COLUMN_ID = "Business Partner";
const FIELD = "businessPartner";
const MAX_RECORDS = 3;
const COLUMNS = [{ id: COLUMN_ID, columnName: FIELD }] as Column[];

const makeRecords = (...values: string[]): EntityData[] =>
  values.map((value, index) => ({ id: `rec-${index}`, [FIELD]: value }) as EntityData);

type HookProps = Parameters<typeof useTableGrouping>[0];

/** Renders the hook with sensible defaults; `overrides` replaces any parameter. */
const renderGrouping = (overrides: Partial<HookProps> = {}) => {
  const props: HookProps = {
    windowId: WINDOW_ID,
    columns: COLUMNS,
    grouping: [],
    setGrouping: jest.fn(),
    setSorting: jest.fn(),
    records: [],
    loading: false,
    shouldUseTreeMode: false,
    canChangeGrouping: () => true,
    showWarning: jest.fn(),
    ...overrides,
  };
  const hook = renderHook((current: HookProps) => useTableGrouping(current), { initialProps: props });
  return { ...hook, props };
};

describe("useTableGrouping", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({ [GROUPING_ENABLED_PREFERENCE]: "Y", [GROUPING_MAX_RECORDS_PREFERENCE]: String(MAX_RECORDS) });
    mockGetLabel.mockImplementation((key: string) => key);
  });

  afterEach(() => clearPreferences());

  it("exposes the active grouping when the window enables it", () => {
    const { result } = renderGrouping({ grouping: [COLUMN_ID] });

    expect(result.current.isGroupingAvailable).toBe(true);
    expect(result.current.groupedColumnId).toBe(COLUMN_ID);
    expect(result.current.activeGrouping).toEqual([COLUMN_ID]);
  });

  it("is not available in tree mode nor without the preference", () => {
    const { result } = renderGrouping({ grouping: [COLUMN_ID], shouldUseTreeMode: true });
    expect(result.current.isGroupingAvailable).toBe(false);
    expect(result.current.activeGrouping).toEqual([]);

    clearPreferences();
    const { result: disabled } = renderGrouping({ grouping: [COLUMN_ID] });
    expect(disabled.current.isGroupingAvailable).toBe(false);
    expect(disabled.current.groupedColumnId).toBeUndefined();
  });

  it("groups by a column sorting by it first", () => {
    const { result, props } = renderGrouping();

    act(() => result.current.groupBy(COLUMN_ID));

    expect(props.setSorting).toHaveBeenCalledWith([{ id: COLUMN_ID, desc: false }]);
    expect(props.setGrouping).toHaveBeenCalledWith([COLUMN_ID]);
  });

  it("ungroups", () => {
    const { result, props } = renderGrouping({ grouping: [COLUMN_ID] });

    act(() => result.current.ungroup());

    expect(props.setGrouping).toHaveBeenCalledWith([]);
  });

  it("does not change the grouping while rows are being edited", () => {
    const { result, props } = renderGrouping({ grouping: [COLUMN_ID], canChangeGrouping: () => false });

    act(() => {
      result.current.groupBy(COLUMN_ID);
      result.current.ungroup();
    });

    expect(props.setGrouping).not.toHaveBeenCalled();
    expect(props.setSorting).not.toHaveBeenCalled();
  });

  it("clears the grouping with the classic message when the records exceed the limit", () => {
    mockGetLabel.mockImplementation((key: string) =>
      key === "OBUIAPP_MaxGroupingReached" ? "There are more than %0 records" : key
    );
    const { props } = renderGrouping({ grouping: [COLUMN_ID], records: makeRecords("a", "b", "c", "d") });

    expect(props.setGrouping).toHaveBeenCalledWith([]);
    expect(props.showWarning).toHaveBeenCalledWith(`There are more than ${MAX_RECORDS} records`);
  });

  it("waits for the data to finish loading before checking the limit", () => {
    const { props } = renderGrouping({
      grouping: [COLUMN_ID],
      records: makeRecords("a", "b", "c", "d"),
      loading: true,
    });

    expect(props.setGrouping).not.toHaveBeenCalled();
  });

  it("opens the first group once the regrouped data arrives", () => {
    const staleRecords = makeRecords("x");
    const { result, rerender, props } = renderGrouping({ grouping: [COLUMN_ID], records: staleRecords });
    expect(result.current.groupExpanded).toEqual({});

    rerender({ ...props, records: staleRecords, loading: true });
    expect(result.current.groupExpanded).toEqual({});

    rerender({ ...props, records: makeRecords("b", "b", "c"), loading: false });
    expect(result.current.groupExpanded).toEqual({ [`${COLUMN_ID}:b`]: true });
  });

  it("uses the column id as field when the column is unknown", () => {
    const { result, rerender, props } = renderGrouping({ grouping: [COLUMN_ID], columns: [] });

    rerender({ ...props, records: [{ id: "r", [COLUMN_ID]: "v" } as EntityData] });

    expect(result.current.groupExpanded).toEqual({ [`${COLUMN_ID}:v`]: true });
  });

  it("does not reopen the first group after the user collapses it", () => {
    const { result, rerender, props } = renderGrouping({ grouping: [COLUMN_ID], records: [] });
    const records = makeRecords("b");
    rerender({ ...props, records });
    act(() => result.current.handleGroupExpandedChange({}));

    rerender({ ...props, records: [...records] });

    expect(result.current.groupExpanded).toEqual({});
  });

  it("collapses groups when ungrouped", () => {
    const { result, rerender, props } = renderGrouping({ grouping: [COLUMN_ID] });
    act(() => result.current.handleGroupExpandedChange({ [`${COLUMN_ID}:b`]: true }));

    rerender({ ...props, grouping: [] });

    expect(result.current.groupExpanded).toEqual({});
  });

  it("applies expanded updaters", () => {
    const { result } = renderGrouping({ grouping: [COLUMN_ID] });

    act(() => result.current.handleGroupExpandedChange((previous) => ({ ...(previous as object), g1: true })));

    expect(result.current.groupExpanded).toEqual({ g1: true });
  });

  it("resolves menu labels from the AD messages with local fallback", () => {
    mockGetLabel.mockImplementation((key: string) => (key === "OBUIAPP_GroupBy" ? "Group by ${title}" : key));
    const { result } = renderGrouping();

    expect(result.current.getGroupByLabel(COLUMN_ID)).toBe(`Group by ${COLUMN_ID}`);
    expect(result.current.getUngroupLabel()).toBe("t:table.ungroup");
  });
});

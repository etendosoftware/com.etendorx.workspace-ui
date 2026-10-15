import { FieldType, type EntityData } from "@workspaceui/api-client/src/api/types";
import { clearPreferences, savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import {
  DEFAULT_GROUPING_MAX_RECORDS,
  GROUP_BY_LABEL,
  GROUPING_ENABLED_PREFERENCE,
  GROUPING_MAX_RECORDS_PREFERENCE,
  GROUPING_TRANSLATION_KEYS,
  MAX_GROUPING_REACHED_LABEL,
  aggregateSummary,
  buildFirstGroupExpandedState,
  buildGroupedSortBy,
  canGroupByColumn,
  exceedsGroupingLimit,
  formatGroupingLabel,
  getActiveGroupColumnId,
  getGroupDisplayValue,
  getGroupingMaxRecords,
  getGroupingValue,
  isGroupRow,
  isGroupingEnabled,
  resolveGroupingLabel,
} from "../grouping";

const WINDOW_ID = "143";
const OTHER_WINDOW_ID = "999";
const FIELD = "businessPartner";
const COLUMN_ID = "Business Partner";
const BP_ID = "bp-1";

/** Stores the given preferences the way the login flow does (localStorage). */
const givenPreferences = (prefs: Record<string, unknown>) => savePreferences(prefs);

/** Builds a grid record with a foreign key value and its identifier. */
const makeRecord = (id: string, identifier?: string, extra: Record<string, unknown> = {}): EntityData =>
  ({ id: `rec-${id}`, [FIELD]: id, [`${FIELD}$_identifier`]: identifier, ...extra }) as EntityData;

describe("grouping utils", () => {
  beforeEach(() => installLocalStorageMock());
  afterEach(() => clearPreferences());

  describe("isGroupingEnabled", () => {
    it("is enabled when the window-scoped preference is Y", () => {
      givenPreferences({ [`${GROUPING_ENABLED_PREFERENCE}_${WINDOW_ID}`]: "Y" });
      expect(isGroupingEnabled(WINDOW_ID)).toBe(true);
      expect(isGroupingEnabled(OTHER_WINDOW_ID)).toBe(false);
    });

    it("falls back to the global preference", () => {
      givenPreferences({ [GROUPING_ENABLED_PREFERENCE]: "Y" });
      expect(isGroupingEnabled(OTHER_WINDOW_ID)).toBe(true);
    });

    it("is disabled when the preference is missing or not Y", () => {
      expect(isGroupingEnabled(WINDOW_ID)).toBe(false);
      givenPreferences({ [GROUPING_ENABLED_PREFERENCE]: "N" });
      expect(isGroupingEnabled(WINDOW_ID)).toBe(false);
    });
  });

  describe("getGroupingMaxRecords", () => {
    it("uses the preference value when it is a positive integer", () => {
      givenPreferences({ [`${GROUPING_MAX_RECORDS_PREFERENCE}_${WINDOW_ID}`]: "500" });
      expect(getGroupingMaxRecords(WINDOW_ID)).toBe(500);
    });

    it.each(["", "abc", "0", "-3", "10.5"])("defaults to the classic limit for an invalid value %p", (value) => {
      givenPreferences({ [GROUPING_MAX_RECORDS_PREFERENCE]: value });
      expect(getGroupingMaxRecords(WINDOW_ID)).toBe(DEFAULT_GROUPING_MAX_RECORDS);
    });

    it("defaults to the classic limit without preference", () => {
      expect(getGroupingMaxRecords(WINDOW_ID)).toBe(DEFAULT_GROUPING_MAX_RECORDS);
    });
  });

  describe("getActiveGroupColumnId", () => {
    beforeEach(() => givenPreferences({ [GROUPING_ENABLED_PREFERENCE]: "Y" }));

    it("returns the first grouped column", () => {
      expect(getActiveGroupColumnId([COLUMN_ID], WINDOW_ID, false)).toBe(COLUMN_ID);
    });

    it("ignores grouping in tree mode, when empty or when the window disables it", () => {
      expect(getActiveGroupColumnId([COLUMN_ID], WINDOW_ID, true)).toBeUndefined();
      expect(getActiveGroupColumnId([], WINDOW_ID, false)).toBeUndefined();
      expect(getActiveGroupColumnId(undefined, WINDOW_ID, false)).toBeUndefined();
      clearPreferences();
      expect(getActiveGroupColumnId([COLUMN_ID], WINDOW_ID, false)).toBeUndefined();
    });
  });

  describe("canGroupByColumn", () => {
    it("accepts data columns", () => {
      expect(canGroupByColumn({ id: COLUMN_ID, type: FieldType.TABLEDIR })).toBe(true);
    });

    it.each([
      ["missing column", null],
      ["column without id", { type: FieldType.TEXT }],
      ["display column", { id: "custom", columnDefType: "display" }],
      ["selection column", { id: "mrt-row-select" }],
      ["actions column", { id: "actions" }],
      ["boolean column", { id: "active", type: FieldType.BOOLEAN }],
      ["image column", { id: "logo", type: FieldType.IMAGE }],
    ])("rejects a %s", (_label, column) => {
      expect(canGroupByColumn(column)).toBe(false);
    });
  });

  it("detects when the loaded records exceed the limit", () => {
    expect(exceedsGroupingLimit(1001, 1000)).toBe(true);
    expect(exceedsGroupingLimit(1000, 1000)).toBe(false);
  });

  describe("buildGroupedSortBy", () => {
    it("sorts by the grouped field when there is no other sort", () => {
      expect(buildGroupedSortBy(FIELD)).toBe(FIELD);
      expect(buildGroupedSortBy(FIELD, null)).toBe(FIELD);
    });

    it("keeps the direction of a sort on the grouped field", () => {
      expect(buildGroupedSortBy(FIELD, { id: FIELD, desc: true })).toBe(`-${FIELD}`);
      expect(buildGroupedSortBy(FIELD, { id: FIELD, desc: false })).toBe(FIELD);
    });

    it("sorts inside each group by another column", () => {
      expect(buildGroupedSortBy(FIELD, { id: "documentNo", desc: true })).toBe(`${FIELD},-documentNo`);
      expect(buildGroupedSortBy(FIELD, { id: "documentNo", desc: false })).toBe(`${FIELD},documentNo`);
    });
  });

  describe("group values", () => {
    it("groups by the raw value and shows the identifier", () => {
      const record = makeRecord(BP_ID, "Customer A");
      expect(getGroupingValue(record, FIELD)).toBe(BP_ID);
      expect(getGroupDisplayValue(record, FIELD)).toBe("Customer A");
    });

    it("shows the raw value without identifier and an empty text without value", () => {
      expect(getGroupDisplayValue(makeRecord("CO"), FIELD)).toBe("CO");
      expect(getGroupDisplayValue({ id: "x" } as EntityData, FIELD)).toBe("");
      expect(getGroupDisplayValue(undefined, FIELD)).toBe("");
      expect(getGroupingValue(undefined, FIELD)).toBeNull();
    });
  });

  describe("buildFirstGroupExpandedState", () => {
    it("opens the group of the first record using TanStack's grouped row id", () => {
      expect(buildFirstGroupExpandedState(COLUMN_ID, makeRecord(BP_ID), FIELD)).toEqual({
        [`${COLUMN_ID}:${BP_ID}`]: true,
      });
    });

    it("opens nothing without records", () => {
      expect(buildFirstGroupExpandedState(COLUMN_ID, undefined, FIELD)).toEqual({});
    });
  });

  describe("aggregateSummary", () => {
    const AMOUNT = "grandTotalAmount";
    const records = [10, 20, null, "30"].map((amount, index) =>
      makeRecord(String(index), undefined, { [AMOUNT]: amount })
    );

    it.each([
      ["sum", 60],
      ["avg", 20],
      ["count", 3],
      ["min", 10],
      ["max", 30],
    ] as const)("computes %s over non-empty values", (type, expected) => {
      expect(aggregateSummary(type, records, AMOUNT)).toBe(expected);
    });

    it.each(["avg", "min", "max"] as const)("returns null for %s without values", (type) => {
      expect(aggregateSummary(type, [], AMOUNT)).toBeNull();
    });

    it("returns zero for sum and count without values", () => {
      expect(aggregateSummary("sum", [], AMOUNT)).toBe(0);
      expect(aggregateSummary("count", [], AMOUNT)).toBe(0);
    });
  });

  describe("labels", () => {
    const CLASSIC_GROUP_BY = "Group by ${title}";
    const t = jest.fn((key: string) => `local:${key}`);

    it("replaces classic and local placeholders", () => {
      expect(formatGroupingLabel(CLASSIC_GROUP_BY, { title: COLUMN_ID })).toBe(`Group by ${COLUMN_ID}`);
      expect(formatGroupingLabel("Agrupar por {column}", { title: COLUMN_ID })).toBe(`Agrupar por ${COLUMN_ID}`);
      expect(formatGroupingLabel("More than %0", { count: 1000 })).toBe("More than 1000");
      expect(formatGroupingLabel("More than {count}", { count: 5 })).toBe("More than 5");
      expect(formatGroupingLabel("Ungroup")).toBe("Ungroup");
    });

    it("uses the backend AD message when available", () => {
      const getLabel = jest.fn(() => CLASSIC_GROUP_BY);
      const label = resolveGroupingLabel(getLabel, t, GROUP_BY_LABEL, GROUPING_TRANSLATION_KEYS.GROUP_BY, {
        title: COLUMN_ID,
      });
      expect(label).toBe(`Group by ${COLUMN_ID}`);
      expect(getLabel).toHaveBeenCalledWith(GROUP_BY_LABEL);
      expect(t).not.toHaveBeenCalled();
    });

    it.each([
      ["the key itself", (key: string) => key],
      ["an empty text", () => ""],
    ])("falls back to the local translation when the backend returns %s", (_label, getLabel) => {
      const label = resolveGroupingLabel(
        getLabel,
        t,
        MAX_GROUPING_REACHED_LABEL,
        GROUPING_TRANSLATION_KEYS.MAX_GROUPING_REACHED
      );
      expect(label).toBe(`local:${GROUPING_TRANSLATION_KEYS.MAX_GROUPING_REACHED}`);
    });
  });

  it("identifies group header rows", () => {
    expect(isGroupRow({ getIsGrouped: () => true })).toBe(true);
    expect(isGroupRow({ getIsGrouped: () => false })).toBe(false);
    expect(isGroupRow({})).toBe(false);
  });
});

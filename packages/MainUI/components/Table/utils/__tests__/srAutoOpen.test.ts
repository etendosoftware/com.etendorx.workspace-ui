import { getSrAutoOpenDecision, ROOT_TRACKING_KEY } from "../srAutoOpen";
import { UIPattern as UIPatternEnum, type EntityData, type Tab } from "@workspaceui/api-client/src/api/types";

const makeTab = (overrides: Partial<Tab> = {}): Tab =>
  ({
    id: "tab-1",
    defaultEditMode: true,
    parentColumns: [] as string[],
    fields: {},
    ...overrides,
  }) as unknown as Tab;

const makeRecord = (id: string | number = "rec-1"): EntityData => ({ id }) as unknown as EntityData;

const baseInputs = {
  uIPattern: UIPatternEnum.EDIT_ONLY,
  tab: makeTab(),
  loading: false,
  displayRecords: [makeRecord("rec-1")],
  parentTab: null,
  parentRecord: null,
};

describe("getSrAutoOpenDecision", () => {
  describe("does NOT open when", () => {
    it("uIPattern is not EDIT_ONLY", () => {
      expect(getSrAutoOpenDecision({ ...baseInputs, uIPattern: UIPatternEnum.READ_ONLY })).toEqual({ open: false });
    });

    it("tab.defaultEditMode is false", () => {
      expect(getSrAutoOpenDecision({ ...baseInputs, tab: makeTab({ defaultEditMode: false }) })).toEqual({
        open: false,
      });
    });

    it("loading is true (records may not be final yet)", () => {
      expect(getSrAutoOpenDecision({ ...baseInputs, loading: true })).toEqual({ open: false });
    });

    it("displayRecords is empty", () => {
      expect(getSrAutoOpenDecision({ ...baseInputs, displayRecords: [] })).toEqual({ open: false });
    });

    it("parent exists and tab is a 1:1 ID-extension (Tab.tsx handles it)", () => {
      // 1:1 ID-extension = parentColumns includes the keyFieldName.
      // With empty fields, getKeyFieldName returns undefined, so the helper falls
      // through. Force the 1:1 case by giving parentColumns a non-empty entry that
      // also matches the key column.
      const tab = makeTab({
        parentColumns: ["myId"],
        fields: {
          myId: {
            column: { keyColumn: true },
            columnName: "myId",
            inputName: "inpmyId",
            hqlName: "myId",
          } as any,
        },
      });
      expect(
        getSrAutoOpenDecision({
          ...baseInputs,
          tab,
          parentTab: makeTab({ id: "parent" }),
          parentRecord: { id: "p1" },
        })
      ).toEqual({ open: false });
    });

    it("parent exists but parentRecord.id is missing (waiting for parent selection)", () => {
      expect(
        getSrAutoOpenDecision({
          ...baseInputs,
          parentTab: makeTab({ id: "parent" }),
          parentRecord: null,
        })
      ).toEqual({ open: false });
    });
  });

  describe("opens when", () => {
    it("root SR (no parent): trackingKey is the root sentinel", () => {
      const decision = getSrAutoOpenDecision({ ...baseInputs, displayRecords: [makeRecord("client-1")] });
      expect(decision).toEqual({ open: true, recordId: "client-1", trackingKey: ROOT_TRACKING_KEY });
    });

    it("logical SR (parent + non-ID-extension): trackingKey is the parent id, recordId is from displayRecords[0]", () => {
      // Logical SR: parentColumns has FK that is NOT the key column → isSrOneToOneExtension returns false.
      const tab = makeTab({
        parentColumns: ["organization"],
        fields: {
          id: { column: { keyColumn: true }, columnName: "id", inputName: "inpid", hqlName: "id" } as any,
        },
      });
      const decision = getSrAutoOpenDecision({
        ...baseInputs,
        tab,
        parentTab: makeTab({ id: "parent" }),
        parentRecord: { id: "parent-7" },
        displayRecords: [makeRecord("child-9")],
      });
      expect(decision).toEqual({ open: true, recordId: "child-9", trackingKey: "parent-7" });
    });

    it("coerces numeric ids to strings in both recordId and trackingKey", () => {
      const tab = makeTab({
        parentColumns: ["organization"],
        fields: {
          id: { column: { keyColumn: true }, columnName: "id", inputName: "inpid", hqlName: "id" } as any,
        },
      });
      const decision = getSrAutoOpenDecision({
        ...baseInputs,
        tab,
        parentTab: makeTab({ id: "parent" }),
        parentRecord: { id: 42 },
        displayRecords: [makeRecord(99)],
      });
      expect(decision).toEqual({ open: true, recordId: "99", trackingKey: "42" });
    });

    it("uses the first record when multiple are present", () => {
      const decision = getSrAutoOpenDecision({
        ...baseInputs,
        displayRecords: [makeRecord("first"), makeRecord("second")],
      });
      expect(decision).toEqual({ open: true, recordId: "first", trackingKey: ROOT_TRACKING_KEY });
    });
  });
});

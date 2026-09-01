import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { getSingleRecordAutoSelectDecision, type SingleRecordAutoSelectInputs } from "../singleRecordAutoSelect";

const RECORD_ID = "record-1";

const makeRecord = (id: string | number): EntityData => ({ id }) as unknown as EntityData;

const baseInputs: SingleRecordAutoSelectInputs = {
  loading: false,
  isVisible: true,
  isTabCollapsed: false,
  records: [makeRecord(RECORD_ID)],
  hasMoreRecords: false,
  srAutoOpens: false,
  isNewRecordMode: false,
  hasEditingRows: false,
};

const decide = (overrides: Partial<SingleRecordAutoSelectInputs> = {}) =>
  getSingleRecordAutoSelectDecision({ ...baseInputs, ...overrides });

describe("getSingleRecordAutoSelectDecision", () => {
  describe("does NOT select when", () => {
    it("the load is still in flight", () => {
      expect(decide({ loading: true })).toEqual({ select: false });
    });

    it("the grid is not visible (form view)", () => {
      expect(decide({ isVisible: false })).toEqual({ select: false });
    });

    it("the whole tab is collapsed, even though its grid pane reports visible", () => {
      expect(decide({ isTabCollapsed: true, isVisible: true })).toEqual({ select: false });
    });

    it("the page is full, so the result set may hold more matches", () => {
      expect(decide({ hasMoreRecords: true })).toEqual({ select: false });
    });

    it("there are no records", () => {
      expect(decide({ records: [] })).toEqual({ select: false });
    });

    it("there is more than one record", () => {
      expect(decide({ records: [makeRecord("a"), makeRecord("b")] })).toEqual({ select: false });
    });

    it("the SR / Default Edit Mode path is opening the form", () => {
      expect(decide({ srAutoOpens: true })).toEqual({ select: false });
    });

    it("the form is creating a new record", () => {
      expect(decide({ isNewRecordMode: true })).toEqual({ select: false });
    });

    it("a row is being inline-edited", () => {
      expect(decide({ hasEditingRows: true })).toEqual({ select: false });
    });

    it("that record is already the stored selection (deep link wins)", () => {
      expect(decide({ storedSelectedId: RECORD_ID })).toEqual({ select: false });
    });

    it("the rule already selected that record (a manual deselect is not undone)", () => {
      expect(decide({ lastAutoSelectedId: RECORD_ID })).toEqual({ select: false });
    });
  });

  describe("selects when", () => {
    it("a settled load yields exactly one record", () => {
      expect(decide()).toEqual({ select: true, recordId: RECORD_ID });
    });

    it("the stored selection points outside the result set (filtering down to one)", () => {
      expect(decide({ storedSelectedId: "some-other-record" })).toEqual({
        select: true,
        recordId: RECORD_ID,
      });
    });

    it("the rule last selected a different record (the post-delete survivor)", () => {
      expect(decide({ lastAutoSelectedId: "deleted-record" })).toEqual({
        select: true,
        recordId: RECORD_ID,
      });
    });

    it("coercing a numeric record id to a string", () => {
      expect(decide({ records: [makeRecord(42)] })).toEqual({ select: true, recordId: "42" });
    });
  });
});

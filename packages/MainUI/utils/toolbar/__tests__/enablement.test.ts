import {
  isAttachmentBlockedByPreference,
  isCloneBlockedByForm,
  isDeleteBlocked,
  isExportBlocked,
  isPreferenceNo,
} from "../enablement";
import { UIPattern } from "@workspaceui/api-client/src/api/types";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

const makeTab = (extra: Record<string, unknown> = {}) =>
  ({ id: "t1", window: "W1", uIPattern: UIPattern.STANDARD, ...extra }) as unknown as Tab;
const draft: EntityData = { id: "r1" };

const setPreferences = (prefs: Record<string, unknown>) => savePreferences(prefs);
describe("toolbar enablement rules", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  describe("isPreferenceNo", () => {
    it("is false without the preference", () => {
      expect(isPreferenceNo("AllowDelete", "W1")).toBe(false);
    });

    it("is true when the preference is N, globally or for the window", () => {
      setPreferences({ AllowDelete: "N" });
      expect(isPreferenceNo("AllowDelete", "W1")).toBe(true);
      setPreferences({ AllowDelete_W1: "N" });
      expect(isPreferenceNo("AllowDelete", "W1")).toBe(true);
      expect(isPreferenceNo("AllowDelete", "W2")).toBe(false);
    });

    it("is false when the preference is Y", () => {
      setPreferences({ AllowDelete: "Y" });
      expect(isPreferenceNo("AllowDelete", "W1")).toBe(false);
    });
  });

  describe("isDeleteBlocked", () => {
    const base = { tab: makeTab(), selectedRecords: [draft], isNewRecord: false, hasParentRecordSelected: true };

    it("allows deleting a draft record of a deletable table", () => {
      expect(isDeleteBlocked(base)).toBe(false);
    });

    it("blocks processed or read-only records, also when only one of several is", () => {
      expect(isDeleteBlocked({ ...base, selectedRecords: [{ id: "r1", _readOnly: true }] })).toBe(true);
      expect(isDeleteBlocked({ ...base, selectedRecords: [draft, { id: "r2", _readOnly: true }] })).toBe(true);
    });

    it("blocks records that are not saved yet and a form in creation", () => {
      expect(isDeleteBlocked({ ...base, selectedRecords: [{ id: "r1", _new: true }] })).toBe(true);
      expect(isDeleteBlocked({ ...base, isNewRecord: true })).toBe(true);
    });

    it("blocks tables that do not allow deleting", () => {
      expect(isDeleteBlocked({ ...base, tab: makeTab({ deletableRecords: false }) })).toBe(true);
      expect(isDeleteBlocked({ ...base, tab: makeTab({ deletableRecords: true }) })).toBe(false);
    });

    it("blocks read-only and single-record tabs", () => {
      expect(isDeleteBlocked({ ...base, tab: makeTab({ uIPattern: UIPattern.READ_ONLY }) })).toBe(true);
      expect(isDeleteBlocked({ ...base, tab: makeTab({ uIPattern: UIPattern.EDIT_ONLY }) })).toBe(true);
    });

    it("blocks a child tab without its parent record", () => {
      expect(isDeleteBlocked({ ...base, hasParentRecordSelected: false })).toBe(true);
    });

    it("blocks it when the AllowDelete preference is No", () => {
      setPreferences({ AllowDelete: "N" });
      expect(isDeleteBlocked(base)).toBe(true);
    });
  });

  describe("isExportBlocked", () => {
    const base = { tab: makeTab(), isFormView: false };

    it("allows exporting a grid with rows", () => {
      expect(isExportBlocked(base)).toBe(false);
      expect(isExportBlocked({ ...base, hasGridRows: true })).toBe(false);
    });

    it("blocks the form view, the tree and an empty grid", () => {
      expect(isExportBlocked({ ...base, isFormView: true })).toBe(true);
      expect(isExportBlocked({ ...base, isTreeView: true })).toBe(true);
      expect(isExportBlocked({ ...base, hasGridRows: false })).toBe(true);
    });

    it("blocks it when the ExportToCsv preference is No", () => {
      setPreferences({ ExportToCsv: "N" });
      expect(isExportBlocked(base)).toBe(true);
    });
  });

  describe("isCloneBlockedByForm", () => {
    it("blocks with unsaved changes or a new record only", () => {
      expect(isCloneBlockedByForm({ hasFormChanges: false, isNewRecord: false })).toBe(false);
      expect(isCloneBlockedByForm({ hasFormChanges: true, isNewRecord: false })).toBe(true);
      expect(isCloneBlockedByForm({ hasFormChanges: false, isNewRecord: true })).toBe(true);
    });
  });

  describe("isAttachmentBlockedByPreference", () => {
    it("follows the AllowAttachment preference", () => {
      expect(isAttachmentBlockedByPreference(makeTab())).toBe(false);
      setPreferences({ AllowAttachment: "N" });
      expect(isAttachmentBlockedByPreference(makeTab())).toBe(true);
    });
  });
});

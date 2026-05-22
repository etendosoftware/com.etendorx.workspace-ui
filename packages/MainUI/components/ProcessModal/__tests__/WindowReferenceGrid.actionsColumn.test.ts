import { UIPattern } from "@workspaceui/api-client/src/api/types";
import {
  buildEnableEditingPredicate,
  isColumnEditable,
  isPersistedRow,
} from "../WindowReferenceGrid";

describe("isPersistedRow", () => {
  it("returns true when row.original.id is defined and truthy", () => {
    expect(isPersistedRow({ original: { id: "abc" } })).toBe(true);
  });

  it("returns false for create-row / locally-added rows without persisted id", () => {
    expect(isPersistedRow({ original: { _locallyAdded: true } })).toBe(false);
    expect(isPersistedRow({ original: {} })).toBe(false);
    expect(isPersistedRow({})).toBe(false);
  });
});

describe("isColumnEditable", () => {
  const baseField = { columnName: "amount", hqlName: "amount", name: "Amount" };

  it("rejects MRT structural columns regardless of metadata", () => {
    expect(isColumnEditable({ id: "mrt-row-actions" }, [baseField], {})).toBe(false);
    expect(isColumnEditable({ id: "mrt-row-select" }, [baseField], {})).toBe(false);
  });

  it("honours explicit enableEditing=false on the column", () => {
    expect(isColumnEditable({ accessorKey: "amount", enableEditing: false }, [baseField], {})).toBe(false);
  });

  it("returns true when the matched field is editable and not in the read-only map", () => {
    expect(isColumnEditable({ accessorKey: "amount" }, [baseField], {})).toBe(true);
  });

  it("returns false when the matched field is flagged readOnly", () => {
    expect(isColumnEditable({ accessorKey: "amount" }, [{ ...baseField, readOnly: true }], {})).toBe(false);
  });

  it("returns false when the matched field has READ_ONLY UI pattern", () => {
    expect(
      isColumnEditable({ accessorKey: "amount" }, [{ ...baseField, uIPattern: UIPattern.READ_ONLY }], {})
    ).toBe(false);
  });

  it("returns false when the read-only map flags the column", () => {
    expect(isColumnEditable({ accessorKey: "amount" }, [baseField], { amount: true })).toBe(false);
  });

  it("falls back to col.enableEditing for unknown columns (no matching field)", () => {
    expect(isColumnEditable({ accessorKey: "unknown", enableEditing: true }, [baseField], {})).toBe(true);
    expect(isColumnEditable({ accessorKey: "unknown" }, [baseField], {})).toBe(false);
  });
});

describe("buildEnableEditingPredicate", () => {
  const editableField = { columnName: "amount", hqlName: "amount", name: "Amount" };
  const editableCol = { accessorKey: "amount" };

  it("returns false for any row that already has a persisted id", () => {
    const tab = { fields: [editableField] };
    const predicate = buildEnableEditingPredicate([editableCol], tab, {});
    expect(predicate({ original: { id: "1" } })).toBe(false);
  });

  it("returns true for create-rows when at least one column is editable", () => {
    const tab = { fields: [editableField] };
    const predicate = buildEnableEditingPredicate([editableCol], tab, {});
    expect(predicate({ original: { _locallyAdded: true } })).toBe(true);
  });

  it("returns false for create-rows when every column is read-only", () => {
    const tab = { fields: [{ ...editableField, readOnly: true }] };
    const predicate = buildEnableEditingPredicate([editableCol], tab, {});
    expect(predicate({ original: { _locallyAdded: true } })).toBe(false);
  });

  it("normalises `tab.fields` whether it arrives as array or as an object map", () => {
    const asArray = buildEnableEditingPredicate([editableCol], { fields: [editableField] }, {});
    const asMap = buildEnableEditingPredicate([editableCol], { fields: { amount: editableField } }, {});
    const row = { original: { _locallyAdded: true } };
    expect(asArray(row)).toBe(true);
    expect(asMap(row)).toBe(true);
  });

  it("returns false when the tab has no field metadata at all", () => {
    const predicate = buildEnableEditingPredicate([editableCol], null, {});
    expect(predicate({ original: { _locallyAdded: true } })).toBe(false);
  });
});

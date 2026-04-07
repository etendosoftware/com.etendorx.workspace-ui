/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import useFormFields from "../useFormFields";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";

jest.mock("../useCurrentRecord", () => ({
  useCurrentRecord: jest.fn(() => ({ record: null, loading: false })),
}));

jest.mock("../useTranslation", () => ({
  useTranslation: jest.fn(() => ({ t: (key: string) => key })),
}));

jest.mock("@/utils", () => ({
  getFieldReference: jest.fn(() => "string"),
}));

jest.mock("@/utils/url/constants", () => ({
  NEW_RECORD_ID: "new",
}));

/** Build a minimal Field with only the properties useFormFields reads. */
const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    hqlName: "testField",
    inputName: "inpTestField",
    columnName: "testField",
    displayed: true,
    shownInStatusBar: false,
    processAction: null,
    processDefinition: null,
    fieldGroup: "group1",
    fieldGroup$_identifier: "Group One",
    sequenceNumber: 10,
    column: { reference: "string" },
    ...overrides,
  }) as unknown as Field;

const makeTab = (fields: Record<string, Field>): Tab =>
  ({
    id: "tab1",
    fields,
    table: "table1",
    entityName: "Entity",
  }) as unknown as Tab;

describe("useFormFields — fieldGroupCollapsed threading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets fieldGroupCollapsed to true on the group when the first field has fieldGroupCollapsed: true", () => {
    const tab = makeTab({
      field1: makeField({ hqlName: "field1", fieldGroupCollapsed: true }),
    });

    const { result } = renderHook(() =>
      useFormFields(tab, "rec1", FormMode.EDIT)
    );

    const group = result.current.groups.find(([id]) => id === "group1");
    expect(group).toBeDefined();
    expect(group![1].fieldGroupCollapsed).toBe(true);
  });

  it("sets fieldGroupCollapsed to false on the group when the first field has fieldGroupCollapsed: false", () => {
    const tab = makeTab({
      field1: makeField({ hqlName: "field1", fieldGroupCollapsed: false }),
    });

    const { result } = renderHook(() =>
      useFormFields(tab, "rec1", FormMode.EDIT)
    );

    const group = result.current.groups.find(([id]) => id === "group1");
    expect(group).toBeDefined();
    expect(group![1].fieldGroupCollapsed).toBe(false);
  });

  it("leaves fieldGroupCollapsed undefined on the group when the field does not carry it", () => {
    const tab = makeTab({
      field1: makeField({ hqlName: "field1" }),
    });

    const { result } = renderHook(() =>
      useFormFields(tab, "rec1", FormMode.EDIT)
    );

    const group = result.current.groups.find(([id]) => id === "group1");
    expect(group).toBeDefined();
    expect(group![1].fieldGroupCollapsed).toBeUndefined();
  });

  it("preserves fieldGroupCollapsed from the first field when multiple fields share the same group", () => {
    const tab = makeTab({
      field1: makeField({ hqlName: "field1", sequenceNumber: 10, fieldGroupCollapsed: true }),
      field2: makeField({ hqlName: "field2", sequenceNumber: 20, fieldGroupCollapsed: false }),
    });

    const { result } = renderHook(() =>
      useFormFields(tab, "rec1", FormMode.EDIT)
    );

    // The group is created on first encounter (field1), so collapsed = true
    const group = result.current.groups.find(([id]) => id === "group1");
    expect(group).toBeDefined();
    expect(group![1].fieldGroupCollapsed).toBe(true);
  });

  it("produces distinct groups for fields belonging to different fieldGroups, each with their own fieldGroupCollapsed", () => {
    const tab = makeTab({
      field1: makeField({ hqlName: "field1", fieldGroup: "g1", fieldGroupCollapsed: true }),
      field2: makeField({ hqlName: "field2", fieldGroup: "g2", fieldGroupCollapsed: false }),
    });

    const { result } = renderHook(() =>
      useFormFields(tab, "rec1", FormMode.EDIT)
    );

    const g1 = result.current.groups.find(([id]) => id === "g1");
    const g2 = result.current.groups.find(([id]) => id === "g2");

    expect(g1![1].fieldGroupCollapsed).toBe(true);
    expect(g2![1].fieldGroupCollapsed).toBe(false);
  });
});

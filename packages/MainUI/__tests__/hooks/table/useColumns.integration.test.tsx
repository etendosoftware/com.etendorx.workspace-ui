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
import { useColumns } from "@/hooks/table/useColumns";
import type { Tab, Field, GridProps } from "@workspaceui/api-client/src/api/types";

// Mock the dependencies
jest.mock("@/utils/tableColumns", () => ({
  parseColumns: jest.fn((fields) =>
    fields.map((field: Field) => {
      const column: any = {
        id: field.name,
        header: field.name,
        accessorFn: (row: Record<string, unknown>) => row[field.name],
        columnName: field.name,
        name: field.name,
        _identifier: field.name,
        fieldId: field.id,
        column: field.column || {},
      };

      if (field.etmetaCustomjs) {
        // Simular la creación de Cell a partir de custom JS
        column.Cell = new Function("record", `return (${field.etmetaCustomjs})(record)`);
      }

      return column;
    })
  ),
}));

jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  isEntityReference: jest.fn(() => false),
}));

jest.mock("@/utils", () => ({
  getFieldReference: jest.fn(() => "text"),
}));

jest.mock("@/hooks/navigation/useRedirect", () => ({
  useRedirect: () => ({
    handleClickRedirect: jest.fn(),
    handleKeyDownRedirect: jest.fn(),
  }),
}));

describe("useColumns integration with custom JS", () => {
  const mockGridProps: GridProps = {
    sort: 0,
    autoExpand: false,
    editorProps: {
      displayField: "",
      valueField: "",
    },
    displaylength: 20,
    fkField: false,
    selectOnClick: false,
    canSort: true,
    canFilter: true,
    showHover: false,
    filterEditorProperties: {
      keyProperty: "",
    },
    showIf: "",
  };

  const mockTab: Tab = {
    uIPattern: "STD",
    window: "TestWindow",
    name: "Test Tab",
    title: "Test Tab Title",
    parentColumns: [],
    id: "1",
    table: "TestTable",
    entityName: "TestEntity",
    tabLevel: 0,
    _identifier: "test-tab",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "TestModule",
    fields: {
      normalField: {
        name: "normalField",
        showInGridView: true,
        etmetaCustomjs: null,
        hqlName: "normalField",
        inputName: "normalField",
        columnName: "normalField",
        process: "",
        shownInStatusBar: false,
        tab: "",
        displayed: true,
        startnewline: false,
        fieldGroup$_identifier: "",
        fieldGroup: "",
        isMandatory: false,
        column: {},
        id: "1",
        module: "",
        hasDefaultValue: false,
        refColumnName: "",
        targetEntity: "",
        gridProps: mockGridProps,
        type: "",
        field: [],
        refList: [],
        referencedEntity: "",
        referencedWindowId: "",
        referencedTabId: "",
        isReadOnly: false,
        isDisplayed: true,
        sequenceNumber: 1,
        isUpdatable: true,
        description: "",
        helpComment: "",
      },
      customField: {
        name: "customField",
        showInGridView: true,
        etmetaCustomjs: '(record) => record.name + " (Custom)"',
        hqlName: "customField",
        inputName: "customField",
        columnName: "customField",
        process: "",
        shownInStatusBar: false,
        tab: "",
        displayed: true,
        startnewline: false,
        fieldGroup$_identifier: "",
        fieldGroup: "",
        isMandatory: false,
        column: {},
        id: "2",
        module: "",
        hasDefaultValue: false,
        refColumnName: "",
        targetEntity: "",
        gridProps: mockGridProps,
        type: "",
        field: [],
        refList: [],
        referencedEntity: "",
        referencedWindowId: "",
        referencedTabId: "",
        isReadOnly: false,
        isDisplayed: true,
        sequenceNumber: 2,
        isUpdatable: true,
        description: "",
        helpComment: "",
      },
    },
  };

  it("should integrate custom JS columns with existing column processing", () => {
    const { result } = renderHook(() => useColumns(mockTab));

    expect(result.current).toHaveLength(2);

    // Normal field should not have custom Cell
    const normalColumn = result.current.find((col) => col.name === "normalField");
    expect(normalColumn).toBeDefined();
    expect(normalColumn?.Cell).toBeUndefined();

    // Custom field should have custom Cell function
    const customColumn = result.current.find((col) => col.name === "customField");
    expect(customColumn).toBeDefined();
    expect(customColumn?.Cell).toBeDefined();
    expect(typeof customColumn?.Cell).toBe("function");
  });

  it("should handle tab with no custom JS fields", () => {
    const tabWithoutCustomJs = {
      ...mockTab,
      fields: {
        normalField: mockTab.fields.normalField,
      },
    };

    const { result } = renderHook(() => useColumns(tabWithoutCustomJs));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe("normalField");
    expect(result.current[0].Cell).toBeUndefined();
  });

  it("should handle tab with empty fields", () => {
    const emptyTab = {
      ...mockTab,
      fields: {},
    };

    const { result } = renderHook(() => useColumns(emptyTab));

    expect(result.current).toHaveLength(0);
  });
});

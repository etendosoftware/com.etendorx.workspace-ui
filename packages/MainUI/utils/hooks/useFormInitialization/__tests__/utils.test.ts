import { SessionMode, FormMode } from "@workspaceui/api-client/src/api/types";
import type { Tab, FormInitializationResponse, Field, GridProps } from "@workspaceui/api-client/src/api/types";
import {
  buildFormInitializationParams,
  buildFormInitializationPayload,
  buildSessionAttributes,
  fetchFormInitialization,
} from "../utils";
import * as utils from "@/utils/form/entityConfig";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

jest.mock("@/utils/form/entityConfig");
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: {
      post: jest.fn(),
    },
  },
}));
jest.mock("@/utils/logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));
jest.mock("@/utils/commons", () => ({
  extractKeyValuePairs: jest.fn((auxiliaryInputValues) => {
    const result: Record<string, string> = {};
    if (auxiliaryInputValues) {
      for (const [key, value] of Object.entries(auxiliaryInputValues)) {
        if (value && typeof value === "object" && "value" in value) {
          result[key] = String(value.value);
        }
      }
    }
    return result;
  }),
}));

describe("FormInitialization Utils - SessionMode Support", () => {
  const mockGridProps: GridProps = {
    sort: 1,
    autoExpand: false,
    editorProps: {
      displayField: "name",
      valueField: "id",
    },
    displaylength: 20,
    fkField: false,
    selectOnClick: true,
    canSort: true,
  };

  const mockField: Field = {
    hqlName: "testField",
    inputName: "testInput",
    columnName: "test_column",
    process: "",
    shownInStatusBar: false,
    tab: "test-tab",
    displayed: true,
    startnewline: false,
    showInGridView: true,
    fieldGroup$_identifier: "test_field_group",
    fieldGroup: "test_field_group",
    isMandatory: false,
    column: { keyColumn: "true" },
    name: "Test Field",
    id: "test-field-id",
    module: "test_module",
    hasDefaultValue: false,
    refColumnName: "",
    targetEntity: "",
    gridProps: mockGridProps,
    type: "string",
    field: [],
    refList: [],
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: false,
    isDisplayed: true,
    sequenceNumber: 1,
    isUpdatable: true,
    description: "Test Field Description",
    helpComment: "Test Field Help",
  };

  const mockTab: Tab = {
    id: "test-tab",
    name: "Test Tab",
    title: "Test Tab Title",
    window: "test-window",
    tabLevel: 0,
    parentTabId: undefined,
    uIPattern: "STD",
    table: "test_table",
    entityName: "TestEntity",
    fields: {
      testField: mockField,
    },
    parentColumns: [],
    _identifier: "test_identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test_module",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildFormInitializationParams with SessionMode", () => {
    it("should handle SessionMode.SETSESSION correctly", () => {
      const params = buildFormInitializationParams({
        tab: mockTab,
        mode: SessionMode.SETSESSION,
        recordId: "record-123",
        parentId: "parent-123",
      });

      expect(params.get("MODE")).toBe("SETSESSION");
      expect(params.get("TAB_ID")).toBe("test-tab");
      expect(params.get("ROW_ID")).toBe("record-123");
      expect(params.get("PARENT_ID")).toBe("parent-123");
      expect(params.get("_action")).toBe("org.openbravo.client.application.window.FormInitializationComponent");
    });

    it("should handle SessionMode with minimal parameters", () => {
      const params = buildFormInitializationParams({
        tab: mockTab,
        mode: SessionMode.SETSESSION,
        recordId: "record-123",
      });

      expect(params.get("MODE")).toBe("SETSESSION");
      expect(params.get("TAB_ID")).toBe("test-tab");
      expect(params.get("ROW_ID")).toBe("record-123");
      expect(params.get("PARENT_ID")).toBe("null");
      expect(params.get("_action")).toBe("org.openbravo.client.application.window.FormInitializationComponent");
    });

    it("should handle FormMode.NEW correctly", () => {
      const params = buildFormInitializationParams({
        tab: mockTab,
        mode: FormMode.NEW,
        recordId: "record-123",
      });

      expect(params.get("MODE")).toBe("NEW");
      expect(params.get("ROW_ID")).toBe("null"); // NEW mode should ignore recordId
    });

    it("should handle FormMode.EDIT correctly", () => {
      const params = buildFormInitializationParams({
        tab: mockTab,
        mode: FormMode.EDIT,
        recordId: "record-123",
      });

      expect(params.get("MODE")).toBe("EDIT");
      expect(params.get("ROW_ID")).toBe("record-123"); // EDIT mode should use recordId
    });

    it("should handle null recordId correctly", () => {
      const params = buildFormInitializationParams({
        tab: mockTab,
        mode: SessionMode.SETSESSION,
        recordId: null,
      });

      expect(params.get("ROW_ID")).toBe("null");
    });
  });

  describe("buildFormInitializationPayload with SessionMode", () => {
    const mockEntityKeyColumn: Field = mockField;

    beforeEach(() => {
      jest.mocked(utils.getFieldsToAdd).mockReturnValue({});
    });

    it("should build payload for SETSESSION mode", () => {
      const payload = buildFormInitializationPayload(mockTab, SessionMode.SETSESSION, {}, mockEntityKeyColumn);

      expect(payload).toEqual({
        inpKeyName: "testInput",
        inpTabId: "test-tab",
        inpTableId: "test_table",
        inpkeyColumnId: "test_column",
        keyColumnName: "test_column",
        _entityName: "TestEntity",
        inpwindowId: "test-window",
      });

      // Verify getFieldsToAdd is not called for SETSESSION mode
      expect(utils.getFieldsToAdd).not.toHaveBeenCalled();
    });

    it("should build payload for NEW mode with additional fields", () => {
      const mockAdditionalFields = { additionalField: "additionalValue" };
      jest.mocked(utils.getFieldsToAdd).mockReturnValue(mockAdditionalFields);

      const payload = buildFormInitializationPayload(mockTab, FormMode.NEW, {}, mockEntityKeyColumn);

      expect(payload).toEqual({
        inpKeyName: "testInput",
        inpTabId: "test-tab",
        inpTableId: "test_table",
        inpkeyColumnId: "test_column",
        keyColumnName: "test_column",
        _entityName: "TestEntity",
        inpwindowId: "test-window",
        additionalField: "additionalValue",
      });

      expect(utils.getFieldsToAdd).toHaveBeenCalledWith("TestEntity", FormMode.NEW);
    });

    it("should handle payload extension correctly", () => {
      const basePayload = { existingField: "existingValue" };

      const payload = buildFormInitializationPayload(mockTab, SessionMode.SETSESSION, basePayload, mockEntityKeyColumn);

      expect(payload).toEqual({
        existingField: "existingValue",
        inpKeyName: "testInput",
        inpTabId: "test-tab",
        inpTableId: "test_table",
        inpkeyColumnId: "test_column",
        keyColumnName: "test_column",
        _entityName: "TestEntity",
        inpwindowId: "test-window",
      });
    });

    it("should merge parent data with payload", () => {
      const parentData = {
        parentField1: "parentValue1",
        parentField2: "parentValue2",
      };

      const payload = buildFormInitializationPayload(mockTab, SessionMode.SETSESSION, parentData, mockEntityKeyColumn);

      expect(payload).toEqual(expect.objectContaining(parentData));
      expect(payload).toEqual(
        expect.objectContaining({
          inpKeyName: "testInput",
          inpTabId: "test-tab",
          _entityName: "TestEntity",
        })
      );
    });
  });

  describe("buildSessionAttributes", () => {
    it("should combine auxiliaryInputValues and sessionAttributes", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {
          field1: { value: "value1" },
          field2: { value: "value2" },
          fieldWithoutValue: {}, // Should be ignored
        },
        sessionAttributes: {
          attr1: "attrValue1",
          attr2: "attrValue2",
        },
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({
        field1: "value1",
        field2: "value2",
        attr1: "attrValue1",
        attr2: "attrValue2",
      });
    });

    it("should handle missing auxiliaryInputValues", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {},
        sessionAttributes: {
          attr1: "attrValue1",
          attr2: "attrValue2",
        },
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({
        attr1: "attrValue1",
        attr2: "attrValue2",
      });
    });

    it("should handle missing sessionAttributes", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {
          field1: { value: "value1" },
          field2: { value: "value2" },
        },
        sessionAttributes: {},
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({
        field1: "value1",
        field2: "value2",
      });
    });

    it("should return empty object for empty response", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {},
        sessionAttributes: {},
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({});
    });

    it("should prioritize sessionAttributes over auxiliaryInputValues with same key", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {
          conflictKey: { value: "auxiliaryValue" },
        },
        sessionAttributes: {
          conflictKey: "sessionValue",
        },
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({
        conflictKey: "sessionValue", // sessionAttributes should win
      });
    });

    it("should handle complex auxiliaryInputValues structure", () => {
      const response: FormInitializationResponse = {
        columnValues: {},
        auxiliaryInputValues: {
          field1: { value: "value1", classicValue: "classic1" },
          field2: { value: "value2" },
          field3: { classicValue: "classic3" }, // No value property
          field4: { value: "", classicValue: "classic4" }, // Empty value
        },
        sessionAttributes: {},
        dynamicCols: [],
        attachmentExists: false,
      };

      const result = buildSessionAttributes(response);

      expect(result).toEqual({
        field1: "value1",
        field2: "value2",
        field4: "", // Empty string is still a valid value
      });
    });
  });

  describe("fetchFormInitialization", () => {
    beforeEach(() => {
      jest.mocked(Metadata.kernelClient.post).mockClear();
    });

    it("should successfully fetch form initialization data", async () => {
      const mockResponse = {
        data: {
          columnValues: {},
          auxiliaryInputValues: { field1: { value: "value1" } },
          sessionAttributes: { attr1: "attrValue1" },
          dynamicCols: [],
          attachmentExists: false,
        },
      };

      jest.mocked(Metadata.kernelClient.post).mockResolvedValue(mockResponse);

      const params = new URLSearchParams("MODE=SETSESSION&TAB_ID=test-tab");
      const payload = { testData: "testValue" };

      const result = await fetchFormInitialization(params, payload);

      expect(Metadata.kernelClient.post).toHaveBeenCalledWith("?MODE=SETSESSION&TAB_ID=test-tab", payload);
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle API errors and throw meaningful error", async () => {
      const mockError = new Error("API Error");
      jest.mocked(Metadata.kernelClient.post).mockRejectedValue(mockError);

      const params = new URLSearchParams("MODE=SETSESSION&TAB_ID=test-tab");
      const payload = { testData: "testValue" };

      await expect(fetchFormInitialization(params, payload)).rejects.toThrow("Failed to fetch initial data");
    });

    it("should pass correct parameters to API client", async () => {
      const mockResponse = {
        data: {
          columnValues: {},
          auxiliaryInputValues: {},
          sessionAttributes: {},
          dynamicCols: [],
          attachmentExists: false,
        },
      };

      jest.mocked(Metadata.kernelClient.post).mockResolvedValue(mockResponse);

      const params = new URLSearchParams({
        MODE: "SETSESSION",
        TAB_ID: "test-tab",
        ROW_ID: "record-123",
        PARENT_ID: "parent-456",
      });
      const payload = {
        inpKeyName: "testInput",
        inpTabId: "test-tab",
        MULTIPLE_ROW_IDS: ["1", "2", "3"],
      };

      await fetchFormInitialization(params, payload);

      expect(Metadata.kernelClient.post).toHaveBeenCalledWith(
        "?MODE=SETSESSION&TAB_ID=test-tab&ROW_ID=record-123&PARENT_ID=parent-456",
        payload
      );
    });
  });
});

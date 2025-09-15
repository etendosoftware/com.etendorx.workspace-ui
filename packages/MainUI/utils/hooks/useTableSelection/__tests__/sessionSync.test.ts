import { syncSelectedRecordsToSession } from "../sessionSync";
import { SessionMode } from "@workspaceui/api-client/src/api/types";
import * as formUtils from "@/utils/hooks/useFormInitialization/utils";
import type {
  Tab,
  EntityData,
  ISession,
  FormInitializationResponse,
  Field,
  GridProps,
} from "@workspaceui/api-client/src/api/types";

jest.mock("@/utils/hooks/useFormInitialization/utils");
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("syncSelectedRecordsToSession", () => {
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

  const mockRecords: EntityData[] = [
    { id: "1", name: "Record 1" },
    { id: "2", name: "Record 2" },
  ];

  const createMockFormInitializationResponse = (
    auxiliaryInputValues: Record<string, { value: string; classicValue?: string }> = {},
    sessionAttributes: Record<string, string> = {}
  ): FormInitializationResponse => ({
    columnValues: {},
    auxiliaryInputValues,
    sessionAttributes,
    dynamicCols: [],
    attachmentExists: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sync multiple selected records in single request", async () => {
    const mockBuildParams = jest
      .spyOn(formUtils, "buildFormInitializationParams")
      .mockReturnValue(new URLSearchParams());
    const mockBuildPayload = jest.spyOn(formUtils, "buildFormInitializationPayload").mockReturnValue({});
    const mockBuildSessionAttributes = jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({
      field1: "value1",
      attr1: "attrValue1",
    });
    const mockFetch = jest
      .spyOn(formUtils, "fetchFormInitialization")
      .mockResolvedValue(
        createMockFormInitializationResponse({ field1: { value: "value1" } }, { attr1: "attrValue1" })
      );
    const mockSetSession = jest.fn();

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
    });

    // Should call functions only once (single request)
    expect(mockBuildParams).toHaveBeenCalledTimes(1);
    expect(mockBuildPayload).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockBuildSessionAttributes).toHaveBeenCalledTimes(1);
    expect(mockSetSession).toHaveBeenCalledTimes(1);

    // Verify SETSESSION mode is used
    expect(mockBuildParams).toHaveBeenCalledWith(expect.objectContaining({ mode: SessionMode.SETSESSION }));

    // Verify last selected record is used in query string
    expect(mockBuildParams).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: "2" }) // Last record ID
    );

    // Verify session is updated with processed attributes
    expect(mockSetSession).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should include MULTIPLE_ROW_IDS in payload for multiple selections", async () => {
    jest.spyOn(formUtils, "buildFormInitializationParams").mockReturnValue(new URLSearchParams());
    jest.spyOn(formUtils, "buildFormInitializationPayload").mockReturnValue({});
    jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({});
    jest.spyOn(formUtils, "fetchFormInitialization").mockResolvedValue(createMockFormInitializationResponse());
    const mockSetSession = jest.fn();

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
    });

    // Verify payload was modified to include MULTIPLE_ROW_IDS
    const mockCall = jest.mocked(formUtils.fetchFormInitialization).mock.calls[0];
    const payload = mockCall[1];

    expect(payload).toEqual(
      expect.objectContaining({
        MULTIPLE_ROW_IDS: ["1", "2"],
      })
    );
  });

  it("should not include MULTIPLE_ROW_IDS for single selection", async () => {
    const singleRecord = [mockRecords[0]];
    jest.spyOn(formUtils, "buildFormInitializationParams").mockReturnValue(new URLSearchParams());
    jest.spyOn(formUtils, "buildFormInitializationPayload").mockReturnValue({});
    jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({});
    jest.spyOn(formUtils, "fetchFormInitialization").mockResolvedValue(createMockFormInitializationResponse());
    const mockSetSession = jest.fn();

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: singleRecord,
      setSession: mockSetSession,
    });

    const mockCall = jest.mocked(formUtils.fetchFormInitialization).mock.calls[0];
    const payload = mockCall[1];

    expect(payload).not.toHaveProperty("MULTIPLE_ROW_IDS");
  });

  it("should process response and update session attributes", async () => {
    const mockResponse = createMockFormInitializationResponse(
      { field1: { value: "value1" }, field2: { value: "value2" } },
      { attr1: "attrValue1" }
    );
    jest.spyOn(formUtils, "buildFormInitializationParams").mockReturnValue(new URLSearchParams());
    jest.spyOn(formUtils, "buildFormInitializationPayload").mockReturnValue({});
    jest.spyOn(formUtils, "fetchFormInitialization").mockResolvedValue(mockResponse);
    jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({
      field1: "value1",
      field2: "value2",
      attr1: "attrValue1",
    });
    const mockSetSession = jest.fn();

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
    });

    expect(mockSetSession).toHaveBeenCalledWith(expect.any(Function));

    // Test the function passed to setSession
    const updateFunction = mockSetSession.mock.calls[0][0];
    const result = updateFunction({ existingAttr: "existingValue" } as ISession);

    expect(result).toEqual({
      existingAttr: "existingValue",
      field1: "value1",
      field2: "value2",
      attr1: "attrValue1",
    });
  });

  it("should handle missing key column gracefully", async () => {
    const tabWithoutKey: Tab = {
      ...mockTab,
      fields: {},
    };
    const mockSetSession = jest.fn();

    await expect(
      syncSelectedRecordsToSession({
        tab: tabWithoutKey,
        selectedRecords: mockRecords,
        setSession: mockSetSession,
      })
    ).resolves.not.toThrow();

    // Should not proceed with session sync when no key column
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("should handle API errors without throwing", async () => {
    jest.spyOn(formUtils, "fetchFormInitialization").mockRejectedValue(new Error("API Error"));
    const mockSetSession = jest.fn();

    await expect(
      syncSelectedRecordsToSession({
        tab: mockTab,
        selectedRecords: mockRecords,
        setSession: mockSetSession,
      })
    ).resolves.not.toThrow();

    // Session should not be updated when API fails
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("should do nothing when no records are selected", async () => {
    const mockSetSession = jest.fn();
    const mockFetch = jest.spyOn(formUtils, "fetchFormInitialization");

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: [],
      setSession: mockSetSession,
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("should use parentId when provided", async () => {
    const mockBuildParams = jest
      .spyOn(formUtils, "buildFormInitializationParams")
      .mockReturnValue(new URLSearchParams());
    jest.spyOn(formUtils, "buildFormInitializationPayload").mockReturnValue({});
    jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({});
    jest.spyOn(formUtils, "fetchFormInitialization").mockResolvedValue(createMockFormInitializationResponse());
    const mockSetSession = jest.fn();
    const parentId = "parent-123";

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: mockRecords,
      parentId,
      setSession: mockSetSession,
    });

    expect(mockBuildParams).toHaveBeenCalledWith(expect.objectContaining({ parentId }));
  });

  it("should use correct entity key column properties", async () => {
    jest.spyOn(formUtils, "buildFormInitializationParams").mockReturnValue(new URLSearchParams());
    jest.spyOn(formUtils, "buildFormInitializationPayload").mockImplementation(() => ({}));
    jest.spyOn(formUtils, "buildSessionAttributes").mockReturnValue({});
    jest.spyOn(formUtils, "fetchFormInitialization").mockResolvedValue(createMockFormInitializationResponse());
    const mockSetSession = jest.fn();

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: mockRecords,
      setSession: mockSetSession,
    });

    expect(formUtils.buildFormInitializationPayload).toHaveBeenCalledWith(
      mockTab,
      SessionMode.SETSESSION,
      {},
      expect.objectContaining({
        column: { keyColumn: "true" },
        inputName: "testInput",
      })
    );
  });
});

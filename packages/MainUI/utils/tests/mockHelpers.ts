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

import type { NextRequest } from "next/server";
import type {
  GridProps,
  Field,
  Tab,
  User,
  EntityData,
  FormInitializationResponse,
} from "@workspaceui/api-client/src/api/types";

interface MockRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface MockRequestConfig extends MockRequestOptions {
  pathname?: string;
  searchParams?: URLSearchParams;
}

/**
 * Creates a mock NextRequest object for testing purposes
 *
 * @param url - The request URL
 * @param init - Configuration options for the mock request
 * @returns A mocked NextRequest object
 */
export const createMockRequest = (url: string, init?: MockRequestConfig): NextRequest => {
  const mockHeaders = {
    get: (key: string) => init?.headers?.[key] || init?.headers?.[key.toLowerCase()],
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
  };

  const mockCookies = {
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  return {
    url,
    method: init?.method || "GET",
    headers: mockHeaders,
    cookies: mockCookies,
    nextUrl: {
      pathname: init?.pathname || "/api/test",
      searchParams: init?.searchParams || new URLSearchParams(),
    },
    json: jest.fn().mockResolvedValue(init?.body ? JSON.parse(init.body) : {}),
    text: jest.fn().mockResolvedValue(init?.body || ""),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
    clone: jest.fn(),
  } as unknown as NextRequest;
};

// Test helpers for datasource API tests

interface CreateDatasourceRequestOptions {
  entity: string;
  params?: Record<string, unknown>;
  token?: string;
  headers?: Record<string, string>;
  pathname?: string;
}

/**
 * Creates a mock request for datasource API with common defaults
 */
export const createDatasourceRequest = (options: CreateDatasourceRequestOptions): NextRequest => {
  const { entity, params = { test: "value" }, token, headers = {}, pathname = "/api/datasource" } = options;

  const requestBody = {
    entity,
    params,
  };

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  return createMockRequest("https://example.com/api/datasource", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    pathname,
  });
};

/**
 * Creates mock response data with common structure
 */
export const createMockResponseData = (data: Array<Record<string, unknown>> = [{ id: 1, name: "Test" }]) => ({
  response: { data },
});

/**
 * Helper to create session retry success result
 */
export const createSessionRetryResult = (data: unknown, recovered = false) => ({
  success: true,
  data,
  recovered,
});

/**
 * Helper to create session retry error result
 */
export const createSessionRetryError = (error: string) => ({
  success: false,
  error,
});

interface MockResponse {
  status: number;
  json: () => Promise<unknown>;
}

/**
 * Common assertions for successful API responses
 */
export const expectSuccessfulResponse = async (response: MockResponse, expectedData: unknown) => {
  const result = await response.json();
  expect(response.status).toBe(200);
  expect(result).toEqual(expectedData);
};

/**
 * Common assertions for error responses
 */
export const expectErrorResponse = async (response: MockResponse, expectedStatus: number, expectedError: string) => {
  const result = await response.json();
  expect(response.status).toBe(expectedStatus);
  expect(result).toHaveProperty("error", expectedError);
};

// Test helpers for sessionValidator tests

/**
 * Creates a mock Response object for testing
 */
export const createMockResponse = (status: number, body = ""): Response => {
  return new Response(body, { status });
};

/**
 * Creates test data objects with common structures
 */
export const createTestData = {
  empty: () => ({}),
  withError: (error: string) => ({ error }),
  withMessage: (message: string) => ({ message }),
  withResult: (result: string) => ({ result }),
};

/**
 * Helper to test session validation functions with expected results
 */
export const expectSessionValidation = (
  validationFn: (response: Response, data: unknown) => boolean,
  response: Response,
  data: unknown,
  expected: boolean
) => {
  expect(validationFn(response, data)).toBe(expected);
};

/**
 * Creates test cases for session validation
 */
export const createSessionTestCase = (status: number, data: unknown, description?: string) => ({
  response: createMockResponse(status),
  data,
  description: description || `status ${status}`,
});

// Test helpers for useTableSelection hook tests

/**
 * Provides mock implementations for useTableSelection-related modules
 * This function returns the mock implementations that should be used with jest.mock()
 *
 * Usage in test files:
 * ```typescript
 * // At the top level of your test file (before imports):
 * const { mockImplementations } = getTableSelectionMocks();
 *
 * jest.mock("../useUserContext");
 * jest.mock("../useSelected", () => ({
 *   useSelected: jest.fn(),
 * }));
 * // ... other mocks
 *
 * // Then in your test setup:
 * beforeEach(() => {
 *   setupTableSelectionMockImplementations(mockImplementations);
 * });
 * ```
 */
export const getTableSelectionMocks = () => ({
  mockImplementations: {
    useSelected: () => ({
      graph: {
        getChildren: jest.fn(() => []),
        getParent: jest.fn(() => null),
        setSelected: jest.fn(),
        getSelected: jest.fn(() => null),
        clearSelected: jest.fn(),
        setSelectedMultiple: jest.fn(),
        clearSelectedMultiple: jest.fn(),
      },
    }),

    useMultiWindowURL: () => ({
      activeWindow: {
        windowId: "test-window",
        window_identifier: "test-window_123456789",
        isActive: true,
        order: 1,
        selectedRecords: {},
        title: "Test Window",
      },
      clearSelectedRecord: jest.fn(),
      setSelectedRecord: jest.fn(),
      getSelectedRecord: jest.fn(() => undefined),
      setSelectedRecordAndClearChildren: jest.fn(),
      clearChildrenSelections: jest.fn(),
      getTabFormState: jest.fn(() => undefined),
      setTabFormState: jest.fn(),
      clearTabFormState: jest.fn(),
      clearTabFormStateAtomic: jest.fn(),
      applyWindowUpdates: jest.fn((fn) => fn([])),
    }),

    useStateReconciliation: () => ({
      reconcileStates: jest.fn(),
      handleSyncError: jest.fn(),
    }),

    debounce: jest.fn(<T extends (...args: unknown[]) => unknown>(fn: T) => {
      const wrappedFn = ((...args: unknown[]) => fn(...args)) as T & { cancel: () => void };
      wrappedFn.cancel = jest.fn();
      return wrappedFn;
    }),

    mapBy: (items: unknown[], key: string) => {
      const result: Record<string, unknown> = {};
      for (const item of items) {
        const keyValue = (item as Record<string, unknown>)[key];
        result[String(keyValue)] = item;
      }
      return result;
    },

    compareArraysAlphabetically: () => false,
  },
});

/**
 * Sets up mock implementations for table selection-related hooks and utilities
 * This should be called in beforeEach blocks after the modules have been mocked at the top level
 */
export const setupTableSelectionMockImplementations = (
  mockImplementations = getTableSelectionMocks().mockImplementations
) => {
  // Note: The actual jest.mock() calls must be done at the module level in each test file
  // This function only sets up the mock return values and implementations

  // Import the modules dynamically to avoid hoisting issues
  const useSelected = require("@/hooks/useSelected");
  const useMultiWindowURL = require("@/hooks/navigation/useMultiWindowURL");
  const useStateReconciliation = require("@/hooks/useStateReconciliation");
  const debounce = require("@/utils/debounce");
  const structures = require("@/utils/structures");
  const commons = require("@/utils/commons");

  // Set up mock implementations
  if (useSelected?.useSelected) {
    jest.mocked(useSelected.useSelected).mockReturnValue(mockImplementations.useSelected());
  }

  if (useMultiWindowURL?.useMultiWindowURL) {
    jest.mocked(useMultiWindowURL.useMultiWindowURL).mockReturnValue(mockImplementations.useMultiWindowURL());
  }

  if (useStateReconciliation?.useStateReconciliation) {
    jest
      .mocked(useStateReconciliation.useStateReconciliation)
      .mockReturnValue(mockImplementations.useStateReconciliation());
  }

  if (debounce?.debounce) {
    jest.mocked(debounce.debounce).mockImplementation(mockImplementations.debounce);
  }

  if (structures?.mapBy) {
    jest.mocked(structures.mapBy).mockImplementation(mockImplementations.mapBy);
  }

  if (commons?.compareArraysAlphabetically) {
    jest
      .mocked(commons.compareArraysAlphabetically)
      .mockImplementation(mockImplementations.compareArraysAlphabetically);
  }
};

// Test helpers for common mock data structures

/**
 * Creates a standardized mock GridProps object
 */
export const createMockGridProps = (overrides: Partial<GridProps> = {}): GridProps => ({
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
  canFilter: true,
  showHover: true,
  filterEditorProperties: {
    keyProperty: "id",
  },
  showIf: "",
  ...overrides,
});

/**
 * Creates a standardized mock Field object
 */
export const createMockField = (overrides: Partial<Field> = {}): Field => ({
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
  referencedEntity: "",
  referencedWindowId: "",
  referencedTabId: "",
  isReadOnly: false,
  isDisplayed: true,
  sequenceNumber: 1,
  isUpdatable: true,
  description: "Test Field Description",
  helpComment: "Test Field Help",
  gridProps: createMockGridProps(),
  type: "string",
  field: [],
  refList: [],
  ...overrides,
});

/**
 * Creates a standardized mock Tab object
 */
export const createMockTab = (overrides: Partial<Tab> = {}): Tab => {
  const mockField = createMockField();
  return {
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
    ...overrides,
  };
};

/**
 * Creates a standardized mock User object
 */
export const createMockUser = (overrides: Partial<User> = {}) =>
  ({
    id: "test-user",
    name: "Test User",
    username: "testuser",
    ...overrides,
  }) as User;

/**
 * Creates a standardized mock UserContext return value
 */
export const createMockUserContext = (overrides: Partial<Record<string, unknown>> = {}) => ({
  setSession: jest.fn(),
  session: {},
  user: createMockUser(),
  login: jest.fn(),
  changeProfile: jest.fn(),
  token: "mock-token",
  roles: [],
  currentRole: undefined,
  prevRole: undefined,
  profile: {
    name: "Test User",
    email: "test@example.com",
    image: "",
  },
  currentWarehouse: undefined,
  currentClient: undefined,
  currentOrganization: undefined,
  setToken: jest.fn(),
  clearUserData: jest.fn(),
  setDefaultConfiguration: jest.fn(),
  languages: [],
  isSessionSyncLoading: false,
  setSessionSyncLoading: jest.fn(),
  ...overrides,
});

/**
 * Creates mock EntityData records for testing
 */
export const createMockEntityRecords = (count = 2): EntityData[] =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `Record ${index + 1}`,
  }));

/**
 * Creates a mock FormInitializationResponse
 */
export const createMockFormInitializationResponse = (
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }> = {},
  sessionAttributes: Record<string, string> = {}
): FormInitializationResponse => ({
  columnValues: {},
  auxiliaryInputValues,
  sessionAttributes,
  dynamicCols: [],
  attachmentExists: false,
  noteCount: 0,
});

/**
 * Sets up common form utility mocks for tests
 */
export const setupFormUtilsMocks = () => {
  const mockBuildParams = jest.fn().mockReturnValue(new URLSearchParams());
  const mockBuildPayload = jest.fn().mockReturnValue({});
  const mockBuildSessionAttributes = jest.fn().mockReturnValue({});
  const mockFetchFormInitialization = jest.fn().mockResolvedValue(createMockFormInitializationResponse());

  return {
    mockBuildParams,
    mockBuildPayload,
    mockBuildSessionAttributes,
    mockFetchFormInitialization,
  };
};

/**
 * Common test setup for beforeEach blocks
 */
export const setupCommonTestMocks = () => {
  jest.clearAllMocks();
};

/**
 * Common patterns for useTableSelection tests to reduce code duplication
 */
export const createTableSelectionTestHelpers = () => {
  /**
   * Executes a renderHook call and waits for effects to complete
   */
  const renderHookAndWait = async (hookFn: () => void, waitTime = 100) => {
    const { renderHook, act } = require("@testing-library/react");

    const result = renderHook(hookFn);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    });

    return result;
  };

  /**
   * Common assertion pattern for session sync calls
   */
  const expectSessionSyncCall = (
    mockSyncSpy: jest.SpyInstance,
    tab: unknown,
    records: unknown[],
    setSession: jest.Mock,
    parentId?: string
  ) => {
    expect(mockSyncSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tab,
        selectedRecords: records,
        setSession,
        parentId: parentId || undefined,
      })
    );
  };

  /**
   * Common pattern for creating session sync mock implementation with payload inspection
   */
  const createSessionSyncMockWithPayloadInspection = () => {
    let capturedPayload: Record<string, unknown> | null = null;

    const mockImplementation = async (params: {
      tab: unknown;
      selectedRecords: unknown[];
      setSession: (updater: (prev: unknown) => unknown) => void;
    }) => {
      const { tab, selectedRecords, setSession } = params;
      const tabFields = (tab as { fields: Record<string, { inputName?: string; column?: Record<string, string> }> })
        .fields;
      const entityKeyColumn = Object.values(tabFields).find((field) => field?.column?.keyColumn);

      if (entityKeyColumn && selectedRecords.length > 0) {
        const allSelectedIds = selectedRecords.map((record) => String((record as { id: string }).id));
        const payload = {
          inpKeyName: entityKeyColumn.inputName,
          inpTabId: (tab as { id: string }).id,
          ...(selectedRecords.length > 1 && { MULTIPLE_ROW_IDS: allSelectedIds }),
        };

        capturedPayload = payload;
        setSession((prev: unknown) => ({ ...(prev as Record<string, unknown>), syncedIds: allSelectedIds.join(",") }));
      }
    };

    return {
      mockImplementation,
      getCapturedPayload: () => capturedPayload,
    };
  };

  return {
    renderHookAndWait,
    expectSessionSyncCall,
    createSessionSyncMockWithPayloadInspection,
  };
};

/**
 * Creates a standardized mock WindowContext return value
 */
export const createMockWindowContext = (overrides: Partial<Record<string, unknown>> = {}) => ({
  getTabFormState: jest.fn(() => undefined),
  setTabFormState: jest.fn(),
  clearTabFormState: jest.fn(),
  getSelectedRecord: jest.fn(() => undefined),
  setSelectedRecord: jest.fn(),
  clearSelectedRecord: jest.fn(),
  setSelectedRecordAndClearChildren: jest.fn(),
  clearChildrenSelections: jest.fn(),
  applyWindowUpdates: jest.fn((fn) => fn([])),
  ...overrides,
});

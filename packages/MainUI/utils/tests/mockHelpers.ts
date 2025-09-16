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
 * Sets up common mocks for useTableSelection tests
 * This function consolidates the repeated mock setup code used across multiple test files
 *
 * @param userContextPath - The relative path to useUserContext module (e.g., "../useUserContext" or "../../useUserContext")
 */
export const setupTableSelectionMocks = (userContextPath: string) => {
  // Mock useUserContext
  jest.mock(userContextPath);

  // Mock useSelected
  jest.mock(userContextPath.replace("useUserContext", "useSelected"), () => ({
    useSelected: jest.fn(() => ({
      graph: {
        getChildren: jest.fn(() => []),
        setSelected: jest.fn(),
        getSelected: jest.fn(() => null),
        clearSelected: jest.fn(),
        setSelectedMultiple: jest.fn(),
        clearSelectedMultiple: jest.fn(),
      },
    })),
  }));

  // Mock useMultiWindowURL
  jest.mock(userContextPath.replace("useUserContext", "navigation/useMultiWindowURL"), () => ({
    useMultiWindowURL: jest.fn(() => ({
      activeWindow: { windowId: "test-window" },
      clearSelectedRecord: jest.fn(),
      setSelectedRecord: jest.fn(),
      getSelectedRecord: jest.fn(),
    })),
  }));

  // Mock useStateReconciliation
  jest.mock("@/hooks/useStateReconciliation", () => ({
    useStateReconciliation: jest.fn(() => ({
      reconcileStates: jest.fn(),
      handleSyncError: jest.fn(),
    })),
  }));

  // Mock debounce utility
  jest.mock("@/utils/debounce", () => ({
    debounce: jest.fn((fn) => fn),
  }));

  // Mock structures utility
  jest.mock("@/utils/structures", () => ({
    mapBy: jest.fn((items: unknown[], key: string) => {
      const result: Record<string, unknown> = {};
      for (const item of items) {
        const keyValue = (item as Record<string, unknown>)[key];
        result[String(keyValue)] = item;
      }
      return result;
    }),
  }));

  // Mock commons utility
  jest.mock("@/utils/commons", () => ({
    compareArraysAlphabetically: jest.fn(() => false),
  }));
};

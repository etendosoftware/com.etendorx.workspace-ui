/**
 * Common utilities for datasource integration tests.
 * Provides shared setup, mocks, and helper functions to avoid duplication across integration tests.
 */

import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import {
  createMockRequest,
  setupTestEnvironment,
  testData,
  assertFetchCall,
} from "./api-test-utils";
import { POST } from "../datasource/[entity]/route";

/**
 * Standard test environment setup for datasource integration tests.
 * Provides setup and cleanup functions that can be used in beforeEach/afterAll.
 */
export const useDatasourceTestEnvironment = () => {
  const { setup, cleanup } = setupTestEnvironment();
  return { setup, cleanup };
};

/**
 * Configuration for creating a test scenario with ERP session.
 */
export interface TestScenarioConfig {
  /** Bearer token to use for authentication */
  bearerToken: string;
  /** Cookie header value for the session */
  cookieHeader?: string;
  /** CSRF token for the session */
  csrfToken?: string;
  /** Request body payload */
  payload: Record<string, unknown>;
  /** URL to use for the request */
  url: string;
  /** Entity name for the datasource operation */
  entity: string;
}

/**
 * Default configuration values for test scenarios.
 */
export const DEFAULT_TEST_CONFIG = {
  cookieHeader: "JSESSIONID=ABC123DEF456; Path=/; HttpOnly",
  csrfToken: "CSRF-TEST-123",
} as const;

/**
 * Creates a complete test scenario with ERP session setup and request execution.
 * Handles the common pattern of setting up session cookies and making requests.
 * 
 * @param config - Configuration for the test scenario
 * @returns Promise resolving to the response from the POST route
 */
export async function executeTestScenario(config: TestScenarioConfig) {
  const {
    bearerToken,
    cookieHeader = DEFAULT_TEST_CONFIG.cookieHeader,
    csrfToken = DEFAULT_TEST_CONFIG.csrfToken,
    payload,
    url,
    entity,
  } = config;

  // Set up ERP session cookie
  setErpSessionCookie(bearerToken, {
    cookieHeader,
    csrfToken,
  });

  // Create mock request
  const req = createMockRequest({
    url,
    bearer: bearerToken,
    jsonBody: payload,
  });

  // Execute the POST route
  const response = await POST(req, { params: { entity } });

  return response;
}

/**
 * Common assertions for datasource integration tests.
 * Provides standardized checks for response status and fetch call verification.
 */
export class DatasourceTestAssertions {
  /**
   * Assert that a response has the expected status code.
   * 
   * @param response - Response object to check
   * @param expectedStatus - Expected HTTP status code
   */
  static assertResponseStatus(response: { status: number }, expectedStatus = 200): void {
    expect(response.status).toBe(expectedStatus);
  }

  /**
   * Assert that a fetch call was made with the expected parameters.
   * 
   * @param expectedUrl - Expected URL that was called
   * @param expectedMethod - Expected HTTP method
   * @param expectedHeaders - Expected headers object
   */
  static assertFetchCallWasMade(
    expectedUrl: string,
    expectedMethod = "POST",
    expectedHeaders: Record<string, string | undefined> = {}
  ): void {
    const fetchMock = (global as unknown as { fetch: jest.Mock }).fetch;
    assertFetchCall(fetchMock, expectedUrl, expectedMethod, expectedHeaders);
  }

  /**
   * Assert that the request body contains or does not contain specific content.
   * 
   * @param shouldContain - Content that should be present in the body
   * @param shouldNotContain - Content that should NOT be present in the body
   */
  static assertRequestBodyContent(
    shouldContain?: string,
    shouldNotContain?: string
  ): void {
    const fetchMock = (global as unknown as { fetch: jest.Mock }).fetch;
    const [, requestInit] = fetchMock.mock.calls[0];
    const rawBody = requestInit.body as string;

    if (shouldContain) {
      expect(rawBody).toContain(shouldContain);
    }

    if (shouldNotContain) {
      expect(rawBody).not.toContain(shouldNotContain);
    }
  }
}

/**
 * Common test data and URL builders for datasource integration tests.
 */
export const DatasourceTestData = {
  /**
   * Creates a standard ERP forward URL for a given entity and operation.
   * 
   * @param entity - Entity name (e.g., "Order", "Invoice")
   * @param windowId - Window ID for the operation
   * @param tabId - Tab ID for the operation
   * @param operationType - Type of operation (default: "add")
   * @returns Formatted ERP forward URL
   */
  createErpForwardUrl: (
    entity: string,
    windowId = 10,
    tabId = 20,
    operationType = "add"
  ): string => {
    return `http://erp.example/etendo/meta/forward/org.openbravo.service.datasource/${entity}?windowId=${windowId}&tabId=${tabId}&_operationType=${operationType}`;
  },

  /**
   * Standard test tokens for different scenarios.
   */
  tokens: {
    standard: "Bearer-Token-XYZ",
    noCsrf: "Bearer-Token-NoCSRF",
    invoice: "Bearer-Token-Invoice",
  },

  /**
   * Common payload structures for testing.
   */
  payloads: {
    /**
     * Creates a standard payload with optional CSRF token.
     * 
     * @param includeCsrf - Whether to include CSRF token in payload
     * @returns Standard test payload
     */
    createStandard: (includeCsrf = true) => {
      const payload = {
        ...testData.defaultPayload,
      };

      if (!includeCsrf) {
        const { csrfToken, ...payloadWithoutCsrf } = payload;
        return payloadWithoutCsrf;
      }

      return payload;
    },
  },
} as const;

// Re-export commonly used utilities for convenience
export {
  createMockRequest,
  testData,
  assertFetchCall,
  setErpSessionCookie,
  POST,
};

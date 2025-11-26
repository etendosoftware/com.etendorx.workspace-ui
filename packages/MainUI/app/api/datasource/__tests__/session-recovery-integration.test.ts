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

// Mock next/server before any other imports
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
    })),
  },
}));

// Mock next/cache
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn) => fn),
}));

// Mock all other dependencies
jest.mock("@/lib/auth");
jest.mock("@/app/api/_utils/datasourceCache");
jest.mock("@/app/api/_utils/forwardConfig");
jest.mock("@/app/api/_utils/sessionRetryWithCsrf");
jest.mock("@/app/api/_utils/url");
import { POST } from "../route";
import {
  createMockRequest,
  createDatasourceRequest,
  createMockResponseData,
  createSessionRetryResult,
  createSessionRetryError,
  expectSuccessfulResponse,
  expectErrorResponse,
} from "../../../../utils/tests/mockHelpers";

const mockExtractBearerToken = require("@/lib/auth").extractBearerToken as jest.MockedFunction<
  typeof import("@/lib/auth").extractBearerToken
>;
const mockGetUserContext = require("@/lib/auth").getUserContext as jest.MockedFunction<
  typeof import("@/lib/auth").getUserContext
>;
const mockShouldCacheDatasource = require("@/app/api/_utils/datasourceCache")
  .shouldCacheDatasource as jest.MockedFunction<
  typeof import("@/app/api/_utils/datasourceCache").shouldCacheDatasource
>;
const mockExecuteWithSessionAndCsrfRetry = require("@/app/api/_utils/sessionRetryWithCsrf")
  .executeWithSessionAndCsrfRetry as jest.MockedFunction<
  typeof import("@/app/api/_utils/sessionRetryWithCsrf").executeWithSessionAndCsrfRetry
>;

describe("Datasource API Route - Session Recovery Integration", () => {
  const testToken = "test-jwt-token";
  const testUserContext = {
    userId: "user123",
    clientId: "client123",
    orgId: "org123",
    roleId: "role123",
    warehouseId: "warehouse123",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockExtractBearerToken.mockReturnValue(testToken);
    mockGetUserContext.mockResolvedValue(testUserContext);
    mockShouldCacheDatasource.mockReturnValue(false); // Disable caching for retry tests
  });

  it("should successfully process request without session issues", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "TestEntity",
      token: testToken,
    });

    const mockResponseData = createMockResponseData();

    mockExecuteWithSessionAndCsrfRetry.mockResolvedValue(createSessionRetryResult(mockResponseData));

    const response = await POST(mockRequest);

    await expectSuccessfulResponse(response, mockResponseData);
    expect(mockExecuteWithSessionAndCsrfRetry).toHaveBeenCalledWith(mockRequest, testToken, expect.any(Function));
  });

  it("should successfully recover from session expiration", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "TestEntity",
      token: testToken,
    });

    const mockResponseData = createMockResponseData([{ id: 1, name: "Test After Recovery" }]);

    mockExecuteWithSessionAndCsrfRetry.mockResolvedValue(
      createSessionRetryResult(mockResponseData, true) // Indicates session was recovered
    );

    const response = await POST(mockRequest);

    await expectSuccessfulResponse(response, mockResponseData);
    expect(mockExecuteWithSessionAndCsrfRetry).toHaveBeenCalledWith(mockRequest, testToken, expect.any(Function));
  });

  it("should return error when session recovery fails", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "TestEntity",
      token: testToken,
    });

    mockExecuteWithSessionAndCsrfRetry.mockResolvedValue(
      createSessionRetryError("Session recovery failed: Maximum recovery attempts exceeded")
    );

    const response = await POST(mockRequest);

    await expectErrorResponse(response, 500, "Session recovery failed: Maximum recovery attempts exceeded");
    expect(mockExecuteWithSessionAndCsrfRetry).toHaveBeenCalledWith(mockRequest, testToken, expect.any(Function));
  });

  it("should bypass session retry for cached requests", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "CachedEntity",
      token: testToken,
    });

    // Enable caching for this test
    mockShouldCacheDatasource.mockReturnValue(true);

    await POST(mockRequest);

    // Should not call session retry logic for cached requests
    expect(mockExecuteWithSessionAndCsrfRetry).not.toHaveBeenCalled();
  });

  it("should handle missing authorization token", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "TestEntity",
      // No token provided
    });

    mockExtractBearerToken.mockReturnValue(null);

    const response = await POST(mockRequest);

    await expectErrorResponse(response, 401, "Unauthorized - Missing Bearer token");
    expect(mockExecuteWithSessionAndCsrfRetry).not.toHaveBeenCalled();
  });

  it("should handle missing user context", async () => {
    const mockRequest = createDatasourceRequest({
      entity: "TestEntity",
      token: testToken,
    });

    mockGetUserContext.mockResolvedValue(null);

    const response = await POST(mockRequest);

    await expectErrorResponse(response, 401, "Unauthorized - Missing user context");
    expect(mockExecuteWithSessionAndCsrfRetry).not.toHaveBeenCalled();
  });

  it("should handle missing entity parameter", async () => {
    const requestBody = {
      params: { test: "value" },
      // Missing entity
    };

    const mockRequest = createMockRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      pathname: "/api/datasource",
    });

    const response = await POST(mockRequest);

    await expectErrorResponse(response, 400, "Entity is required");
    expect(mockExecuteWithSessionAndCsrfRetry).not.toHaveBeenCalled();
  });
});

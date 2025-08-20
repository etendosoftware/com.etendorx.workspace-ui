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

import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock all dependencies
jest.mock("@/lib/auth");
jest.mock("@/app/api/_utils/datasourceCache");
jest.mock("@/app/api/_utils/forwardConfig");
jest.mock("@/app/api/_utils/sessionRetry");
jest.mock("../_utils/url");

const mockExtractBearerToken = require("@/lib/auth").extractBearerToken as jest.MockedFunction<any>;
const mockGetUserContext = require("@/lib/auth").getUserContext as jest.MockedFunction<any>;
const mockShouldCacheDatasource = require("@/app/api/_utils/datasourceCache").shouldCacheDatasource as jest.MockedFunction<any>;
const mockExecuteWithSessionRetry = require("@/app/api/_utils/sessionRetry").executeWithSessionRetry as jest.MockedFunction<any>;

describe("Datasource API Route - Session Recovery Integration", () => {
  const testToken = "test-jwt-token";
  const testUserContext = {
    userId: "user123",
    clientId: "client123", 
    orgId: "org123",
    roleId: "role123",
    warehouseId: "warehouse123"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockExtractBearerToken.mockReturnValue(testToken);
    mockGetUserContext.mockResolvedValue(testUserContext);
    mockShouldCacheDatasource.mockReturnValue(false); // Disable caching for retry tests
  });

  it("should successfully process request without session issues", async () => {
    const requestBody = {
      entity: "TestEntity",
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const mockResponseData = { response: { data: [{ id: 1, name: "Test" }] } };
    
    mockExecuteWithSessionRetry.mockResolvedValue({
      success: true,
      data: mockResponseData,
      recovered: false
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(mockResponseData);
    expect(mockExecuteWithSessionRetry).toHaveBeenCalledWith(
      mockRequest,
      testToken,
      expect.any(Function)
    );
  });

  it("should successfully recover from session expiration", async () => {
    const requestBody = {
      entity: "TestEntity", 
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const mockResponseData = { response: { data: [{ id: 1, name: "Test After Recovery" }] } };
    
    mockExecuteWithSessionRetry.mockResolvedValue({
      success: true,
      data: mockResponseData,
      recovered: true // Indicates session was recovered
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(mockResponseData);
    expect(mockExecuteWithSessionRetry).toHaveBeenCalledWith(
      mockRequest,
      testToken,
      expect.any(Function)
    );
  });

  it("should return error when session recovery fails", async () => {
    const requestBody = {
      entity: "TestEntity",
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST", 
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    mockExecuteWithSessionRetry.mockResolvedValue({
      success: false,
      error: "Session recovery failed: Maximum recovery attempts exceeded"
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe("Session recovery failed: Maximum recovery attempts exceeded");
    expect(mockExecuteWithSessionRetry).toHaveBeenCalledWith(
      mockRequest,
      testToken,
      expect.any(Function)
    );
  });

  it("should bypass session retry for cached requests", async () => {
    const requestBody = {
      entity: "CachedEntity",
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${testToken}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    // Enable caching for this test
    mockShouldCacheDatasource.mockReturnValue(true);

    const response = await POST(mockRequest);

    // Should not call session retry logic for cached requests
    expect(mockExecuteWithSessionRetry).not.toHaveBeenCalled();
  });

  it("should handle missing authorization token", async () => {
    const requestBody = {
      entity: "TestEntity",
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    mockExtractBearerToken.mockReturnValue(null);

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized - Missing Bearer token");
    expect(mockExecuteWithSessionRetry).not.toHaveBeenCalled();
  });

  it("should handle missing user context", async () => {
    const requestBody = {
      entity: "TestEntity",
      params: { test: "value" }
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    mockGetUserContext.mockResolvedValue(null);

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error).toBe("Unauthorized - Missing user context");
    expect(mockExecuteWithSessionRetry).not.toHaveBeenCalled();
  });

  it("should handle missing entity parameter", async () => {
    const requestBody = {
      params: { test: "value" }
      // Missing entity
    };

    const mockRequest = new NextRequest("https://example.com/api/datasource", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${testToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Entity is required");
    expect(mockExecuteWithSessionRetry).not.toHaveBeenCalled();
  });
});
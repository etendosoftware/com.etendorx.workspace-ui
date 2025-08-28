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

import { renderHook, act } from "@testing-library/react";
import { useApiRequest } from "../useApiRequest";
import { Client } from "@workspaceui/api-client/src/api/client";

// Mock the Client class
jest.mock("@workspaceui/api-client/src/api/client");

const mockClient = jest.mocked(Client);

describe("useApiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.cancelRequestsForEndpoint = jest.fn();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useApiRequest());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
  });

  it("should handle successful API request", async () => {
    const mockData = { id: 1, name: "Test" };
    const mockResponse = { ok: true, data: mockData };
    
    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      const response = await result.current.execute("/test-endpoint");
      expect(response).toEqual(mockData);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockRequest).toHaveBeenCalledWith("/test-endpoint", undefined);
  });

  it("should handle API request with options", async () => {
    const mockData = { success: true };
    const mockResponse = { ok: true, data: mockData };
    const mockOptions = { method: "POST", body: { test: true } };
    
    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      await result.current.execute("/test-endpoint", mockOptions);
    });

    expect(mockRequest).toHaveBeenCalledWith("/test-endpoint", mockOptions);
  });

  it("should handle API request failure", async () => {
    const mockError = new Error("Request failed");
    const mockRequest = jest.fn().mockRejectedValue(mockError);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      const response = await result.current.execute("/test-endpoint");
      expect(response).toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Request failed");
  });

  it("should handle response with !ok status", async () => {
    const mockResponse = { ok: false, statusText: "Not Found" };
    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      const response = await result.current.execute("/test-endpoint");
      expect(response).toBeNull();
    });

    expect(result.current.error).toBe("Not Found");
  });

  it("should not show error for authentication failures", async () => {
    const authError = new Error("Session expired. Please login again.");
    const mockRequest = jest.fn().mockRejectedValue(authError);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      const response = await result.current.execute("/test-endpoint");
      expect(response).toBeNull();
    });

    expect(result.current.error).toBe("Session expired. Please login again.");
    expect(result.current.loading).toBe(false);
  });

  it("should set loading state during request", async () => {
    const mockData = { id: 1 };
    const mockResponse = { ok: true, data: mockData };
    
    let resolveRequest: (value: unknown) => void;
    const requestPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    
    const mockRequest = jest.fn().mockReturnValue(requestPromise);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    // Start the request
    act(() => {
      result.current.execute("/test-endpoint");
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    // Resolve the request
    await act(async () => {
      resolveRequest(mockResponse);
    });

    // Should not be loading anymore
    expect(result.current.loading).toBe(false);
  });

  it("should cancel requests for current endpoint", async () => {
    const mockRequest = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    act(() => {
      result.current.execute("/test-endpoint");
    });

    act(() => {
      result.current.cancel();
    });

    expect(mockClient.cancelRequestsForEndpoint).toHaveBeenCalledWith("/test-endpoint");
    expect(result.current.loading).toBe(false);
  });

  it("should handle unknown error types", async () => {
    const unknownError = "String error";
    const mockRequest = jest.fn().mockRejectedValue(unknownError);
    mockClient.prototype.request = mockRequest;

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      await result.current.execute("/test-endpoint");
    });

    expect(result.current.error).toBe("An unexpected error occurred");
  });
});
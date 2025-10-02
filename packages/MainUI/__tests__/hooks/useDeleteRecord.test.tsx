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
import { useDeleteRecord } from "@/hooks/useDeleteRecord";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@/contexts/TabRefreshContext");
jest.mock("@/contexts/ToolbarContext");
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    datasourceServletClient: {
      request: jest.fn(),
    },
    kernelClient: {
      post: jest.fn(),
    },
  },
}));
jest.mock("@/hooks/useUserContext");
jest.mock("@/hooks/useTranslation");

const mockUseTabRefreshContext = useTabRefreshContext as jest.MockedFunction<typeof useTabRefreshContext>;
const mockMetadataRequest = Metadata.datasourceServletClient.request as jest.MockedFunction<
  typeof Metadata.datasourceServletClient.request
>;
const mockKernelClientPost = Metadata.kernelClient.post as jest.MockedFunction<typeof Metadata.kernelClient.post>;

describe("useDeleteRecord - Parent Refresh Integration", () => {
  const mockTriggerParentRefreshes = jest.fn();
  const mockTab: Tab = {
    id: "test-tab",
    tabLevel: 2,
    entityName: "TestEntity",
    name: "Test Tab",
    window: "test-window",
    title: "Test Tab",
    uIPattern: "STD" as const,
    parentColumns: [],
    table: "test_table",
    fields: {},
    _identifier: "test-identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test-module",
  };
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: jest.fn(),
      unregisterRefresh: jest.fn(),
      triggerParentRefreshes: mockTriggerParentRefreshes,
    });

    // Mock successful delete response
    mockMetadataRequest.mockResolvedValue({
      ok: true,
      data: { response: { status: 0 } },
    } as unknown as Response & { data?: unknown });

    // Mock successful multi-delete response
    mockKernelClientPost.mockResolvedValue({
      ok: true,
      data: { response: { status: 0 } },
    } as unknown as Response & { data?: unknown });

    // Mock other required hooks
    require("@/hooks/useUserContext").useUserContext.mockReturnValue({
      user: { id: "test-user" },
      logout: jest.fn(),
      setLoginErrorText: jest.fn(),
      setLoginErrorDescription: jest.fn(),
    });

    require("@/hooks/useTranslation").useTranslation.mockReturnValue({
      t: (key: string) => key,
    });

    // Mock ToolbarContext
    require("@/contexts/ToolbarContext").useToolbarContext.mockReturnValue({
      onBack: jest.fn(),
    });
  });

  it("should trigger parent refreshes after successful delete for child tabs", async () => {
    const { result } = renderHook(() =>
      useDeleteRecord({
        tab: mockTab,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    const testRecord = { id: "test-record-1" };

    await act(async () => {
      await result.current.deleteRecord(testRecord);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(1);
    expect(mockTriggerParentRefreshes).toHaveBeenCalledWith(2);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it("should not trigger parent refreshes for level 0 tabs", async () => {
    const level0Tab = { ...mockTab, tabLevel: 0 };

    const { result } = renderHook(() =>
      useDeleteRecord({
        tab: level0Tab,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    const testRecord = { id: "test-record-1" };

    await act(async () => {
      await result.current.deleteRecord(testRecord);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(1);
    expect(mockTriggerParentRefreshes).not.toHaveBeenCalled();
  });

  it("should not trigger parent refreshes if delete fails", async () => {
    // Mock failed delete response
    mockMetadataRequest.mockResolvedValue({
      ok: false,
      data: { response: { error: { message: "Delete failed" } } },
    } as unknown as Response & { data?: unknown });

    const { result } = renderHook(() =>
      useDeleteRecord({
        tab: mockTab,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    const testRecord = { id: "test-record-1" };

    await act(async () => {
      await result.current.deleteRecord(testRecord);
    });

    expect(mockOnError).toHaveBeenCalledWith({ errorMessage: "Delete failed" });
    expect(mockTriggerParentRefreshes).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("should handle multiple records deletion and trigger parent refresh", async () => {
    const { result } = renderHook(() =>
      useDeleteRecord({
        tab: mockTab,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    const testRecords = [{ id: "test-record-1" }, { id: "test-record-2" }, { id: "test-record-3" }];

    await act(async () => {
      await result.current.deleteRecord(testRecords);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(3);
    expect(mockTriggerParentRefreshes).toHaveBeenCalledWith(2);
    expect(mockKernelClientPost).toHaveBeenCalledTimes(1); // One call for multi-delete
    expect(mockMetadataRequest).not.toHaveBeenCalled(); // Single delete should not be called
  });
});

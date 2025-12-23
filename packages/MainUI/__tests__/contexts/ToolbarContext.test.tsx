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

import { render, act } from "@testing-library/react";
import { ToolbarProvider, useToolbarContext } from "@/contexts/ToolbarContext";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { useTabContext } from "@/contexts/tab";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@/contexts/TabRefreshContext");
jest.mock("@/contexts/tab");
jest.mock("@/services/callouts");

const mockUseTabRefreshContext = useTabRefreshContext as jest.MockedFunction<typeof useTabRefreshContext>;
const mockUseTabContext = useTabContext as jest.MockedFunction<typeof useTabContext>;

describe("ToolbarContext - Save Wrapping", () => {
  let contextValue: ReturnType<typeof useToolbarContext>;
  const mockTriggerParentRefreshes = jest.fn();
  const mockTriggerCurrentRefresh = jest.fn();
  const mockTab: Tab = {
    id: "test-tab",
    tabLevel: 2,
    name: "Test Tab",
    window: "test-window",
    entityName: "TestEntity",
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

  const TestComponent = () => {
    contextValue = useToolbarContext();
    return null;
  };

  const renderWithProviders = (customTab?: Tab) => {
    const tabToUse = customTab || mockTab;

    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: jest.fn(),
      unregisterRefresh: jest.fn(),
      triggerParentRefreshes: mockTriggerParentRefreshes,
      triggerCurrentRefresh: mockTriggerCurrentRefresh,
      triggerRefresh: jest.fn(),
    });

    mockUseTabContext.mockReturnValue({
      tab: tabToUse,
      record: null,
      parentTab: null,
      parentRecord: null,
      parentRecords: null,
      hasFormChanges: false,
      markFormAsChanged: jest.fn(),
      resetFormChanges: jest.fn(),
    });

    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should wrap onSave to trigger parent refreshes after successful save", async () => {
    renderWithProviders();

    const mockSave = jest.fn().mockResolvedValue(undefined);

    // Register a save action
    act(() => {
      contextValue.registerActions({ save: mockSave });
    });

    // Execute the wrapped onSave
    await act(async () => {
      await contextValue.onSave(false);
    });

    expect(mockSave).toHaveBeenCalledWith(false);
    // Should trigger parent refreshes
    expect(mockTriggerParentRefreshes).toHaveBeenCalledWith(2);
  });

  it("should not trigger refreshes if save fails", async () => {
    renderWithProviders();

    const saveError = new Error("Save failed");
    const mockSave = jest.fn().mockRejectedValue(saveError);

    act(() => {
      contextValue.registerActions({ save: mockSave });
    });

    await expect(
      act(async () => {
        await contextValue.onSave(false);
      })
    ).rejects.toThrow("Save failed");

    expect(mockSave).toHaveBeenCalledWith(false);
    expect(mockTriggerParentRefreshes).not.toHaveBeenCalled();
  });

  it("should not trigger parent refreshes for level 0 tabs", async () => {
    const level0Tab = { ...mockTab, tabLevel: 0 };

    renderWithProviders(level0Tab);

    const mockSave = jest.fn().mockResolvedValue(undefined);

    act(() => {
      contextValue.registerActions({ save: mockSave });
    });

    await act(async () => {
      await contextValue.onSave(false);
    });

    expect(mockSave).toHaveBeenCalledWith(false);
    // Should NOT trigger parent refreshes for level 0
    expect(mockTriggerParentRefreshes).not.toHaveBeenCalled();
  });

  it("should handle missing tab context gracefully", async () => {
    // Create a tab with undefined tabLevel to test handling
    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: jest.fn(),
      unregisterRefresh: jest.fn(),
      triggerParentRefreshes: mockTriggerParentRefreshes,
      triggerCurrentRefresh: mockTriggerCurrentRefresh,
      triggerRefresh: jest.fn(),
    });

    mockUseTabContext.mockReturnValue({
      tab: undefined as unknown as Tab,
      record: null,
      parentTab: null,
      parentRecord: null,
      parentRecords: null,
      hasFormChanges: false,
      markFormAsChanged: jest.fn(),
      resetFormChanges: jest.fn(),
    });

    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    const mockSave = jest.fn().mockResolvedValue(undefined);

    act(() => {
      contextValue.registerActions({ save: mockSave });
    });

    await act(async () => {
      await contextValue.onSave(false);
    });

    expect(mockSave).toHaveBeenCalledWith(false);
    // Should not trigger any refreshes when tab is undefined
    expect(mockTriggerParentRefreshes).not.toHaveBeenCalled();
  });
});

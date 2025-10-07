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

import type React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import { DatasourceProvider } from "@/contexts/datasourceContext";
import { Tab } from "@/components/window/Tab";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/process", () => ({
  executeProcess: jest.fn(),
}));

jest.mock("@/components/ProcessModal/ProcessDefinitionModal", () => ({
  ProcessDefinitionModal: jest.fn(() => null),
}));

jest.mock("@/components/Toolbar/Toolbar", () => ({
  Toolbar: jest.fn(() => null),
}));

jest.mock("@/components/Table", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/components/Form/FormView", () => ({
  FormView: jest.fn(() => null),
}));

jest.mock("@/contexts/TabRefreshContext");
jest.mock("@/contexts/ToolbarContext");
jest.mock("@/hooks/useMetadataContext");
jest.mock("@/hooks/useSelected");
jest.mock("@/hooks/navigation/useMultiWindowURL");
jest.mock("@/contexts/tab");
jest.mock("@/hooks/useUserContext");

const mockUseTabRefreshContext = useTabRefreshContext as jest.MockedFunction<typeof useTabRefreshContext>;
const mockUseToolbarContext = useToolbarContext as jest.MockedFunction<typeof useToolbarContext>;

// Helper function to render with theme and providers
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <DatasourceProvider>{component}</DatasourceProvider>
    </ThemeProvider>
  );
};

describe("Tab - Refresh Registration", () => {
  const mockTab: TabType = {
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

  const mockRegisterRefresh = jest.fn();
  const mockUnregisterRefresh = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockRegisterActions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: mockRegisterRefresh,
      unregisterRefresh: mockUnregisterRefresh,
      triggerParentRefreshes: jest.fn(),
    });

    mockUseToolbarContext.mockReturnValue({
      registerActions: mockRegisterActions,
      onRefresh: mockOnRefresh,
      onSave: jest.fn(),
      onNew: jest.fn(),
      onBack: jest.fn(),
      onFilter: jest.fn(),
      onToggleTreeView: jest.fn(),
      onColumnFilters: jest.fn(),
      saveButtonState: {
        isCalloutLoading: false,
        hasValidationErrors: false,
        isSaving: false,
        validationErrors: [],
      },
      setSaveButtonState: jest.fn(),
    });

    // Mock other hooks with minimal required values
    require("@/hooks/useMetadataContext").useMetadataContext = jest.fn().mockReturnValue({
      window: { id: "test-window" },
    });

    require("@/hooks/useSelected").useSelected = jest.fn().mockReturnValue({
      graph: {
        clearSelected: jest.fn(),
        getChildren: jest.fn(() => []),
        getParent: jest.fn(() => null),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    });

    require("@/hooks/navigation/useMultiWindowURL").useMultiWindowURL = jest.fn().mockReturnValue({
      activeWindow: { windowId: "test-window" },
      getTabFormState: jest.fn(() => ({ mode: "table" })),
      getSelectedRecord: jest.fn(),
      setTabFormState: jest.fn(),
      clearTabFormState: jest.fn(),
      clearTabFormStateAtomic: jest.fn(),
      setSelectedRecord: jest.fn(),
      clearSelectedRecord: jest.fn(),
      clearChildrenSelections: jest.fn(),
    });

    // Mock tab context
    require("@/contexts/tab").useTabContext = jest.fn().mockReturnValue({
      tab: mockTab,
    });

    // Mock user context
    require("@/hooks/useUserContext").useUserContext = jest.fn().mockReturnValue({
      user: { id: "test-user", name: "Test User" },
      isAuthenticated: true,
    });
  });

  it("should register refresh callback on mount", () => {
    renderWithTheme(<Tab tab={mockTab} collapsed={false} />);

    expect(mockRegisterRefresh).toHaveBeenCalledWith(2, mockOnRefresh);
  });

  it("should unregister refresh callback on unmount", () => {
    const { unmount } = renderWithTheme(<Tab tab={mockTab} collapsed={false} />);

    unmount();

    expect(mockUnregisterRefresh).toHaveBeenCalledWith(2);
  });

  it("should register tab-specific actions", () => {
    renderWithTheme(<Tab tab={mockTab} collapsed={false} />);

    expect(mockRegisterActions).toHaveBeenCalled();

    // Get all the actions that were registered across all calls
    const allRegisteredActions = mockRegisterActions.mock.calls.reduce((acc, call) => {
      return Object.assign(acc, call[0]);
    }, {});

    // Tab component should register its specific actions at some point
    expect(allRegisteredActions.new).toBeDefined();
    expect(allRegisteredActions.back).toBeDefined();
    expect(allRegisteredActions.treeView).toBeDefined();

    // These actions should be functions
    expect(typeof allRegisteredActions.new).toBe("function");
    expect(typeof allRegisteredActions.back).toBe("function");
    expect(typeof allRegisteredActions.treeView).toBe("function");
  });
});

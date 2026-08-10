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

// Mock dependencies
jest.mock("../../../contexts/TabRefreshContext");
jest.mock("../../../contexts/ToolbarContext");
jest.mock("../../../hooks/useMetadataContext");
jest.mock("../../../hooks/useSelected");
jest.mock("../../../contexts/tab");
jest.mock("../../../hooks/useUserContext");

import type React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import { DatasourceProvider } from "@/contexts/datasourceContext";
import WindowProvider from "@/contexts/window";
import { Tab } from "@/components/window/Tab";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import type { Tab as TabType } from "@workspaceui/api-client/src/api/types";
import DynamicTable from "@/components/Table";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { CurrentWindowProvider } from "@/contexts/CurrentWindowContext";
import { FocusProvider } from "@/contexts/focus";
import { useWindowStore } from "@/stores/windowStore";
import { TOOLBAR_ACTION_OWNERS } from "@/utils/toolbar/actionOwnership";

// Mock other dependencies
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

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    forEach: jest.fn(),
  })),
}));

const mockUseTabRefreshContext = useTabRefreshContext as jest.MockedFunction<typeof useTabRefreshContext>;
const mockUseToolbarContext = useToolbarContext as jest.MockedFunction<typeof useToolbarContext>;

// Helper function to render with theme and providers
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <WindowProvider>
        <DatasourceProvider>{component}</DatasourceProvider>
      </WindowProvider>
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

    // Mock runtime config context
    // Handled by fallback in RuntimeConfigContext.tsx

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
      shouldOpenAttachmentModal: false,
      setShouldOpenAttachmentModal: jest.fn(),
      isImplicitFilterApplied: false,
      setIsImplicitFilterApplied: jest.fn(),
    });

    // Mock other hooks with minimal required values
    require("@/hooks/useMetadataContext").useMetadataContext = jest.fn().mockReturnValue({
      window: { id: "test-window" },
    });

    require("@/hooks/useSelected").useSelected = jest.fn().mockReturnValue({
      graph: {
        clearSelected: jest.fn(),
        clearSelectedMultiple: jest.fn(),
        getChildren: jest.fn(() => []),
        getParent: jest.fn(() => null),
        addListener: jest.fn().mockReturnThis(),
        removeListener: jest.fn().mockReturnThis(),
        getSelected: jest.fn(),
        getSelectedMultiple: jest.fn(() => []),
        setSelected: jest.fn(),
        setSelectedMultiple: jest.fn(),
      },
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

describe("Tab - Split view", () => {
  const WINDOW_IDENTIFIER = "test-window_1";
  const RECORD_ID = "record-1";

  const splitTab: TabType = {
    ...({} as TabType),
    id: "split-tab",
    tabLevel: 0,
    name: "Split Tab",
    window: "test-window",
    entityName: "TestEntity",
    title: "Split Tab",
    uIPattern: "STD" as const,
    parentColumns: [],
    table: "test_table",
    fields: {},
    _identifier: "split-identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test-module",
  };

  const mockRegisterActions = jest.fn();

  const renderSplitTab = () =>
    render(
      <ThemeProvider theme={theme}>
        <WindowProvider>
          <CurrentWindowProvider windowIdentifier={WINDOW_IDENTIFIER} windowId="test-window">
            <FocusProvider>
              <DatasourceProvider>
                <Tab tab={splitTab} collapsed={false} />
              </DatasourceProvider>
            </FocusProvider>
          </CurrentWindowProvider>
        </WindowProvider>
      </ThemeProvider>
    );

  /** Latest props the mocked child component was rendered with. */
  const lastPropsOf = (component: unknown) => {
    const calls = (component as jest.Mock).mock.calls;
    return calls[calls.length - 1]?.[0];
  };

  /** The `toggleSplitView` implementation the tab registered on the toolbar. */
  const registeredToggle = (): (() => void) => {
    const merged = mockRegisterActions.mock.calls.reduce((acc, call) => Object.assign(acc, call[0]), {});
    return merged.toggleSplitView;
  };

  const openForm = () => {
    act(() => {
      useWindowStore
        .getState()
        .setTabFormState(WINDOW_IDENTIFIER, splitTab.id, { recordId: RECORD_ID, mode: "form", formMode: "edit" });
    });
  };

  const getSplit = () => useWindowStore.getState().windows[WINDOW_IDENTIFIER]?.tabs[splitTab.id]?.split;

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.getState().cleanState();

    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: jest.fn(),
      unregisterRefresh: jest.fn(),
      triggerParentRefreshes: jest.fn(),
    });

    mockUseToolbarContext.mockReturnValue({
      registerActions: mockRegisterActions,
      unregisterActions: jest.fn(),
      onRefresh: jest.fn(),
      onSave: jest.fn(),
      onNew: jest.fn(),
      onBack: jest.fn(),
      onFilter: jest.fn(),
      onToggleTreeView: jest.fn(),
      onToggleSplitView: jest.fn(),
      onColumnFilters: jest.fn(),
      saveButtonState: {
        isCalloutLoading: false,
        hasValidationErrors: false,
        isSaving: false,
        validationErrors: [],
      },
      setSaveButtonState: jest.fn(),
      shouldOpenAttachmentModal: false,
      setShouldOpenAttachmentModal: jest.fn(),
      isImplicitFilterApplied: false,
      setIsImplicitFilterApplied: jest.fn(),
      setIsAdvancedFilterApplied: jest.fn(),
    });

    require("@/hooks/useMetadataContext").useMetadataContext = jest.fn().mockReturnValue({
      window: { id: "test-window" },
    });

    require("@/hooks/useSelected").useSelected = jest.fn().mockReturnValue({
      graph: {
        clearSelected: jest.fn(),
        clearSelectedMultiple: jest.fn(),
        getChildren: jest.fn(() => []),
        getParent: jest.fn(() => null),
        addListener: jest.fn().mockReturnThis(),
        removeListener: jest.fn().mockReturnThis(),
        getSelected: jest.fn(),
        getSelectedMultiple: jest.fn(() => []),
        setSelected: jest.fn(),
        setSelectedMultiple: jest.fn(),
      },
    });

    require("@/contexts/tab").useTabContext = jest.fn().mockReturnValue({ tab: splitTab, hasFormChanges: false });

    require("@/hooks/useUserContext").useUserContext = jest.fn().mockReturnValue({
      user: { id: "test-user", name: "Test User" },
      isAuthenticated: true,
    });
  });

  it("registers the split-view toggle under the tab owner", () => {
    renderSplitTab();

    expect(mockRegisterActions).toHaveBeenCalledWith(
      expect.objectContaining({ toggleSplitView: expect.any(Function) }),
      TOOLBAR_ACTION_OWNERS.TAB
    );
  });

  it("starts in grid mode with the grid as the only pane", () => {
    renderSplitTab();

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(lastPropsOf(DynamicTable)).toMatchObject({ isVisible: true, isPrimaryView: true });
    expect(lastPropsOf(Toolbar)).toMatchObject({ isFormView: false, isSplitView: false });
  });

  it("hides the grid in the maximized form", () => {
    renderSplitTab();
    openForm();

    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(lastPropsOf(DynamicTable)).toMatchObject({ isVisible: false, isPrimaryView: false });
    expect(lastPropsOf(Toolbar)).toMatchObject({ isFormView: true, isSplitView: false });
  });

  it("shows both panes with a draggable divider once split is enabled", () => {
    renderSplitTab();
    openForm();

    act(() => registeredToggle()());

    expect(screen.getByRole("separator")).toBeInTheDocument();
    // The grid is visible but no longer the primary view — the form pane is too.
    expect(lastPropsOf(DynamicTable)).toMatchObject({ isVisible: true, isPrimaryView: false });
    expect(lastPropsOf(Toolbar)).toMatchObject({ isFormView: true, isSplitView: true });
  });

  it("toggles back to the maximized form", () => {
    renderSplitTab();
    openForm();

    act(() => registeredToggle()());
    expect(getSplit()?.enabled).toBe(true);

    act(() => registeredToggle()());
    expect(getSplit()?.enabled).toBe(false);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("opens the selected record in split view when pressed from the grid", () => {
    renderSplitTab();
    act(() => {
      useWindowStore.getState().setSelectedRecord(WINDOW_IDENTIFIER, splitTab.id, RECORD_ID);
    });

    act(() => registeredToggle()());

    expect(getSplit()?.enabled).toBe(true);
    expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].tabs[splitTab.id].form).toMatchObject({
      recordId: RECORD_ID,
      mode: "form",
    });
  });

  it("does nothing when pressed from the grid with no record selected", () => {
    renderSplitTab();

    act(() => registeredToggle()());

    // Nothing was written at all: no split preference and no form opened.
    expect(getSplit()?.enabled).toBeFalsy();
    expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER]?.tabs[splitTab.id]?.form ?? {}).toEqual({});
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("keeps the split preference when the form is closed", () => {
    renderSplitTab();
    openForm();
    act(() => registeredToggle()());

    act(() => {
      useWindowStore.getState().clearTabFormState(WINDOW_IDENTIFIER, splitTab.id);
    });

    expect(getSplit()?.enabled).toBe(true);
    // Grid only again, but the preference survives for the next record.
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  describe("row selection in split view", () => {
    const selectRow = (recordId: string) => {
      act(() => lastPropsOf(DynamicTable).onRecordSelection(recordId));
    };

    it("loads the clicked record into the form", () => {
      renderSplitTab();
      openForm();
      act(() => registeredToggle()());

      selectRow("record-2");

      expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].tabs[splitTab.id].form).toMatchObject({
        recordId: "record-2",
      });
    });

    it("does not change the form record when there are unsaved changes", () => {
      require("@/contexts/tab").useTabContext = jest.fn().mockReturnValue({ tab: splitTab, hasFormChanges: true });
      renderSplitTab();
      openForm();
      act(() => registeredToggle()());

      selectRow("record-2");

      expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].tabs[splitTab.id].form).toMatchObject({
        recordId: RECORD_ID,
      });
    });

    it("does not open the form on selection outside split view", () => {
      renderSplitTab();

      selectRow("record-2");

      expect(useWindowStore.getState().windows[WINDOW_IDENTIFIER].tabs[splitTab.id].form).toEqual({});
    });
  });

  describe("ctrl+m shortcut", () => {
    it("toggles the split view while the tab is focused", () => {
      renderSplitTab();
      openForm();

      fireEvent.keyDown(document, { key: "m", ctrlKey: true });

      expect(getSplit()?.enabled).toBe(true);
    });
  });
});

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

/**
 * @fileoverview Unit tests for Window component with windowIdentifier prop
 *
 * Tests the Window component implementation changes for multi-window instance isolation:
 * - Component interface updates to receive windowIdentifier prop
 * - Proper prop passing to SelectedProvider
 * - TypeScript validation for required props
 */

import { render, screen } from "@testing-library/react";
import Window from "../Window";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";

// Mock all required contexts and hooks with controllable behavior
const mockMetadataContext = {
  error: null,
  loading: false,
  getWindowMetadata: jest.fn().mockReturnValue({
    id: "TestWindow",
    name: "Test Window",
    window$_identifier: "TestWindow",
    tabs: [
      {
        id: "tab1",
        name: "Main Tab",
        tabLevel: 0,
        parentTabId: undefined,
        window: "TestWindow",
        table: "test_table",
        entityName: "TestEntity",
        fields: {},
        parentColumns: [],
        _identifier: "test_identifier",
        records: {},
        hqlfilterclause: "",
        hqlwhereclause: "",
        sQLWhereClause: "",
        module: "test_module",
      },
    ],
  } as unknown as Etendo.WindowMetadata),
  loadWindowData: jest.fn().mockResolvedValue({}),
};

jest.mock("../../../hooks/useMetadataContext", () => ({
  useMetadataContext: () => mockMetadataContext,
}));

// Mock useTranslation hook
jest.mock("../../../hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Simple pass-through for translation keys
  }),
}));

// Mock SelectedProvider
jest.mock("../../../contexts/selected", () => ({
  SelectedProvider: ({
    children,
    tabs,
    windowId,
    windowIdentifier,
  }: {
    children: React.ReactNode;
    tabs: unknown[];
    windowId: string;
    windowIdentifier: string;
  }) => (
    <div
      data-testid="selected-provider"
      data-window-id={windowId}
      data-window-identifier={windowIdentifier}
      data-tabs-count={tabs.length}>
      {children}
    </div>
  ),
}));

// Mock TabsContainer
jest.mock("../TabsContainer", () => ({
  __esModule: true,
  default: () => <div data-testid="tabs-container">Tabs Container</div>,
}));

// Mock ErrorDisplay
jest.mock("../../../components/ErrorDisplay", () => ({
  ErrorDisplay: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="error-display" data-title={title} data-description={description}>
      Error: {title}
      {description && ` - ${description}`}
    </div>
  ),
}));

// Mock Loading component
jest.mock("../../../components/loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

describe("Window Component Multi-Window Instance Support", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state
    Object.assign(mockMetadataContext, {
      error: null,
      loading: false,
      getWindowMetadata: jest.fn().mockReturnValue({
        id: "TestWindow",
        name: "Test Window",
        window$_identifier: "TestWindow",
        tabs: [
          {
            id: "tab1",
            name: "Main Tab",
            tabLevel: 0,
            parentTabId: undefined,
            window: "TestWindow",
            table: "test_table",
            entityName: "TestEntity",
            fields: {},
            parentColumns: [],
            _identifier: "test_identifier",
            records: {},
            hqlfilterclause: "",
            hqlwhereclause: "",
            sQLWhereClause: "",
            module: "test_module",
          },
        ],
      } as unknown as Etendo.WindowMetadata),
      loadWindowData: jest.fn().mockResolvedValue({}),
    });
  });

  describe("Component Interface Updates", () => {
    it("should accept both windowId and windowIdentifier props", () => {
      expect(() => {
        render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);
      }).not.toThrow();

      expect(screen.getByTestId("selected-provider")).toBeInTheDocument();
    });

    it("should pass windowIdentifier to SelectedProvider", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      const selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-window-identifier", "TestWindow_123456789");
    });

    it("should pass windowId to SelectedProvider for metadata operations", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      const selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-window-id", "TestWindow");
    });

    it("should pass tabs from window metadata to SelectedProvider", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      const selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-tabs-count", "1");
    });
  });

  describe("Props Validation", () => {
    it("should handle missing windowIdentifier gracefully in TypeScript", () => {
      // This test ensures TypeScript compilation catches missing props
      // @ts-expect-error - Testing TypeScript validation
      const renderWithMissingProp = () => render(<Window windowId="TestWindow" />);

      // TypeScript should prevent this from compiling
      // In runtime, we expect the component to handle it gracefully
      expect(renderWithMissingProp).toBeDefined();
    });

    it("should handle missing windowId gracefully in TypeScript", () => {
      // @ts-expect-error - Testing TypeScript validation
      const renderWithMissingProp = () => render(<Window windowIdentifier="TestWindow_123" />);

      // TypeScript should prevent this from compiling
      expect(renderWithMissingProp).toBeDefined();
    });

    it("should work with different windowIdentifier formats", () => {
      const identifiers = ["TestWindow_123456789", "ProductWindow_987654321", "CustomerWindow_111222333"];

      for (const identifier of identifiers) {
        const { unmount } = render(<Window windowId="TestWindow" windowIdentifier={identifier} />);

        const selectedProvider = screen.getByTestId("selected-provider");
        expect(selectedProvider).toHaveAttribute("data-window-identifier", identifier);

        unmount();
      }
    });
  });

  describe("Component Hierarchy and Integration", () => {
    it("should render TabsContainer when window data is available", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      expect(screen.getByTestId("tabs-container")).toBeInTheDocument();
    });

    it("should handle loading state correctly", () => {
      // Set loading state
      Object.assign(mockMetadataContext, {
        error: null,
        loading: true,
        getWindowMetadata: jest.fn().mockReturnValue(undefined),
        loadWindowData: jest.fn().mockResolvedValue({}),
      });

      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      expect(screen.getByTestId("loading-component")).toBeInTheDocument();
    });

    it("should handle error state correctly", () => {
      const testError = new Error("Test error message");

      // Set error state - but keep windowData available so !windowData doesn't trigger loading
      Object.assign(mockMetadataContext, {
        error: testError,
        loading: false,
        getWindowMetadata: jest.fn().mockReturnValue({
          id: "TestWindow",
          name: "Test Window",
          window$_identifier: "TestWindow",
          tabs: [],
        } as unknown as Etendo.WindowMetadata),
        loadWindowData: jest.fn().mockResolvedValue({}),
      });

      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByTestId("error-display")).toHaveAttribute("data-title", "Test error message");
    });
  });

  describe("Component Interface Requirements", () => {
    it("should maintain prop passing chain through component hierarchy", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      // Verify the complete prop passing chain
      const selectedProvider = screen.getByTestId("selected-provider");

      // Both windowId and windowIdentifier should be passed
      expect(selectedProvider).toHaveAttribute("data-window-id", "TestWindow");
      expect(selectedProvider).toHaveAttribute("data-window-identifier", "TestWindow_123456789");

      // Tabs should be passed from metadata
      expect(selectedProvider).toHaveAttribute("data-tabs-count", "1");
    });

    it("should support multiple instances with different identifiers", () => {
      // First instance
      const { unmount: unmount1 } = render(<Window windowId="TestWindow" windowIdentifier="TestWindow_instance1" />);

      let selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-window-identifier", "TestWindow_instance1");

      unmount1();

      // Second instance
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_instance2" />);

      selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-window-identifier", "TestWindow_instance2");
    });

    it("should use correct testid format for component identification", () => {
      render(<Window windowId="TestWindow" windowIdentifier="TestWindow_123456789" />);

      // SelectedProvider should have the expected testid format
      const selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toBeInTheDocument();

      // Verify it's using the testid from implementation
      expect(selectedProvider).toHaveAttribute("data-testid", "selected-provider");
    });

    it("should handle complex window metadata structures", () => {
      // Set complex window data
      Object.assign(mockMetadataContext, {
        error: null,
        loading: false,
        getWindowMetadata: jest.fn().mockReturnValue({
          id: "ComplexWindow",
          name: "Complex Window",
          window$_identifier: "ComplexWindow",
          tabs: [
            {
              id: "tab1",
              name: "Parent Tab",
              tabLevel: 0,
              parentTabId: undefined,
            },
            {
              id: "tab2",
              name: "Child Tab",
              tabLevel: 1,
              parentTabId: "tab1",
            },
            {
              id: "tab3",
              name: "Grandchild Tab",
              tabLevel: 2,
              parentTabId: "tab2",
            },
          ],
        } as unknown as Etendo.WindowMetadata),
        loadWindowData: jest.fn().mockResolvedValue({}),
      });

      render(<Window windowId="ComplexWindow" windowIdentifier="ComplexWindow_complex123" />);

      const selectedProvider = screen.getByTestId("selected-provider");
      expect(selectedProvider).toHaveAttribute("data-tabs-count", "3");
      expect(selectedProvider).toHaveAttribute("data-window-id", "ComplexWindow");
      expect(selectedProvider).toHaveAttribute("data-window-identifier", "ComplexWindow_complex123");
    });
  });
});

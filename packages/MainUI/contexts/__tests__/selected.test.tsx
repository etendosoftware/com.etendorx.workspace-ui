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
 * @fileoverview Unit tests for SelectedProvider with required windowIdentifier
 *
 * Tests the SelectedProvider implementation changes for multi-window instance isolation:
 * - Required windowIdentifier parameter validation
 * - Independent graph cache key generation per instance
 * - Graph instance isolation between different window identifiers
 */

import { render, screen } from "@testing-library/react";
import { SelectedProvider, SelectContext } from "../selected";
import { useContext } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock useMultiWindowURL hook
const mockWindowStates = [
  {
    windowId: "TestWindow",
    window_identifier: "TestWindow_123456789",
    isActive: true,
    order: 1,
    selectedRecords: { tab1: "record1" },
    tabFormStates: {},
  },
  {
    windowId: "TestWindow",
    window_identifier: "TestWindow_987654321",
    isActive: false,
    order: 2,
    selectedRecords: { tab1: "record2" },
    tabFormStates: {},
  },
];

jest.mock("../../hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => ({
    windows: mockWindowStates,
    activeWindow: mockWindowStates[0],
  }),
}));

jest.mock("../../data/graph", () => {
  return jest.fn().mockImplementation((tabs: Tab[]) => {
    const graphId = `graph_${Date.now()}}`;
    const instance = {
      id: graphId,
      tabs,
      clearSelected: jest.fn(),
      clearSelectedMultiple: jest.fn(),
      setSelected: jest.fn(),
      getSelected: jest.fn(),
      getSelectedRecord: jest.fn(),
      setSelectedRecord: jest.fn(),
      clearSelectedRecord: jest.fn(),
      getSelectedRecords: jest.fn(),
      setSelectedRecords: jest.fn(),
      clearSelectedRecords: jest.fn(),
    };
    return instance;
  });
});

// Create mock tabs
const createMockTabs = (): Tab[] => [
  {
    id: "tab1",
    name: "Main Tab",
    title: "Main Tab",
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
    uIPattern: "STD",
  },
  {
    id: "tab2",
    name: "Child Tab",
    title: "Child Tab",
    tabLevel: 1,
    parentTabId: "tab1",
    window: "TestWindow",
    table: "child_table",
    entityName: "ChildEntity",
    fields: {},
    parentColumns: ["parentId"],
    _identifier: "child_identifier",
    records: {},
    hqlfilterclause: "",
    hqlwhereclause: "",
    sQLWhereClause: "",
    module: "test_module",
    uIPattern: "STD",
  },
];

describe("SelectedProvider Multi-Window Instance Isolation", () => {
  const mockTabs = createMockTabs();

  const TestConsumer = ({ testId }: { testId: string }) => {
    const context = useContext(SelectContext);

    return (
      <div>
        <span data-testid={`${testId}-graph-id`}>{(context.graph as { id?: string })?.id || "no-graph"}</span>
        <span data-testid={`${testId}-graph-exists`}>{context.graph ? "true" : "false"}</span>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("windowIdentifier Functionality", () => {
    it("should render successfully when windowIdentifier is provided", () => {
      expect(() => {
        render(
          <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
            <TestConsumer testId="valid" />
          </SelectedProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId("valid-graph-id")).toBeInTheDocument();
    });

    it("should use windowIdentifier for graph cache key generation", () => {
      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <TestConsumer testId="cache-key-test" />
        </SelectedProvider>
      );

      // Should successfully create graph instance
      expect(screen.getByTestId("cache-key-test-graph-id")).not.toHaveTextContent("no-graph");
    });
  });

  describe("Graph Instance Isolation", () => {
    it("should create different graph instances for different window identifiers", () => {
      const { unmount: unmount1 } = render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <TestConsumer testId="instance1" />
        </SelectedProvider>
      );

      const graph1Id = screen.getByTestId("instance1-graph-id").textContent;

      unmount1();

      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_987654321">
          <TestConsumer testId="instance2" />
        </SelectedProvider>
      );

      const graph2Id = screen.getByTestId("instance2-graph-id").textContent;

      // Different window identifiers should create different graph instances
      expect(graph1Id).not.toBe(graph2Id);
      expect(graph1Id).not.toBe("no-graph");
      expect(graph2Id).not.toBe("no-graph");
    });

    it("should reuse graph instance for same window identifier", () => {
      const { unmount: unmount1 } = render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <TestConsumer testId="first-render" />
        </SelectedProvider>
      );

      const firstGraphId = screen.getByTestId("first-render-graph-id").textContent;

      unmount1();

      // Re-render with same windowIdentifier
      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <TestConsumer testId="second-render" />
        </SelectedProvider>
      );

      const secondGraphId = screen.getByTestId("second-render-graph-id").textContent;

      // Same window identifier should reuse cached graph instance
      expect(firstGraphId).toBe(secondGraphId);
    });

    it("should use windowIdentifier as cache key instead of windowId", () => {
      // First instance with specific windowIdentifier
      const { unmount: unmount1 } = render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_specific_123">
          <TestConsumer testId="specific" />
        </SelectedProvider>
      );

      const specificGraphId = screen.getByTestId("specific-graph-id").textContent;

      unmount1();

      // Second instance with same windowId but different windowIdentifier
      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_different_456">
          <TestConsumer testId="different" />
        </SelectedProvider>
      );

      const differentGraphId = screen.getByTestId("different-graph-id").textContent;

      // Should create different graphs even with same windowId but different windowIdentifier
      expect(specificGraphId).not.toBe(differentGraphId);
    });
  });

  describe("Context Functionality", () => {
    it("should provide complete context with all required properties", () => {
      let contextInstance: unknown = null;

      const ContextCapture = () => {
        contextInstance = useContext(SelectContext);
        return <div data-testid="context-capture">captured</div>;
      };

      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <ContextCapture />
        </SelectedProvider>
      );

      expect(screen.getByTestId("context-capture")).toBeInTheDocument();
      expect(contextInstance).not.toBeNull();

      // Verify required context properties exist
      expect(contextInstance).toHaveProperty("graph");
    });

    it("should initialize with proper default state", () => {
      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <TestConsumer testId="defaults" />
        </SelectedProvider>
      );

      // Should have graph instance
      expect(screen.getByTestId("defaults-graph-id")).not.toHaveTextContent("no-graph");

      // Should have a valid graph
      expect(screen.getByTestId("defaults-graph-exists")).toHaveTextContent("true");
    });
  });

  describe("Instance Isolation Requirements", () => {
    it("should use windowIdentifier for instance isolation", () => {
      render(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_isolated_123">
          <TestConsumer testId="isolation-test" />
        </SelectedProvider>
      );

      // Should successfully create isolated graph instance
      expect(screen.getByTestId("isolation-test-graph-id")).not.toHaveTextContent("no-graph");
    });

    it("should use consistent cache key pattern", () => {
      const graphIds: string[] = [];

      // Test multiple instances with predictable identifiers
      const identifiers = ["TestWindow_111", "TestWindow_222", "ProductWindow_333"];

      for (const identifier of identifiers) {
        const { unmount } = render(
          <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier={identifier}>
            <TestConsumer testId={`test-${identifier}`} />
          </SelectedProvider>
        );

        const graphId = screen.getByTestId(`test-${identifier}-graph-id`).textContent;
        if (graphId) {
          graphIds.push(graphId);
        }

        unmount();
      }

      // All instances should have unique graph IDs
      const uniqueIds = new Set(graphIds);
      expect(uniqueIds.size).toBe(identifiers.length);
    });
  });
});

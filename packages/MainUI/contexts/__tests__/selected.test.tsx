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
import WindowProvider from "../window";

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

const createMockRouter = () => ({
  replace: mockReplace,
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

jest.mock("next/navigation", () => ({
  useRouter: () => createMockRouter(),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

jest.mock("../../data/graph", () => {
  let instanceCounter = 0;
  return jest.fn().mockImplementation((tabs: Tab[]) => {
    const graphId = `graph_${Date.now()}_${instanceCounter++}`;
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
const createMockTab = (id: string, name: string, level: number, parentTabId?: string): Tab => ({
  id,
  name,
  title: name,
  tabLevel: level,
  parentTabId,
  window: "TestWindow",
  table: level === 0 ? "test_table" : "child_table",
  entityName: level === 0 ? "TestEntity" : "ChildEntity",
  fields: {},
  parentColumns: level > 0 ? ["parentId"] : [],
  _identifier: level === 0 ? "test_identifier" : "child_identifier",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "test_module",
  uIPattern: "STD",
});

const createMockTabs = (): Tab[] => [
  createMockTab("tab1", "Main Tab", 0),
  createMockTab("tab2", "Child Tab", 1, "tab1"),
];

// Test helpers
const renderWithWindowProvider = (ui: React.ReactElement) => {
  return render(<WindowProvider>{ui}</WindowProvider>);
};

const createSelectedProvider = (windowIdentifier: string, tabs = createMockTabs(), windowId = "TestWindow") => (
  <SelectedProvider tabs={tabs} windowId={windowId} windowIdentifier={windowIdentifier}>
    <TestConsumer testId={windowIdentifier} />
  </SelectedProvider>
);

const TestConsumer = ({ testId }: { testId: string }) => {
  const context = useContext(SelectContext);

  return (
    <div>
      <span data-testid={`${testId}-graph-id`}>{(context.graph as { id?: string })?.id || "no-graph"}</span>
      <span data-testid={`${testId}-graph-exists`}>{context.graph ? "true" : "false"}</span>
    </div>
  );
};

const getGraphId = (testId: string) => screen.getByTestId(`${testId}-graph-id`).textContent;

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
    mockReplace.mockClear();
  });

  describe("windowIdentifier Functionality", () => {
    it("should render successfully when windowIdentifier is provided", () => {
      expect(() => {
        renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));
      }).not.toThrow();

      expect(screen.getByTestId("TestWindow_123456789-graph-id")).toBeInTheDocument();
    });

    it("should use windowIdentifier for graph cache key generation", () => {
      renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));

      expect(screen.getByTestId("TestWindow_123456789-graph-id")).not.toHaveTextContent("no-graph");
    });
  });

  describe("Graph Instance Isolation", () => {
    it("should create different graph instances for different window identifiers", () => {
      const { unmount: unmount1 } = renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));
      const graph1Id = getGraphId("TestWindow_123456789");
      unmount1();

      renderWithWindowProvider(createSelectedProvider("TestWindow_987654321"));
      const graph2Id = getGraphId("TestWindow_987654321");

      expect(graph1Id).not.toBe(graph2Id);
      expect(graph1Id).not.toBe("no-graph");
      expect(graph2Id).not.toBe("no-graph");
    });

    it("should reuse graph instance for same window identifier", () => {
      const { unmount: unmount1 } = renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));
      const firstGraphId = getGraphId("TestWindow_123456789");
      unmount1();

      renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));
      const secondGraphId = getGraphId("TestWindow_123456789");

      expect(firstGraphId).toBe(secondGraphId);
    });

    it("should use windowIdentifier as cache key instead of windowId", () => {
      const { unmount: unmount1 } = renderWithWindowProvider(createSelectedProvider("TestWindow_specific_123"));
      const specificGraphId = getGraphId("TestWindow_specific_123");
      unmount1();

      renderWithWindowProvider(createSelectedProvider("TestWindow_different_456"));
      const differentGraphId = getGraphId("TestWindow_different_456");

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

      renderWithWindowProvider(
        <SelectedProvider tabs={mockTabs} windowId="TestWindow" windowIdentifier="TestWindow_123456789">
          <ContextCapture />
        </SelectedProvider>
      );

      expect(screen.getByTestId("context-capture")).toBeInTheDocument();
      expect(contextInstance).not.toBeNull();
      expect(contextInstance).toHaveProperty("graph");
    });

    it("should initialize with proper default state", () => {
      renderWithWindowProvider(createSelectedProvider("TestWindow_123456789"));

      expect(screen.getByTestId("TestWindow_123456789-graph-id")).not.toHaveTextContent("no-graph");
      expect(screen.getByTestId("TestWindow_123456789-graph-exists")).toHaveTextContent("true");
    });
  });

  describe("Instance Isolation Requirements", () => {
    it("should use windowIdentifier for instance isolation", () => {
      renderWithWindowProvider(createSelectedProvider("TestWindow_isolated_123"));

      expect(screen.getByTestId("TestWindow_isolated_123-graph-id")).not.toHaveTextContent("no-graph");
    });

    it("should use consistent cache key pattern", () => {
      const identifiers = ["TestWindow_111", "TestWindow_222", "ProductWindow_333"];
      const graphIds: string[] = [];

      for (const identifier of identifiers) {
        const { unmount } = renderWithWindowProvider(createSelectedProvider(identifier));
        const graphId = getGraphId(identifier);
        if (graphId) graphIds.push(graphId);
        unmount();
      }

      const uniqueIds = new Set(graphIds);
      expect(uniqueIds.size).toBe(identifiers.length);
    });
  });
});

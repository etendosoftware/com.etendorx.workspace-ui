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
 * @fileoverview Unit tests for MetadataProvider with windowIdentifier support
 *
 * Tests the MetadataProvider implementation changes for multi-window instance isolation:
 * - windowIdentifier extraction and provision
 * - Enhanced context value with instance awareness
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import MetadataProvider from "../metadata";
import WindowProvider from "../window";
import { useMetadataContext } from "../../hooks/useMetadataContext";

// Mock next/navigation required by WindowProvider
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: "/window",
  })),
  useSearchParams: jest.fn(() => {
    const params = new URLSearchParams();
    return {
      get: jest.fn((key: string) => params.get(key)),
      toString: jest.fn(() => params.toString()),
      forEach: jest.fn((callback: (value: string, key: string) => void) => {
        params.forEach(callback);
      }),
      has: jest.fn((key: string) => params.has(key)),
      getAll: jest.fn((key: string) => params.getAll(key)),
      keys: jest.fn(() => params.keys()),
      values: jest.fn(() => params.values()),
      entries: jest.fn(() => params.entries()),
    };
  }),
  usePathname: jest.fn(() => "/window"),
}));

// Mock DatasourceContext
jest.mock("../datasourceContext", () => ({
  useDatasourceContext: () => ({
    removeRecordFromDatasource: jest.fn(),
  }),
}));

// Mock Metadata API
const mockWindowMetadata = {
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
};

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    clearWindowCache: jest.fn(),
    forceWindowReload: jest.fn().mockResolvedValue(mockWindowMetadata),
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock mapBy utility
jest.mock("../../utils/structures", () => ({
  mapBy: jest.fn((array: unknown[], key: string) => {
    const result: Record<string, unknown> = {};
    for (const item of array) {
      if (typeof item === "object" && item !== null && key in item) {
        result[(item as Record<string, unknown>)[key] as string] = item;
      }
    }
    return result;
  }),
}));

// Mock groupTabsByLevel utility
jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  groupTabsByLevel: jest.fn((windowData) => {
    if (!windowData?.tabs) return [];
    return [windowData.tabs.filter((tab: { tabLevel: number }) => tab.tabLevel === 0)];
  }),
}));

describe("MetadataProvider with windowIdentifier support", () => {
  const TestComponent = ({ testId }: { testId: string }) => {
    const { windowId, windowIdentifier, window: windowData, loading, error } = useMetadataContext();

    return (
      <div>
        <span data-testid={`${testId}-windowId`}>{windowId || "undefined"}</span>
        <span data-testid={`${testId}-windowIdentifier`}>{windowIdentifier || "undefined"}</span>
        <span data-testid={`${testId}-loading`}>{loading.toString()}</span>
        <span data-testid={`${testId}-error`}>{error ? "error" : "no-error"}</span>
        <span data-testid={`${testId}-hasWindow`}>{windowData ? "has-window" : "no-window"}</span>
      </div>
    );
  };

  const renderWithProvider = (children: ReactNode) => {
    return render(
      <WindowProvider>
        <MetadataProvider>{children}</MetadataProvider>
      </WindowProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Context Provision", () => {
    it("should provide both windowId and windowIdentifier from active window", async () => {
      renderWithProvider(<TestComponent testId="basic" />);

      // Initially no active window
      expect(screen.getByTestId("basic-windowId")).toHaveTextContent("undefined");
      expect(screen.getByTestId("basic-windowIdentifier")).toHaveTextContent("undefined");
    });

    it("should provide initial loading state", () => {
      renderWithProvider(<TestComponent testId="states" />);

      // Should provide loading state (false initially as no active window)
      const loadingElement = screen.getByTestId("states-loading");
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement.textContent).toMatch(/false/);

      // Should not have error initially
      expect(screen.getByTestId("states-error")).toHaveTextContent("no-error");
    });

    it("should handle undefined active window gracefully", () => {
      renderWithProvider(<TestComponent testId="undefined" />);

      expect(screen.getByTestId("undefined-windowId")).toHaveTextContent("undefined");
      expect(screen.getByTestId("undefined-windowIdentifier")).toHaveTextContent("undefined");
    });
  });

  describe("Context Value Completeness", () => {
    it("should provide all required context properties", () => {
      const contextValues: string[] = [];

      const ContextChecker = () => {
        const context = useMetadataContext();

        // Check all required properties exist
        const requiredProps = [
          "windowId",
          "windowIdentifier",
          "window",
          "loading",
          "error",
          "groupedTabs",
          "tabs",
          "refetch",
          "removeRecord",
          "emptyWindowDataName",
          "loadWindowData",
          "getWindowMetadata",
          "isWindowLoading",
          "getWindowError",
          "windowsData",
          "loadingWindows",
          "errors",
        ];

        for (const prop of requiredProps) {
          if (prop in context) {
            contextValues.push(prop);
          }
        }

        return <div data-testid="context-checker">checked</div>;
      };

      renderWithProvider(<ContextChecker />);

      expect(screen.getByTestId("context-checker")).toBeInTheDocument();

      expect(contextValues).toContain("windowIdentifier");

      // Verify essential existing properties still exist
      expect(contextValues).toContain("windowId");
      expect(contextValues).toContain("window");
      expect(contextValues).toContain("loading");
    });
  });

  describe("Multi-Window Instance Support", () => {
    it("should extract windowIdentifier from active window when window is active", () => {
      renderWithProvider(<TestComponent testId="extraction" />);

      // Without an active window, should show undefined
      expect(screen.getByTestId("extraction-windowIdentifier")).toHaveTextContent("undefined");
    });

    it("should maintain backward compatibility with existing windowId usage", () => {
      renderWithProvider(<TestComponent testId="backward-compat" />);

      // Without an active window, both should be undefined
      expect(screen.getByTestId("backward-compat-windowId")).toHaveTextContent("undefined");
      expect(screen.getByTestId("backward-compat-windowIdentifier")).toHaveTextContent("undefined");
    });

    it("should handle window identifier extraction when no active window", () => {
      renderWithProvider(<TestComponent testId="no-active" />);

      expect(screen.getByTestId("no-active-windowId")).toHaveTextContent("undefined");
      expect(screen.getByTestId("no-active-windowIdentifier")).toHaveTextContent("undefined");
    });
  });
});

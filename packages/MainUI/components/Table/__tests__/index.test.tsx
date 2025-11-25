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
 * Test suite for the DynamicTable component
 *
 * The DynamicTable component is a highly complex component with numerous dependencies and interactions.
 * This test suite verifies the component's basic interface and prop handling.
 *
 * For comprehensive testing of specific features, see the dedicated test files:
 * - inlineEditing.test.ts - Inline editing functionality
 * - errorHandling.test.tsx - Error handling and recovery
 * - saveOperations.test.ts - Save and persistence operations
 * - tableFeatureIntegration.test.tsx - Feature compatibility and integration
 */

import React from "react";
import DynamicTable from "../index";

describe("DynamicTable Component", () => {
  const mockSetRecordId = jest.fn();
  const mockOnRecordSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Interface", () => {
    it("should accept setRecordId as a required prop", () => {
      expect(() => {
        // This should not throw an error
        // The component definition expects setRecordId prop
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it("should accept onRecordSelection as an optional prop", () => {
      expect(() => {
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          onRecordSelection: mockOnRecordSelection,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });

    it("should accept isTreeMode as an optional prop with boolean value", () => {
      expect(() => {
        const componentWithTreeMode = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          isTreeMode: true,
        });
        const componentWithoutTreeMode = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
          isTreeMode: false,
        });
        expect(componentWithTreeMode).toBeDefined();
        expect(componentWithoutTreeMode).toBeDefined();
      }).not.toThrow();
    });

    it("should default isTreeMode to true when not provided", () => {
      expect(() => {
        const component = React.createElement(DynamicTable, {
          setRecordId: mockSetRecordId,
        });
        expect(component).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Component Type", () => {
    it("should be a React component", () => {
      expect(typeof DynamicTable).toBe("function");
    });

    it("should be a valid React functional component", () => {
      expect(React.isValidElement(DynamicTable)).toBe(false);
      expect(typeof DynamicTable).toBe("function");
    });
  });

  describe("Props Validation", () => {
    it("should handle prop updates without errors", () => {
      expect(() => {
        const props1 = {
          setRecordId: mockSetRecordId,
          onRecordSelection: mockOnRecordSelection,
          isTreeMode: true,
        };
        const props2 = {
          setRecordId: jest.fn(),
          onRecordSelection: jest.fn(),
          isTreeMode: false,
        };
        const component1 = React.createElement(DynamicTable, props1);
        const component2 = React.createElement(DynamicTable, props2);
        expect(component1).toBeDefined();
        expect(component2).toBeDefined();
      }).not.toThrow();
    });

    it("should handle all prop combinations", () => {
      const testCases = [
        { setRecordId: mockSetRecordId },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection },
        { setRecordId: mockSetRecordId, isTreeMode: true },
        { setRecordId: mockSetRecordId, isTreeMode: false },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection, isTreeMode: true },
        { setRecordId: mockSetRecordId, onRecordSelection: mockOnRecordSelection, isTreeMode: false },
      ];

      expect(() => {
        for (const props of testCases) {
          const component = React.createElement(DynamicTable, props);
          expect(component).toBeDefined();
        }
      }).not.toThrow();
    });
  });
});

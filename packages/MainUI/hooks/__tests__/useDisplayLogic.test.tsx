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
 * All portions are Copyright © 2024–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import useDisplayLogic from "../useDisplayLogic";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { createMockField as baseCreateMockField, createMockTab as baseCreateMockTab } from "@/utils/tests/mockHelpers";

// Mock compileExpression — returns a jest.fn() so individual tests can override its return value
const mockCompiledExpr = jest.fn();
jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn(() => mockCompiledExpr),
}));

// Mock useUserContext
jest.mock("../useUserContext", () => ({
  useUserContext: jest.fn(() => ({ session: {} })),
}));

// Mock useExpressionDependencies — we control what "watched" form values it returns
const mockExpressionDeps = jest.fn(() => ({}));
jest.mock("../useExpressionDependencies", () => ({
  useExpressionDependencies: jest.fn(() => mockExpressionDeps()),
}));

// Mock useTabContext — default returns minimal tab context
const mockTabContext = {
  tab: null as Tab | null,
  record: {} as Record<string, unknown>,
  parentRecord: null as Record<string, unknown> | null,
  parentTab: null as Tab | null,
  auxiliaryInputs: {} as Record<string, string>,
};

jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(() => mockTabContext),
}));

// Common expression strings used in tests
const EXPR_IS_ACTIVE_Y = "OB.Utilities.getValue(x,'isActive')=='Y'";
const EXPR_USER_HAS_NAME_1 = "OB.Utilities.getValue(x,'UserHasName')=='1'";

// Helpers
const createMockField = (overrides: Partial<Field> = {}): Field =>
  baseCreateMockField({
    displayLogicExpression: "",
    mandatoryLogicExpression: "",
    readOnlyLogicExpression: "",
    ...overrides,
  }) as Field;

const createMockTab = (overrides: Partial<Tab> = {}): Tab => baseCreateMockTab(overrides);

const renderDisplayLogic = (overrides: Partial<Field> = {}) => {
  const field = createMockField({ displayed: true, ...overrides });
  return renderHook(() => useDisplayLogic({ field }));
};

describe("useDisplayLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to defaults before each test
    mockTabContext.tab = createMockTab();
    mockTabContext.record = {};
    mockTabContext.parentRecord = null;
    mockTabContext.parentTab = null;
    mockTabContext.auxiliaryInputs = {};
    mockExpressionDeps.mockReturnValue({});
    mockCompiledExpr.mockReturnValue(true);
  });

  describe("Basic display conditions", () => {
    it("should return false when tab is null", () => {
      mockTabContext.tab = null;
      const { result } = renderDisplayLogic();
      expect(result.current).toBe(false);
    });

    it("should return false when field.displayed is false", () => {
      const field = createMockField({ displayed: false });
      const { result } = renderHook(() => useDisplayLogic({ field }));
      expect(result.current).toBe(false);
    });

    it("should return true when field is displayed and has no displayLogicExpression", () => {
      const { result } = renderDisplayLogic({ displayLogicExpression: "" });
      expect(result.current).toBe(true);
    });

    it("should return true when field is displayed and displayLogicExpression is undefined", () => {
      const { result } = renderDisplayLogic({ displayLogicExpression: undefined });
      expect(result.current).toBe(true);
    });
  });

  describe("Display logic expression evaluation", () => {
    it("should return true when compiledExpr returns true", () => {
      mockCompiledExpr.mockReturnValue(true);
      const { result } = renderDisplayLogic({ displayLogicExpression: EXPR_IS_ACTIVE_Y });
      expect(result.current).toBe(true);
    });

    it("should return false when compiledExpr returns false", () => {
      mockCompiledExpr.mockReturnValue(false);
      const { result } = renderDisplayLogic({ displayLogicExpression: EXPR_IS_ACTIVE_Y });
      expect(result.current).toBe(false);
    });

    it("should pass smartContext to the compiled expression", () => {
      mockTabContext.record = { isActive: "Y" };
      renderDisplayLogic({ displayLogicExpression: EXPR_IS_ACTIVE_Y });

      // The compiled expression must have been called with a proxy-based smartContext
      expect(mockCompiledExpr).toHaveBeenCalledTimes(1);
      const [arg1] = mockCompiledExpr.mock.calls[0];
      expect(arg1.isActive).toBe("Y");
    });
  });

  describe("Auxiliary inputs integration", () => {
    const renderWithUserHasName = () => renderDisplayLogic({ displayLogicExpression: EXPR_USER_HAS_NAME_1 });

    beforeEach(() => {
      mockCompiledExpr.mockImplementation((ctx: Record<string, unknown>) => ctx.UserHasName === "1");
    });

    it("should make auxiliaryInputs accessible inside the expression context", () => {
      mockTabContext.auxiliaryInputs = { UserHasName: "1" };
      const { result } = renderWithUserHasName();
      expect(result.current).toBe(true);
    });

    it("should return false when auxiliaryInputs value does not satisfy the expression", () => {
      mockTabContext.auxiliaryInputs = { UserHasName: "0" };
      const { result } = renderWithUserHasName();
      expect(result.current).toBe(false);
    });

    it("should return false when auxiliaryInputs is empty and expression depends on it", () => {
      mockTabContext.auxiliaryInputs = {};
      const { result } = renderWithUserHasName();
      expect(result.current).toBe(false);
    });

    it("should allow record values to override auxiliaryInputs", () => {
      // Record value "0" should take priority over auxiliaryInput "1"
      mockTabContext.auxiliaryInputs = { UserHasName: "1" };
      mockTabContext.record = { UserHasName: "0" };
      const { result } = renderWithUserHasName();
      // Record value "0" overrides auxiliaryInput "1", so expression resolves to false
      expect(result.current).toBe(false);
    });
  });

  describe("Form values integration", () => {
    it("should merge formValues with record for the expression context", () => {
      mockTabContext.record = { name: "initial" };
      mockExpressionDeps.mockReturnValue({ name: "updated" });
      mockCompiledExpr.mockImplementation((ctx: Record<string, unknown>) => ctx.name === "updated");
      const { result } = renderDisplayLogic({
        displayLogicExpression: "OB.Utilities.getValue(x,'name')=='updated'",
      });
      expect(result.current).toBe(true);
    });

    it("should ignore undefined formValues to avoid shadowing valid record values", () => {
      mockTabContext.record = { isActive: false };
      // RHF returns undefined for fields not yet registered
      mockExpressionDeps.mockReturnValue({ isActive: undefined });
      mockCompiledExpr.mockImplementation((ctx: Record<string, unknown>) => ctx.isActive === "N");
      const { result } = renderDisplayLogic({
        displayLogicExpression: "OB.Utilities.getValue(x,'isActive')=='N'",
      });
      // undefined from formValues must NOT overwrite false from record (which becomes 'N' via normalize)
      expect(result.current).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should not throw when the compiled expression throws", () => {
      mockCompiledExpr.mockImplementation(() => {
        throw new Error("evaluation error");
      });
      expect(() => renderDisplayLogic({ displayLogicExpression: "throw new Error()" })).not.toThrow();
    });
  });
});

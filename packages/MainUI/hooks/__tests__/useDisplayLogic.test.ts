/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import useDisplayLogic from "../useDisplayLogic";
import { useUserContext } from "../useUserContext";
import { useTabContext } from "@/contexts/tab";
import { useExpressionDependencies } from "../useExpressionDependencies";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { createSmartContext } from "@/utils/expressions";

// Mocks
jest.mock("../useUserContext");
jest.mock("@/contexts/tab");
jest.mock("../useExpressionDependencies");
jest.mock("@/components/Form/FormView/selectors/BaseSelector");
jest.mock("@/utils/expressions");
jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn((msg, err) => false),
  },
}));

describe("useDisplayLogic", () => {
  const mockField = {
    name: "testField",
    displayed: true,
    displayLogicExpression: "someExpression",
  } as any;

  const mockTab = {
    fields: { testField: mockField },
  };

  const mockSession = { user: "testUser" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserContext as jest.Mock).mockReturnValue({ session: mockSession });
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record: {} });
    (useExpressionDependencies as jest.Mock).mockReturnValue({});
    (compileExpression as jest.Mock).mockReturnValue(jest.fn(() => true));
    (createSmartContext as jest.Mock).mockReturnValue({});
  });

  it("should return false if tab is not present", () => {
    (useTabContext as jest.Mock).mockReturnValue({ tab: null });
    const { result } = renderHook(() => useDisplayLogic({ field: mockField }));
    expect(result.current).toBe(false);
  });

  it("should return false if field.displayed is false", () => {
    const hiddenField = { ...mockField, displayed: false };
    const { result } = renderHook(() => useDisplayLogic({ field: hiddenField }));
    expect(result.current).toBe(false);
  });

  it("should return true if no displayLogicExpression is present", () => {
    const noExprField = { ...mockField, displayLogicExpression: "" };
    const { result } = renderHook(() => useDisplayLogic({ field: noExprField }));
    expect(result.current).toBe(true);
  });

  it("should compile and execute the expression", () => {
    const mockCompiledExpr = jest.fn(() => true);
    (compileExpression as jest.Mock).mockReturnValue(mockCompiledExpr);

    const { result } = renderHook(() => useDisplayLogic({ field: mockField }));

    expect(compileExpression).toHaveBeenCalledWith("someExpression");
    expect(mockCompiledExpr).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  it("should use values from record, formValues and extra values", () => {
    const record = { field1: "val1" };
    const formValues = { field2: "val2" };
    const extraValues = { field3: "val3" };

    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record });
    (useExpressionDependencies as jest.Mock).mockReturnValue(formValues);

    renderHook(() => useDisplayLogic({ field: mockField, values: extraValues }));

    expect(createSmartContext).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { ...record, ...formValues, ...extraValues },
      })
    );
  });

  it("should handle expression errors and return false", () => {
    const mockCompiledExpr = jest.fn(() => {
      throw new Error("Execution error");
    });
    (compileExpression as jest.Mock).mockReturnValue(mockCompiledExpr);

    const { result } = renderHook(() => useDisplayLogic({ field: mockField }));

    expect(result.current).toBe(false);
  });

  it("should filter out undefined form values", () => {
    const record = { field1: "recordVal" };
    const formValues = { field1: undefined, field2: "formVal" };

    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab, record });
    (useExpressionDependencies as jest.Mock).mockReturnValue(formValues);

    renderHook(() => useDisplayLogic({ field: mockField }));

    expect(createSmartContext).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { field1: "recordVal", field2: "formVal" },
      })
    );
  });
});

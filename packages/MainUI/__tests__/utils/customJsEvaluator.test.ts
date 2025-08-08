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

import { evaluateCustomJs, type CustomJsContext } from "@/utils/customJsEvaluator";
import type { Column } from "@workspaceui/api-client/src/api/types";

// Mock the executeStringFunction
jest.mock("@/utils/functions", () => ({
  executeStringFunction: jest.fn(),
}));

// Mock Metadata
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {},
}));

describe("CustomJS Evaluator", () => {
  const mockRecord = {
    id: "1",
    name: "John Doe",
    amount: 1500,
    status: "active",
    firstName: "John",
    lastName: "Doe",
    price: 99.99,
    quantity: 2,
  };

  const mockColumn: Column = {
    id: "test",
    name: "test",
    header: "Test Column",
    accessorFn: () => {},
    columnName: "test",
    _identifier: "test",
  } as Column;

  const mockContext: CustomJsContext = {
    record: mockRecord,
    column: mockColumn,
  };

  const { executeStringFunction } = require("@/utils/functions");

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Successful evaluations", () => {
    it("should evaluate simple field access expressions", async () => {
      const code = "(record) => record.name";
      executeStringFunction.mockResolvedValue("John Doe");

      const result = await evaluateCustomJs(code, mockContext);

      expect(executeStringFunction).toHaveBeenCalledWith(code, { Metadata: {} }, mockContext);
      expect(result).toBe("John Doe");
    });

    it("should evaluate string transformation expressions", async () => {
      const code = "(record) => record.name.toUpperCase()";
      executeStringFunction.mockResolvedValue("JOHN DOE");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("JOHN DOE");
    });

    it("should handle calculation expressions", async () => {
      const code = "(record) => record.amount * 1.21";
      executeStringFunction.mockResolvedValue(1815);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe(1815);
    });

    it("should handle string concatenation", async () => {
      const code = '(record) => record.firstName + " " + record.lastName';
      executeStringFunction.mockResolvedValue("John Doe");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("John Doe");
    });

    it("should handle conditional expressions", async () => {
      const code = '(record) => record.status === "active" ? "✓ Active" : "✗ Inactive"';
      executeStringFunction.mockResolvedValue("✓ Active");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("✓ Active");
    });

    it("should handle mathematical operations", async () => {
      const code = "(record) => Math.round(record.price * record.quantity * 100) / 100";
      executeStringFunction.mockResolvedValue(199.98);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe(199.98);
    });

    it("should handle comparison operations", async () => {
      const code = '(record) => record.amount > 1000 ? "High" : "Low"';
      executeStringFunction.mockResolvedValue("High");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("High");
    });

    it("should handle boolean return values", async () => {
      const code = "(record) => record.amount > 1000";
      executeStringFunction.mockResolvedValue(true);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe(true);
    });

    it("should handle null/undefined values gracefully", async () => {
      const code = "(record) => record.nonexistent || 'N/A'";
      executeStringFunction.mockResolvedValue("N/A");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("N/A");
    });
  });

  describe("Error handling", () => {
    it("should handle JavaScript runtime errors gracefully", async () => {
      const code = "(record) => record.nonexistent.property";
      const error = new Error("Cannot read property 'property' of undefined");
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(console.error).toHaveBeenCalledWith("Error evaluating custom JS:", error);
      expect(result).toBe("[Error: Cannot read property 'property' of undefined]");
    });

    it("should handle syntax errors in JavaScript code", async () => {
      const code = "(record) => record.name +";
      const error = new SyntaxError("Unexpected end of input");
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(console.error).toHaveBeenCalledWith("Error evaluating custom JS:", error);
      expect(result).toBe("[Error: Unexpected end of input]");
    });

    it("should handle type errors", async () => {
      const code = "(record) => record.amount.nonexistent()";
      const error = new TypeError("record.amount.nonexistent is not a function");
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("[Error: record.amount.nonexistent is not a function]");
    });

    it("should handle reference errors", async () => {
      const code = "(record) => undefinedVariable";
      const error = new ReferenceError("undefinedVariable is not defined");
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("[Error: undefinedVariable is not defined]");
    });

    it("should handle unknown error types", async () => {
      const code = "(record) => record.name";
      const error = "Unknown error string";
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("[Error: Unknown error]");
    });

    it("should handle empty error messages", async () => {
      const code = "(record) => record.name";
      const error = new Error("");
      executeStringFunction.mockRejectedValue(error);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("[Error: ]");
    });
  });

  describe("Context validation", () => {
    it("should pass correct context to executeStringFunction", async () => {
      const code = "(record) => record.name";
      executeStringFunction.mockResolvedValue("result");

      await evaluateCustomJs(code, mockContext);

      expect(executeStringFunction).toHaveBeenCalledWith(code, { Metadata: {} }, mockContext);
    });

    it("should work with different record structures", async () => {
      const differentRecord = {
        productId: "P123",
        productName: "Widget",
        category: "Electronics",
      };

      const differentContext: CustomJsContext = {
        record: differentRecord,
        column: mockColumn,
      };

      const code = "(record) => record.productName + ' (' + record.category + ')'";
      executeStringFunction.mockResolvedValue("Widget (Electronics)");

      const result = await evaluateCustomJs(code, differentContext);

      expect(executeStringFunction).toHaveBeenCalledWith(code, { Metadata: {} }, differentContext);
      expect(result).toBe("Widget (Electronics)");
    });

    it("should work with empty record", async () => {
      const emptyContext: CustomJsContext = {
        record: {},
        column: mockColumn,
      };

      const code = '(record) => Object.keys(record).length === 0 ? "Empty" : "Not empty"';
      executeStringFunction.mockResolvedValue("Empty");

      const result = await evaluateCustomJs(code, emptyContext);

      expect(result).toBe("Empty");
    });
  });

  describe("Integration with Metadata", () => {
    it("should provide Metadata in the execution context", async () => {
      const code = "(record) => typeof Metadata";
      executeStringFunction.mockResolvedValue("object");

      await evaluateCustomJs(code, mockContext);

      expect(executeStringFunction).toHaveBeenCalledWith(code, { Metadata: {} }, mockContext);
    });
  });

  describe("Performance considerations", () => {
    it("should handle complex expressions efficiently", async () => {
      const code = `(record) => {
        const calculations = [];
        for (let i = 0; i < 100; i++) {
          calculations.push(record.amount * i);
        }
        return calculations.reduce((sum, val) => sum + val, 0);
      }`;

      executeStringFunction.mockResolvedValue(7425000);

      const startTime = Date.now();
      const result = await evaluateCustomJs(code, mockContext);
      const endTime = Date.now();

      expect(result).toBe(7425000);
      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Edge cases", () => {
    it("should handle functions that return objects", async () => {
      const code = "(record) => ({ name: record.name, doubled: record.amount * 2 })";
      const expectedResult = { name: "John Doe", doubled: 3000 };
      executeStringFunction.mockResolvedValue(expectedResult);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toEqual(expectedResult);
    });

    it("should handle functions that return arrays", async () => {
      const code = "(record) => [record.name, record.amount]";
      const expectedResult = ["John Doe", 1500];
      executeStringFunction.mockResolvedValue(expectedResult);

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toEqual(expectedResult);
    });

    it("should handle async code execution", async () => {
      const code = "async (record) => { await Promise.resolve(); return record.name; }";
      executeStringFunction.mockResolvedValue("John Doe");

      const result = await evaluateCustomJs(code, mockContext);

      expect(result).toBe("John Doe");
    });
  });
});

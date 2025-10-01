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

import { debounce } from "@/utils/debounce";

// Mock timers to control timing in tests
jest.useFakeTimers();

// Test type definitions for better type safety
type TestFunction = (...args: string[]) => string;
type VoidTestFunction = (...args: string[]) => void;
type AsyncTestFunction = (...args: string[]) => Promise<string>;

describe("debounce utility", () => {
  let mockFunction: jest.MockedFunction<TestFunction>;
  let mockVoidFunction: jest.MockedFunction<VoidTestFunction>;
  let mockAsyncFunction: jest.MockedFunction<AsyncTestFunction>;

  beforeEach(() => {
    mockFunction = jest.fn().mockReturnValue("result");
    mockVoidFunction = jest.fn();
    mockAsyncFunction = jest.fn().mockResolvedValue("async result");
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe("Basic functionality", () => {
    it("should create a debounced function", () => {
      const debouncedFn = debounce(mockFunction, 100);

      expect(typeof debouncedFn).toBe("function");
      expect(debouncedFn).not.toBe(mockFunction);
    });

    it("should delay function execution by specified amount", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("test");

      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(99);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should pass arguments correctly to the original function", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("arg1", "arg2", "arg3");
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledWith("arg1", "arg2", "arg3");
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it("should handle functions with no arguments", () => {
      const noArgFunction = jest.fn();
      const debouncedFn = debounce(noArgFunction, 100);

      debouncedFn();
      jest.advanceTimersByTime(100);

      expect(noArgFunction).toHaveBeenCalledWith();
      expect(noArgFunction).toHaveBeenCalledTimes(1);
    });

    it("should handle void functions", () => {
      const debouncedFn = debounce(mockVoidFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(mockVoidFunction).toHaveBeenCalledWith("test");
      expect(mockVoidFunction).toHaveBeenCalledTimes(1);
    });

    it("should work with zero delay", () => {
      const debouncedFn = debounce(mockFunction, 0);

      debouncedFn("test");

      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should work with async functions", () => {
      const debouncedFn = debounce(mockAsyncFunction, 100);

      debouncedFn("async test");
      jest.advanceTimersByTime(100);

      expect(mockAsyncFunction).toHaveBeenCalledWith("async test");
    });
  });

  describe("Debouncing behavior", () => {
    it("should cancel previous timeout when called multiple times", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // Call multiple times rapidly
      debouncedFn("call1");
      debouncedFn("call2");
      debouncedFn("call3");

      // Only the last call should execute after the delay
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("call3");
    });

    it("should reset timer on each new call", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("first");
      jest.advanceTimersByTime(50);

      debouncedFn("second");
      jest.advanceTimersByTime(50);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFunction).toHaveBeenCalledWith("second");
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid successive calls", () => {
      const debouncedFn = debounce(mockFunction, 50);

      // Make many rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedFn(`call${i}`);
      }

      jest.advanceTimersByTime(50);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("call9");
    });

    it("should allow multiple executions after delay periods", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // First call
      debouncedFn("first");
      jest.advanceTimersByTime(100);

      // Second call after delay
      debouncedFn("second");
      jest.advanceTimersByTime(100);

      // Third call after delay
      debouncedFn("third");
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(3);
      expect(mockFunction).toHaveBeenNthCalledWith(1, "first");
      expect(mockFunction).toHaveBeenNthCalledWith(2, "second");
      expect(mockFunction).toHaveBeenNthCalledWith(3, "third");
    });

    it("should debounce each instance independently", () => {
      const debouncedFn1 = debounce(mockFunction, 100);
      const debouncedFn2 = debounce(mockFunction, 50);

      debouncedFn1("from1");
      debouncedFn2("from2");

      jest.advanceTimersByTime(50);
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("from2");

      jest.advanceTimersByTime(50);
      expect(mockFunction).toHaveBeenCalledTimes(2);
      expect(mockFunction).toHaveBeenCalledWith("from1");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle functions that throw errors", () => {
      const errorFunction = jest.fn().mockImplementation(() => {
        throw new Error("Function error");
      });
      const debouncedFn = debounce(errorFunction, 100);

      debouncedFn("test");

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow("Function error");

      expect(errorFunction).toHaveBeenCalledWith("test");
    });

    it("should handle extremely small delays", () => {
      const debouncedFn = debounce(mockFunction, 1);

      debouncedFn("test");
      jest.advanceTimersByTime(1);

      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle large delays", () => {
      const debouncedFn = debounce(mockFunction, 10000);

      debouncedFn("test");
      jest.advanceTimersByTime(9999);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle negative delay (should be treated as 0)", () => {
      const debouncedFn = debounce(mockFunction, -100);

      debouncedFn("test");
      jest.advanceTimersByTime(0);

      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle fractional delays", () => {
      const debouncedFn = debounce(mockFunction, 100.5);

      debouncedFn("test");
      // Fractional delays are rounded down by setTimeout, so 100.5 becomes 100
      jest.advanceTimersByTime(101);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle NaN delay gracefully", () => {
      const debouncedFn = debounce(mockFunction, Number.NaN);

      debouncedFn("test");
      // NaN delay should be handled by setTimeout (likely treated as 0)
      jest.advanceTimersByTime(0);

      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle Infinity delay", () => {
      const debouncedFn = debounce(mockFunction, Number.POSITIVE_INFINITY);

      debouncedFn("test");
      // Infinity delay in setTimeout is typically converted to a large number or executes immediately
      // depending on the JavaScript engine implementation
      jest.advanceTimersByTime(0);

      // In most implementations, Infinity delay will execute immediately or be treated as 0
      expect(mockFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Type safety and parameter handling", () => {
    it("should preserve function signature for functions with specific types", () => {
      interface TestArgs {
        id: string;
        value: number;
      }

      const typedFunction = jest.fn((args: TestArgs) => `${args.id}: ${args.value}`);
      const debouncedFn = debounce(typedFunction, 100);

      debouncedFn({ id: "test", value: 42 });
      jest.advanceTimersByTime(100);

      expect(typedFunction).toHaveBeenCalledWith({ id: "test", value: 42 });
    });

    it("should handle functions with multiple parameter types", () => {
      const multiParamFunction = jest.fn((str: string, num: number, bool: boolean) => `${str}-${num}-${bool}`);
      const debouncedFn = debounce(multiParamFunction, 100);

      debouncedFn("test", 42, true);
      jest.advanceTimersByTime(100);

      expect(multiParamFunction).toHaveBeenCalledWith("test", 42, true);
    });

    it("should handle functions with optional parameters", () => {
      const optionalParamFunction = jest.fn((required: string, optional?: number) => `${required}-${optional || 0}`);
      const debouncedFn = debounce(optionalParamFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(optionalParamFunction).toHaveBeenCalledWith("test");
    });

    it("should handle functions with rest parameters", () => {
      const restParamFunction = jest.fn((first: string, ...rest: number[]) => `${first}: ${rest.join(",")}`);
      const debouncedFn = debounce(restParamFunction, 100);

      debouncedFn("numbers", 1, 2, 3, 4, 5);
      jest.advanceTimersByTime(100);

      expect(restParamFunction).toHaveBeenCalledWith("numbers", 1, 2, 3, 4, 5);
    });

    it("should handle functions with object parameters", () => {
      interface ComplexObject {
        nested: {
          value: string;
          array: number[];
        };
        optional?: string;
      }

      const objectFunction = jest.fn((obj: ComplexObject) => obj.nested.value);
      const debouncedFn = debounce(objectFunction, 100);

      const testObject: ComplexObject = {
        nested: {
          value: "test",
          array: [1, 2, 3],
        },
        optional: "optional value",
      };

      debouncedFn(testObject);
      jest.advanceTimersByTime(100);

      expect(objectFunction).toHaveBeenCalledWith(testObject);
    });
  });

  describe("Memory management", () => {
    it("should clear timeout when called again before execution", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("first");
      // Clear timeout reference for memory management testing

      debouncedFn("second");
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("second");
    });

    it("should handle multiple debounced functions independently", () => {
      const function1 = jest.fn();
      const function2 = jest.fn();

      const debounced1 = debounce(function1, 100);
      const debounced2 = debounce(function2, 200);

      debounced1("test1");
      debounced2("test2");

      jest.advanceTimersByTime(100);
      expect(function1).toHaveBeenCalledWith("test1");
      expect(function2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(function2).toHaveBeenCalledWith("test2");
    });

    it("should handle timeout cleanup properly", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // Create and cancel multiple timeouts
      debouncedFn("call1");
      debouncedFn("call2");
      debouncedFn("call3");
      debouncedFn("call4");
      debouncedFn("final");

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("final");
    });
  });

  describe("Performance considerations", () => {
    it("should handle high-frequency calls efficiently", () => {
      const debouncedFn = debounce(mockFunction, 50);

      // Simulate high-frequency calls (e.g., scroll events)
      for (let i = 0; i < 1000; i++) {
        debouncedFn(`call${i}`);
        jest.advanceTimersByTime(1); // Advance slightly but not enough to trigger
      }

      // Only after the full delay should it execute
      jest.advanceTimersByTime(50);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("call999");
    });

    it("should handle burst patterns with settling periods", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // First burst
      debouncedFn("burst1-1");
      debouncedFn("burst1-2");
      debouncedFn("burst1-3");
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledWith("burst1-3");

      // Second burst after settling
      debouncedFn("burst2-1");
      debouncedFn("burst2-2");
      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(2);
      expect(mockFunction).toHaveBeenLastCalledWith("burst2-2");
    });

    it("should handle overlapping timeout scenarios", () => {
      const shortDelay = debounce(mockFunction, 50);
      const longDelay = debounce(mockVoidFunction, 200);

      shortDelay("short");
      longDelay("long");

      jest.advanceTimersByTime(50);
      expect(mockFunction).toHaveBeenCalledWith("short");
      expect(mockVoidFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(mockVoidFunction).toHaveBeenCalledWith("long");
    });
  });

  describe("Real-world usage patterns", () => {
    it("should handle search input debouncing pattern", () => {
      const searchFunction = jest.fn();
      const debouncedSearch = debounce(searchFunction, 300);

      // Simulate user typing
      const searchTerms = ["a", "ap", "app", "appl", "apple"];

      for (const term of searchTerms) {
        debouncedSearch(term);
        jest.advanceTimersByTime(50); // Simulate typing speed
      }

      // User stops typing
      jest.advanceTimersByTime(300);

      expect(searchFunction).toHaveBeenCalledTimes(1);
      expect(searchFunction).toHaveBeenCalledWith("apple");
    });

    it("should handle API call debouncing pattern", () => {
      const apiCall = jest.fn();
      const debouncedApiCall = debounce(apiCall, 500);

      // Simulate rapid user interactions that would trigger API calls
      debouncedApiCall("param1");
      jest.advanceTimersByTime(100);
      debouncedApiCall("param2");
      jest.advanceTimersByTime(100);
      debouncedApiCall("param3");

      jest.advanceTimersByTime(500);

      expect(apiCall).toHaveBeenCalledTimes(1);
      expect(apiCall).toHaveBeenCalledWith("param3");
    });

    it("should handle resize event debouncing pattern", () => {
      const resizeHandler = jest.fn();
      const debouncedResize = debounce(resizeHandler, 250);

      // Simulate window resize events
      for (let i = 0; i < 20; i++) {
        debouncedResize(`${800 + i}x${600 + i}`);
        jest.advanceTimersByTime(10);
      }

      jest.advanceTimersByTime(250);

      expect(resizeHandler).toHaveBeenCalledTimes(1);
      expect(resizeHandler).toHaveBeenCalledWith("819x619");
    });

    it("should handle save operation debouncing pattern", () => {
      const saveFunction = jest.fn();
      const debouncedSave = debounce(saveFunction, 1000);

      // Simulate user making rapid changes
      debouncedSave({ field1: "value1" });
      jest.advanceTimersByTime(200);
      debouncedSave({ field1: "value1", field2: "value2" });
      jest.advanceTimersByTime(200);
      debouncedSave({ field1: "value1", field2: "value2", field3: "value3" });

      jest.advanceTimersByTime(1000);

      expect(saveFunction).toHaveBeenCalledTimes(1);
      expect(saveFunction).toHaveBeenCalledWith({ field1: "value1", field2: "value2", field3: "value3" });
    });
  });

  describe("Complex parameter scenarios", () => {
    it("should handle functions with array parameters", () => {
      const arrayFunction = jest.fn((items: string[]) => items.join(","));
      const debouncedFn = debounce(arrayFunction, 100);

      debouncedFn(["a", "b", "c"]);
      jest.advanceTimersByTime(100);

      expect(arrayFunction).toHaveBeenCalledWith(["a", "b", "c"]);
    });

    it("should handle functions with null/undefined parameters", () => {
      const nullableFunction = jest.fn((value: string | null | undefined) => value || "default");
      const debouncedFn = debounce(nullableFunction, 100);

      debouncedFn(null);
      jest.advanceTimersByTime(100);

      expect(nullableFunction).toHaveBeenCalledWith(null);

      jest.clearAllMocks();
      jest.clearAllTimers();

      debouncedFn(undefined);
      jest.advanceTimersByTime(100);

      expect(nullableFunction).toHaveBeenCalledWith(undefined);
    });

    it("should preserve parameter order and types", () => {
      const multiTypeFunction = jest.fn((str: string, num: number, obj: { key: string }, arr: boolean[]) => {
        return `${str}-${num}-${obj.key}-${arr.length}`;
      });
      const debouncedFn = debounce(multiTypeFunction, 100);

      const testObj = { key: "test" };
      const testArray = [true, false, true];

      debouncedFn("test", 42, testObj, testArray);
      jest.advanceTimersByTime(100);

      expect(multiTypeFunction).toHaveBeenCalledWith("test", 42, testObj, testArray);
    });

    it("should handle functions with callback parameters", () => {
      const callbackFunction = jest.fn((value: string, callback: (result: string) => void) => {
        callback(`processed: ${value}`);
      });
      const debouncedFn = debounce(callbackFunction, 100);

      const mockCallback = jest.fn();
      debouncedFn("test", mockCallback);
      jest.advanceTimersByTime(100);

      expect(callbackFunction).toHaveBeenCalledWith("test", mockCallback);
      expect(mockCallback).toHaveBeenCalledWith("processed: test");
    });
  });

  describe("Timing precision", () => {
    it("should execute exactly once after delay period", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("test");

      // Check at various time intervals
      jest.advanceTimersByTime(50);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(25);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(24);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFunction).toHaveBeenCalledTimes(1);

      // Advancing more time shouldn't trigger additional calls
      jest.advanceTimersByTime(1000);
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent debounced functions with different delays", () => {
      const fastFunction = jest.fn();
      const slowFunction = jest.fn();

      const fastDebounced = debounce(fastFunction, 100);
      const slowDebounced = debounce(slowFunction, 300);

      // Start both at the same time
      fastDebounced("fast");
      slowDebounced("slow");

      // Fast should execute first
      jest.advanceTimersByTime(100);
      expect(fastFunction).toHaveBeenCalledWith("fast");
      expect(slowFunction).not.toHaveBeenCalled();

      // Slow should execute later
      jest.advanceTimersByTime(200);
      expect(slowFunction).toHaveBeenCalledWith("slow");
    });

    it("should handle timer interference scenarios", () => {
      const debouncedFn = debounce(mockFunction, 100);

      debouncedFn("first");

      // Manually create other timers to test isolation
      const externalTimeout1 = setTimeout(() => {}, 50);
      const externalTimeout2 = setTimeout(() => {}, 150);

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledWith("first");

      // Clean up external timers
      clearTimeout(externalTimeout1);
      clearTimeout(externalTimeout2);
    });
  });

  describe("Error scenarios in function execution", () => {
    it("should handle syntax errors in the original function", () => {
      // Simulate a function that has runtime issues
      const problematicFunction = jest.fn().mockImplementation(() => {
        // This will cause an error in strict mode
        throw new Error("Strict mode error");
      });

      const debouncedFn = debounce(problematicFunction, 100);

      debouncedFn("test");

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow("Strict mode error");
    });

    it("should handle functions that modify their parameters", () => {
      const modifyingFunction = jest.fn((obj: { value: string }) => {
        obj.value = "modified";
        return obj.value;
      });
      const debouncedFn = debounce(modifyingFunction, 100);

      const testObj = { value: "original" };
      debouncedFn(testObj);
      jest.advanceTimersByTime(100);

      expect(modifyingFunction).toHaveBeenCalledWith(testObj);
      expect(testObj.value).toBe("modified");
    });

    it("should handle functions that return promises", () => {
      const promiseFunction = jest.fn().mockReturnValue(Promise.resolve("promise result"));
      const debouncedFn = debounce(promiseFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(promiseFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Integration with real timer scenarios", () => {
    it("should work correctly when mixed with real timers", () => {
      // Use real timers for this specific test
      jest.useRealTimers();

      return new Promise<void>((resolve) => {
        const realTimeFunction = jest.fn((_message: string) => {
          expect(realTimeFunction).toHaveBeenCalledWith("real timer test");
          resolve();
        });

        const debouncedFn = debounce(realTimeFunction, 50);
        debouncedFn("real timer test");
      });
    });

    it("should handle timer cleanup in real scenarios", async () => {
      jest.useRealTimers();

      const cleanupFunction = jest.fn();
      const debouncedFn = debounce(cleanupFunction, 10);

      // Call multiple times
      debouncedFn("1");
      debouncedFn("2");
      debouncedFn("3");

      // Wait for execution
      await new Promise((resolve) => setTimeout(resolve, 15));

      expect(cleanupFunction).toHaveBeenCalledTimes(1);
      expect(cleanupFunction).toHaveBeenCalledWith("3");
    });
  });

  describe("Type inference and generic handling", () => {
    it("should maintain type inference for return types", () => {
      const numberFunction = jest.fn((x: number) => x * 2);
      const stringFunction = jest.fn((s: string) => s.toUpperCase());

      const debouncedNumber = debounce(numberFunction, 100);
      const debouncedString = debounce(stringFunction, 100);

      debouncedNumber(5);
      debouncedString("hello");

      jest.advanceTimersByTime(100);

      expect(numberFunction).toHaveBeenCalledWith(5);
      expect(stringFunction).toHaveBeenCalledWith("hello");
    });

    it("should handle generic function types", () => {
      function genericFunction<T>(value: T): T {
        return value;
      }

      const mockGenericFunction = jest.fn(genericFunction);
      const debouncedFn = debounce(mockGenericFunction, 100);

      debouncedFn("string value");
      jest.advanceTimersByTime(100);

      expect(mockGenericFunction).toHaveBeenCalledWith("string value");
    });

    it("should work with class methods", () => {
      class TestClass {
        value = "initial";

        method(newValue: string): string {
          this.value = newValue;
          return this.value;
        }
      }

      const instance = new TestClass();
      const boundMethod = instance.method.bind(instance);
      const mockBoundMethod = jest.fn(boundMethod);
      const debouncedMethod = debounce(mockBoundMethod, 100);

      debouncedMethod("updated");
      jest.advanceTimersByTime(100);

      expect(mockBoundMethod).toHaveBeenCalledWith("updated");
    });
  });

  describe("Edge cases with undefined and null", () => {
    it("should handle null timeout cleanup", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // First call creates timeout
      debouncedFn("first");

      // Immediately call again (should clear previous timeout)
      debouncedFn("second");

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("second");
    });

    it("should handle functions that return undefined", () => {
      const undefinedFunction = jest.fn((_param: string) => undefined);
      const debouncedFn = debounce(undefinedFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(undefinedFunction).toHaveBeenCalledWith("test");
    });

    it("should handle functions that return null", () => {
      const nullFunction = jest.fn((_param: string) => null);
      const debouncedFn = debounce(nullFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(nullFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Boundary value testing", () => {
    it("should handle minimum valid delay (1ms)", () => {
      const debouncedFn = debounce(mockFunction, 1);

      debouncedFn("test");
      jest.advanceTimersByTime(1);

      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle maximum realistic delay", () => {
      const debouncedFn = debounce(mockFunction, 5000);

      debouncedFn("test");
      jest.advanceTimersByTime(4999);
      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });

    it("should handle decimal delays properly", () => {
      const debouncedFn = debounce(mockFunction, 99.7);

      debouncedFn("test");
      // Decimal delays are typically floored by setTimeout, so 99.7 becomes 99
      jest.advanceTimersByTime(100);
      expect(mockFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Stress testing", () => {
    it("should handle rapid creation and execution of multiple debounced functions", () => {
      const functions: Array<jest.MockedFunction<() => void>> = [];
      const debouncedFunctions: Array<() => void> = [];

      // Create many debounced functions
      for (let i = 0; i < 100; i++) {
        const fn = jest.fn();
        functions.push(fn);
        debouncedFunctions.push(debounce(fn, 50 + i));
      }

      // Execute all of them
      for (let i = 0; i < debouncedFunctions.length; i++) {
        debouncedFunctions[i]();
      }

      // Advance time to trigger all executions
      jest.advanceTimersByTime(200);

      // All functions should have been called
      for (const fn of functions) {
        expect(fn).toHaveBeenCalledTimes(1);
      }
    });

    it("should handle debounced functions with very different delays", () => {
      const delays = [1, 10, 100, 1000, 5000];
      const functions = delays.map(() => jest.fn());
      const debouncedFunctions = delays.map((delay, i) => debounce(functions[i], delay));

      // Call all at the same time
      debouncedFunctions.forEach((fn, i) => fn(`test${i}`));

      // Check execution at each delay point
      for (let i = 0; i < delays.length; i++) {
        jest.advanceTimersByTime(delays[i] - (i > 0 ? delays[i - 1] : 0));

        // Functions up to current index should have executed
        for (let j = 0; j <= i; j++) {
          expect(functions[j]).toHaveBeenCalledWith(`test${j}`);
        }

        // Functions after current index should not have executed yet
        for (let j = i + 1; j < functions.length; j++) {
          expect(functions[j]).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe("Return value handling", () => {
    it("should not return a value from the debounced function", () => {
      const returnValueFunction = jest.fn((_param: string) => "return value");
      const debouncedFn = debounce(returnValueFunction, 100);

      const result = debouncedFn("test");

      expect(result).toBeUndefined();

      jest.advanceTimersByTime(100);
      expect(returnValueFunction).toHaveBeenCalledWith("test");
    });

    it("should ignore return values from the original function", () => {
      const promiseFunction = jest.fn((_param: string) => Promise.resolve("async result"));
      const debouncedFn = debounce(promiseFunction, 100);

      const result = debouncedFn("test");

      expect(result).toBeUndefined();

      jest.advanceTimersByTime(100);
      expect(promiseFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Timeout ID management", () => {
    it("should handle timeout ID assignment correctly", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // First call should create a timeout
      debouncedFn("first");

      // Second call should clear the first timeout and create a new one
      debouncedFn("second");

      // Third call should clear the second timeout and create a new one
      debouncedFn("third");

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith("third");
    });

    it("should handle clearTimeout with null timeoutId gracefully", () => {
      const debouncedFn = debounce(mockFunction, 100);

      // Call the function for the first time (timeoutId starts as null)
      debouncedFn("test");

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Function context preservation", () => {
    it("should preserve this context when function is bound", () => {
      const contextObject = {
        value: "context",
        method: jest.fn(function (this: { value: string }, param: string) {
          return `${this.value}: ${param}`;
        }),
      };

      const boundMethod = contextObject.method.bind(contextObject);
      const debouncedFn = debounce(boundMethod, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(contextObject.method).toHaveBeenCalledWith("test");
    });

    it("should work with arrow functions (which don't have their own this)", () => {
      const arrowFunction = jest.fn((value: string) => `arrow: ${value}`);
      const debouncedFn = debounce(arrowFunction, 100);

      debouncedFn("test");
      jest.advanceTimersByTime(100);

      expect(arrowFunction).toHaveBeenCalledWith("test");
    });
  });

  describe("Browser environment considerations", () => {
    it("should work with functions that use global objects", () => {
      const globalFunction = jest.fn((url: string) => {
        // Simulate function that uses global URL
        try {
          return new URL(url).hostname;
        } catch {
          return "invalid";
        }
      });

      const debouncedFn = debounce(globalFunction, 100);

      debouncedFn("https://example.com/path");
      jest.advanceTimersByTime(100);

      expect(globalFunction).toHaveBeenCalledWith("https://example.com/path");
    });

    it("should handle functions that access DOM-like objects", () => {
      const domFunction = jest.fn((selector: string) => {
        // Simulate a function that might access document (mocked in jest setup)
        return `selector: ${selector}`;
      });

      const debouncedFn = debounce(domFunction, 100);

      debouncedFn("#test-element");
      jest.advanceTimersByTime(100);

      expect(domFunction).toHaveBeenCalledWith("#test-element");
    });
  });

  describe("Import and export validation", () => {
    it("should be importable as named export", () => {
      expect(typeof debounce).toBe("function");
    });

    it("should also be available as default export", async () => {
      // Dynamic import to test default export
      const debounceModule = await import("@/utils/debounce");
      expect(typeof debounceModule.default).toBe("function");
      expect(debounceModule.default).toBe(debounce);
    });
  });

  describe("Documentation and usage compliance", () => {
    it("should work according to the JSDoc specification", () => {
      // Test that it creates a debounced function as documented
      const testFunction = jest.fn((message: string) => `Hello ${message}`);
      const debouncedFn = debounce(testFunction, 150);

      // Test that it delays invoking as documented
      debouncedFn("World");
      expect(testFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(testFunction).toHaveBeenCalledWith("World");
    });

    it("should follow the exact function signature from the implementation", () => {
      // The function should accept any function type and return a function with the same parameters
      const multiParamFn = jest.fn((a: string, b: number, c: boolean) => `${a}-${b}-${c}`);
      const debouncedFn = debounce(multiParamFn, 100);

      // The debounced function should accept the same parameters
      debouncedFn("test", 42, true);
      jest.advanceTimersByTime(100);

      expect(multiParamFn).toHaveBeenCalledWith("test", 42, true);
    });
  });
});

import { executeStringFunction } from "../functions";

describe("executeStringFunction", () => {
  describe("basic arithmetic", () => {
    it("executes a simple addition function", async () => {
      const result = await executeStringFunction("(a, b) => a + b", {}, 2, 3);
      expect(result).toBe(5);
    });

    it("executes a multiplication function", async () => {
      const result = await executeStringFunction("(x) => x * 10", {}, 7);
      expect(result).toBe(70);
    });
  });

  describe("string operations", () => {
    it("executes a template literal function", async () => {
      const result = await executeStringFunction("(name) => `Hello, ${name}!`", {}, "World");
      expect(result).toBe("Hello, World!");
    });
  });

  describe("context injection", () => {
    it("injects a single context variable and uses it", async () => {
      const result = await executeStringFunction("(x) => multiplier * x", { multiplier: 3 }, 4);
      expect(result).toBe(12);
    });

    it("injects multiple context variables", async () => {
      const result = await executeStringFunction("() => a + b", { a: 10, b: 20 });
      expect(result).toBe(30);
    });

    it("injects an object with methods as context", async () => {
      const math = { add: (x: number, y: number) => x + y };
      const result = await executeStringFunction("(x, y) => math.add(x, y)", { math }, 5, 7);
      expect(result).toBe(12);
    });
  });

  describe("async functions", () => {
    it("resolves an async arrow function", async () => {
      const result = await executeStringFunction("async (x) => x * 2", {}, 6);
      expect(result).toBe(12);
    });

    it("resolves a promise returned from the function", async () => {
      const result = await executeStringFunction("(x) => Promise.resolve(x + 1)", {}, 9);
      expect(result).toBe(10);
    });
  });

  describe("no arguments / empty context", () => {
    it("works with no extra args and empty context", async () => {
      const result = await executeStringFunction("() => 42");
      expect(result).toBe(42);
    });

    it("defaults context to an empty object when omitted", async () => {
      const result = await executeStringFunction("() => true");
      expect(result).toBe(true);
    });
  });
});

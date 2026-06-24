import { logger } from "@/utils/logger";
import { classifyPayscriptBody, evaluateModuleScope } from "../moduleScope";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

/** Minimal script context shared by the evaluation tests. */
const makeContext = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  Metadata: {},
  callAction: jest.fn(),
  ...extra,
});

describe("classifyPayscriptBody", () => {
  describe("Tier 1 — explicit markers", () => {
    it("treats a `// @payscript` first line as DSL even if the body looks like a module", () => {
      expect(classifyPayscriptBody("// @payscript\nconst x = 1; return { x };")).toBe("dsl");
    });

    it("treats a `// @module-scope` first line as a module even if the body opens with `(`", () => {
      expect(classifyPayscriptBody("// @module-scope\n(function(){})();\nreturn {};")).toBe("module");
    });

    it("recognises a block-comment marker", () => {
      expect(classifyPayscriptBody("/* @module-scope */ const a = 1; return { a };")).toBe("module");
    });
  });

  describe("Tier 2 — structural fallback", () => {
    it("classifies an object expression as DSL", () => {
      expect(classifyPayscriptBody('{ id: "X", compute: () => ({}) }')).toBe("dsl");
    });

    it("classifies a parenthesised expression as DSL", () => {
      expect(classifyPayscriptBody("({ onScan: async () => {} })")).toBe("dsl");
    });

    it.each([
      ["export const = object", "export const Rules = { id: 'X', compute: () => ({}) };"],
      ["export const = parenthesised", "export const Rules = ({ onScan: async () => {} });"],
      ["export default", "export default { id: 'X' };"],
    ])("classifies a leading %s as DSL (the registry strips the wrapper)", (_label, body) => {
      expect(classifyPayscriptBody(body)).toBe("dsl");
    });

    it("routes an export-led body to DSL even behind a leading comment", () => {
      expect(classifyPayscriptBody("// rules\nexport const Rules = { id: 'X' };")).toBe("dsl");
    });

    it.each([
      ["const declaration", "const a = 1; return { a };"],
      ["let declaration", "let a = 1; return { a };"],
      ["function declaration", "function f() {} return { f };"],
      ["use strict directive", '"use strict"; const a = 1; return { a };'],
    ])("classifies a %s as a module body", (_label, body) => {
      expect(classifyPayscriptBody(body)).toBe("module");
    });

    it("skips a leading header comment before inspecting the first token", () => {
      expect(classifyPayscriptBody("// helper module\n\nconst a = 1; return { a };")).toBe("module");
    });

    it("misclassifies a leading IIFE as DSL (documented edge case requiring the marker)", () => {
      expect(classifyPayscriptBody("(function(){})();\nconst a = 1; return { a };")).toBe("dsl");
    });
  });
});

describe("evaluateModuleScope", () => {
  beforeEach(() => {
    (logger.warn as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  it("returns the object the body exports via `return`", () => {
    const scope = evaluateModuleScope("const greet = (n) => `hi ${n}`; return { greet };", makeContext());
    expect(typeof scope.greet).toBe("function");
    expect((scope.greet as (n: string) => string)("Ada")).toBe("hi Ada");
  });

  it("shares module state across helper invocations (closure over `let`)", () => {
    const scope = evaluateModuleScope("let count = 0; const tick = () => ++count; return { tick };", makeContext());
    const tick = scope.tick as () => number;
    expect(tick()).toBe(1);
    expect(tick()).toBe(2);
  });

  it("can read injected context (OB / callAction) from inside the body", () => {
    const callAction = jest.fn();
    const scope = evaluateModuleScope(
      "const run = () => callAction('h', {}); return { run };",
      makeContext({ callAction })
    );
    (scope.run as () => void)();
    expect(callAction).toHaveBeenCalledWith("h", {});
  });

  it("persists OB namespace writes performed during evaluation", () => {
    const OB: Record<string, unknown> = {};
    evaluateModuleScope("OB.APRM = {}; OB.APRM.updateTotal = () => 42; return {};", makeContext({ OB }));
    const aprm = OB.APRM as { updateTotal: () => number };
    expect(aprm.updateTotal()).toBe(42);
  });

  it("returns an empty scope and warns when the body returns no object", () => {
    const scope = evaluateModuleScope("const a = 1;", makeContext());
    expect(scope).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  it("returns an empty scope and warns when the body returns a non-object", () => {
    const scope = evaluateModuleScope("return 5;", makeContext());
    expect(scope).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  it("returns an empty scope and logs an error when the body throws", () => {
    const scope = evaluateModuleScope("throw new Error('boom');", makeContext());
    expect(scope).toEqual({});
    expect(logger.error).toHaveBeenCalled();
  });
});

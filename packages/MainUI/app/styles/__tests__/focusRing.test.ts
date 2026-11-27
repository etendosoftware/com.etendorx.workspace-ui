import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(__dirname, "..", "global.css"), "utf8");

/** The text between the `{` that follows `selector` and its closing `}`. */
const blockOf = (selector: string): string => {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`Unclosed block for ${selector}`);
};

describe("keyboard focus ring (ETP-6304)", () => {
  it("defines the ring colour for the light theme", () => {
    expect(css).toMatch(/--ui-focus-ring:\s*#[0-9a-f]{6}/i);
  });

  it("defines a different ring colour for the dark theme", () => {
    const dark = blockOf('html[data-theme="dark"] {');
    expect(dark).toMatch(/--ui-focus-ring:\s*#[0-9a-f]{6}/i);
  });

  it("draws a visible outline on keyboard focus for buttons, links, menu items and fields", () => {
    const rule = css.slice(css.indexOf(":is(\n    a[href]"));
    for (const target of ["a[href]", "button", 'input:not([type="hidden"])', "textarea", '[role="menuitem"]']) {
      expect(rule.slice(0, rule.indexOf("{"))).toContain(target);
    }
    expect(rule.slice(0, rule.indexOf("{"))).toContain(":focus-visible");
    expect(blockOf(":is(\n    a[href]")).toContain("outline: 2px solid var(--ui-focus-ring)");
  });

  it("is outside any cascade layer, so it wins over the outline-none utilities", () => {
    const ruleStart = css.indexOf(":is(\n    a[href]");
    const before = css.slice(0, ruleStart);
    const opened = (before.match(/@layer[^{;]*\{/g) ?? []).length;
    // every `@layer name {` block before the rule is closed by then: the rule is at the top level
    const depthBefore = (before.match(/\{/g) ?? []).length - (before.match(/\}/g) ?? []).length;
    expect(opened).toBeGreaterThanOrEqual(0);
    expect(depthBefore).toBe(0);
  });
});

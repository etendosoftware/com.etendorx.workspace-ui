import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Page } from "@playwright/test";

const require = createRequire(import.meta.url);
/** axe-core, the engine of the accessibility check, read once and injected into the page under test. */
const AXE_SOURCE = readFileSync(require.resolve("axe-core"), "utf8");

/** A rule of axe-core the page breaks, with how many elements break it and where. */
export interface A11yViolation {
  rule: string;
  impact: string | null;
  help: string;
  count: number;
  /** CSS selectors of the first elements that break it, to find them. */
  targets: string[];
  /** The start of the HTML of the first element that breaks it. */
  sample: string;
}

interface AxeResult {
  violations: {
    id: string;
    impact: string | null;
    help: string;
    nodes: { target: unknown[]; html: string }[];
  }[];
}

const MAX_TARGETS = 5;
const SAMPLE_LENGTH = 200;

interface ScanOptions {
  /** CSS selector of the part of the page to check; the whole page by default. */
  within?: string;
  /** Only these rules of axe-core. */
  rules: readonly string[];
}

/**
 * Checks the page with axe-core, only for the given rules, and returns the ones it breaks.
 * Read-only: it inspects the DOM and changes nothing.
 */
export async function scanAccessibility(page: Page, { within, rules }: ScanOptions): Promise<A11yViolation[]> {
  const hasAxe = await page.evaluate(() => "axe" in window);
  if (!hasAxe) await page.addScriptTag({ content: AXE_SOURCE });

  const result = await page.evaluate(
    async ({ within, rules }) => {
      const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<unknown> } }).axe;
      const context = within ? { include: [within] } : document;
      return (await axe.run(context, {
        runOnly: { type: "rule", values: rules },
        resultTypes: ["violations"],
      })) as unknown;
    },
    { within, rules: [...rules] }
  );

  return (result as AxeResult).violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    count: violation.nodes.length,
    targets: violation.nodes.slice(0, MAX_TARGETS).map((node) => String(node.target.at(-1))),
    sample: (violation.nodes[0]?.html ?? "").slice(0, SAMPLE_LENGTH),
  }));
}

/** One line per violation, for the message of a failed check. */
export function formatViolations(violations: readonly A11yViolation[]): string {
  return violations
    .map(
      (v) => `${v.rule} (${v.impact ?? "n/a"}, ${v.count}x): ${v.help} — e.g. ${v.targets.join(" | ")}\n    ${v.sample}`
    )
    .join("\n");
}

/**
 * The rules of axe-core the main screens are checked against: the name, role and state of what the keyboard and a
 * screen reader reach. Colour contrast and the page structure (landmarks, headings) are not in the list yet.
 */
export const ENFORCED_RULES = [
  "button-name",
  "link-name",
  "input-button-name",
  "select-name",
  "label",
  "aria-input-field-name",
  "aria-toggle-field-name",
  "aria-command-name",
  "aria-dialog-name",
  "image-alt",
  "aria-roles",
  "aria-valid-attr",
  "aria-valid-attr-value",
  "aria-allowed-attr",
  "aria-required-attr",
  "aria-required-children",
  "aria-required-parent",
  "aria-hidden-focus",
  "duplicate-id-aria",
  "nested-interactive",
  "tabindex",
  "document-title",
  "html-has-lang",
  "frame-title",
] as const;

/** The violations of a screen that are not in `known`, and the known ones that are no longer there. */
export function compareWithKnown(
  violations: readonly A11yViolation[],
  known: Readonly<Record<string, string>>
): { unexpected: A11yViolation[]; fixed: string[] } {
  const found = new Set(violations.map((violation) => violation.rule));
  return {
    unexpected: violations.filter((violation) => !(violation.rule in known)),
    fixed: Object.keys(known).filter((rule) => !found.has(rule)),
  };
}

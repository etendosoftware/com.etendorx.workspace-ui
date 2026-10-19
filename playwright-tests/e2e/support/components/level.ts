import type { Locator } from "@playwright/test";

/**
 * Tab level a control belongs to when a header and a child tab are shown at once.
 * The header renders first in the DOM and the child tab last.
 */
export type TabLevel = "header" | "child";

/** Picks the header (first) or child (last) match of a locator. */
export function atLevel(locator: Locator, level: TabLevel): Locator {
  return level === "header" ? locator.first() : locator.last();
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Builds a regular expression that matches `text` exactly, escaping its special characters. */
export function exactText(text: string): RegExp {
  return new RegExp(`^${escapeRegExp(text)}$`);
}

/**
 * Builds a regular expression that finds `text` inside a longer text, but not as the tail of a
 * longer value: "1 (Spain)" is found in "Payment Method 1 (Spain)", not in "2.1 (Spain)".
 */
export function standaloneText(text: string): RegExp {
  return new RegExp(`(?<![\\w.])${escapeRegExp(text)}`);
}

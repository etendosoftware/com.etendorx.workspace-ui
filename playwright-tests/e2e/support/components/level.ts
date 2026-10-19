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

/** Builds a regular expression that matches `text` exactly, escaping its special characters. */
export function exactText(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/**
 * Playwright reporter that makes flaky tests visible.
 *
 * A test that fails and then passes on a retry is reported as green by the default
 * reporters. This reporter lists those tests at the end of the run and writes them to a
 * JSON file that CI archives. It never changes the exit code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const DEFAULT_OUTPUT_FILE = "test-results/flaky-tests.json";
const FLAKY_OUTCOME = "flaky";

/**
 * Builds the serializable entry of a flaky test.
 * @param {import("@playwright/test/reporter").TestCase} test
 * @returns {{ title: string, file: string, line: number, retries: number }}
 */
export function toFlakyEntry(test) {
  return {
    title: test.titlePath().filter(Boolean).join(" › "),
    file: test.location.file,
    line: test.location.line,
    retries: test.results.length - 1,
  };
}

/** Formats the end-of-run summary printed to the console. */
export function formatSummary(entries) {
  if (entries.length === 0) {
    return "Flaky tests: none.";
  }
  const lines = entries.map((entry) => `  ⚠ ${entry.title} (retries: ${entry.retries})`);
  return [`Flaky tests: ${entries.length} passed only after a retry:`, ...lines].join("\n");
}

export default class FlakySummaryReporter {
  /** @param {{ outputFile?: string, log?: (message: string) => void }} options */
  constructor(options = {}) {
    this.outputFile = options.outputFile ?? DEFAULT_OUTPUT_FILE;
    this.log = options.log ?? console.log;
    this.tests = new Map();
  }

  printsToStdio() {
    return false;
  }

  onTestEnd(test) {
    this.tests.set(test.id, test);
  }

  onEnd() {
    const entries = [...this.tests.values()].filter((test) => test.outcome() === FLAKY_OUTCOME).map(toFlakyEntry);
    mkdirSync(dirname(this.outputFile), { recursive: true });
    writeFileSync(this.outputFile, `${JSON.stringify(entries, null, 2)}\n`);
    this.log(formatSummary(entries));
  }
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import FlakySummaryReporter, { DEFAULT_OUTPUT_FILE, formatSummary, toFlakyEntry } from "../flaky-summary.mjs";

const SPEC_FILE = "/e2e/a.spec.ts";

/** Minimal TestCase double: `attempts` is the number of results (1 + retries). */
function fakeTest(id, outcome, attempts = 1) {
  return {
    id,
    location: { file: SPEC_FILE, line: 7 },
    results: Array.from({ length: attempts }, () => ({})),
    outcome: () => outcome,
    titlePath: () => ["", "chromium", "Suite", id],
  };
}

/** Feeds the tests to a reporter writing into a temp dir; returns the written entries and log. */
function report(tests) {
  const outputFile = join(mkdtempSync(join(tmpdir(), "flaky-")), "nested", "flaky.json");
  const messages = [];
  const reporter = new FlakySummaryReporter({ outputFile, log: (message) => messages.push(message) });
  for (const testCase of tests) {
    reporter.onTestEnd(testCase);
  }
  reporter.onEnd();
  return { entries: JSON.parse(readFileSync(outputFile, "utf8")), output: messages.join("\n") };
}

test("builds the entry of a flaky test from its title path, location and retries", () => {
  assert.deepEqual(toFlakyEntry(fakeTest("t1", "flaky", 3)), {
    title: "chromium › Suite › t1",
    file: SPEC_FILE,
    line: 7,
    retries: 2,
  });
});

test("summary says none when there are no flaky tests", () => {
  assert.equal(formatSummary([]), "Flaky tests: none.");
});

test("summary lists every flaky test with its retries", () => {
  const summary = formatSummary([{ title: "Suite › t1", retries: 1 }]);
  assert.match(summary, /Flaky tests: 1 passed only after a retry:/);
  assert.match(summary, /⚠ Suite › t1 \(retries: 1\)/);
});

test("writes and logs only the flaky tests, once per test", () => {
  const flaky = fakeTest("t1", "flaky", 2);
  const { entries, output } = report([flaky, flaky, fakeTest("t2", "expected"), fakeTest("t3", "unexpected", 3)]);
  assert.deepEqual(
    entries.map((entry) => entry.title),
    ["chromium › Suite › t1"]
  );
  assert.match(output, /Flaky tests: 1 passed only after a retry/);
});

test("writes an empty list when every test is stable", () => {
  const { entries, output } = report([fakeTest("t1", "expected")]);
  assert.deepEqual(entries, []);
  assert.equal(output, "Flaky tests: none.");
});

test("defaults to the test-results folder and does not print to stdio", () => {
  const reporter = new FlakySummaryReporter();
  assert.equal(reporter.outputFile, DEFAULT_OUTPUT_FILE);
  assert.equal(reporter.printsToStdio(), false);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { median, bootstrapMedianDiff, compareMetric, compareRuns } from "../stats.mjs";

test("median of odd and even samples", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test("bootstrap interval is deterministic and brackets the difference", () => {
  const base = [100, 102, 98, 101, 99];
  const head = [150, 152, 148, 151, 149];
  const [lo, hi] = bootstrapMedianDiff(base, head);
  assert.deepEqual(bootstrapMedianDiff(base, head), [lo, hi]);
  assert.ok(lo > 0 && lo <= 50 && hi >= 50);
});

test("a timing change inside the noise is not a regression", () => {
  const r = compareMetric("settledMs", [1000, 1300, 900], [1100, 1200, 1000]);
  assert.equal(r.regression, false);
});

test("a timing change above 10% and above the noise is a regression", () => {
  const r = compareMetric("blockingMs", [500, 510, 495], [700, 720, 690]);
  assert.equal(r.regression, true);
  assert.equal(Math.round(r.changePct), 40);
});

test("a small absolute timing change is not a regression even when consistent", () => {
  // +61 ms on a 289 ms step: above 10%, outside the noise of 2 rounds, but too small to matter
  assert.equal(compareMetric("settledMs", [289, 290], [350, 351]).regression, false);
  assert.equal(compareMetric("blockingMs", [33, 34], [70, 71]).regression, false);
});

test("a timing improvement is never a regression", () => {
  assert.equal(compareMetric("settledMs", [700, 720, 690], [500, 510, 495]).regression, false);
});

test("one more request is a regression regardless of noise", () => {
  assert.equal(compareMetric("apiRequests", [5, 5, 5], [6, 6, 6]).regression, true);
  assert.equal(compareMetric("apiRequests", [5, 5, 5], [5, 5, 5]).regression, false);
});

test("bytes are a regression above 5%", () => {
  assert.equal(compareMetric("apiBytes", [1000, 1000], [1040, 1040]).regression, false);
  assert.equal(compareMetric("apiBytes", [1000, 1000], [1100, 1100]).regression, true);
});

test("compareRuns compares the flows that succeeded on both sides", () => {
  const run = (settled, reqs) => ({
    flows: {
      "Sales Order / open-record": { settledMs: settled, blockingMs: 10, apiRequests: reqs, apiBytes: 100 },
      "Sales Order / error": { error: "boom" },
    },
  });
  const report = compareRuns([run(100, 5), run(110, 5)], [run(105, 6), run(100, 6)]);
  assert.deepEqual(
    report.rows.map((r) => r.flow),
    ["Sales Order / open-record"]
  );
  assert.equal(report.regressions.length, 1);
  assert.equal(report.regressions[0].metric, "apiRequests");
});

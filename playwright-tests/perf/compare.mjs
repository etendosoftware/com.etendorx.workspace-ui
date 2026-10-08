// Compares two bench.mjs results: node perf/compare.mjs before.json after.json
import fs from "node:fs";

const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
if (!a || !b) {
  console.error("usage: node perf/compare.mjs before.json after.json");
  process.exit(1);
}

const pct = (x, y) => (x ? `${(((y - x) / x) * 100).toFixed(1)}%` : "n/a");
const row = (x, y, f) => `${x[f]} → ${y[f]} (${pct(x[f], y[f])})`;
const kb = (n) => Math.round(n / 1024);

console.log(
  `before: ${a.label} ${a.date} (CPU ${a.cpuThrottle || 1}x)\nafter:  ${b.label} ${b.date} (CPU ${b.cpuThrottle || 1}x)\n(negative % = improvement)\n`
);

// Union of flow keys: a flow present only in one file (or that errored in either) is reported,
// never silently dropped, and excluded from the comparable set used for the table row and TOTAL.
const flowKeys = new Set([...Object.keys(a.flows), ...Object.keys(b.flows)]);
const table = {};
const common = [];
const notComparable = [];
for (const k of flowKeys) {
  const x = a.flows[k];
  const y = b.flows[k];
  if (!x) {
    table[k] = { note: "only in after" };
    notComparable.push(`${k} (only in after)`);
    continue;
  }
  if (!y) {
    table[k] = { note: "only in before" };
    notComparable.push(`${k} (only in before)`);
    continue;
  }
  if (x.error || y.error) {
    table[k] = { note: "failed in before, after, or both" };
    notComparable.push(`${k} (failed)`);
    continue;
  }
  table[k] = {
    settledMs: row(x, y, "settledMs"),
    visibleMs: row(x, y, "visibleMs"),
    interactiveMs: x.interactiveMs == null ? "n/a" : row(x, y, "interactiveMs"),
    blockingMs: x.blockingMs == null ? "n/a" : row(x, y, "blockingMs"),
    apiReqs: row(x, y, "apiRequests"),
    apiKB: `${kb(x.apiBytes)} → ${kb(y.apiBytes)} (${pct(x.apiBytes, y.apiBytes)})`,
    waitMs: row(x, y, "apiWaitMs"),
  };
  common.push([k, x, y]);
}
console.table(table);

// TOTAL: sum of per-flow medians over flows present and successful in BOTH files, so runs with
// different failed steps (e.g. one missing "type-10-chars") stay comparable instead of showing a
// false regression from flows that only exist on one side.
console.log(
  `\nTOTAL (sum of per-flow medians, ${common.length} of ${flowKeys.size} flows compared)${
    notComparable.length ? `; not comparable: ${notComparable.join(", ")}` : ""
  }`
);
const TOTAL_METRICS = [
  "settledMs",
  "visibleMs",
  "interactiveMs",
  "blockingMs",
  "longTaskMs",
  "apiRequests",
  "apiBytes",
  "bytes",
  "apiWaitMs",
];
const t = {};
for (const f of TOTAL_METRICS) {
  let before = 0;
  let after = 0;
  let n = 0;
  for (const [, x, y] of common) {
    if (x[f] == null || y[f] == null) continue; // skip this flow's contribution if either side lacks the metric
    before += x[f];
    after += y[f];
    n++;
  }
  if (n > 0) t[f] = { before, after, change: pct(before, after) };
}
console.table(t);

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
const table = {};
for (const k of Object.keys(a.flows)) {
  const x = a.flows[k];
  const y = b.flows[k];
  if (!y || x.error || y.error) {
    table[k] = { note: "missing or error in one run" };
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
}
console.table(table);

console.log("\nTOTAL (sum of all flows)");
const t = {};
for (const f of [
  "settledMs",
  "visibleMs",
  "interactiveMs",
  "blockingMs",
  "longTaskMs",
  "apiRequests",
  "apiBytes",
  "bytes",
  "apiWaitMs",
])
  if (a.totals[f] != null && b.totals[f] != null)
    t[f] = { before: a.totals[f], after: b.totals[f], change: pct(a.totals[f], b.totals[f]) };
console.table(t);

// Aggregates bench.mjs CPU profiles into source-level hotspots using the production source maps.
// Usage: node perf/hotspots.mjs perf/results/profiles/<LABEL> [../packages/MainUI/.next] [filter]
// `filter` keeps only profiles whose file name contains it (e.g. "open-record").
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import fs from "node:fs";
import path from "node:path";

const [profileDir, nextDir = "../packages/MainUI/.next", filter = ""] = process.argv.slice(2);
if (!profileDir) {
  console.error("usage: node perf/hotspots.mjs <profile-dir> [next-build-dir] [filter]");
  process.exit(1);
}

const maps = new Map();
function mapFor(url) {
  if (!maps.has(url)) {
    let m = null;
    const p = url.match(/\/_next\/(static\/.+\.js)/);
    const file = p && path.join(nextDir, `${p[1]}.map`);
    if (file && fs.existsSync(file)) m = new TraceMap(fs.readFileSync(file, "utf8"));
    maps.set(url, m);
  }
  return maps.get(url);
}

// Collapses node_modules paths to the package name so library time is grouped per package
const shortSource = (src) => {
  const s = src.replace(/^webpack:\/\/_N_E\//, "").replace(/^\.\//, "");
  const nm = s.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/);
  return nm ? `[${nm[1]}]` : s;
};

function frameLabel(cf) {
  if (!cf.url) return { fn: cf.functionName || `(${cf.functionName || "native"})`, src: "(native)", lib: true };
  const m = cf.lineNumber >= 0 ? mapFor(cf.url) : null;
  if (!m) return { fn: cf.functionName || "(anon)", src: path.basename(cf.url), lib: true };
  const o = originalPositionFor(m, { line: cf.lineNumber + 1, column: cf.columnNumber });
  if (!o.source) return { fn: cf.functionName || "(anon)", src: path.basename(cf.url), lib: true };
  const src = shortSource(o.source);
  return { fn: o.name || cf.functionName || "(anon)", src: `${src}:${o.line}`, file: src, lib: src.startsWith("[") };
}

const files = fs
  .readdirSync(profileDir)
  .filter((f) => f.endsWith(".cpuprofile") && f.includes(filter))
  .sort();
const self = new Map(); // "fn src:line" -> ms
const inclusiveApp = new Map(); // first-party function -> ms (time with it on the stack)
const byFile = new Map(); // first-party file -> self ms of the file + libs it called
const perProfile = [];
let grand = 0;
let idle = 0;

for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(profileDir, f), "utf8"));
  const nodes = new Map(p.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of p.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const labels = new Map();
  const lab = (id) => {
    if (!labels.has(id)) labels.set(id, frameLabel(nodes.get(id).callFrame));
    return labels.get(id);
  };
  const t = new Map();
  p.samples.forEach((s, i) => t.set(s, (t.get(s) || 0) + (p.timeDeltas[i] || 0) / 1000));
  let busy = 0;
  for (const [id, ms] of t) {
    const n = nodes.get(id);
    const name = n.callFrame.functionName;
    if (name === "(idle)" || name === "(program)" || name === "(root)") {
      if (name === "(idle)") idle += ms;
      continue;
    }
    busy += ms;
    const l = lab(id);
    const key = `${l.fn}  ${l.src}`;
    self.set(key, (self.get(key) || 0) + ms);
    // Walk the stack once: inclusive time per first-party function, and attribute the sample to the
    // nearest first-party file (library/native time is charged to the app code that called it)
    const seen = new Set();
    let owner = null;
    for (let x = id; x !== undefined; x = parent.get(x)) {
      const fl = lab(x);
      if (fl.lib) continue;
      if (!owner) owner = fl.file;
      const k = `${fl.fn}  ${fl.src}`;
      if (!seen.has(k)) {
        seen.add(k);
        inclusiveApp.set(k, (inclusiveApp.get(k) || 0) + ms);
      }
    }
    const o = owner || "(library/framework only)";
    byFile.set(o, (byFile.get(o) || 0) + ms);
  }
  grand += busy;
  perProfile.push([f.replace(".cpuprofile", ""), Math.round(busy)]);
}

const top = (m, n) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${String(Math.round(v)).padStart(7)} ms ${((v / grand) * 100).toFixed(1).padStart(5)}%  ${k}`)
    .join("\n");

console.log(`${files.length} profiles, busy CPU ${Math.round(grand)} ms (idle ${Math.round(idle)} ms)\n`);
console.log(`== Busy CPU per step\n${perProfile.map(([k, v]) => `${String(v).padStart(7)} ms  ${k}`).join("\n")}`);
console.log(`\n== Self time (where the CPU actually burns)\n${top(self, 30)}`);
console.log(`\n== First-party files (self + library time they triggered)\n${top(byFile, 25)}`);
console.log(`\n== First-party functions, inclusive (on the stack)\n${top(inclusiveApp, 40)}`);

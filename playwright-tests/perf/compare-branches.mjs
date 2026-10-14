// pnpm perf:compare — measures this branch against its base on the same machine and writes a report for
// the PR. Builds the base (merge-base with the target branch) in a cached git worktree and the working
// tree, serves both, runs bench.mjs alternating base and head, and compares with stats.mjs.
// See README.md ("Comparing a branch with its base").
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { busyRounds, busyPct, cpuTimes, IDLE_MAX_BUSY_PCT, sampleBusyPct } from "./machine.mjs";
import { compareRuns, METRICS, windowsToRemeasure } from "./stats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const run = (cmd, args, opts = {}) =>
  (
    execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 2 ** 20,
      ...opts,
    }) ?? ""
  ).trim();
const git = (...args) => run("git", args);
const ROOT = git("rev-parse", "--show-toplevel");

const ROUNDS = Number(process.env.ROUNDS || 3);
// Rounds added per side, only for the windows with a regression, before writing the report (0 disables)
const EXTRA_ROUNDS = Number(process.env.EXTRA_ROUNDS ?? 3);
const QUICK = process.env.QUICK === "1";
const WINDOWS = process.env.WINDOWS || (QUICK ? "Sales Invoice" : "");
const CPU_THROTTLE = process.env.CPU_THROTTLE || "1";
const BASE_PORT = Number(process.env.BASE_PORT || 3201);
const HEAD_PORT = Number(process.env.HEAD_PORT || 3202);
const SKIP_BUILD = process.env.SKIP_BUILD === "1";
const STRICT = process.env.STRICT === "1";
const WORKTREES_DIR = process.env.PERF_WORKTREES_DIR || path.join(os.homedir(), ".cache", "workspace-ui-perf-compare");

// The developer's shell may carry a NODE_OPTIONS preload that child processes cannot resolve
const childEnv = (extra = {}) => {
  const { NODE_OPTIONS: _ignored, ...env } = process.env;
  return { ...env, NEXT_TELEMETRY_DISABLED: "1", ...extra };
};

const log = (msg) => console.log(`[perf:compare] ${msg}`);

function resolveBase() {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const target = process.env.BASE_REF || (branch.startsWith("hotfix/") ? "origin/main" : "origin/develop");
  try {
    git("rev-parse", "--verify", target);
  } catch {
    throw new Error(`Base ref ${target} not found. Run "git fetch origin" or set BASE_REF.`);
  }
  return {
    branch,
    target,
    baseSha: git("merge-base", "HEAD", target),
    headSha: git("rev-parse", "HEAD"),
    dirty: git("status", "--porcelain", "--untracked-files=no") !== "",
  };
}

function prepareBaseWorktree(baseSha) {
  // Outside the repo, so jest, Biome and the IDE never index a second copy of the sources
  const dir = path.join(WORKTREES_DIR, baseSha.slice(0, 12));
  if (!fs.existsSync(dir)) {
    log(`Creating worktree for the base at ${dir}`);
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    git("worktree", "add", "--detach", dir, baseSha);
    log("Installing dependencies in the base worktree (pnpm store is shared, usually quick)");
    run("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], { cwd: dir, env: childEnv(), stdio: "inherit" });
  }
  const env = path.join(ROOT, "packages/MainUI/.env");
  if (fs.existsSync(env)) fs.copyFileSync(env, path.join(dir, "packages/MainUI/.env"));
  return dir;
}

function build(dir, label) {
  const mainUi = path.join(dir, "packages/MainUI");
  if (SKIP_BUILD && fs.existsSync(path.join(mainUi, ".next/BUILD_ID"))) {
    log(`Reusing the existing ${label} build`);
    return;
  }
  log(`Building ${label} (production build)`);
  run("pnpm", ["build"], { cwd: mainUi, env: childEnv(), stdio: "inherit" });
}

async function serve(dir, port, label) {
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: path.join(dir, "packages/MainUI"),
    env: childEnv(),
    stdio: "ignore",
  });
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${url}/api/health`)).ok) {
        log(`${label} served at ${url}`);
        return { child, url };
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  child.kill();
  throw new Error(`${label} did not start on port ${port}`);
}

/** One bench.mjs run of one side; `windows` limits it (extra rounds), otherwise WINDOWS or all of them. */
function bench({ url, side, label, outDir, windows, load }) {
  const out = path.join(outDir, `${side}-${label}.json`);
  log(`Round ${label}: ${side}${windows ? ` (${windows})` : ""}`);
  const before = cpuTimes();
  const selected = windows || WINDOWS;
  run("node", [path.join(HERE, "bench.mjs")], {
    cwd: path.dirname(HERE),
    env: childEnv({
      BASE_URL: url,
      RUNS: "1",
      CPU_THROTTLE,
      LABEL: `perfcmp-${side}`,
      OUT_FILE: out,
      ...(selected ? { WINDOWS: selected } : {}),
    }),
  });
  load.push({ label: `${side} ${label}`, busyPct: busyPct(before, cpuTimes()) });
  return JSON.parse(fs.readFileSync(out, "utf8"));
}

/**
 * Runs `count` rounds per side, alternating which side goes first so drift and warm-up affect both alike.
 * `first` numbers the rounds after the ones already run.
 */
function runRounds({ servers, runs, outDir, load, count, first = 0, windows }) {
  for (let round = first; round < first + count; round++) {
    const order = round % 2 === 0 ? ["base", "head"] : ["head", "base"];
    for (const side of order) {
      const url = servers[side === "base" ? 0 : 1].url;
      runs[side].push(bench({ url, side, label: String(round + 1), outDir, windows, load }));
    }
  }
}

const fmt = (metric, value) =>
  metric === "apiBytes"
    ? `${Math.round(value / 1024)} KB`
    : metric === "apiRequests"
      ? String(value)
      : `${Math.round(value)} ms`;
const pct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const LABELS = { settledMs: "time", blockingMs: "blocking CPU", apiRequests: "requests", apiBytes: "API bytes" };

function machineLines({ idleBusyPct, load }) {
  const lines = [];
  if (idleBusyPct > IDLE_MAX_BUSY_PCT) {
    lines.push(
      `> ⚠️ The machine was already ${idleBusyPct}% busy before starting: timings are less reliable. Close other programs and run it again.`
    );
  }
  const busy = busyRounds(load);
  if (busy.length) {
    lines.push(
      `> ⚠️ Other programs were using the CPU during round(s) ${busy.join(", ")}: their timings are less reliable.`
    );
  }
  return lines.length ? [...lines, ""] : [];
}

function report({ base, report: r, rounds, startedAt, machine, remeasured }) {
  const cpu = os.cpus()[0]?.model ?? "unknown CPU";
  const lines = [
    "## Performance comparison (`pnpm perf:compare`)",
    "",
    `- **Base:** \`${base.target}\` merge-base \`${base.baseSha.slice(0, 9)}\``,
    `- **Head:** \`${base.branch}\` \`${base.headSha.slice(0, 9)}\`${base.dirty ? " + uncommitted changes" : ""}`,
    `- **Machine:** ${cpu}, ${os.cpus().length} cores, ${Math.round(os.totalmem() / 2 ** 30)} GB, ${os.platform()} · CPU throttle ${CPU_THROTTLE}x · ${rounds} rounds per side, alternated · ${startedAt}`,
    `- **CPU in use:** ${machine.idleBusyPct}% before starting · per round ${machine.load.map((l) => `${l.label} ${l.busyPct}%`).join(", ")}`,
  ];
  if (remeasured.length) {
    lines.push(`- **Re-measured** with ${EXTRA_ROUNDS} extra rounds per side: ${remeasured.join(", ")}`);
  }
  lines.push("", ...machineLines(machine));
  if (r.regressions.length === 0) {
    lines.push("**No regressions** beyond this machine's noise.", "");
  } else {
    lines.push(
      `**${r.regressions.length} regression(s):**`,
      "",
      "| Step | Metric | Base | Head | Change |",
      "|---|---|---|---|---|"
    );
    for (const g of r.regressions) {
      lines.push(
        `| ${g.flow} | ${LABELS[g.metric]} | ${fmt(g.metric, g.base)} | ${fmt(g.metric, g.head)} | ${pct(g.changePct)} |`
      );
    }
    lines.push("");
  }
  lines.push("### Totals", "", "| Metric | Base | Head | Change |", "|---|---|---|---|");
  for (const metric of METRICS) {
    const t = r.totals[metric];
    lines.push(
      `| ${LABELS[metric]} | ${fmt(metric, t.base)} | ${fmt(metric, t.head)} | ${pct(t.changePct)}${t.regression ? " ⚠️" : ""} |`
    );
  }
  lines.push(
    "",
    "<details><summary>By step (median of the rounds)</summary>",
    "",
    "| Step | Time | Blocking CPU | Requests |",
    "|---|---|---|---|"
  );
  for (const row of r.rows) {
    const cell = (metric) => {
      const m = row.metrics[metric];
      return `${fmt(metric, m.base)} → ${fmt(metric, m.head)} (${pct(m.changePct)})${m.regression ? " ⚠️" : ""}`;
    };
    lines.push(`| ${row.flow} | ${cell("settledMs")} | ${cell("blockingMs")} | ${cell("apiRequests")} |`);
  }
  lines.push("", "</details>", "");
  if (r.unstable.length) {
    lines.push(
      `Requests vary between the base rounds (timing-dependent, compared against that noise): ${r.unstable.join(", ")}`,
      ""
    );
  }
  if (r.skipped.length) lines.push(`Not compared (failed in some round): ${r.skipped.join(", ")}`, "");
  lines.push(
    "Rules: a change is a regression only when the bootstrap 95% interval of the difference is above zero (larger than this machine's noise) and it is more requests than the base, API bytes > +5%, or time and blocking CPU > +10% and at least 100 ms (time) or 50 ms (blocking CPU) more."
  );
  return lines.join("\n");
}

async function main() {
  const startedAt = new Date().toISOString();
  const idleBusyPct = await sampleBusyPct();
  if (idleBusyPct > IDLE_MAX_BUSY_PCT) {
    log(`Warning: ${idleBusyPct}% of the CPU is in use before starting; close other programs for reliable timings.`);
  }
  const base = resolveBase();
  log(
    `Base ${base.target} @ ${base.baseSha.slice(0, 9)} · head ${base.branch} @ ${base.headSha.slice(0, 9)}${base.dirty ? " (+ uncommitted changes)" : ""}`
  );
  const baseDir = prepareBaseWorktree(base.baseSha);
  build(baseDir, "base");
  build(ROOT, "head");

  const servers = [];
  const stop = () => {
    for (const server of servers) server.child.kill();
  };
  process.on("SIGINT", () => {
    stop();
    process.exit(130);
  });
  try {
    servers.push(await serve(baseDir, BASE_PORT, "base"));
    servers.push(await serve(ROOT, HEAD_PORT, "head"));
    const outDir = path.join(HERE, "results", "compare-tmp", startedAt.replace(/[:.]/g, "-"));
    const runs = { base: [], head: [] };
    const load = [];
    runRounds({ servers, runs, outDir, load, count: ROUNDS });
    let result = compareRuns(runs.base, runs.head);
    // A regression on few rounds is often noise: measure only those windows again and compare all the rounds
    const remeasured = EXTRA_ROUNDS > 0 ? windowsToRemeasure(result.regressions) : [];
    if (remeasured.length) {
      log(`Regressions in ${remeasured.join(", ")}: ${EXTRA_ROUNDS} extra rounds per side for those windows`);
      runRounds({ servers, runs, outDir, load, count: EXTRA_ROUNDS, first: ROUNDS, windows: remeasured.join(",") });
      result = compareRuns(runs.base, runs.head);
    }
    const machine = { idleBusyPct, load };
    const md = report({ base, report: result, rounds: ROUNDS, startedAt, machine, remeasured });
    const file = path.join(HERE, "results", `compare-${startedAt.replace(/[:.]/g, "-")}.md`);
    fs.writeFileSync(file, md);
    console.log(`\n${md}\n`);
    log(`Report written to ${path.relative(ROOT, file)} — paste it in the PR's Performance section.`);
    if (STRICT && result.regressions.length > 0) process.exitCode = 1;
  } finally {
    stop();
  }
}

main().catch((error) => {
  console.error(`[perf:compare] ${error.message}`);
  process.exit(2);
});

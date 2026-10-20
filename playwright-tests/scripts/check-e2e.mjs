#!/usr/bin/env node
/**
 * E2E convention ratchet.
 *
 * Counts unstable patterns (fixed sleeps, forced clicks, swallowed errors, codemod hash
 * test IDs, CSS-chain selectors) across the Playwright sources and compares them with the
 * committed baseline. A count may only go down: the check fails when any rule grows.
 *
 * Usage:
 *   node scripts/check-e2e.mjs            check against the baseline
 *   node scripts/check-e2e.mjs --update   lower the baseline to the current counts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT_DIR, "e2e");
const BASELINE_FILE = join(ROOT_DIR, "e2e-ratchet.baseline.json");
const SOURCE_EXTENSION = ".ts";
const UPDATE_FLAG = "--update";

/** Rules counted by the ratchet. `pattern` must be global so every occurrence is counted. */
export const RULES = [
  {
    id: "waitForTimeout",
    hint: "fixed sleep: wait for a network response or a UI state instead",
    pattern: /\bwaitForTimeout\s*\(/g,
  },
  {
    id: "forceTrue",
    hint: "force: true skips actionability checks: wait for the element to be actionable",
    pattern: /\bforce\s*:\s*true\b/g,
  },
  {
    id: "swallowedCatch",
    hint: ".catch(() => null) hides real failures: let the step fail or assert the fallback",
    pattern: /\.catch\(\s*(?:async\s*)?\(\s*\)\s*=>\s*(?:null|undefined|false|true|\{\s*\}|\[\s*\])\s*\)/g,
  },
  {
    id: "hashTestId",
    hint: "codemod hash test ID: use a role, a label or a stable domain test ID",
    pattern: /(?<!MenuTitle)__[0-9a-f]{6}(?![\w-])/g,
  },
  {
    id: "cssChainSelector",
    hint: "CSS class selector: use a role, a label or a stable domain test ID",
    pattern: /\.h-14\b|\bcss-[a-z0-9]{5,}\b|\.h-\\*\[|:nth-child\(|\.Mui[A-Z]/g,
  },
  {
    id: "nativeValueSetter",
    hint: "native value setter hack: use FormField.fill, which types like a user",
    pattern: /getOwnPropertyDescriptor\(\s*(?:window\.)?HTMLInputElement\.prototype/g,
  },
];

/**
 * Counts the occurrences of every rule in one source text.
 * @param {string} source - file contents.
 * @returns {Record<string, number>} count per rule id.
 */
export function countViolations(source) {
  const counts = {};
  for (const rule of RULES) {
    counts[rule.id] = source.match(rule.pattern)?.length ?? 0;
  }
  return counts;
}

/**
 * Counts every rule across a set of files.
 * @param {{ path: string, source: string }[]} files
 * @returns {{ totals: Record<string, number>, byFile: Record<string, Record<string, number>> }}
 */
export function countAll(files) {
  const totals = Object.fromEntries(RULES.map((rule) => [rule.id, 0]));
  const byFile = {};
  for (const { path, source } of files) {
    const counts = countViolations(source);
    byFile[path] = counts;
    for (const rule of RULES) {
      totals[rule.id] += counts[rule.id];
    }
  }
  return { totals, byFile };
}

/**
 * Compares current totals with the baseline. A rule missing from the baseline counts as 0.
 * @param {Record<string, number>} totals
 * @param {Record<string, number>} baseline
 * @returns {{ increased: { rule: string, baseline: number, actual: number }[], decreased: { rule: string, baseline: number, actual: number }[] }}
 */
export function compareWithBaseline(totals, baseline) {
  const increased = [];
  const decreased = [];
  for (const rule of RULES) {
    const entry = { rule: rule.id, baseline: baseline[rule.id] ?? 0, actual: totals[rule.id] ?? 0 };
    if (entry.actual > entry.baseline) {
      increased.push(entry);
    } else if (entry.actual < entry.baseline) {
      decreased.push(entry);
    }
  }
  return { increased, decreased };
}

/**
 * Builds the failure report for the rules that grew, listing the files that contain them.
 * @param {{ rule: string, baseline: number, actual: number }[]} increased
 * @param {Record<string, Record<string, number>>} byFile
 * @returns {string}
 */
export function formatIncreases(increased, byFile) {
  const lines = [];
  for (const { rule, baseline, actual } of increased) {
    const { hint } = RULES.find((candidate) => candidate.id === rule);
    lines.push(`✗ ${rule}: ${actual} (baseline ${baseline}) — ${hint}`);
    for (const [path, counts] of Object.entries(byFile)) {
      if (counts[rule] > 0) {
        lines.push(`    ${path}: ${counts[rule]}`);
      }
    }
  }
  return lines.join("\n");
}

/**
 * Lists the Playwright source files under a directory, recursively.
 * @param {string} dir
 * @returns {string[]} absolute paths.
 */
export function listSourceFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(SOURCE_EXTENSION))
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}

function writeBaseline(totals, baselineFile, log) {
  writeFileSync(baselineFile, `${JSON.stringify(totals, null, 2)}\n`);
  log(`E2E ratchet baseline written: ${JSON.stringify(totals)}`);
}

/** Bootstraps a missing baseline with --update; without it, a missing baseline is an error. */
function createBaseline({ update, totals, baselineFile, log }) {
  if (!update) {
    log(`E2E ratchet baseline not found: ${baselineFile}. Run with ${UPDATE_FLAG} to create it.`);
    return 1;
  }
  writeBaseline(totals, baselineFile, log);
  return 0;
}

/**
 * Runs the ratchet and returns the process exit code.
 * @param {{ update: boolean, sourceDir?: string, baselineFile?: string, log?: (message: string) => void }} options
 * @returns {number} 0 when the counts did not grow, 1 otherwise.
 */
export function run({ update, sourceDir = SOURCE_DIR, baselineFile = BASELINE_FILE, log = console.log }) {
  const files = listSourceFiles(sourceDir).map((path) => ({
    path: relative(ROOT_DIR, path),
    source: readFileSync(path, "utf8"),
  }));
  const { totals, byFile } = countAll(files);
  if (!existsSync(baselineFile)) {
    return createBaseline({ update, totals, baselineFile, log });
  }
  const baseline = JSON.parse(readFileSync(baselineFile, "utf8"));
  const { increased, decreased } = compareWithBaseline(totals, baseline);

  if (increased.length > 0) {
    log(formatIncreases(increased, byFile));
    log("E2E ratchet failed: counts may only go down. See playwright-tests/CLAUDE.md.");
    return 1;
  }
  if (update) {
    writeBaseline(totals, baselineFile, log);
    return 0;
  }
  for (const { rule, baseline: before, actual } of decreased) {
    log(`↓ ${rule}: ${actual} (baseline ${before}) — run "pnpm check:e2e --update" to lock it in`);
  }
  log("E2E ratchet passed.");
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = run({ update: process.argv.includes(UPDATE_FLAG) });
}

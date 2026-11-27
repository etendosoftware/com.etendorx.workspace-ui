// Tells the Playwright pipeline whether a PR changes performance-sensitive code (sensitive-paths.txt), before
// it posts a "Performance" status: a PR that changes none gets no check at all (ETP-6295).
//   BASE_REF=origin/main node perf/sensitive-check.mjs
// Exit code: 0 = sensitive files changed, 10 = none, 2 = cannot tell (no base branch, not a checkout).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mergeBaseOrTip } from "./base.mjs";
import { readSensitivePatterns, sensitiveChanges } from "./sensitive.mjs";

export const EXIT = { SENSITIVE: 0, UNKNOWN: 2, NONE: 10 };
const SHOWN_FILES = 15;

/** Exit code for the pipeline, logging the sensitive files changed against `baseRef`. */
export function checkSensitive({ git, baseRef, patterns, log = console.log }) {
  try {
    const { baseSha, baseIsTip } = mergeBaseOrTip(git, baseRef);
    const files = sensitiveChanges({ git, base: baseSha, patterns });
    const against = baseIsTip ? `the tip of ${baseRef}` : baseRef;
    if (files.length === 0) {
      log(`No performance-sensitive file changed against ${against}.`);
      return EXIT.NONE;
    }
    log(`${files.length} performance-sensitive file(s) changed against ${against}:`);
    for (const file of files.slice(0, SHOWN_FILES)) log(`  ${file}`);
    return EXIT.SENSITIVE;
  } catch (error) {
    log(`Cannot compare with ${baseRef}: ${String(error.message).split("\n")[0]}`);
    return EXIT.UNKNOWN;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  process.exitCode = checkSensitive({ git, baseRef: process.env.BASE_REF, patterns: readSensitivePatterns() });
}

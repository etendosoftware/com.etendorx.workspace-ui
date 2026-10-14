// Pre-push warning: lists the files of this branch that can affect UI performance and asks to run
// `pnpm perf:compare` before opening the PR. Never blocks the push (always exits 0).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchSensitive, parsePatterns } from "./sensitive.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

export const defaultBaseRef = (branch) => (branch.startsWith("hotfix/") ? "origin/main" : "origin/develop");

try {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const target = process.env.BASE_REF || defaultBaseRef(branch);
  const base = git("merge-base", "HEAD", target);
  const changed = git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const patterns = parsePatterns(fs.readFileSync(path.join(here, "sensitive-paths.txt"), "utf8"));
  const sensitive = matchSensitive(changed, patterns);
  if (sensitive.length > 0) {
    const shown = sensitive.slice(0, 15).map((file) => `    ${file}`);
    if (sensitive.length > shown.length) shown.push(`    … and ${sensitive.length - shown.length} more`);
    console.log(
      [
        "",
        `⚠️  This branch changes ${sensitive.length} file(s) that can affect UI performance (vs ${target}):`,
        ...shown,
        "",
        "   Before opening the PR, compare it with its base on this machine and paste the report in the PR:",
        "     pnpm perf:compare        (needs the local Etendo backend running; see playwright-tests/perf/README.md)",
        "",
      ].join("\n")
    );
  }
} catch {
  // No base branch or not a git checkout: nothing to report.
}

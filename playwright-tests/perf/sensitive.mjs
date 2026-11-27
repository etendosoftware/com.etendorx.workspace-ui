// Paths whose changes can affect UI performance (see sensitive-paths.txt), used by the pre-push hook and by
// perf:compare to skip a run that has nothing to measure (ONLY_SENSITIVE=1, the automatic check of a PR).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATTERNS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "sensitive-paths.txt");

const DEEP_DIR = "__deep_dir__";
const DEEP_ANY = "__deep_any__";

const globToRegex = (glob) =>
  new RegExp(
    `^${glob
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replaceAll("**/", DEEP_DIR)
      .replaceAll("**", DEEP_ANY)
      .replaceAll("*", "[^/]*")
      .replaceAll(DEEP_DIR, "(?:.*/)?")
      .replaceAll(DEEP_ANY, ".*")}$`
  );

export const parsePatterns = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map(globToRegex);

const isTest = (file) => /(^|\/)__tests__\//.test(file) || /\.test\.[jt]sx?$/.test(file);

export const matchSensitive = (files, patterns) =>
  files.filter((file) => !isTest(file) && patterns.some((pattern) => pattern.test(file)));

/** The patterns of sensitive-paths.txt. */
export const readSensitivePatterns = (file = PATTERNS_FILE) => parsePatterns(fs.readFileSync(file, "utf8"));

/**
 * Files changed between `base` and HEAD that can affect UI performance.
 *
 * @param {{ git: (...args: string[]) => string, base: string, patterns: RegExp[] }} options `git` returns stdout
 */
export const sensitiveChanges = ({ git, base, patterns }) =>
  matchSensitive(git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean), patterns);

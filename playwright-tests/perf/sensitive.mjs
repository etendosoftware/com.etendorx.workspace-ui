// Paths whose changes can affect UI performance (see sensitive-paths.txt), used by the pre-push hook.

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

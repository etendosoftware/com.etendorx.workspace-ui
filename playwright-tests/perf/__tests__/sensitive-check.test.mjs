import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSensitive, EXIT } from "../sensitive-check.mjs";
import { parsePatterns } from "../sensitive.mjs";

const BASE_REF = "origin/main";
const SENSITIVE_FILE = "packages/MainUI/components/Table/index.tsx";
const patterns = parsePatterns("packages/MainUI/components/Table/**");

/** A git stub: `diff` lists `changed`; merge-base fails when `shallow`; everything fails when `broken`. */
const fakeGit =
  ({ changed = [], shallow = false, broken = false }) =>
  (...args) => {
    if (broken) throw new Error(`fatal: ambiguous argument '${BASE_REF}'\nusage…`);
    if (args[0] === "merge-base" && shallow) throw new Error("no merge base");
    if (args[0] === "diff") return changed.join("\n");
    return "abc123";
  };

/** Runs the check collecting what it logs. */
function check(gitOptions) {
  const logs = [];
  const code = checkSensitive({
    git: fakeGit(gitOptions),
    baseRef: BASE_REF,
    patterns,
    log: (line) => logs.push(line),
  });
  return { code, logs };
}

test("a branch that changes sensitive files gets the check, listing them", () => {
  const { code, logs } = check({ changed: [SENSITIVE_FILE, "docs/README.md"] });
  assert.equal(code, EXIT.SENSITIVE);
  assert.deepEqual(logs, [`1 performance-sensitive file(s) changed against ${BASE_REF}:`, `  ${SENSITIVE_FILE}`]);
});

test("a branch with no sensitive change gets no check", () => {
  const { code, logs } = check({ changed: ["docs/README.md"] });
  assert.equal(code, EXIT.NONE);
  assert.deepEqual(logs, [`No performance-sensitive file changed against ${BASE_REF}.`]);
});

test("a shallow clone is compared against the tip of the base", () => {
  const { code, logs } = check({ changed: [SENSITIVE_FILE], shallow: true });
  assert.equal(code, EXIT.SENSITIVE);
  assert.match(logs[0], /against the tip of origin\/main/);
});

test("a missing base branch cannot be told apart, with the first line of the error", () => {
  const { code, logs } = check({ broken: true });
  assert.equal(code, EXIT.UNKNOWN);
  assert.deepEqual(logs, [`Cannot compare with ${BASE_REF}: fatal: ambiguous argument '${BASE_REF}'`]);
});

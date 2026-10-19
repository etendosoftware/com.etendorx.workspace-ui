import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RULES, compareWithBaseline, countAll, countViolations, formatIncreases, listSourceFiles, run } from "../check-e2e.mjs";

const SPEC_FILE = "a.spec.ts";
const ZERO_COUNTS = Object.fromEntries(RULES.map((rule) => [rule.id, 0]));

/** Counts of a source text where only the given rules are non-zero. */
const countsWith = (overrides) => ({ ...ZERO_COUNTS, ...overrides });

/** Creates a temp e2e dir with the given files and an optional baseline; returns the paths. */
function createWorkspace(files, baseline) {
  const root = mkdtempSync(join(tmpdir(), "check-e2e-"));
  const sourceDir = join(root, "e2e");
  mkdirSync(join(sourceDir, "nested"), { recursive: true });
  for (const [name, source] of Object.entries(files)) {
    writeFileSync(join(sourceDir, name), source);
  }
  const baselineFile = join(root, "baseline.json");
  if (baseline) {
    writeFileSync(baselineFile, JSON.stringify(baseline));
  }
  return { sourceDir, baselineFile };
}

/** Runs the ratchet on a workspace, capturing the log. */
function runOn(workspace, update = false) {
  const messages = [];
  const exitCode = run({ update, ...workspace, log: (message) => messages.push(message) });
  return { exitCode, output: messages.join("\n") };
}

test("counts every rule occurrence", () => {
  const source = `
    await page.waitForTimeout(500); await page.waitForTimeout (1);
    await button.click({ force: true });
    await save.click().catch(() => null); await x.catch(async () => undefined); await y.catch(() => {});
    page.locator('[data-testid="Button__602739"]'); page.locator('[data-testid$="__761503"]');
    page.locator(".h-14 > div"); page.locator(".css-br42ok"); page.locator(".h-\\\\[625px\\\\]");
    page.locator(".rounded-2xl > :nth-child(2)"); page.locator(".MuiTypography-root");
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  `;
  assert.deepEqual(
    countViolations(source),
    countsWith({
      waitForTimeout: 2,
      forceTrue: 1,
      swallowedCatch: 3,
      hashTestId: 2,
      cssChainSelector: 5,
      nativeValueSetter: 1,
    })
  );
});

test("does not count stable ids, record ids or handled catches", () => {
  const source = `
    page.locator('[data-testid="MenuTitle__800216"]');
    page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40C3CB02EC"]');
    page.locator('[data-testid="TextInput__3374"]');
    await x.catch((error) => console.warn(error));
    await button.click({ force: false });
  `;
  assert.deepEqual(countViolations(source), ZERO_COUNTS);
});

test("sums the counts across files and keeps the per-file breakdown", () => {
  const { totals, byFile } = countAll([
    { path: SPEC_FILE, source: "waitForTimeout(1); waitForTimeout(2);" },
    { path: "b.spec.ts", source: "waitForTimeout(3); { force: true }" },
  ]);
  assert.deepEqual(totals, countsWith({ waitForTimeout: 3, forceTrue: 1 }));
  assert.equal(byFile[SPEC_FILE].waitForTimeout, 2);
});

test("classifies increases and decreases, treating missing baseline rules as 0", () => {
  const { increased, decreased } = compareWithBaseline(countsWith({ waitForTimeout: 5, forceTrue: 1 }), {
    waitForTimeout: 6,
  });
  assert.deepEqual(increased, [{ rule: "forceTrue", baseline: 0, actual: 1 }]);
  assert.deepEqual(decreased, [{ rule: "waitForTimeout", baseline: 6, actual: 5 }]);
});

test("the failure report names the rule, its hint and the offending files", () => {
  const report = formatIncreases([{ rule: "forceTrue", baseline: 0, actual: 1 }], {
    [SPEC_FILE]: countsWith({ forceTrue: 1 }),
    "clean.spec.ts": ZERO_COUNTS,
  });
  assert.match(report, /✗ forceTrue: 1 \(baseline 0\) — force: true skips actionability checks/);
  assert.match(report, /a\.spec\.ts: 1/);
  assert.doesNotMatch(report, /clean\.spec\.ts/);
});

test("lists only TypeScript sources, recursively and sorted", () => {
  const { sourceDir } = createWorkspace({ "b.ts": "", "nested/a.ts": "", "notes.md": "" });
  assert.deepEqual(listSourceFiles(sourceDir), [join(sourceDir, "b.ts"), join(sourceDir, "nested", "a.ts")]);
});

test("passes when counts stay at the baseline and reports decreases", () => {
  const workspace = createWorkspace({ [SPEC_FILE]: "waitForTimeout(1);" }, countsWith({ waitForTimeout: 2 }));
  const { exitCode, output } = runOn(workspace);
  assert.equal(exitCode, 0);
  assert.match(output, /↓ waitForTimeout: 1 \(baseline 2\)/);
  assert.match(output, /E2E ratchet passed/);
});

test("fails when a count goes above the baseline, even with --update", () => {
  const workspace = createWorkspace({ [SPEC_FILE]: "waitForTimeout(1);" }, ZERO_COUNTS);
  for (const update of [false, true]) {
    const { exitCode, output } = runOn(workspace, update);
    assert.equal(exitCode, 1);
    assert.match(output, /E2E ratchet failed/);
  }
  assert.deepEqual(JSON.parse(readFileSync(workspace.baselineFile, "utf8")), ZERO_COUNTS);
});

test("--update lowers the baseline to the current counts", () => {
  const workspace = createWorkspace({ [SPEC_FILE]: "waitForTimeout(1);" }, countsWith({ waitForTimeout: 4 }));
  assert.equal(runOn(workspace, true).exitCode, 0);
  assert.deepEqual(JSON.parse(readFileSync(workspace.baselineFile, "utf8")), countsWith({ waitForTimeout: 1 }));
});

test("a missing baseline fails without --update and is created with it", () => {
  const workspace = createWorkspace({ [SPEC_FILE]: "{ force: true }" });
  const missing = runOn(workspace);
  assert.equal(missing.exitCode, 1);
  assert.match(missing.output, /baseline not found/);
  assert.equal(runOn(workspace, true).exitCode, 0);
  assert.deepEqual(JSON.parse(readFileSync(workspace.baselineFile, "utf8")), countsWith({ forceTrue: 1 }));
});

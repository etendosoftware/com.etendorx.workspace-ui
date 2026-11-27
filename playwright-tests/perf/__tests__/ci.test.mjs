import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildCiResult,
  CI_STATUS,
  errorReason,
  errorResult,
  PerfStepError,
  runStep,
  safeDescription,
  statusDescription,
  writeResult,
} from "../ci.mjs";

const REPORT = "/tmp/report.md";
const REGRESSION = { flow: "Sales Invoice / open-cold", metric: "apiRequests" };

test("buildCiResult passes without regressions and fails with them", () => {
  assert.deepEqual(buildCiResult({ regressions: [], noiseWarnings: [], report: REPORT }), {
    status: CI_STATUS.PASS,
    regressions: 0,
    noisy: false,
    report: REPORT,
  });
  assert.deepEqual(buildCiResult({ regressions: [REGRESSION, REGRESSION], noiseWarnings: ["busy"], report: REPORT }), {
    status: CI_STATUS.REGRESSION,
    regressions: 2,
    noisy: true,
    report: REPORT,
  });
});

test("runStep returns the value and names the step that failed", async () => {
  assert.equal(await runStep("base build", () => 42), 42);
  assert.equal(await runStep("base server", async () => "ok"), "ok");
  await assert.rejects(
    runStep("base build", () => {
      throw new Error("pnpm build exited with 1\nstack…");
    }),
    (error) => error instanceof PerfStepError && error.step === "base build"
  );
});

test("errorReason names the step and keeps only the first line", () => {
  assert.equal(errorReason(new PerfStepError("base build", new Error("exit 1\nmore"))), "base build failed: exit 1");
  assert.equal(errorReason(new Error("Base ref origin/main not found.")), "Base ref origin/main not found.");
  assert.equal(errorReason("plain"), "plain");
});

test("statusDescription tells a pass, a regression and a run that could not measure apart", () => {
  assert.equal(statusDescription({ status: CI_STATUS.PASS, noisy: false }), "No regressions against the base");
  assert.equal(
    statusDescription({ status: CI_STATUS.PASS, noisy: true }),
    "No regressions against the base (busy machine, see the report)"
  );
  assert.equal(
    statusDescription({ status: CI_STATUS.REGRESSION, regressions: 3, noisy: false }),
    "3 regression(s) against the base, see the PR comment"
  );
  assert.equal(statusDescription(errorResult("base build failed: exit 1")), "Could not run: base build failed: exit 1");
});

test("safeDescription removes what a shell argument or JSON cannot carry and fits GitHub's limit", () => {
  assert.equal(safeDescription(`a "quoted" $HOME \`cmd\` back\\slash\nnext`), "a quoted HOME cmd back slash next");
  assert.equal(safeDescription("x".repeat(200)).length, 140);
});

test("writeResult writes the result with its description, and nothing without a file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-ci-"));
  const file = path.join(dir, "nested", "result.json");
  writeResult(file, errorResult("head server failed: port 3202 in use"));
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), {
    status: CI_STATUS.ERROR,
    reason: "head server failed: port 3202 in use",
    description: "Could not run: head server failed: port 3202 in use",
  });
  writeResult("", errorResult("ignored"));
  fs.rmSync(dir, { recursive: true });
});

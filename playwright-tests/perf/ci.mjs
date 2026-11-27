// The outcome of a perf:compare run for the automatic "Performance" check of a PR (ETP-6295). The pipeline
// reads RESULT_FILE to set the GitHub status, so a run that could not measure says so instead of looking like
// a pass or a regression. See README.md ("Automatic check on PRs").
import fs from "node:fs";
import path from "node:path";

export const CI_STATUS = {
  PASS: "pass",
  REGRESSION: "regression",
  ERROR: "error",
};

/** GitHub limits a commit status description to 140 characters. */
const MAX_DESCRIPTION = 140;
/** Characters the pipeline cannot pass safely through a shell argument or a JSON payload. */
const UNSAFE_DESCRIPTION_CHARS = /["'`$\\\n\r\t]/g;

/** A step of the run that failed, so the result names what could not be done ("base build", "servers"). */
export class PerfStepError extends Error {
  constructor(step, cause) {
    super(cause?.message ?? String(cause));
    this.name = "PerfStepError";
    this.step = step;
  }
}

/** Runs `fn` and tags its failure with the step name. */
export async function runStep(step, fn) {
  try {
    return await fn();
  } catch (error) {
    throw new PerfStepError(step, error);
  }
}

/** Short reason of a failed run: the step that failed and the first line of its error. */
export function errorReason(error) {
  const message = String(error?.message ?? error).split("\n")[0];
  if (error instanceof PerfStepError) return `${error.step} failed: ${message}`;
  return message;
}

/** Result of a run that compared both builds. */
export function buildCiResult({ regressions, noiseWarnings, report }) {
  const status = regressions.length > 0 ? CI_STATUS.REGRESSION : CI_STATUS.PASS;
  return { status, regressions: regressions.length, noisy: noiseWarnings.length > 0, report };
}

export const errorResult = (reason) => ({ status: CI_STATUS.ERROR, reason });

/** A description safe for a GitHub commit status and for the shell command that posts it. */
export const safeDescription = (text) =>
  text.replace(UNSAFE_DESCRIPTION_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION);

/** The text of the "Performance" commit status for a result. */
export function statusDescription(result) {
  const noisy = result.noisy ? " (busy machine, see the report)" : "";
  if (result.status === CI_STATUS.REGRESSION) {
    return safeDescription(`${result.regressions} regression(s) against the base, see the PR comment${noisy}`);
  }
  if (result.status === CI_STATUS.PASS) return safeDescription(`No regressions against the base${noisy}`);
  return safeDescription(`Could not run: ${result.reason}`);
}

/** Writes the result, with its status description, where the pipeline reads it; nothing when `file` is empty. */
export function writeResult(file, result) {
  if (!file) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ ...result, description: statusDescription(result) }, null, 2));
}

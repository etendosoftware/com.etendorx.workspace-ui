import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CI_STATUS, errorResult } from "../ci.mjs";
import { COMMENT_MARKER, commentBody, findMarkedComment, main, readRun, upsertComment } from "../pr-comment.mjs";

const TOKEN = "secret-token";
const REPO = "owner/repo";
const PR = "12";
const BODY = `${COMMENT_MARKER}\nreport`;
const BUILD_URL = "https://jenkins.example/job/1/";
const REPORT = "## Performance comparison\n\n**No regressions**";

/**
 * A fetch stub answering the GitHub API: `pages` are the comment pages of the PR. Records every call.
 * `status` makes every answer fail with that HTTP status.
 */
function fakeGitHub({ pages = [[]], status = 200 } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body && JSON.parse(init.body) });
    const page = Number(new URL(url).searchParams.get("page") || 1);
    const json = init.method === "GET" ? (pages[page - 1] ?? []) : {};
    return { ok: status < 400, status, json: async () => json };
  };
  return { fetchFn, calls };
}

const comment = (id, body) => ({ id, body });

/** Writes a result (and optionally a report) the way perf:compare does, in a temporary folder. */
function writeRun(result, report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-comment-"));
  const reportFile = path.join(dir, "report.md");
  if (report) fs.writeFileSync(reportFile, report);
  const resultFile = path.join(dir, "result.json");
  fs.writeFileSync(resultFile, JSON.stringify({ ...result, report: reportFile }));
  return { dir, resultFile, reportFile };
}

test("findMarkedComment finds the comment of an earlier run by its marker", () => {
  const marked = comment(2, BODY);
  assert.equal(findMarkedComment([comment(1, "LGTM"), comment(3, null), marked]), marked);
  assert.equal(findMarkedComment([comment(1, "LGTM")]), undefined);
});

test("commentBody carries the report, or says the check could not run", () => {
  const passed = commentBody({ result: { status: CI_STATUS.PASS }, report: REPORT, buildUrl: BUILD_URL });
  assert.ok(passed.startsWith(COMMENT_MARKER));
  assert.ok(passed.includes(REPORT));
  assert.ok(passed.includes(`[Jenkins build](${BUILD_URL})`));
  assert.ok(passed.includes("not required to merge"));

  const failed = commentBody({ result: errorResult("base build failed: exit 1"), report: "" });
  assert.ok(failed.includes("**The check could not run:** base build failed: exit 1"));
  assert.ok(failed.includes("neither a pass nor a regression"));
  assert.ok(!failed.includes("Jenkins build"));
});

test("upsertComment adds the comment when the PR has none", async () => {
  const github = fakeGitHub({ pages: [[comment(1, "LGTM")]] });
  assert.equal(
    await upsertComment({ fetchFn: github.fetchFn, token: TOKEN, repo: REPO, prNumber: PR, body: BODY }),
    "created"
  );
  const post = github.calls.at(-1);
  assert.equal(post.method, "POST");
  assert.equal(post.url, `https://api.github.com/repos/${REPO}/issues/${PR}/comments`);
  assert.deepEqual(post.body, { body: BODY });
  assert.equal(post.headers.Authorization, `token ${TOKEN}`);
});

test("upsertComment updates the comment of an earlier run, looking through every page", async () => {
  const firstPage = Array.from({ length: 100 }, (_, i) => comment(i, "other"));
  const github = fakeGitHub({ pages: [firstPage, [comment(777, BODY)]] });
  assert.equal(
    await upsertComment({ fetchFn: github.fetchFn, token: TOKEN, repo: REPO, prNumber: PR, body: BODY }),
    "updated"
  );
  assert.deepEqual(
    github.calls.map((call) => call.method),
    ["GET", "GET", "PATCH"]
  );
  assert.equal(github.calls[2].url, `https://api.github.com/repos/${REPO}/issues/comments/777`);
});

test("a GitHub error names the request and its status, never the token", async () => {
  const github = fakeGitHub({ status: 403 });
  await assert.rejects(
    upsertComment({ fetchFn: github.fetchFn, token: TOKEN, repo: REPO, prNumber: PR, body: BODY }),
    (error) => error.message.includes("answered 403") && !error.message.includes(TOKEN)
  );
});

test("readRun reads the result and the report, which a failed run does not have", () => {
  const run = writeRun({ status: CI_STATUS.PASS }, REPORT);
  assert.equal(readRun({ resultFile: run.resultFile }).report, REPORT);
  const failed = writeRun(errorResult("x"));
  assert.equal(readRun({ resultFile: failed.resultFile }).report, "");
  for (const { dir } of [run, failed]) fs.rmSync(dir, { recursive: true });
});

test("main comments the run with its report", async () => {
  const logs = [];
  const run = writeRun({ status: CI_STATUS.REGRESSION, regressions: 1 }, REPORT);
  const github = fakeGitHub();
  const env = { RESULT_FILE: run.resultFile, GITHUB_TOKEN: TOKEN, GITHUB_REPOSITORY: REPO, PR_NUMBER: PR, BUILD_URL };
  assert.equal(await main({ env, fetchFn: github.fetchFn, log: (line) => logs.push(line) }), "created");
  assert.ok(github.calls.at(-1).body.body.includes(REPORT));
  assert.deepEqual(logs, ["[perf:comment] PR comment created."]);
  fs.rmSync(run.dir, { recursive: true });
});

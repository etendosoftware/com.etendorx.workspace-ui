// Publishes the report of the automatic "Performance" check (ETP-6295) as a comment of the PR, updating the
// same comment on every run instead of adding a new one. Run by the Playwright pipeline after perf:compare:
//   GITHUB_TOKEN=… GITHUB_REPOSITORY=owner/repo PR_NUMBER=12 RESULT_FILE=… [REPORT_FILE=…] [BUILD_URL=…] \
//     node perf/pr-comment.mjs
// The token is only sent in the Authorization header, never printed.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { CI_STATUS } from "./ci.mjs";

export const COMMENT_MARKER = "<!-- perf-compare-ci -->";
const API = "https://api.github.com";
const PAGE_SIZE = 100;
const USER_AGENT = "perf-compare-ci";

/** The comment written by an earlier run, found by its marker. */
export const findMarkedComment = (comments) => comments.find((comment) => comment.body?.includes(COMMENT_MARKER));

/** Body of the comment: the report, or why the check could not run, and the build that measured it. */
export function commentBody({ result, report, buildUrl }) {
  const lines = [COMMENT_MARKER];
  if (result.status === CI_STATUS.ERROR) {
    lines.push("## Performance comparison", "", `**The check could not run:** ${result.reason}`, "");
    lines.push("This is neither a pass nor a regression: run `pnpm perf:compare` locally if the change needs it.");
  } else {
    lines.push(report);
  }
  lines.push("", "---");
  const build = buildUrl ? ` [Jenkins build](${buildUrl}).` : "";
  lines.push(`Automatic check, not required to merge.${build} Updated on every push.`);
  return lines.join("\n");
}

/** Calls the GitHub REST API; fails with the HTTP status, never with the token. */
async function github({ fetchFn, token, method = "GET", url, body }) {
  const response = await fetchFn(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": USER_AGENT,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`GitHub ${method} ${new URL(url).pathname} answered ${response.status}`);
  return response.json();
}

/** Every comment of the PR (the API pages them). */
async function listComments({ fetchFn, token, repo, prNumber }) {
  const comments = [];
  for (let page = 1; ; page++) {
    const url = `${API}/repos/${repo}/issues/${prNumber}/comments?per_page=${PAGE_SIZE}&page=${page}`;
    const batch = await github({ fetchFn, token, url });
    comments.push(...batch);
    if (batch.length < PAGE_SIZE) return comments;
  }
}

/**
 * Updates the comment of an earlier run, or adds it when there is none.
 *
 * @returns {Promise<"updated" | "created">}
 */
export async function upsertComment({ fetchFn = fetch, token, repo, prNumber, body }) {
  const existing = findMarkedComment(await listComments({ fetchFn, token, repo, prNumber }));
  if (existing) {
    await github({
      fetchFn,
      token,
      method: "PATCH",
      url: `${API}/repos/${repo}/issues/comments/${existing.id}`,
      body: { body },
    });
    return "updated";
  }
  await github({
    fetchFn,
    token,
    method: "POST",
    url: `${API}/repos/${repo}/issues/${prNumber}/comments`,
    body: { body },
  });
  return "created";
}

/** Reads the result and the report the run wrote; the report is optional (a run that failed has none). */
export function readRun({ resultFile, reportFile }) {
  const result = JSON.parse(fs.readFileSync(resultFile, "utf8"));
  const file = reportFile || result.report;
  const report = file && fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  return { result, report };
}

/** Comments the run on the PR; returns whether the comment was "created" or "updated". */
export async function main({ env = process.env, fetchFn = fetch, log = console.log } = {}) {
  const { result, report } = readRun({ resultFile: env.RESULT_FILE, reportFile: env.REPORT_FILE });
  const body = commentBody({ result, report, buildUrl: env.BUILD_URL });
  const action = await upsertComment({
    fetchFn,
    token: env.GITHUB_TOKEN,
    repo: env.GITHUB_REPOSITORY,
    prNumber: env.PR_NUMBER,
    body,
  });
  log(`[perf:comment] PR comment ${action}.`);
  return action;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[perf:comment] ${error.message}`);
    process.exit(1);
  });
}

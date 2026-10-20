/**
 * Fails when the coverage of the analysis this run uploaded to SonarQube is lower than the
 * latest coverage of the branch it merges into.
 *
 * Environment:
 *   SONAR_HOST_URL, SONAR_TOKEN  SonarQube server and API token
 *   GITHUB_TOKEN                 Token used to look up the open pull request of the branch
 *   GITHUB_REPOSITORY            owner/repo
 *   BRANCH                       Branch analyzed by this run
 *   MAIN_BRANCH                  Fallback branch to compare with (default: main)
 *   GITHUB_BASE_REF              Target branch, set by GitHub on pull_request events
 */
const fs = require("node:fs");

const COVERAGE_METRIC = "coverage";
const HISTORY_PAGE_SIZE = 100;
const HISTORY_PAGES_TO_SCAN = 2;
const REPORT_TASK_FILE = ".scannerwork/report-task.txt";
const SONAR_PROPERTIES_FILE = "sonar-project.properties";
const TASK_TIMEOUT_SECONDS = 15 * 60;
const TASK_POLL_SECONDS = 10;
const TASK_MAX_CONSECUTIVE_ERRORS = 6;
const REQUEST_TIMEOUT_MS = 30 * 1000;

const { SONAR_TOKEN, GITHUB_TOKEN, GITHUB_REPOSITORY, BRANCH, GITHUB_BASE_REF } = process.env;
const MAIN_BRANCH = process.env.MAIN_BRANCH || "main";
// A trailing slash makes "//api/..." paths, which SonarQube answers with its web UI instead of the API
const SONAR_HOST_URL = (process.env.SONAR_HOST_URL || "").replace(/\/+$/, "");

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

/**
 * Calls the SonarQube web API.
 * @param {string} path API path and query, starting with /api/
 * @returns {Promise<any>} response body parsed as JSON
 */
async function sonarGet(path) {
  const response = await fetch(`${SONAR_HOST_URL}${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${SONAR_TOKEN}:`).toString("base64")}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} returned ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`GET ${path} returned ${contentType || "no content type"} instead of JSON, check SONAR_HOST_URL`);
  }
  return response.json();
}

/**
 * Reads a key from sonar-project.properties.
 * @param {string} key Property name
 * @returns {string|null} its value
 */
function readSonarProperty(key) {
  const content = fs.readFileSync(SONAR_PROPERTIES_FILE, "utf8");
  const match = content.match(new RegExp(`^${key.replace(".", "\\.")}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

/**
 * Branch the given branch merges into: the base of its open pull request, otherwise the
 * Git Police convention (feature/* and epic/* into develop, the rest into main).
 * @param {string} branch Branch name
 * @returns {Promise<string>} target branch
 */
async function resolveTargetBranch(branch) {
  if (GITHUB_BASE_REF) {
    return GITHUB_BASE_REF;
  }
  try {
    const owner = GITHUB_REPOSITORY.split("/")[0];
    const head = encodeURIComponent(`${owner}:${branch}`);
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?state=open&head=${head}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }
    const pulls = await response.json();
    if (pulls[0]?.base?.ref) {
      console.log(`Open pull request #${pulls[0].number} of ${branch} targets ${pulls[0].base.ref}`);
      return pulls[0].base.ref;
    }
    console.log(`No open pull request for ${branch}`);
  } catch (e) {
    console.log(`Could not look up the pull request of ${branch}: ${e.message}`);
  }
  return branch.startsWith("feature/") || branch.startsWith("epic/") ? "develop" : MAIN_BRANCH;
}

/**
 * Waits until SonarQube has processed the analysis this run uploaded. The scanner only
 * uploads the report; the server processes it in a background task whose id it writes to
 * report-task.txt.
 * @returns {Promise<string>} id of the analysis the task created
 */
async function waitForAnalysis() {
  if (!fs.existsSync(REPORT_TASK_FILE)) {
    throw new Error(`SonarQube report task file not found: ${REPORT_TASK_FILE}`);
  }
  const taskId = fs.readFileSync(REPORT_TASK_FILE, "utf8").match(/^ceTaskId=(\S+)\s*$/m)?.[1];
  if (!taskId) {
    throw new Error(`No ceTaskId in ${REPORT_TASK_FILE}`);
  }

  let consecutiveErrors = 0;
  for (let waited = 0; waited < TASK_TIMEOUT_SECONDS; waited += TASK_POLL_SECONDS) {
    let status = "UNKNOWN";
    try {
      const { task } = await sonarGet(`/api/ce/task?id=${taskId}`);
      status = task?.status ?? "UNKNOWN";
      consecutiveErrors = 0;
      if (status === "SUCCESS") {
        console.log(`✅ SonarQube processed task ${taskId}: analysis ${task.analysisId}`);
        return task.analysisId;
      }
    } catch (e) {
      console.log(`⚠️ Could not read SonarQube task ${taskId}: ${e.message}`);
      consecutiveErrors++;
      if (consecutiveErrors >= TASK_MAX_CONSECUTIVE_ERRORS) {
        throw new Error(
          `Could not read SonarQube task ${taskId} in ${consecutiveErrors} attempts in a row: ${e.message}`
        );
      }
    }
    if (status === "FAILED" || status === "CANCELED") {
      throw new Error(`SonarQube task ${taskId} ended with status ${status}`);
    }
    console.log(`⏳ SonarQube task ${taskId} is ${status} after ${waited} seconds, checking again...`);
    await sleep(TASK_POLL_SECONDS);
  }
  throw new Error(`SonarQube task ${taskId} did not finish in ${TASK_TIMEOUT_SECONDS / 60} minutes`);
}

/**
 * Coverage of one analysis of a branch.
 * @param {string} projectKey SonarQube project key
 * @param {string} branch Branch name
 * @param {string} analysisId Analysis returned by waitForAnalysis
 * @returns {Promise<number>} coverage percentage
 */
async function getAnalysisCoverage(projectKey, branch, analysisId) {
  const encodedBranch = encodeURIComponent(branch);
  const { analyses = [] } = await sonarGet(
    `/api/project_analyses/search?project=${projectKey}&branch=${encodedBranch}&ps=20`
  );
  const analysis = analyses.find((a) => a.key === analysisId);
  if (!analysis) {
    throw new Error(`Analysis ${analysisId} not found among the latest analyses of branch '${branch}'`);
  }

  const { measures = [] } = await sonarGet(
    `/api/measures/search_history?component=${projectKey}&branch=${encodedBranch}&metrics=${COVERAGE_METRIC}&from=${encodeURIComponent(analysis.date)}`
  );
  const history = measures.find((m) => m.metric === COVERAGE_METRIC)?.history ?? [];
  const value = history.find((h) => h.date === analysis.date)?.value;
  if (!value) {
    throw new Error(`Analysis ${analysisId} of branch '${branch}' (${analysis.date}) has no coverage`);
  }
  console.log(`📊 Coverage of '${branch}' at ${analysis.date} (revision ${analysis.revision ?? "N/A"}): ${value}%`);
  return Number.parseFloat(value);
}

/**
 * Latest coverage of a branch measured with a coverage report. Analyses without a report
 * (coverage missing or 0) are skipped.
 * @param {string} projectKey SonarQube project key
 * @param {string} branch Branch name
 * @returns {Promise<number|null>} coverage percentage, or null when the branch has none
 */
async function getLatestCoverage(projectKey, branch) {
  const historyPath = `/api/measures/search_history?component=${projectKey}&branch=${encodeURIComponent(branch)}&metrics=${COVERAGE_METRIC}`;
  try {
    // The history is sorted from oldest to newest: read its last pages.
    const total = (await sonarGet(`${historyPath}&ps=1`)).paging?.total ?? 0;
    const lastPage = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
    for (let page = lastPage; page >= 1 && page > lastPage - HISTORY_PAGES_TO_SCAN; page--) {
      const { measures = [] } = await sonarGet(`${historyPath}&ps=${HISTORY_PAGE_SIZE}&p=${page}`);
      const history = measures.find((m) => m.metric === COVERAGE_METRIC)?.history ?? [];
      for (let i = history.length - 1; i >= 0; i--) {
        const value = Number.parseFloat(history[i].value);
        if (value > 0) {
          console.log(`📊 Latest coverage of '${branch}' (${history[i].date}): ${value}%`);
          return value;
        }
      }
    }
    console.log(
      `⚠️ No analysis of '${branch}' with coverage among its latest ${HISTORY_PAGE_SIZE * HISTORY_PAGES_TO_SCAN}`
    );
  } catch (e) {
    console.log(`⚠️ Could not read the coverage history of '${branch}': ${e.message}`);
  }
  return null;
}

async function main() {
  const projectKey = readSonarProperty("sonar.projectKey");
  console.log(`SonarQube project key: ${projectKey}`);
  console.log(`Project URL: ${SONAR_HOST_URL}/dashboard?id=${projectKey}&branch=${encodeURIComponent(BRANCH)}`);

  const targetBranch = await resolveTargetBranch(BRANCH);
  console.log(`Target branch: ${targetBranch}`);
  if (targetBranch === BRANCH) {
    console.log(`${BRANCH} is its own target, nothing to compare`);
    return;
  }

  const analysisId = await waitForAnalysis();
  const coverageCurrent = await getAnalysisCoverage(projectKey, BRANCH, analysisId);

  let comparedBranch = targetBranch;
  let coverageTarget = await getLatestCoverage(projectKey, targetBranch);
  if (coverageTarget === null && targetBranch !== MAIN_BRANCH) {
    console.log(`No coverage measured for ${targetBranch}, comparing with ${MAIN_BRANCH}`);
    comparedBranch = MAIN_BRANCH;
    coverageTarget = await getLatestCoverage(projectKey, MAIN_BRANCH);
  }
  if (coverageTarget === null) {
    console.log(`No coverage measured for ${comparedBranch}, the coverage cannot be lower`);
    coverageTarget = 0;
  }

  console.log(`Current branch coverage: ${coverageCurrent}%`);
  console.log(`${comparedBranch} branch coverage: ${coverageTarget}%`);
  if (coverageCurrent < coverageTarget) {
    console.log(`::error::Coverage (${coverageCurrent}%) is lower than ${comparedBranch} branch (${coverageTarget}%)`);
    process.exit(1);
  }
  console.log("✅ Coverage is OK");
}

main().catch((e) => {
  console.log(`::error::Coverage comparison failed: ${e.message}`);
  process.exit(1);
});

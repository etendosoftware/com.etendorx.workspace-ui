// utils/functions/sonarUtils.groovy

import groovy.transform.Field

@Field final String COVERAGE_METRIC = 'coverage'
@Field final int HISTORY_PAGE_SIZE = 100
@Field final int HISTORY_PAGES_TO_SCAN = 2

/**
 * Rethrows a build abort or a timeout instead of treating it as a failed request.
 * @param e Exception caught around a request
 * @throws e when it interrupts the build
 */
def rethrowIfInterrupted(Exception e) {
  if (e instanceof org.jenkinsci.plugins.workflow.steps.FlowInterruptedException || e instanceof InterruptedException) {
    throw e
  }
}

/**
 * Calls the SonarQube web API.
 * @param path API path and query, starting with /api/
 * @param sonarToken SonarQube API token
 * @param sonarServer SonarQube server URL
 * @return response body parsed as JSON
 * @throws error if the request fails (network error or HTTP status >= 400)
 */
def sonarGet(path, sonarToken, sonarServer) {
  def response = sh(
    script: "curl -sS -f -u ${sonarToken}: \"${sonarServer}${path}\"",
    returnStdout: true
  ).trim()
  return readJSON(text: response)
}

/**
 * Reads the background task id from the report-task.txt written by sonar-scanner.
 * @param content Content of report-task.txt
 * @return the ceTaskId value, or null when the file has none
 */
@NonCPS
def extractTaskId(String content) {
  def match = content =~ /(?m)^ceTaskId=(\S+)\s*$/
  return match.find() ? match.group(1) : null
}

/**
 * Waits until SonarQube has processed the analysis this build uploaded. sonar-scanner only
 * uploads the report; the server processes it in a background task whose id it writes to
 * report-task.txt. Polling that task ends as soon as the analysis exists.
 * @param reportTaskFile Path of the report-task.txt written by sonar-scanner
 * @param sonarToken SonarQube API token
 * @param sonarServer SonarQube server URL
 * @param timeoutMinutes Maximum time to wait for the task
 * @param pollSeconds Time between two checks of the task
 * @return id of the analysis the task created
 * @throws error if the file has no task id, or the task fails, is canceled or does not end in time
 */
def waitForAnalysis(reportTaskFile, sonarToken, sonarServer, int timeoutMinutes = 15, int pollSeconds = 10) {
  if (!fileExists(reportTaskFile)) {
    error("SonarQube report task file not found: ${reportTaskFile}")
  }
  def taskId = extractTaskId(readFile(reportTaskFile))
  if (!taskId) {
    error("No ceTaskId in ${reportTaskFile}")
  }

  int timeoutSeconds = timeoutMinutes * 60
  for (int waited = 0; waited < timeoutSeconds; waited += pollSeconds) {
    def status = 'UNKNOWN'
    try {
      def task = sonarGet("/api/ce/task?id=${taskId}", sonarToken, sonarServer).task
      status = task?.status ?: 'UNKNOWN'
      if (status == 'SUCCESS') {
        echo "✅ SonarQube processed task ${taskId}: analysis ${task.analysisId}"
        return task.analysisId
      }
    } catch (Exception e) {
      rethrowIfInterrupted(e)
      echo "⚠️ Could not read SonarQube task ${taskId}: ${e.getMessage()}"
    }
    if (status == 'FAILED' || status == 'CANCELED') {
      error("SonarQube task ${taskId} ended with status ${status}")
    }
    echo "⏳ SonarQube task ${taskId} is ${status} after ${waited} seconds, checking again in ${pollSeconds} seconds..."
    sleep(time: pollSeconds, unit: 'SECONDS')
  }
  error("SonarQube task ${taskId} did not finish in ${timeoutMinutes} minutes")
}

/**
 * Coverage of one analysis of a branch.
 * @param branch Branch name
 * @param analysisId Analysis returned by waitForAnalysis
 * @param sonarProjectKey SonarQube project key
 * @param sonarToken SonarQube API token
 * @param sonarServer SonarQube server URL
 * @return coverage percentage
 * @throws error if the analysis or its coverage cannot be found
 */
def getAnalysisCoverage(branch, analysisId, sonarProjectKey, sonarToken, sonarServer) {
  def encodedBranch = URLEncoder.encode(branch, 'UTF-8')
  def analyses = sonarGet("/api/project_analyses/search?project=${sonarProjectKey}&branch=${encodedBranch}&ps=20", sonarToken, sonarServer).analyses ?: []
  def analysis = analyses.find { it.key == analysisId }
  if (!analysis) {
    error("Analysis ${analysisId} not found among the latest analyses of branch '${branch}'")
  }

  def encodedDate = URLEncoder.encode(analysis.date, 'UTF-8')
  def measures = sonarGet(
    "/api/measures/search_history?component=${sonarProjectKey}&branch=${encodedBranch}&metrics=${COVERAGE_METRIC}&from=${encodedDate}",
    sonarToken,
    sonarServer
  ).measures ?: []
  def history = measures.find { it.metric == COVERAGE_METRIC }?.history ?: []
  def value = history.find { it.date == analysis.date }?.value
  if (!value) {
    error("Analysis ${analysisId} of branch '${branch}' (${analysis.date}) has no coverage")
  }
  echo "📊 Coverage of '${branch}' at ${analysis.date} (revision ${analysis.revision ?: 'N/A'}): ${value}%"
  return value.toFloat()
}

/**
 * Latest coverage of a branch measured with a coverage report. Analyses without a report
 * (coverage missing or 0, e.g. the GitHub Action scan) are skipped.
 * @param branch Branch name
 * @param sonarProjectKey SonarQube project key
 * @param sonarToken SonarQube API token
 * @param sonarServer SonarQube server URL
 * @return coverage percentage, or null when the branch has no analysis with coverage
 */
def getLatestCoverage(branch, sonarProjectKey, sonarToken, sonarServer) {
  def encodedBranch = URLEncoder.encode(branch, 'UTF-8')
  def historyPath = "/api/measures/search_history?component=${sonarProjectKey}&branch=${encodedBranch}&metrics=${COVERAGE_METRIC}"
  try {
    // The history is sorted from oldest to newest: read its last pages.
    int total = sonarGet("${historyPath}&ps=1", sonarToken, sonarServer).paging?.total ?: 0
    int lastPage = 1
    while (lastPage * HISTORY_PAGE_SIZE < total) {
      lastPage++
    }
    for (int page = lastPage; page >= 1 && page > lastPage - HISTORY_PAGES_TO_SCAN; page--) {
      def measures = sonarGet("${historyPath}&ps=${HISTORY_PAGE_SIZE}&p=${page}", sonarToken, sonarServer).measures ?: []
      def history = measures.find { it.metric == COVERAGE_METRIC }?.history ?: []
      for (int i = history.size() - 1; i >= 0; i--) {
        def value = history[i].value
        if (value && value.toFloat() > 0) {
          echo "📊 Latest coverage of '${branch}' (${history[i].date}): ${value}%"
          return value.toFloat()
        }
      }
    }
    echo "⚠️ No analysis of '${branch}' with coverage among its latest ${HISTORY_PAGE_SIZE * HISTORY_PAGES_TO_SCAN}"
  } catch (Exception e) {
    rethrowIfInterrupted(e)
    echo "⚠️ Could not read the coverage history of '${branch}': ${e.getMessage()}"
  }
  return null
}

return this

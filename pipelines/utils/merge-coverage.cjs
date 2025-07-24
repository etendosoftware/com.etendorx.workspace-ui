const fs = require("fs");
const path = require("path");
const libCoverage = require("istanbul-lib-coverage");
const libReport = require("istanbul-lib-report");
const reports = require("istanbul-reports");

const coverageDirs = ["packages/MainUI/coverage", "packages/api-client/coverage", "packages/ComponentLibrary/coverage"];

const map = libCoverage.createCoverageMap({});

for (const dir of coverageDirs) {
  const file = path.join(dir, "coverage-final.json");
  if (fs.existsSync(file)) {
    console.log(`✅ Merging coverage from: ${file}`);
    const content = JSON.parse(fs.readFileSync(file, "utf8"));
    map.merge(content);
  } else {
    console.warn(`⚠️ Coverage file not found: ${file}`);
  }
}

const context = libReport.createContext({
  dir: "coverage-merged",
  coverageMap: map,
});

reports.create("lcovonly").execute(context);

console.log("✅ Merged coverage written to coverage-merged/lcov.info");

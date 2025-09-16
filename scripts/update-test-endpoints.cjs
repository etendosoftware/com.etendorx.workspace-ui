#!/usr/bin/env node

/**
 * Script to update test files with new endpoint URLs
 * This migrates from old "/meta/forward/" URLs to the new centralized endpoint pattern
 */

const fs = require('fs');
const path = require('path');

// Pattern to match old datasource URLs in tests
const OLD_URL_PATTERN = /"http:\/\/[^\/]+\/etendo\/meta\/forward\/org\.openbravo\.service\.datasource\/([^?"]+)(\?[^"]*)?"/g;

// Pattern to match SWS URLs that should use the new pattern
const SWS_URL_PATTERN = /"http:\/\/[^\/]+\/etendo\/sws\/com\.etendoerp\.metadata\.forward\/org\.openbravo\.service\.datasource\/([^?"]+)(\?[^"]*)?"/g;

function parseQueryParams(queryString) {
  const params = new URLSearchParams(queryString || '');
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

function generateNewUrlCall(entity, queryString) {
  const params = parseQueryParams(queryString);
  const operationType = params._operationType;
  
  let paramsObj = '{';
  const entries = Object.entries(params);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    paramsObj += `\n      ${key}: "${value}"`;
    if (i < entries.length - 1) paramsObj += ',';
  }
  paramsObj += '\n    }';

  if (operationType) {
    return `getExpectedDatasourceUrl("${entity}", "${operationType}", ${paramsObj})`;
  } else {
    return `getExpectedDatasourceUrl("${entity}", undefined, ${paramsObj})`;
  }
}

function updateTestFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Add import if needed and there are datasource URL patterns
  if ((OLD_URL_PATTERN.test(content) || SWS_URL_PATTERN.test(content)) && 
      !content.includes('getExpectedDatasourceUrl')) {
    
    // Find the right place to add the import
    const importLines = content.match(/^import.*$/gm) || [];
    if (importLines.length > 0) {
      const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
      const afterLastImport = lastImportIndex + importLines[importLines.length - 1].length;
      content = content.slice(0, afterLastImport) + 
        '\nimport { getExpectedDatasourceUrl } from "../../../_test-utils/endpoint-test-utils";' +
        content.slice(afterLastImport);
      hasChanges = true;
    }
  }
  
  // Reset regex state
  OLD_URL_PATTERN.lastIndex = 0;
  SWS_URL_PATTERN.lastIndex = 0;
  
  // Update old-style URLs
  content = content.replace(OLD_URL_PATTERN, (match, entity, queryString) => {
    hasChanges = true;
    return generateNewUrlCall(entity, queryString);
  });

  // Update SWS URLs to use centralized function  
  content = content.replace(SWS_URL_PATTERN, (match, entity, queryString) => {
    hasChanges = true;
    return generateNewUrlCall(entity, queryString);
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function findTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.')) {
      files.push(...findTestFiles(fullPath));
    } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const testDir = path.join(__dirname, '..', 'packages', 'MainUI', 'app', 'api');
const testFiles = findTestFiles(testDir);

console.log(`Found ${testFiles.length} test files`);

for (const file of testFiles) {
  updateTestFile(file);
}

console.log('Test endpoint migration completed!');
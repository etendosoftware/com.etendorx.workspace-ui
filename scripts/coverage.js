#!/usr/bin/env node

import { execSync } from "node:child_process";

console.log("🧪 Executing test with coverage...\n");

try {
  const command = `npx jest --coverage --collectCoverageFrom="packages/ComponentLibrary/src/**/*.{ts,tsx}" --collectCoverageFrom="packages/MainUI/src/**/*.{ts,tsx}" --collectCoverageFrom="packages/MainUI/components/**/*.{ts,tsx}" --collectCoverageFrom="packages/MainUI/hooks/**/*.{ts,tsx}" --collectCoverageFrom="packages/MainUI/contexts/**/*.{ts,tsx}" --collectCoverageFrom="packages/MainUI/utils/**/*.{ts,tsx}" --collectCoverageFrom="packages/api-client/src/**/*.{ts,tsx}" --collectCoverageFrom="!packages/*/src/**/*.d.ts" --collectCoverageFrom="!packages/*/src/**/*.stories.{ts,tsx}" --collectCoverageFrom="!packages/*/src/**/*.test.{ts,tsx}" --collectCoverageFrom="!packages/*/src/**/__tests__/**" --collectCoverageFrom="!packages/*/src/**/index.{ts,tsx}" --collectCoverageFrom="!packages/*/src/**/types.{ts,tsx}" --collectCoverageFrom="!packages/*/src/**/constants.{ts,tsx}"`;

  execSync(command, { stdio: "inherit" });

  console.log("\n✅ Coverage report generated successfully!");
  console.log("📊 Reviw HTML report in: coverage/lcov-report/index.html");
} catch (error) {
  console.error("❌ Error executing coverage:", error.message);
  process.exit(1);
}

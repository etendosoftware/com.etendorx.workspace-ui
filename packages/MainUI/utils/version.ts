import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Generates the application version string combining package.json version with git commit hash.
 *
 * This function is designed to run at build-time in Node.js environment (e.g., next.config.ts).
 * It should NOT be imported directly by client-side components.
 *
 * @returns {string} The application version in format "version - commitHash"
 */
export function generateAppVersion(): string {
  try {
    // Read package.json version from monorepo root
    // Navigate up from packages/MainUI to the project root
    const packagePath = join(process.cwd(), "..", "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
    const version = packageJson.version;

    // Get git commit hash
    let commitHash = "";
    try {
      commitHash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    } catch {
      console.warn("Could not get git commit hash, using empty string.");
    }

    return `${version}${commitHash ? ` - ${commitHash}` : ""}`;
  } catch (error) {
    console.warn("Error generating app version:", error);
    return "unknown - unknown";
  }
}

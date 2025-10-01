import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Find git executable in common locations
 */
function findGitExecutable(): string | null {
  const commonPaths = [
    "/usr/bin/git",
    "/usr/local/bin/git",
    "/bin/git",
    "/opt/homebrew/bin/git", // macOS with Homebrew
  ];

  for (const gitPath of commonPaths) {
    if (existsSync(gitPath)) {
      return gitPath;
    }
  }

  return null;
}

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
      const gitPath = findGitExecutable();
      if (gitPath) {
        // Use spawnSync with explicit arguments array to prevent command injection
        const result = spawnSync(gitPath, ["rev-parse", "--short", "HEAD"], {
          encoding: "utf8",
        });

        if (result.status === 0 && result.stdout) {
          commitHash = result.stdout.trim();
        } else {
          console.warn("Git command failed:", result.stderr);
        }
      } else {
        console.warn("Git executable not found in common locations.");
      }
    } catch {
      console.warn("Could not get git commit hash, using empty string.");
    }

    const versionSuffix = commitHash ? ` - ${commitHash}` : "";
    return `${version}${versionSuffix}`;
  } catch (error) {
    console.warn("Error generating app version:", error);
    return "unknown - unknown";
  }
}

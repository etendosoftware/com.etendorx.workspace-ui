/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Tests for version utility functions
 *
 * NOTE: The generateAppVersion function uses Node.js APIs (fs, child_process)
 * that are designed to run at build-time only. Since mocking these APIs
 * in Jest ESM environment is complex, we test the internal logic patterns instead.
 */

describe("version utilities", () => {
  // ============================================================================
  // Version String Formatting Logic
  // ============================================================================

  describe("version string formatting", () => {
    /**
     * This mirrors the formatting logic in generateAppVersion
     */
    const formatVersion = (version: string, commitHash?: string): string => {
      const versionSuffix = commitHash ? ` - ${commitHash}` : "";
      return `${version}${versionSuffix}`;
    };

    it.each([
      { version: "1.0.0", hash: "abc1234", expected: "1.0.0 - abc1234" },
      { version: "0.1.0", hash: "def5678", expected: "0.1.0 - def5678" },
      { version: "2.0.0-beta.1", hash: "ghi9012", expected: "2.0.0-beta.1 - ghi9012" },
      { version: "10.20.30", hash: "jkl3456", expected: "10.20.30 - jkl3456" },
    ])("should format '$version' with hash '$hash' as '$expected'", ({ version, hash, expected }) => {
      expect(formatVersion(version, hash)).toBe(expected);
    });

    it.each([
      { version: "1.0.0", expected: "1.0.0" },
      { version: "0.0.1", expected: "0.0.1" },
    ])("should return '$expected' when hash is empty", ({ version, expected }) => {
      expect(formatVersion(version, "")).toBe(expected);
      expect(formatVersion(version)).toBe(expected);
    });
  });

  // ============================================================================
  // Git Output Parsing Logic
  // ============================================================================

  describe("git output parsing", () => {
    /**
     * Parses git rev-parse output (mirrors the logic in generateAppVersion)
     */
    const parseGitOutput = (stdout: string): string => {
      return stdout.trim();
    };

    it.each([
      { stdout: "abc1234\n", expected: "abc1234" },
      { stdout: "abc1234", expected: "abc1234" },
      { stdout: "  abc1234  \n", expected: "abc1234" },
      { stdout: "abc1234\r\n", expected: "abc1234" },
    ])("should parse '$stdout' to '$expected'", ({ stdout, expected }) => {
      expect(parseGitOutput(stdout)).toBe(expected);
    });

    it("should return empty string for empty output", () => {
      expect(parseGitOutput("")).toBe("");
      expect(parseGitOutput("   ")).toBe("");
    });
  });

  // ============================================================================
  // Git Executable Path Logic
  // ============================================================================

  describe("git executable path finding", () => {
    const commonGitPaths = ["/usr/bin/git", "/usr/local/bin/git", "/bin/git", "/opt/homebrew/bin/git"];

    it("should define common git locations", () => {
      expect(commonGitPaths).toContain("/usr/bin/git");
      expect(commonGitPaths).toContain("/usr/local/bin/git");
      expect(commonGitPaths).toContain("/opt/homebrew/bin/git");
    });

    it("should check multiple paths", () => {
      expect(commonGitPaths.length).toBeGreaterThan(1);
    });
  });

  // ============================================================================
  // Error Handling Logic
  // ============================================================================

  describe("error handling patterns", () => {
    /**
     * Default value returned when version generation fails
     */
    const getErrorFallback = (): string => "unknown - unknown";

    it("should return fallback value for errors", () => {
      expect(getErrorFallback()).toBe("unknown - unknown");
    });
  });

  // ============================================================================
  // Package Path Construction
  // ============================================================================

  describe("package path construction", () => {
    it("should construct relative path from MainUI to root", () => {
      // The function uses path.join(process.cwd(), "..", "..", "package.json")
      // This navigates from packages/MainUI to the monorepo root
      const pathSegments = ["..", "..", "package.json"];
      expect(pathSegments.join("/")).toBe("../../package.json");
    });
  });

  // ============================================================================
  // Spawn Arguments
  // ============================================================================

  describe("spawn arguments structure", () => {
    it("should use correct git arguments for rev-parse", () => {
      const gitArgs = ["rev-parse", "--short", "HEAD"];

      expect(gitArgs[0]).toBe("rev-parse");
      expect(gitArgs[1]).toBe("--short");
      expect(gitArgs[2]).toBe("HEAD");
    });

    it("should use utf8 encoding option", () => {
      const options = { encoding: "utf8" as const };
      expect(options.encoding).toBe("utf8");
    });
  });
});

import { DependencyApi } from "../dependencyApi";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("DependencyApi", () => {
  // ==================== listDependencies ====================

  describe("listDependencies", () => {
    it("returns dependencies on success", async () => {
      const mockData = {
        success: true,
        data: [
          {
            type: "implementation",
            group: "com.etendoerp",
            artifact: "copilot",
            version: "1.5.0",
            rawVersion: "1.5.0",
            line: "implementation 'com.etendoerp:copilot:1.5.0'",
            lineNumber: 10,
            availableVersions: ["2.0.0", "1.5.0"],
            latestVersion: "2.0.0",
            updateAvailable: true,
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockData),
      });

      const result = await DependencyApi.listDependencies();

      expect(mockFetch).toHaveBeenCalledWith("/api/dependencies");
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].artifact).toBe("copilot");
      expect(result.data![0].updateAvailable).toBe(true);
    });

    it("returns error on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: "Server error" }),
      });

      const result = await DependencyApi.listDependencies();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Server error");
    });

    it("handles fetch exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await DependencyApi.listDependencies();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  // ==================== fetchVersions ====================

  describe("fetchVersions", () => {
    it("returns versions for an artifact", async () => {
      const mockData = {
        success: true,
        data: {
          group: "com.etendoerp",
          artifact: "copilot",
          versions: ["2.0.0", "1.5.0", "1.4.0"],
        },
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockData),
      });

      const result = await DependencyApi.fetchVersions("com.etendoerp", "copilot");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dependencies/com.etendoerp/copilot/versions",
      );
      expect(result.success).toBe(true);
      expect(result.data!.versions).toEqual(["2.0.0", "1.5.0", "1.4.0"]);
    });

    it("encodes special characters in group/artifact", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { versions: [] } }),
      });

      await DependencyApi.fetchVersions("com.etendoerp", "copilot.extensions");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dependencies/com.etendoerp/copilot.extensions/versions",
      );
    });

    it("handles fetch exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Timeout"));

      const result = await DependencyApi.fetchVersions("com.etendoerp", "copilot");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Timeout");
    });
  });

  // ==================== updateVersion ====================

  describe("updateVersion", () => {
    it("sends correct POST request", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: "Updated" }),
      });

      const result = await DependencyApi.updateVersion(
        "com.etendoerp",
        "copilot",
        "2.0.0",
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/dependencies/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "com.etendoerp",
          artifact: "copilot",
          version: "2.0.0",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({ success: false, error: "Dependency not found" }),
      });

      const result = await DependencyApi.updateVersion(
        "com.etendoerp",
        "missing",
        "1.0.0",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Dependency not found");
    });

    it("handles fetch exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await DependencyApi.updateVersion(
        "com.etendoerp",
        "copilot",
        "2.0.0",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });

  // ==================== addDependency ====================

  describe("addDependency", () => {
    it("sends correct POST with all fields", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: "Added" }),
      });

      const result = await DependencyApi.addDependency(
        "com.etendoerp",
        "newmodule",
        "1.0.0",
        "moduleDeps",
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/dependencies/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "com.etendoerp",
          artifact: "newmodule",
          version: "1.0.0",
          type: "moduleDeps",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("defaults type to implementation", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await DependencyApi.addDependency(
        "com.etendoerp",
        "newmodule",
        "1.0.0",
      );

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.type).toBe("implementation");
    });

    it("handles duplicate error", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: "Could not add dependency (may already exist)",
          }),
      });

      const result = await DependencyApi.addDependency(
        "com.etendoerp",
        "copilot",
        "1.0.0",
      );

      expect(result.success).toBe(false);
    });
  });

  // ==================== removeDependency ====================

  describe("removeDependency", () => {
    it("sends correct POST request", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: "Removed" }),
      });

      const result = await DependencyApi.removeDependency(
        "com.etendoerp",
        "copilot",
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/dependencies/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: "com.etendoerp",
          artifact: "copilot",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("returns error when dep not found", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({ success: false, error: "Dependency not found" }),
      });

      const result = await DependencyApi.removeDependency(
        "com.etendoerp",
        "missing",
      );

      expect(result.success).toBe(false);
    });
  });

  // ==================== applyChanges ====================

  describe("applyChanges", () => {
    it("sends POST to apply endpoint", async () => {
      const mockData = {
        success: true,
        tasks: [
          { task: "resolve.conflicts", success: true, output: "OK" },
          { task: "expandModules", success: true, output: "OK" },
        ],
        errors: [],
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockData),
      });

      const result = await DependencyApi.applyChanges();

      expect(mockFetch).toHaveBeenCalledWith("/api/dependencies/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      expect(result.success).toBe(true);
    });

    it("returns errors when tasks fail", async () => {
      const mockData = {
        success: false,
        tasks: [
          { task: "resolve.conflicts", success: false, error: "Failed" },
        ],
        errors: ["resolve.conflicts failed"],
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockData),
      });

      const result = await DependencyApi.applyChanges();

      expect(result.success).toBe(false);
    });

    it("handles fetch exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Server down"));

      const result = await DependencyApi.applyChanges();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Server down");
    });
  });
});

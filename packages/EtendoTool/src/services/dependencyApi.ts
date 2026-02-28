const API_BASE = "/api";

export interface Dependency {
  type: string;
  group: string;
  artifact: string;
  version: string;
  rawVersion: string;
  line: string;
  lineNumber: number;
  availableVersions: string[];
  latestVersion: string | null;
  updateAvailable: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AvailablePackage {
  group: string;
  artifact: string;
  name: string;
}

interface ApplyResult {
  success: boolean;
  tasks: Array<{ task: string; success: boolean; output?: string; error?: string }>;
  errors: string[];
}

export class DependencyApi {
  /**
   * List all dependencies with update info
   */
  static async listDependencies(): Promise<ApiResponse<Dependency[]>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch dependencies",
      };
    }
  }

  /**
   * Fetch all available packages from GitHub Packages API
   */
  static async fetchAvailablePackages(): Promise<ApiResponse<AvailablePackage[]>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies/available`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch available packages",
      };
    }
  }

  /**
   * Fetch available versions for a specific dependency
   */
  static async fetchVersions(
    group: string,
    artifact: string,
  ): Promise<ApiResponse<{ group: string; artifact: string; versions: string[] }>> {
    try {
      const response = await fetch(
        `${API_BASE}/dependencies/${encodeURIComponent(group)}/${encodeURIComponent(artifact)}/versions`,
      );
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch versions",
      };
    }
  }

  /**
   * Update a dependency version
   */
  static async updateVersion(group: string, artifact: string, version: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, artifact, version }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update dependency",
      };
    }
  }

  /**
   * Add a new dependency
   */
  static async addDependency(
    group: string,
    artifact: string,
    version: string,
    type: string = "implementation",
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, artifact, version, type }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add dependency",
      };
    }
  }

  /**
   * Remove a dependency
   */
  static async removeDependency(group: string, artifact: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, artifact }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove dependency",
      };
    }
  }

  /**
   * Apply dependency changes (resolve.conflicts + expandModules)
   */
  static async applyChanges(): Promise<ApiResponse<ApplyResult>> {
    try {
      const response = await fetch(`${API_BASE}/dependencies/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to apply changes",
      };
    }
  }
}

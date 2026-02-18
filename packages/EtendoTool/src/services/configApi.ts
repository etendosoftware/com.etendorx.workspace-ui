export interface TemplateInfo {
  name: string;
  source: string;
  properties: Record<string, string>;
  dependencies: string[];
  modules: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  validationErrors?: Record<string, string>;
  updatedKeys?: string[];
}

export interface PropertyConfig {
  key: string;
  currentValue: string;
  defaultValue: string;
  description: string;
  group?: string;
  groups?: string[];
  required?: boolean;
  sensitive?: boolean;
  source?: string;
  hasValue?: boolean;
  order?: number;
  type?: string;
  options?: string[];
  process?: boolean;
}

export interface GroupedConfigs {
  total: number;
  groups: Record<
    string,
    {
      count: number;
      properties: PropertyConfig[];
    }
  >;
}

export interface ConfigUpdate {
  configurations: Record<string, string>;
}

const API_BASE = "/api";

export class ConfigApi {
  /**
   * Get all configurations organized by groups
   */
  static async getConfigsByGroup(): Promise<ApiResponse<GroupedConfigs>> {
    try {
      console.log("[ConfigApi] Fetching grouped configs from:", `${API_BASE}/config/groups`);
      const response = await fetch(`${API_BASE}/config/groups`);
      const data = await response.json();
      console.log("[ConfigApi] Configs loaded:", data);
      return data;
    } catch (error) {
      console.error("[ConfigApi] Error fetching configs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch configurations",
      };
    }
  }

  /**
   * Get all configurations (flat structure)
   */
  static async getAllConfigs(): Promise<
    ApiResponse<{
      total: number;
      properties: PropertyConfig[];
    }>
  > {
    try {
      console.log("[ConfigApi] Fetching all configs from:", `${API_BASE}/config`);
      const response = await fetch(`${API_BASE}/config`);
      const data = await response.json();
      console.log("[ConfigApi] Configs loaded:", data);
      return data;
    } catch (error) {
      console.error("[ConfigApi] Error fetching configs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch configurations",
      };
    }
  }

  /**
   * Save configurations
   */
  static async saveConfigs(updates: Record<string, string>): Promise<ApiResponse<null>> {
    try {
      console.log("[ConfigApi] Saving configs:", updates);
      const response = await fetch(`${API_BASE}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ configurations: updates }),
      });

      const data = await response.json();
      console.log("[ConfigApi] Save response:", data);

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to save configurations",
          validationErrors: data.validationErrors,
        };
      }

      return data;
    } catch (error) {
      console.error("[ConfigApi] Error saving configs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save configurations",
      };
    }
  }

  /**
   * List available templates
   */
  static async listTemplates(): Promise<ApiResponse<{ templates: string[] }>> {
    try {
      const response = await fetch(`${API_BASE}/templates`);
      const data = await response.json();
      // Server returns {success, templates} — wrap under data for consistency
      return { success: data.success, data: { templates: data.templates ?? [] }, error: data.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch templates",
      };
    }
  }

  /**
   * Get template details by name
   */
  static async getTemplate(name: string): Promise<ApiResponse<{ template: TemplateInfo }>> {
    try {
      const response = await fetch(`${API_BASE}/templates/${encodeURIComponent(name)}`);
      const data = await response.json();
      // Server returns {success, template} — wrap under data for consistency
      return { success: data.success, data: { template: data.template }, error: data.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch template",
      };
    }
  }

  /**
   * Execute a Gradle command
   */
  static async executeCommand(command: string, args: Record<string, unknown> = {}): Promise<ApiResponse<{ output: string }>> {
    try {
      console.log("[ConfigApi] Executing command:", command, args);
      const response = await fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command, args }),
      });

      const data = await response.json();
      console.log("[ConfigApi] Command response:", data);
      return data;
    } catch (error) {
      console.error("[ConfigApi] Error executing command:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute command",
      };
    }
  }
}

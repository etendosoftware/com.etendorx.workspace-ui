const API_BASE = "/api";

export interface DeviceFlowStart {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  expiresIn: number;
  interval: number;
}

export interface DeviceFlowPollResult {
  status: "pending" | "success" | "expired" | "denied";
  token?: string;
  interval?: number;
}

export class GithubAuthApi {
  static async startDeviceFlow(): Promise<{
    success: boolean;
    data?: DeviceFlowStart;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/github/auth/start`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to start device flow",
        };
      }
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start device flow",
      };
    }
  }

  static async pollDeviceFlow(
    deviceCode: string,
  ): Promise<DeviceFlowPollResult> {
    try {
      const response = await fetch(`${API_BASE}/github/auth/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      });
      const data = await response.json();
      return data;
    } catch {
      return { status: "expired" };
    }
  }
}

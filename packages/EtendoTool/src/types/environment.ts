export type EnvironmentType = "devcontainer" | "local" | "unknown";

export interface EnvironmentInfo {
  type: EnvironmentType;
  isDevContainer: boolean;
  dockerAvailable: boolean;
  dockerRunning: boolean;
}

export interface EnvironmentResponse {
  success: boolean;
  data?: EnvironmentInfo;
  error?: string;
}

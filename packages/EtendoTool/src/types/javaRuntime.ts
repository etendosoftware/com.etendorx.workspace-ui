export type JavaRuntimeStatus = "unknown" | "installed" | "missing" | "installing";

export interface CheckCommandResponse {
  command: string;
  available: boolean;
}

export interface ExecuteCommandResponse {
  success: boolean;
  output: string;
  error?: string;
}

export interface JavaRuntimeViewState {
  status: JavaRuntimeStatus;
  available: boolean;
  output?: string;
  success?: boolean;
  lastRunAt?: string;
  lastCheckedAt?: string;
  version?: string;
  message?: string;
  skipped?: boolean;
}

import { apiRequest } from "./shared";

export interface DockerStatus {
  running: boolean;
  hasContainers: boolean;
  containers: string[];
  hasComposeFile: boolean;
}

export interface PostgresStatus {
  connected: boolean;
  host: string;
  port: string;
  sid: string;
  url: string;
  via: "local" | "docker" | "none";
}

export interface TomcatStatus {
  running: boolean;
  port: number;
  via: "local" | "docker" | "none";
  needsRestart: boolean;
}

export interface SetupStatus {
  docker: DockerStatus;
  postgres: PostgresStatus;
  tomcat: TomcatStatus;
  warnings: string[];
}

export async function fetchSetupStatus(): Promise<SetupStatus> {
  return apiRequest<SetupStatus>("/setup/status", { method: "GET" });
}

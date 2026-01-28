export type PrerequisiteStatus = "ok" | "warning" | "error" | "checking" | "unknown";

export interface PrerequisiteItem {
  id: string;
  name: string;
  status: PrerequisiteStatus;
  details: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SystemStatusState {
  java: PrerequisiteItem;
  docker: PrerequisiteItem;
  database: PrerequisiteItem;
  ports: PrerequisiteItem;
  isRefreshing: boolean;
}

export const DEFAULT_PREREQUISITES: SystemStatusState = {
  java: {
    id: "java",
    name: "Java JDK 17",
    status: "unknown",
    details: "Not checked",
  },
  docker: {
    id: "docker",
    name: "Docker Engine",
    status: "unknown",
    details: "Not checked",
  },
  database: {
    id: "database",
    name: "Database",
    status: "unknown",
    details: "Not checked",
  },
  ports: {
    id: "ports",
    name: "Port 3000",
    status: "unknown",
    details: "Not checked",
  },
  isRefreshing: false,
};

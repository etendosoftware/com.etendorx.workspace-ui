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
    details: "Sin verificar",
  },
  docker: {
    id: "docker",
    name: "Docker Engine",
    status: "unknown",
    details: "Sin verificar",
  },
  database: {
    id: "database",
    name: "Base de Datos",
    status: "unknown",
    details: "Sin verificar",
  },
  ports: {
    id: "ports",
    name: "Puerto 3000",
    status: "unknown",
    details: "Sin verificar",
  },
  isRefreshing: false,
};

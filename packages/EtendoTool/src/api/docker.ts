import { apiRequest } from "./shared";

export interface DockerResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  output?: string;
}

export interface DockerContainer {
  name?: string;
  service?: string;
  state?: string;
  status?: string;
  ports?: string;
}

const handle = async <T>(endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await apiRequest<DockerResponse<T>>(endpoint, options);
    return response;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error communicating with the Docker API",
    };
  }
};

export const dockerApi = {
  listContainers: () => handle<DockerContainer[] | string>("/docker/containers", { method: "GET" }),
  startAll: () => handle("/execute", { method: "POST", body: JSON.stringify({ command: "resources.up" }) }),
  stopAll: () => handle("/execute", { method: "POST", body: JSON.stringify({ command: "resources.stop" }) }),
  restartAll: () => handle("/execute", { method: "POST", body: JSON.stringify({ command: "resources.restart" }) }),
  pullAll: () => handle("/docker/pull", { method: "POST" }),
  removeStopped: () => handle("/execute", { method: "POST", body: JSON.stringify({ command: "resources.down" }) }),
  serviceAction: (service: string, action: "start" | "stop" | "restart") =>
    handle(`/docker/container/${service}/${action}`, { method: "POST" }),
  serviceLogs: (service: string, params = "") =>
    handle<string>(`/docker/container/${service}/logs${params ? `?${params}` : ""}`, { method: "GET" }),
};

import { apiRequest } from "./shared";
import type { EnvironmentInfo, EnvironmentResponse } from "../types/environment";

/**
 * Fetches environment information from the backend.
 * If the backend endpoint is not available, falls back to client-side detection.
 */
export async function getEnvironmentInfo(): Promise<EnvironmentResponse> {
  try {
    // Try to get environment info from backend
    const response = await apiRequest<EnvironmentResponse>("/environment", { method: "GET" });
    if (response.success && response.data) {
      return response;
    }
    // Fallback to client-side detection
    return { success: true, data: detectEnvironmentClient() };
  } catch {
    // Backend endpoint might not exist yet, use client-side detection
    return { success: true, data: detectEnvironmentClient() };
  }
}

/**
 * Client-side environment detection as fallback.
 * Checks for DevContainer indicators in the browser environment.
 */
function detectEnvironmentClient(): EnvironmentInfo {
  // Check for DevContainer-specific indicators
  // In DevContainers, certain environment variables or conditions may be present
  // We can also check if we're running on a specific hostname pattern

  const hostname = window.location.hostname;
  const isCodespaces = hostname.includes("github.dev") || hostname.includes("codespaces");

  // Check if VITE_DEVCONTAINER env var is set (can be configured in devcontainer.json)
  const viteDevContainer = import.meta.env.VITE_DEVCONTAINER === "true";

  // Check if running on localhost with specific port patterns common in DevContainers
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // If explicitly marked as DevContainer via env var, trust it
  if (viteDevContainer || isCodespaces) {
    return {
      type: "devcontainer",
      isDevContainer: true,
      dockerAvailable: true, // In DevContainer, docker-in-docker or docker-outside-of-docker is typically available
      dockerRunning: true, // Containers are already managed by DevContainer
    };
  }

  // Default to local environment
  return {
    type: isLocalhost ? "local" : "unknown",
    isDevContainer: false,
    dockerAvailable: true, // Assume docker is available, will be verified by docker API
    dockerRunning: false, // Unknown until checked
  };
}

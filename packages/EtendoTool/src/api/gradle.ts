import { apiRequest } from "./shared";

export const GRADLE_COMMANDS = {
  CHECK: "/check?command=gradle",
  INSTALL: { command: "gradle.install" },
  UPDATE_DB: { command: "gradle.update.database" },
  SMARTBUILD: { command: "gradle.smartbuild" },
} as const;

export async function checkGradle() {
  return apiRequest<{ command: string; available: boolean }>(GRADLE_COMMANDS.CHECK, { method: "GET" });
}

export async function executeGradle(command: string, args?: Record<string, string>) {
  return apiRequest<{ success: boolean; output: string; error?: string }>("/execute", {
    method: "POST",
    body: JSON.stringify({ command, args: args ?? {} }),
  });
}

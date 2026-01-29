import type { CheckCommandResponse, ExecuteCommandResponse } from "../types/javaRuntime";
import { apiRequest } from "./shared";

export async function checkJavaCommand() {
  return apiRequest<CheckCommandResponse>("/check?command=java", { method: "GET" });
}

export async function executeJavaCommand(customArgs?: Record<string, string>) {
  return apiRequest<ExecuteCommandResponse>("/execute", {
    method: "POST",
    body: JSON.stringify({ command: "java", args: customArgs ?? {} }),
  });
}

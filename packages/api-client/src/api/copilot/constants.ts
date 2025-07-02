export const COPILOT_ENDPOINTS = {
  UPLOAD_FILE: "file",
  GET_LABELS: "labels",
  SEND_QUESTION: "question",
  SEND_AQUESTION: "aquestion",
  CACHE_QUESTION: "cacheQuestion",
  GET_ASSISTANTS: "assistants",
} as const;

export const COPILOT_METHODS = {
  DELETE: "DELETE",
  GET: "GET",
  PATCH: "PATCH",
  POST: "POST",
} as const;

export const COPILOT_BASE_PATH = "/copilot/";

export const MESSAGE_ROLES = {
  USER: "user",
  BOT: "bot",
  ERROR: "error",
  TOOL: "tool",
  NODE: "node",
  WAIT: "wait",
} as const;

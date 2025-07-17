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

/**
 * Base path for copilot API endpoints
 * This will be appended to the forwarder servlet path
 */
export const COPILOT_BASE_PATH = "/copilot/";

/**
 * Message roles for copilot interactions
 */
export const MESSAGE_ROLES = {
  USER: "user",
  BOT: "bot",
  ASSISTANT: "assistant",
  ERROR: "error",
  TOOL: "tool",
  NODE: "node",
  WAIT: "wait",
} as const;

/**
 * Context-related constants
 */
export const CONTEXT_CONSTANTS = {
  TAG_START: "<Context>",
  TAG_END: "</Context>",
  MAX_ITEMS_DISPLAY: 10,
} as const;

/**
 * SSE connection configuration
 */
export const SSE_CONFIG = {
  HEARTBEAT_TIMEOUT: 12000000,
  RETRY_INTERVAL: 1000,
} as const;

/**
 * File upload configuration
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "text/plain",
    "text/csv",
    "application/json",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const;

/**
 * Question caching threshold
 */
export const CACHE_THRESHOLD = 7000;

/**
 * Environment detection
 */
export const isDevelopment = () => process.env.NODE_ENV === "development";
export const isProduction = () => process.env.NODE_ENV === "production";

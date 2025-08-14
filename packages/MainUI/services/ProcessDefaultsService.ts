import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";

export interface ProcessDefaultsRequest {
  processId: string;
  windowId: string;
  contextData: Record<string, EntityValue>;
  requestId?: string;
}

export interface ProcessDefaultsServiceResponse {
  success: boolean;
  data?: Record<string, EntityValue>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp: number;
}

/**
 * Service class for handling DefaultsProcessActionHandler API calls
 * Provides centralized API communication with consistent error handling
 */
export class ProcessDefaultsService {
  private static readonly ENDPOINT_ACTION = "org.openbravo.client.application.process.DefaultsProcessActionHandler";
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 2;

  /**
   * Fetches process defaults from the backend
   * @param request - The process defaults request parameters
   * @returns Promise with service response
   */
  static async fetchDefaults(request: ProcessDefaultsRequest): Promise<ProcessDefaultsServiceResponse> {
    const { processId, windowId, contextData, requestId } = request;
    const startTime = performance.now();

    // Helper for validation
    const validateParams = (processId: string, windowId: string) => {
      if (!processId || !windowId) {
        return "ProcessId and WindowId are required";
      }
      return null;
    };

    // Helper for building params and payload
    const buildParams = (processId: string, windowId: string) =>
      new URLSearchParams({
        processId,
        windowId,
        _action: this.ENDPOINT_ACTION,
      });

    const buildPayload = (contextData: any, requestId?: string) => ({
      ...contextData,
      _requestType: "defaults",
      _requestId: requestId || this.generateRequestId(),
      _timestamp: Date.now().toString(),
    });

    const validationError = validateParams(processId, windowId);
    if (validationError) {
      logger.error("ProcessDefaultsService: Validation failed", {
        processId,
        windowId,
        requestId,
        error: validationError,
      });
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: validationError },
        requestId,
        timestamp: Date.now(),
      };
    }

    try {
      const params = buildParams(processId, windowId);
      const requestPayload = buildPayload(contextData, requestId);

      logger.debug("ProcessDefaultsService: Making API request", {
        processId,
        windowId,
        requestId,
        contextKeys: Object.keys(contextData),
      });

      const response = await this.makeRequestWithRetry(params, requestPayload);
      const duration = performance.now() - startTime;
      logger.debug("ProcessDefaultsService: Request completed", {
        processId,
        duration: `${duration.toFixed(2)}ms`,
        defaultsCount: Object.keys(response.data || {}).length,
      });

      return {
        success: true,
        data: response.data || {},
        requestId,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error("ProcessDefaultsService: Request failed", {
        processId,
        windowId,
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error: this.processError(error),
        requestId,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Makes API request with retry logic for transient failures
   */
  private static async makeRequestWithRetry(
    params: URLSearchParams,
    payload: Record<string, any>,
    attempt = 1
  ): Promise<any> {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const shouldRetry = (error: any, attempt: number) => attempt < this.MAX_RETRIES && this.isRetryableError(error);

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.REQUEST_TIMEOUT);
      const response = await Metadata.kernelClient.post(`?${params}`, payload, {
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Request-Type": "process-defaults",
          "X-Attempt": attempt.toString(),
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (shouldRetry(error, attempt)) {
        logger.warn(`ProcessDefaultsService: Retrying request (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await delay(backoff);
        return this.makeRequestWithRetry(params, payload, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determines if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      // Network errors are retryable
      if (error.name === "NetworkError" || error.message.includes("fetch")) {
        return true;
      }

      // Timeout errors are retryable
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return true;
      }
    }

    // HTTP 5xx errors are retryable
    if (error?.response?.status >= 500 && error?.response?.status < 600) {
      return true;
    }

    return false;
  }

  /**
   * Processes and normalizes error responses
   */
  private static processError(error: any): { code: string; message: string; details?: any } {
    const isTimeoutError = (err: any) => err instanceof Error && err.name === "AbortError";
    const isNetworkError = (err: any) =>
      err instanceof Error && (err.message.includes("fetch") || err.name === "NetworkError");
    const isValidationError = (err: any) => err instanceof Error && err.message.includes("required");
    const getStatus = (err: any) => err?.response?.status;
    const getStatusText = (err: any) => err?.response?.statusText || "Unknown error";

    if (isTimeoutError(error)) {
      return {
        code: "REQUEST_TIMEOUT",
        message: "Request timed out while fetching process defaults",
        details: { timeout: this.REQUEST_TIMEOUT },
      };
    }
    if (isNetworkError(error)) {
      return {
        code: "NETWORK_ERROR",
        message: "Network error while fetching process defaults",
        details: { originalError: error.message },
      };
    }
    if (isValidationError(error)) {
      return {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: { type: "parameter_validation" },
      };
    }
    if (error instanceof Error) {
      return {
        code: "API_ERROR",
        message: `API error: ${error.message}`,
        details: { originalError: error.message },
      };
    }
    if (error?.response) {
      const status = getStatus(error);
      const statusText = getStatusText(error);
      if (status === 400) {
        return {
          code: "BAD_REQUEST",
          message: "Invalid request parameters",
          details: { status, statusText, data: error.response.data },
        };
      }
      if (status === 401 || status === 403) {
        return {
          code: "UNAUTHORIZED",
          message: "Authentication failed or access denied",
          details: { status, statusText },
        };
      }
      if (status === 404) {
        return {
          code: "NOT_FOUND",
          message: "Process or endpoint not found",
          details: { status, statusText },
        };
      }
      if (status >= 500) {
        return {
          code: "SERVER_ERROR",
          message: "Internal server error",
          details: { status, statusText },
        };
      }
    }
    return {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      details: { error },
    };
  }

  /**
   * Generates a unique request ID for tracking
   */
  private static generateRequestId(): string {
    return `defaults_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Validates the response data structure
   */
  static validateResponse(data: any): boolean {
    if (!data || typeof data !== "object") {
      return false;
    }

    // Check if response has expected structure for defaults
    return true; // Process defaults can have any structure
  }

  /**
   * Transforms backend response to normalized format
   */
  static normalizeDefaults(responseData: any): Record<string, EntityValue> {
    if (!responseData || typeof responseData !== "object") {
      return {};
    }

    const normalized: Record<string, EntityValue> = {};

    // Handle different response formats from backend
    for (const [key, value] of Object.entries(responseData)) {
      if (value !== null && value !== undefined) {
        // Handle object values with identifier/value structure
        if (typeof value === "object" && value !== null && "identifier" in value) {
          normalized[key] = (value as any).identifier;
        } else {
          normalized[key] = value as EntityValue;
        }
      }
    }

    return normalized;
  }

  /**
   * Gets service configuration and statistics
   */
  static getServiceInfo() {
    return {
      endpointAction: this.ENDPOINT_ACTION,
      timeout: this.REQUEST_TIMEOUT,
      maxRetries: this.MAX_RETRIES,
      version: "1.0.0",
    };
  }
}

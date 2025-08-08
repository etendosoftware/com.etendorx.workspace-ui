import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import { generateId } from "@/utils";
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

    try {
      // Validate required parameters
      if (!processId || !windowId) {
        throw new Error("ProcessId and WindowId are required");
      }

      // Build request parameters
      const params = new URLSearchParams({
        processId,
        windowId,
        _action: this.ENDPOINT_ACTION,
      });

      // Prepare request payload
      const requestPayload = {
        ...contextData,
        _requestType: "defaults",
        _requestId: requestId || this.generateRequestId(),
        _timestamp: Date.now().toString(),
      };

      logger.debug("ProcessDefaultsService: Making API request", {
        processId,
        windowId,
        requestId,
        contextKeys: Object.keys(contextData),
      });

      // Make the API call with retry logic
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
    try {
      // Create abort controller for timeout
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
      // Retry logic for transient failures
      if (attempt < this.MAX_RETRIES && this.isRetryableError(error)) {
        logger.warn(`ProcessDefaultsService: Retrying request (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
        
        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
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
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        return true;
      }
      
      // Timeout errors are retryable
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
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
    if (error instanceof Error) {
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        return {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out while fetching process defaults',
          details: { timeout: this.REQUEST_TIMEOUT },
        };
      }

      // Handle network errors
      if (error.message.includes('fetch') || error.name === 'NetworkError') {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error while fetching process defaults',
          details: { originalError: error.message },
        };
      }

      // Handle validation errors
      if (error.message.includes('required')) {
        return {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: { type: 'parameter_validation' },
        };
      }
      // Fallback for other Error instances
      return {
        code: 'API_ERROR',
        message: `API error: ${error.message}`,
        details: { originalError: error.message },
      };
    }

    // Handle HTTP response-like errors
    if (error?.response) {
      const parsed = this.parseHttpError(error.response);
      if (parsed) return parsed;
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: { error },
    };
  }

  private static parseHttpError(response: any): { code: string; message: string; details?: any } | null {
    const status = response.status;
    const statusText = response.statusText || 'Unknown error';

    switch (true) {
      case status === 400:
        return {
          code: 'BAD_REQUEST',
          message: 'Invalid request parameters',
          details: { status, statusText, data: response.data },
        };
      case status === 401 || status === 403:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed or access denied',
          details: { status, statusText },
        };
      case status === 404:
        return {
          code: 'NOT_FOUND',
          message: 'Process or endpoint not found',
          details: { status, statusText },
        };
      case status >= 500:
        return {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          details: { status, statusText },
        };
      default:
        return null;
    }
  }

  /**
   * Generates a unique request ID for tracking
   */
  private static generateRequestId(): string {
    return generateId("defaults_");
  }

  /**
   * Validates the response data structure
   */
  static validateResponse(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if response has expected structure for defaults
    return true; // Process defaults can have any structure
  }

  /**
   * Transforms backend response to normalized format
   */
  static normalizeDefaults(responseData: any): Record<string, EntityValue> {
    if (!responseData || typeof responseData !== 'object') {
      return {};
    }

    const normalized: Record<string, EntityValue> = {};

    // Handle different response formats from backend
    for (const [key, value] of Object.entries(responseData)) {
      if (value !== null && value !== undefined) {
        // Handle object values with identifier/value structure
        if (typeof value === 'object' && value !== null && 'identifier' in value) {
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

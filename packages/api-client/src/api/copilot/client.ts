import { Client, type Interceptor } from "../client";
import { COPILOT_ENDPOINTS, COPILOT_METHODS } from "./constants";
import type { IAssistant, ILabels, CopilotQuestionParams, CopilotUploadResponse } from "./types";

export class CopilotClient {
  public static client = new Client();
  private static isProduction = process.env.NODE_ENV === "production";
  private static currentBaseUrl = "";

  /**
   * Initializes the CopilotClient with base URL
   * Follows the pattern from Metadata class
   */
  public static setBaseUrl(url?: string) {
    let copilotUrl: string;

    if (url) {
      copilotUrl = url;
    } else if (CopilotClient.isProduction) {
      copilotUrl = "../../copilot/";
    } else {
      copilotUrl = "http://localhost:8080/etendo/copilot/";
    }

    CopilotClient.currentBaseUrl = copilotUrl;
    CopilotClient.client.setBaseUrl(copilotUrl);
  }

  /**
   * Sets authentication token for all requests
   */
  public static setToken(token: string) {
    if (!CopilotClient.isProduction) {
      CopilotClient.client.setAuthHeader(btoa("admin:admin"), "Basic");
    } else {
      CopilotClient.client.setAuthHeader(token, "Bearer");
    }

    return CopilotClient;
  }

  /**
   * Sets language header for all requests
   * Follows the pattern from Metadata class
   */
  public static setLanguage(language: string) {
    CopilotClient.client.setLanguageHeader(language);
    return CopilotClient;
  }

  /**
   * Registers an interceptor for response handling
   * Follows the pattern from Metadata class
   */
  public static registerInterceptor(interceptor: Interceptor) {
    return CopilotClient.client.registerInterceptor(interceptor);
  }

  /**
   * Fetches localization labels
   * Includes proper error handling and response parsing
   */
  public static async getLabels(): Promise<ILabels> {
    try {
      const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.GET_LABELS, {
        method: COPILOT_METHODS.GET,
      });

      if (!ok) {
        throw new Error("Failed to fetch labels");
      }

      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch (parseError) {
          console.error("Error parsing labels response:", parseError);
          throw new Error("Invalid labels response format");
        }
      }

      return data as ILabels;
    } catch (error) {
      console.error("Error fetching labels:", error);
      throw error;
    }
  }

  /**
   * Fetches available assistants
   * Includes robust response parsing and error handling
   */
  public static async getAssistants(): Promise<IAssistant[]> {
    try {
      const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.GET_ASSISTANTS, {
        method: COPILOT_METHODS.GET,
      });

      if (!ok) {
        throw new Error("Failed to fetch assistants");
      }

      console.log("CopilotClient.getAssistants raw data:", data, "Type:", typeof data);

      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error("Error parsing assistants response:", parseError);
          return [];
        }
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching assistants:", error);
      throw error;
    }
  }

  /**
   * Uploads a single file to the copilot service
   * Follows the pattern from similar upload methods in the project
   */
  public static async uploadFile(file: File): Promise<CopilotUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.UPLOAD_FILE, {
        method: COPILOT_METHODS.POST,
        body: formData,
      });

      if (!ok) {
        throw new Error("Failed to upload file");
      }

      return data as CopilotUploadResponse;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      throw error;
    }
  }

  /**
   * Uploads multiple files to the copilot service
   * Provides batch upload functionality
   */
  public static async uploadFiles(files: File[]): Promise<CopilotUploadResponse> {
    try {
      const formData = new FormData();

      for (const file of files) {
        formData.append("file", file);
      }

      const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.UPLOAD_FILE, {
        method: COPILOT_METHODS.POST,
        body: formData,
      });

      if (!ok) {
        throw new Error("Failed to upload files");
      }

      return data as CopilotUploadResponse;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  }

  /**
   * Caches a question for large payloads
   * Follows the pattern from similar caching methods in the project
   */
  public static async cacheQuestion(question: string): Promise<any> {
    try {
      const { data, ok } = await CopilotClient.client.post(COPILOT_ENDPOINTS.CACHE_QUESTION, {
        question,
      });

      if (!ok) {
        throw new Error("Failed to cache question");
      }

      return data;
    } catch (error) {
      console.error("Error caching question:", error);
      throw error;
    }
  }

  /**
   * Sends a regular question to the copilot service
   * For non-streaming responses
   */
  public static async sendQuestion(params: CopilotQuestionParams): Promise<any> {
    try {
      const { data, ok } = await CopilotClient.client.post(
        COPILOT_ENDPOINTS.SEND_QUESTION,
        params as unknown as Record<string, unknown>
      );

      if (!ok) {
        throw new Error("Failed to send question");
      }

      return data;
    } catch (error) {
      console.error("Error sending question:", error);
      throw error;
    }
  }

  /**
   * Builds SSE URL for streaming responses
   * Uses the stored base URL for consistency
   */
  public static buildSSEUrl(params: CopilotQuestionParams): string {
    const queryParams = Object.keys(params)
      .filter((key) => params[key as keyof CopilotQuestionParams] !== undefined)
      .map((key) => {
        const value = params[key as keyof CopilotQuestionParams];
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      })
      .join("&");

    return `${CopilotClient.currentBaseUrl}${COPILOT_ENDPOINTS.SEND_AQUESTION}?${queryParams}`;
  }

  /**
   * Gets headers for SSE connections
   * Handles environment-specific authentication
   */
  public static getSSEHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!CopilotClient.isProduction) {
      headers.Authorization = `Basic ${btoa("admin:admin")}`;
    }
    return headers;
  }

  /**
   * Helper method to determine if request should be cached
   * Follows the caching threshold pattern from the original code
   */
  public static shouldCacheQuestion(question: string): boolean {
    return encodeURIComponent(question).length > 7000;
  }

  /**
   * Helper method to handle large questions automatically
   * Provides transparent caching for large payloads
   */
  public static async handleLargeQuestion(params: CopilotQuestionParams): Promise<CopilotQuestionParams> {
    if (CopilotClient.shouldCacheQuestion(params.question)) {
      await CopilotClient.cacheQuestion(params.question);
      const { question, ...restParams } = params;
      return restParams as CopilotQuestionParams;
    }
    return params;
  }

  /**
   * Utility method to get current base URL
   * Useful for debugging and testing
   */
  public static getCurrentBaseUrl(): string {
    return CopilotClient.currentBaseUrl;
  }

  /**
   * Utility method to check if client is in production mode
   * Useful for debugging and conditional logic
   */
  public static isProductionMode(): boolean {
    return CopilotClient.isProduction;
  }

  /**
   * Initializes the CopilotClient with common configuration
   */
  public static initialize(config?: {
    baseUrl?: string;
    token?: string;
    language?: string;
    interceptor?: Interceptor;
  }) {
    if (config?.baseUrl) {
      CopilotClient.setBaseUrl(config.baseUrl);
    } else {
      CopilotClient.setBaseUrl();
    }

    if (config?.token) {
      CopilotClient.setToken(config.token);
    }

    if (config?.language) {
      CopilotClient.setLanguage(config.language);
    }

    if (config?.interceptor) {
      CopilotClient.registerInterceptor(config.interceptor);
    }

    return CopilotClient;
  }
}

import { Client, type Interceptor } from "../client";
import { COPILOT_BASE_PATH, COPILOT_ENDPOINTS, COPILOT_METHODS } from "./constants";
import type { IAssistant, ILabels, CopilotQuestionParams } from "./types";

export class CopilotClient {
  public static client = new Client();
  private static isProduction = process.env.NODE_ENV === "production";
  private static baseUrl = "";

  public static setBaseUrl(url: string) {
    const fullUrl = url + COPILOT_BASE_PATH;
    CopilotClient.baseUrl = fullUrl;
    CopilotClient.client.setBaseUrl(fullUrl);
  }

  public static setToken(token: string) {
    CopilotClient.client.setAuthHeader(token, "Bearer");
  }

  public static registerInterceptor(interceptor: Interceptor) {
    return CopilotClient.client.registerInterceptor(interceptor);
  }

  public static async getLabels(): Promise<ILabels> {
    const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.GET_LABELS, {
      method: COPILOT_METHODS.GET,
    });

    if (!ok) {
      throw new Error("Failed to fetch labels");
    }

    return data;
  }

  public static async getAssistants(): Promise<IAssistant[]> {
    const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.GET_ASSISTANTS, {
      method: COPILOT_METHODS.GET,
    });

    if (!ok) {
      throw new Error("Failed to fetch assistants");
    }

    return data;
  }

  public static async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const { data, ok } = await CopilotClient.client.request(COPILOT_ENDPOINTS.UPLOAD_FILE, {
      method: COPILOT_METHODS.POST,
      body: formData,
    });

    if (!ok) {
      throw new Error("Failed to upload file");
    }

    return data;
  }

  public static async cacheQuestion(question: string): Promise<any> {
    const { data, ok } = await CopilotClient.client.post(COPILOT_ENDPOINTS.CACHE_QUESTION, { question });

    if (!ok) {
      throw new Error("Failed to cache question");
    }

    return data;
  }

  public static buildSSEUrl(params: CopilotQuestionParams): string {
    const queryParams = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key as keyof CopilotQuestionParams] as string)}`
      )
      .join("&");

    return `${CopilotClient.baseUrl}${COPILOT_ENDPOINTS.SEND_AQUESTION}?${queryParams}`;
  }

  public static getSSEHeaders(): Record<string, string> {
    if (!CopilotClient.isProduction) {
      return {
        Authorization: `Basic ${btoa("admin:admin")}`,
      };
    }
    return {};
  }
}

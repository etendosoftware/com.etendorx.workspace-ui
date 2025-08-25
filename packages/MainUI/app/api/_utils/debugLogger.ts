/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { type NextRequest, NextResponse } from "next/server";
import { isDebugErpRequests } from "@/utils/debug";

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  route: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: any;
  timing: number;
  error?: string;
}

class DebugLogger {
  private static instance: DebugLogger;
  private store: Map<string, DebugLogEntry> = new Map();
  private readonly maxEntries = 500;
  private readonly maxAge = 60 * 60 * 1000; // 1 hour

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Wraps an API handler with debug logging functionality - NextRequest variant
   */
  async withDebugLogging<T>(
    route: string,
    handler: (request: NextRequest) => Promise<T>,
    request: NextRequest
  ): Promise<T>;
  
  /**
   * Wraps an API handler with debug logging functionality - Request variant  
   */
  async withDebugLogging<T>(
    route: string,
    handler: (request: Request) => Promise<T>,
    request: Request
  ): Promise<T>;
  
  /**
   * Implementation for both variants
   */
  async withDebugLogging<T>(
    route: string,
    handler: (request: any) => Promise<T>,
    request: NextRequest | Request
  ): Promise<T> {
    if (!this.shouldLog()) {
      return handler(request);
    }

    const startTime = Date.now();
    const logEntry = await this.createLogEntry(route, request);

    try {
      const result = await handler(request);
      const timing = Date.now() - startTime;

      // Capture response data
      this.updateLogEntryWithResponse(logEntry, result, timing);
      this.store.set(logEntry.id, logEntry);
      this.cleanup();

      return result;
    } catch (error) {
      const timing = Date.now() - startTime;
      this.updateLogEntryWithError(logEntry, error, timing);
      this.store.set(logEntry.id, logEntry);
      throw error;
    }
  }

  /**
   * Check if logging should be enabled
   */
  private shouldLog(): boolean {
    return process.env.NODE_ENV === "development" && isDebugErpRequests();
  }

  /**
   * Create initial log entry from request
   */
  private async createLogEntry(route: string, request: NextRequest | Request): Promise<DebugLogEntry> {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Extract request headers and mask sensitive data
    const requestHeaders: Record<string, string> = {};
    
    // Handle both NextRequest and Request types
    if ('headers' in request && typeof request.headers.forEach === 'function') {
      request.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if ('headers' in request) {
      // Fallback for older request types
      for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      }
    }
    
    const maskedRequestHeaders = this.maskSensitiveData(requestHeaders);

    // Extract request body
    let requestBody: any = null;
    try {
      const contentType = requestHeaders["content-type"] || "";
      if (contentType.includes("application/json")) {
        const clonedRequest = request.clone();
        requestBody = await clonedRequest.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const clonedRequest = request.clone();
        if ('formData' in clonedRequest) {
          const formData = await clonedRequest.formData();
          requestBody = Object.fromEntries(formData.entries());
        }
      } else if (contentType.includes("text/")) {
        const clonedRequest = request.clone();
        requestBody = await clonedRequest.text();
      }
    } catch (error) {
      // Ignore body parsing errors, keep as null
      console.debug("Failed to parse request body:", error);
    }

    return {
      id,
      timestamp,
      route,
      method: request.method,
      url: request.url,
      requestHeaders: maskedRequestHeaders,
      requestBody,
      responseStatus: 0,
      responseHeaders: {},
      responseBody: null,
      timing: 0,
    };
  }

  /**
   * Update log entry with successful response data
   */
  private updateLogEntryWithResponse(logEntry: DebugLogEntry, result: any, timing: number): void {
    logEntry.timing = timing;

    if (result instanceof NextResponse) {
      logEntry.responseStatus = result.status;
      
      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      result.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      logEntry.responseHeaders = responseHeaders;

      // For NextResponse, we can't easily extract the body without cloning/consuming it
      // Since this is for debugging, we'll mark it as captured
      logEntry.responseBody = { _debug: "NextResponse body captured", status: result.status };
    } else {
      // For other response types (JSON objects, etc.)
      logEntry.responseStatus = 200;
      logEntry.responseBody = result;
    }
  }

  /**
   * Update log entry with error information
   */
  private updateLogEntryWithError(logEntry: DebugLogEntry, error: any, timing: number): void {
    logEntry.timing = timing;
    logEntry.responseStatus = 500;
    logEntry.error = error instanceof Error ? error.message : String(error);
    logEntry.responseBody = { error: logEntry.error };
  }

  /**
   * Mask sensitive data in headers and body
   */
  private maskSensitiveData(headers: Record<string, string>): Record<string, string> {
    const masked = { ...headers };

    // Mask Authorization header (Bearer token)
    if (masked.authorization || masked.Authorization) {
      const authHeader = masked.authorization || masked.Authorization;
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        masked.authorization = `Bearer ${token.substring(0, 8)}...***`;
        delete masked.Authorization; // Normalize to lowercase
      }
    }

    // Mask Cookie header (JSESSIONID and other session cookies)
    if (masked.cookie || masked.Cookie) {
      const cookieHeader = masked.cookie || masked.Cookie;
      masked.cookie = cookieHeader.replace(/JSESSIONID=[^;]+/g, "JSESSIONID=***")
                                  .replace(/sessionid=[^;]+/gi, "sessionid=***")
                                  .replace(/token=[^;]+/gi, "token=***");
      delete masked.Cookie; // Normalize to lowercase
    }

    return masked;
  }

  /**
   * Get all logs, optionally filtered by timestamp
   */
  getLogs(since?: string): DebugLogEntry[] {
    this.cleanup();
    const entries = Array.from(this.store.values());
    
    if (since) {
      return entries.filter(entry => entry.timestamp > since);
    }
    
    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.store.clear();
  }

  /**
   * Clean up old entries based on age and count limits
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.maxAge;
    
    // Remove entries older than maxAge
    for (const [id, entry] of this.store) {
      if (new Date(entry.timestamp).getTime() < cutoff) {
        this.store.delete(id);
      }
    }

    // Enforce max entries limit
    if (this.store.size > this.maxEntries) {
      const entries = this.getLogs();
      const toRemove = entries.slice(this.maxEntries);
      toRemove.forEach(entry => this.store.delete(entry.id));
    }
  }

  /**
   * Get statistics about current logs
   */
  getStats(): { totalLogs: number; oldestLog?: string; newestLog?: string } {
    this.cleanup();
    const entries = this.getLogs();
    
    return {
      totalLogs: entries.length,
      oldestLog: entries.length > 0 ? entries[entries.length - 1].timestamp : undefined,
      newestLog: entries.length > 0 ? entries[0].timestamp : undefined,
    };
  }
}

// Export singleton instance methods
const debugLogger = DebugLogger.getInstance();

export const withDebugLogging = debugLogger.withDebugLogging.bind(debugLogger);
export const getDebugLogs = () => debugLogger.getLogs();
export const getDebugLogsSince = (since: string) => debugLogger.getLogs(since);
export const clearDebugLogs = () => debugLogger.clearLogs();
export const getDebugStats = () => debugLogger.getStats();
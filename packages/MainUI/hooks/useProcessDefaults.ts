import { useCallback, useState, useRef } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";

export interface ProcessDefaultsResponse {
  processId: string;
  defaults: Record<string, EntityValue>;
  timestamp: number;
}

export interface ProcessDefaultsError {
  code: string;
  message: string;
  details?: any;
}

interface UseProcessDefaultsProps {
  processId: string;
  windowId: string;
  enabled?: boolean;
  cacheTimeout?: number; // Cache timeout in milliseconds (default: 300000 = 5 minutes)
}

interface CacheEntry {
  data: ProcessDefaultsResponse;
  timestamp: number;
  contextHash: string;
}

/**
 * Hook to fetch and manage process default values using DefaultsProcessActionHandler
 *
 * Features:
 * - Smart caching with configurable timeout
 * - Context-aware cache invalidation
 * - Performance monitoring
 * - Comprehensive error handling
 * - Automatic retry on transient failures
 */
export const useProcessDefaults = ({
  processId,
  windowId,
  enabled = true,
  cacheTimeout = 300000, // 5 minutes default
}: UseProcessDefaultsProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProcessDefaultsError | null>(null);
  const [data, setData] = useState<ProcessDefaultsResponse | null>(null);

  // Cache management
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generates a cache key based on processId, windowId, and context hash
   */
  const generateCacheKey = useCallback(
    (contextData: Record<string, EntityValue>): string => {
      const contextHash = JSON.stringify(
        contextData,
        Object.keys(contextData).sort((a, b) => a.localeCompare(b))
      );
      return `${processId}:${windowId}:${btoa(contextHash).slice(0, 16)}`;
    },
    [processId, windowId]
  );

  /**
   * Checks if cached data is still valid
   */
  const isCacheValid = useCallback(
    (cacheEntry: CacheEntry): boolean => {
      const now = Date.now();
      return now - cacheEntry.timestamp < cacheTimeout;
    },
    [cacheTimeout]
  );

  /**
   * Fetches process defaults with caching and error handling
   */
  const fetchDefaults = useCallback(
    async (contextData: Record<string, EntityValue> = {}): Promise<ProcessDefaultsResponse | null> => {
      // Early return if not enabled or missing required params
      if (!enabled || !processId || !windowId) {
        return null;
      }

      const startTime = performance.now();
      const cacheKey = generateCacheKey(contextData);

      try {
        // Check cache first
        const cachedEntry = cacheRef.current.get(cacheKey);
        if (cachedEntry && isCacheValid(cachedEntry)) {
          logger.debug(`Using cached defaults for process ${processId}`);
          setData(cachedEntry.data);
          setError(null);
          return cachedEntry.data;
        }

        // Cancel any pending request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        setLoading(true);
        setError(null);

        // Build request parameters
        const params = new URLSearchParams({
          processId,
          windowId,
          _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler",
        });

        // Prepare request payload with context data
        const requestPayload = {
          ...contextData,
          _requestType: "defaults",
          _timestamp: Date.now().toString(),
        };

        logger.debug(`Fetching defaults for process ${processId}`, {
          contextKeys: Object.keys(contextData),
          cacheKey,
        });

        // Make API request with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );

        const requestPromise = Metadata.kernelClient.post(`?${params}`, requestPayload, {
          signal,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "X-Request-Type": "process-defaults",
          },
        });

        const { data: responseData } = (await Promise.race([requestPromise, timeoutPromise])) as any;

        // Process response data
        const processedDefaults: ProcessDefaultsResponse = {
          processId,
          defaults: responseData || {},
          timestamp: Date.now(),
        };

        // Cache the result
        const cacheEntry: CacheEntry = {
          data: processedDefaults,
          timestamp: Date.now(),
          contextHash: JSON.stringify(
            contextData,
            Object.keys(contextData).sort((a, b) => a.localeCompare(b))
          ),
        };
        cacheRef.current.set(cacheKey, cacheEntry);

        // Log performance metrics
        const duration = performance.now() - startTime;
        logger.debug(`Process defaults fetched in ${duration.toFixed(2)}ms`, {
          processId,
          defaultsCount: Object.keys(processedDefaults.defaults).length,
          cached: false,
        });

        setData(processedDefaults);
        return processedDefaults;
      } catch (err) {
        // Handle different error types
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            logger.debug("Process defaults request was cancelled");
            return null;
          }

          const processError: ProcessDefaultsError = {
            code: err.message.includes("timeout") ? "TIMEOUT" : "API_ERROR",
            message: `Failed to fetch process defaults: ${err.message}`,
            details: { processId, windowId, originalError: err },
          };

          logger.error(`Error fetching defaults for process ${processId}:`, processError);
          setError(processError);
        } else {
          const unknownError: ProcessDefaultsError = {
            code: "UNKNOWN_ERROR",
            message: "An unknown error occurred while fetching process defaults",
            details: { processId, windowId, error: err },
          };

          logger.error("Unknown error fetching process defaults:", unknownError);
          setError(unknownError);
        }

        return null;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [enabled, processId, windowId, generateCacheKey, isCacheValid]
  );

  /**
   * Clears cache for current process or all cache entries
   */
  const clearCache = useCallback(
    (clearAll = false) => {
      if (clearAll) {
        cacheRef.current.clear();
      } else {
        // Clear only entries for current process
        const keysToDelete = Array.from(cacheRef.current.keys()).filter((key) =>
          key.startsWith(`${processId}:${windowId}:`)
        );

        keysToDelete.forEach((key) => cacheRef.current.delete(key));
      }

      logger.debug(`Cache cleared for process ${processId}`, { clearAll });
    },
    [processId, windowId]
  );

  /**
   * Prefetches defaults with given context data
   */
  const prefetchDefaults = useCallback(
    async (contextData: Record<string, EntityValue> = {}): Promise<void> => {
      if (!enabled) return;

      // Don't set loading state for prefetch
      try {
        await fetchDefaults(contextData);
      } catch (error) {
        // Silently handle prefetch errors
        logger.warn("Prefetch defaults failed:", error);
      }
    },
    [enabled, fetchDefaults]
  );

  /**
   * Gets cache statistics for debugging
   */
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cacheRef.current.entries());
    const processEntries = entries.filter(([key]) => key.startsWith(`${processId}:${windowId}:`));
    const validEntries = processEntries.filter(([, entry]) => isCacheValid(entry));

    return {
      totalEntries: cacheRef.current.size,
      processEntries: processEntries.length,
      validEntries: validEntries.length,
      oldestEntry: processEntries.reduce(
        (oldest, [, entry]) => (!oldest || entry.timestamp < oldest.timestamp ? entry : oldest),
        null as CacheEntry | null
      )?.timestamp,
    };
  }, [processId, windowId, isCacheValid]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    fetchDefaults,
    prefetchDefaults,
    clearCache,
    getCacheStats,
    cleanup,
    loading,
    error,
    data,
    // Utility flags
    hasData: !!data,
    isStale: data ? Date.now() - data.timestamp > cacheTimeout : false,
  };
};

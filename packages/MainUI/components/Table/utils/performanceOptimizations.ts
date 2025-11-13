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

import { useCallback, useMemo, useRef } from "react";
import { logger } from "@/utils/logger";

/**
 * Debounce function for performance optimization
 * Delays execution of a function until after a specified delay
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 * Limits execution of a function to at most once per specified interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastExecution >= interval) {
      lastExecution = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          lastExecution = Date.now();
          timeoutId = null;
          func(...args);
        },
        interval - (now - lastExecution)
      );
    }
  };
}

/**
 * Hook for creating debounced callbacks
 * Automatically handles cleanup on unmount
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Hook for creating throttled callbacks
 * Automatically handles cleanup on unmount
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  interval: number
): ((...args: Parameters<T>) => void) => {
  const lastExecutionRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastExecutionRef.current >= interval) {
        lastExecutionRef.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(
          () => {
            lastExecutionRef.current = Date.now();
            timeoutRef.current = null;
            callback(...args);
          },
          interval - (now - lastExecutionRef.current)
        );
      }
    },
    [callback, interval]
  );
};

/**
 * Memoized cell editor factory for performance
 * Prevents unnecessary re-renders of cell editors
 */
export const useMemoizedCellEditor = (
  fieldType: string,
  value: unknown,
  hasError: boolean,
  disabled: boolean,
  rowId: string,
  columnId: string
) => {
  return useMemo(
    () => ({
      fieldType,
      value,
      hasError,
      disabled,
      rowId,
      columnId,
      // Create a stable key for memoization
      key: `${rowId}-${columnId}-${fieldType}-${String(value)}-${hasError}-${disabled}`,
    }),
    [fieldType, value, hasError, disabled, rowId, columnId]
  );
};

/**
 * Lazy loading manager for cell editors
 * Only loads cell editors when they become visible
 */
export class LazyLoadingManager {
  private loadedEditors = new Set<string>();
  private pendingLoads = new Map<string, Promise<any>>();

  /**
   * Check if an editor is already loaded
   */
  isEditorLoaded(editorKey: string): boolean {
    return this.loadedEditors.has(editorKey);
  }

  /**
   * Load an editor lazily
   */
  async loadEditor(editorKey: string, loader: () => Promise<any>): Promise<any> {
    if (this.loadedEditors.has(editorKey)) {
      return Promise.resolve();
    }

    if (this.pendingLoads.has(editorKey)) {
      return this.pendingLoads.get(editorKey);
    }

    const loadPromise = loader()
      .then((result) => {
        this.loadedEditors.add(editorKey);
        this.pendingLoads.delete(editorKey);
        logger.debug(`[LazyLoading] Loaded editor: ${editorKey}`);
        return result;
      })
      .catch((error) => {
        this.pendingLoads.delete(editorKey);
        logger.error(`[LazyLoading] Failed to load editor: ${editorKey}`, error);
        throw error;
      });

    this.pendingLoads.set(editorKey, loadPromise);
    return loadPromise;
  }

  /**
   * Preload editors that are likely to be needed soon
   */
  preloadEditors(editorKeys: string[], loaders: Map<string, () => Promise<any>>): void {
    editorKeys.forEach((key) => {
      const loader = loaders.get(key);
      if (loader && !this.loadedEditors.has(key) && !this.pendingLoads.has(key)) {
        // Preload with low priority
        setTimeout(() => {
          this.loadEditor(key, loader).catch(() => {
            // Ignore preload errors
          });
        }, 100);
      }
    });
  }

  /**
   * Clear loaded editors to free memory
   */
  clearLoadedEditors(): void {
    this.loadedEditors.clear();
    this.pendingLoads.clear();
    logger.debug("[LazyLoading] Cleared all loaded editors");
  }
}

/**
 * Create a lazy loading manager instance
 */
export const createLazyLoadingManager = (): LazyLoadingManager => {
  return new LazyLoadingManager();
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number>();
  private enabled = process.env.NODE_ENV === "development";

  /**
   * Start measuring performance for a specific operation
   */
  startMeasurement(key: string): void {
    if (!this.enabled) return;
    this.measurements.set(key, performance.now());
  }

  /**
   * End measurement and log the result
   */
  endMeasurement(key: string, threshold = 16): void {
    if (!this.enabled) return;

    const startTime = this.measurements.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.delete(key);

      if (duration > threshold) {
        logger.warn(`[Performance] Slow operation detected: ${key} took ${duration.toFixed(2)}ms`);
      } else {
        logger.debug(`[Performance] ${key} completed in ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Measure a function execution
   */
  measure<T>(key: string, fn: () => T, threshold = 16): T {
    if (!this.enabled) return fn();

    this.startMeasurement(key);
    try {
      const result = fn();
      this.endMeasurement(key, threshold);
      return result;
    } catch (error) {
      this.endMeasurement(key, threshold);
      throw error;
    }
  }

  /**
   * Measure an async function execution
   */
  async measureAsync<T>(key: string, fn: () => Promise<T>, threshold = 16): Promise<T> {
    if (!this.enabled) return fn();

    this.startMeasurement(key);
    try {
      const result = await fn();
      this.endMeasurement(key, threshold);
      return result;
    } catch (error) {
      this.endMeasurement(key, threshold);
      throw error;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  return useMemo(() => performanceMonitor, []);
};

/**
 * Virtualization utilities for large datasets
 */
export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
}

export const calculateVisibleRange = (
  scrollTop: number,
  config: VirtualizationConfig,
  totalItems: number
): { startIndex: number; endIndex: number; visibleItems: number } => {
  const { itemHeight, containerHeight, overscan } = config;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);

  return { startIndex, endIndex, visibleItems };
};

/**
 * Memory management utilities
 */
export class MemoryManager {
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  /**
   * Add item to cache with size tracking
   */
  set(key: string, data: any): void {
    const size = this.estimateSize(data);

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentCacheSize -= existing.size;
    }

    // Add new item
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });
    this.currentCacheSize += size;

    // Clean up if cache is too large
    this.cleanup();
  }

  /**
   * Get item from cache
   */
  get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Update timestamp for LRU
      item.timestamp = Date.now();
      return item.data;
    }
    return undefined;
  }

  /**
   * Remove item from cache
   */
  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Cleanup old items when cache is too large
   */
  private cleanup(): void {
    if (this.currentCacheSize <= this.maxCacheSize) return;

    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest items until we're under the limit
    for (const [key, item] of entries) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;

      if (this.currentCacheSize <= this.maxCacheSize * 0.8) {
        break;
      }
    }

    logger.debug(`[MemoryManager] Cleaned up cache, current size: ${this.currentCacheSize} bytes`);
  }

  /**
   * Estimate the size of an object in bytes
   */
  private estimateSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { items: number; size: number; maxSize: number } {
    return {
      items: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
    };
  }
}

/**
 * Global memory manager instance
 */
export const memoryManager = new MemoryManager();

/**
 * Hook for memory management
 */
export const useMemoryManager = () => {
  return useMemo(() => memoryManager, []);
};

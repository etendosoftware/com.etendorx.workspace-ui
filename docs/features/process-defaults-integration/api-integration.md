# API Integration - DefaultsProcessActionHandler

This document provides comprehensive information about integrating with the DefaultsProcessActionHandler API, including request/response patterns, error handling, and performance optimization strategies.

## 🌐 API Overview

The DefaultsProcessActionHandler is a backend service that provides default values, dynamic logic, and filter expressions for process forms. It follows the established Openbravo action handler pattern while providing enhanced functionality for complex process scenarios.

### Endpoint Information

- **Action**: `org.openbravo.client.application.process.DefaultsProcessActionHandler`
- **Method**: `POST`
- **Content-Type**: `application/json;charset=UTF-8`
- **Base URL**: `${baseUrl}/etendo/meta/forward/`

## 📤 Request Structure

### URL Parameters

```typescript
const params = new URLSearchParams({
  processId: "your-process-id",           // Required: Process identifier
  windowId: "your-window-id",             // Optional: Window context
  _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler"
});

const url = `${baseUrl}?${params}`;
```

### Request Payload

```typescript
interface RequestPayload {
  processId: string;                      // Process identifier
  windowId?: string;                      // Window context
  recordId?: string;                      // Current record ID for context
  _requestType: "defaults";               // Request type identifier
  _timestamp: string;                     // Request timestamp
  [contextKey: string]: EntityValue;     // Additional context data
}

// Example payload
const requestPayload = {
  processId: "ABC123",
  windowId: "XYZ789",
  recordId: "record-uuid",
  _requestType: "defaults",
  _timestamp: Date.now().toString(),
  // Additional context fields from current record
  organizationId: "org-uuid",
  currencyId: "currency-uuid",
  documentDate: "2025-08-05"
};
```

### Request Headers

```typescript
const headers = {
  "Content-Type": "application/json;charset=UTF-8",
  "X-Request-Type": "process-defaults",
  // Standard authentication headers...
};
```

## 📥 Response Structure

### Success Response

```typescript
interface DefaultsProcessActionHandlerResponse {
  defaults: Record<string, ProcessDefaultValue>;
  filterExpressions: Record<string, Record<string, any>>;
  refreshParent: boolean;
}

// Real-world example
{
  "defaults": {
    "trxtype": "",
    "ad_org_id": {
      "value": "E443A31992CB4635AFCAEABE7183CE85",
      "identifier": "F&B España - Región Norte"
    },
    "actual_payment": "1.85",
    "issotrx": true,
    "received_from_readonly_logic": "Y",
    "trxtype_display_logic": "N"
  },
  "filterExpressions": {
    "order_invoice": {
      "paymentMethodName": "Transferencia"
    }
  },
  "refreshParent": true
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
  success: false;
}

// Example error response
{
  "error": {
    "message": "Process not found or access denied",
    "type": "ProcessAccessError",
    "code": "PROC_404"
  },
  "success": false
}
```

## 🔧 Implementation with useProcessInitialization

### Basic Implementation

```typescript
import { useProcessInitialization } from '@/hooks/useProcessInitialization';

function ProcessModalComponent({ processId, windowId, recordId }) {
  const {
    processInitialization,
    loading,
    error,
    refetch
  } = useProcessInitialization({
    processId,
    windowId,
    recordId,
    enabled: !!processId && !!windowId
  });

  // Handle loading state
  if (loading) {
    return <ProcessLoadingSpinner />;
  }

  // Handle error state
  if (error) {
    console.warn('Process defaults failed to load:', error);
    // Continue with empty defaults - don't block the user
  }

  // Use the defaults...
  return <ProcessForm defaults={processInitialization} />;
}
```

### Advanced Implementation with Context

```typescript
function useProcessInitializationWithContext(
  processId: string,
  windowId: string,
  contextData: Record<string, EntityValue>
) {
  const { record } = useTabContext();
  const { session } = useUserContext();

  // Combine all context sources
  const enrichedContext = useMemo(() => ({
    ...contextData,
    ...buildPayloadByInputName(record, tab.fields),
    ...session,
    // Add process-specific context
    requestTimestamp: Date.now().toString(),
    userAgent: navigator.userAgent,
  }), [contextData, record, session]);

  const {
    processInitialization,
    loading,
    error,
    refetch
  } = useProcessInitialization({
    processId,
    windowId,
    recordId: record?.id,
    enabled: !!processId && !!windowId
  });

  // Refetch with enriched context when needed
  const refetchWithContext = useCallback(async () => {
    await refetch(enrichedContext);
  }, [refetch, enrichedContext]);

  return {
    processInitialization,
    loading,
    error,
    refetchWithContext
  };
}
```

## 🛡️ Error Handling Strategy

### Error Categories

#### 1. **Network Errors**
- Connection timeouts
- Server unavailable
- DNS resolution failures

```typescript
const handleNetworkError = (error: Error) => {
  if (error.name === 'AbortError') {
    logger.debug('Request was cancelled');
    return null; // Silent handling for cancelled requests
  }
  
  if (error.message.includes('timeout')) {
    logger.warn('Request timeout - server may be overloaded');
    // Could implement retry logic here
  }
  
  logger.error('Network error fetching process defaults:', error);
  // Return empty defaults to not block user workflow
  return {
    defaults: {},
    filterExpressions: {},
    refreshParent: false
  };
};
```

#### 2. **Authentication Errors**
- Session expired
- Insufficient permissions
- Invalid credentials

```typescript
const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    logger.warn('Session expired while fetching process defaults');
    // Trigger re-authentication
    authService.redirectToLogin();
    return null;
  }
  
  if (response.status === 403) {
    logger.warn('Insufficient permissions for process defaults');
    // Continue with empty defaults
    return { defaults: {}, filterExpressions: {}, refreshParent: false };
  }
};
```

#### 3. **Business Logic Errors**
- Process not found
- Invalid parameters
- Business rule violations

```typescript
const handleBusinessError = (errorResponse: ErrorResponse) => {
  switch (errorResponse.error.code) {
    case 'PROC_404':
      logger.warn('Process not found, continuing without defaults');
      break;
    case 'PARAM_INVALID':
      logger.error('Invalid parameters sent to process defaults');
      break;
    case 'BUSINESS_RULE':
      logger.info('Business rule prevented defaults loading');
      break;
    default:
      logger.error('Unknown business error:', errorResponse.error);
  }
  
  // Always return safe fallback
  return { defaults: {}, filterExpressions: {}, refreshParent: false };
};
```

### Comprehensive Error Handler

```typescript
const fetchProcessInitialization = async (
  params: URLSearchParams,
  payload: Record<string, EntityValue>
): Promise<ProcessDefaultsResponse> => {
  try {
    // Set up timeout and abort controller
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    const response = await Metadata.kernelClient.post(`?${params}`, payload, {
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "X-Request-Type": "process-defaults",
      },
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = response.data;

    // Handle business errors
    if (data.error) {
      return handleBusinessError(data);
    }

    // Transform successful response
    return {
      defaults: data?.defaults || data || {},
      filterExpressions: data?.filterExpressions || {},
      refreshParent: !!data?.refreshParent,
    };

  } catch (error) {
    // Handle different error types
    if (error instanceof Error) {
      return handleNetworkError(error);
    }
    
    // Unknown error type
    logger.error('Unknown error type:', error);
    return {
      defaults: {},
      filterExpressions: {},
      refreshParent: false
    };
  }
};
```

## ⚡ Performance Optimization

### 1. **Request Optimization**

#### Payload Minimization
```typescript
// Only send necessary context data
const optimizedPayload = {
  processId,
  windowId,
  recordId,
  _requestType: "defaults",
  _timestamp: Date.now().toString(),
  // Only include relevant context fields
  ...getRelevantContextFields(contextData, processDefinition)
};

function getRelevantContextFields(
  contextData: Record<string, EntityValue>,
  processDefinition: ProcessDefinition
): Record<string, EntityValue> {
  // Only include fields that the process actually uses
  const relevantFields: Record<string, EntityValue> = {};
  
  processDefinition.parameters.forEach(param => {
    if (param.dependsOn && contextData[param.dependsOn]) {
      relevantFields[param.dependsOn] = contextData[param.dependsOn];
    }
  });
  
  return relevantFields;
}
```

#### Request Deduplication
```typescript
// Prevent duplicate requests for same parameters
const requestCache = new Map<string, Promise<ProcessDefaultsResponse>>();

const fetchWithDeduplication = async (
  params: URLSearchParams,
  payload: Record<string, EntityValue>
): Promise<ProcessDefaultsResponse> => {
  const cacheKey = `${params.toString()}:${JSON.stringify(payload)}`;
  
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }
  
  const requestPromise = fetchProcessInitialization(params, payload);
  requestCache.set(cacheKey, requestPromise);
  
  // Clean up cache after request completes
  requestPromise.finally(() => {
    setTimeout(() => requestCache.delete(cacheKey), 5000);
  });
  
  return requestPromise;
};
```

### 2. **Response Caching**

#### Smart Caching Strategy
```typescript
interface CacheEntry {
  data: ProcessDefaultsResponse;
  timestamp: number;
  contextHash: string;
}

class ProcessDefaultsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  generateCacheKey(
    processId: string,
    windowId: string,
    contextData: Record<string, EntityValue>
  ): string {
    const contextHash = this.hashContext(contextData);
    return `${processId}:${windowId}:${contextHash}`;
  }

  private hashContext(contextData: Record<string, EntityValue>): string {
    const sortedKeys = Object.keys(contextData).sort();
    const sortedData = sortedKeys.reduce((acc, key) => {
      acc[key] = contextData[key];
      return acc;
    }, {} as Record<string, EntityValue>);
    
    return btoa(JSON.stringify(sortedData)).slice(0, 16);
  }

  get(cacheKey: string): ProcessDefaultsResponse | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  set(cacheKey: string, data: ProcessDefaultsResponse, contextData: Record<string, EntityValue>): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      contextHash: this.hashContext(contextData)
    };
    
    this.cache.set(cacheKey, entry);
    
    // Cleanup old entries
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.TTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
```

### 3. **Background Prefetching**

```typescript
// Prefetch defaults when user hovers over process button
const usePrefetchProcessDefaults = () => {
  const prefetchCache = useRef(new Map<string, Promise<ProcessDefaultsResponse>>());

  const prefetch = useCallback(async (
    processId: string,
    windowId: string,
    contextData: Record<string, EntityValue> = {}
  ) => {
    const cacheKey = `${processId}:${windowId}`;
    
    if (prefetchCache.current.has(cacheKey)) {
      return; // Already prefetching
    }
    
    const prefetchPromise = fetchProcessDefaults(processId, windowId, contextData);
    prefetchCache.current.set(cacheKey, prefetchPromise);
    
    // Clean up after prefetch completes
    prefetchPromise.finally(() => {
      setTimeout(() => prefetchCache.current.delete(cacheKey), 30000);
    });
  }, []);

  return { prefetch };
};

// Usage in process button component
const ProcessButton = ({ processId, windowId, ...props }) => {
  const { prefetch } = usePrefetchProcessDefaults();
  const { record } = useTabContext();

  const contextData = useMemo(() => 
    buildPayloadByInputName(record, tab.fields), 
    [record, tab.fields]
  );

  return (
    <button
      {...props}
      onMouseEnter={() => prefetch(processId, windowId, contextData)}
      onFocus={() => prefetch(processId, windowId, contextData)}
    >
      Execute Process
    </button>
  );
};
```

## 📊 Monitoring and Analytics

### Performance Metrics

```typescript
interface ProcessDefaultsMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  largestResponseSize: number;
}

class ProcessDefaultsMonitor {
  private metrics: ProcessDefaultsMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    largestResponseSize: 0
  };

  recordRequest(
    duration: number,
    success: boolean,
    responseSize: number,
    fromCache: boolean
  ): void {
    this.metrics.requestCount++;
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + duration) / 
      this.metrics.requestCount;
    
    // Update error rate
    if (!success) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.requestCount - 1) + 1) / 
        this.metrics.requestCount;
    }
    
    // Update cache hit rate
    if (fromCache) {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * (this.metrics.requestCount - 1) + 1) / 
        this.metrics.requestCount;
    }
    
    // Track largest response
    if (responseSize > this.metrics.largestResponseSize) {
      this.metrics.largestResponseSize = responseSize;
    }
  }

  getMetrics(): ProcessDefaultsMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      largestResponseSize: 0
    };
  }
}
```

### Usage Analytics

```typescript
// Track process defaults usage patterns
const trackDefaultsUsage = (
  processId: string,
  fieldsWithDefaults: string[],
  userModifiedFields: string[]
) => {
  analytics.track('process_defaults_loaded', {
    processId,
    defaultsCount: fieldsWithDefaults.length,
    userModifications: userModifiedFields.length,
    modificationRate: userModifiedFields.length / fieldsWithDefaults.length
  });
};
```

## 🚀 Best Practices

### 1. **Request Timing**
- Fetch defaults as early as possible (when modal opens)
- Don't wait for user interaction
- Use loading states to manage user expectations

### 2. **Error Resilience**
- Always provide fallback behavior
- Never block user workflow due to defaults failure
- Log errors for monitoring but continue gracefully

### 3. **Context Optimization**
- Only send relevant context data
- Use efficient serialization
- Consider data compression for large contexts

### 4. **Caching Strategy**
- Cache based on process + context combination
- Implement appropriate TTL (5 minutes recommended)
- Clear cache on relevant data changes

### 5. **Performance Monitoring**
- Track response times
- Monitor error rates
- Measure cache effectiveness
- Alert on performance degradation

---

This API integration approach ensures reliable, performant, and user-friendly process defaults functionality while maintaining system stability and providing comprehensive error handling.
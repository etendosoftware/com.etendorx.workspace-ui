# Technical Proposal: DefaultsProcessActionHandler Integration

## Executive Summary

This document outlines a comprehensive technical design for integrating the DefaultsProcessActionHandler into our ProcessModal system. The integration will enable pre-population of process parameters with default values while maintaining system performance, type safety, and user experience standards.

## 1. Architecture Overview

### 1.1 High-Level Component Interaction

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  ProcessDefinition  │    │  useProcessDefaults │    │ DefaultsActionHandler│
│      Modal          │───▶│      Hook           │───▶│    Backend API      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                          │                          │
           │                          ▼                          │
           │               ┌─────────────────────┐               │
           │               │   React Hook Form   │               │
           │               │   (Form Population) │               │
           │               └─────────────────────┘               │
           │                          │                          │
           ▼                          ▼                          │
┌─────────────────────┐    ┌─────────────────────┐               │
│ ProcessParameter    │    │ ProcessParameter    │               │
│    Selector         │    │     Mapper          │               │
└─────────────────────┘    └─────────────────────┘               │
                                                                  │
                           ┌─────────────────────┐               │
                           │    Error Handler    │◀──────────────┘
                           │   & Retry Logic     │
                           └─────────────────────┘
```

### 1.2 Data Flow Architecture

1. **Modal Open Trigger**: ProcessDefinitionModal receives process parameters
2. **Context Assembly**: Current record values + session data assembled into request payload
3. **API Call**: useProcessDefaults hook calls DefaultsProcessActionHandler endpoint
4. **Response Processing**: Backend returns field defaults with validation
5. **Form Population**: React Hook Form populated with default values
6. **UI Rendering**: ProcessParameterSelector components render with pre-filled values
7. **User Interaction**: Users can override defaults or proceed with pre-filled values

### 1.3 Integration Points

- **Existing Hook Integration**: Extends current `useProcessConfig` hook pattern
- **Form System Integration**: Seamless integration with React Hook Form
- **Selector Integration**: Works with existing ProcessParameterSelector architecture
- **Error System Integration**: Leverages existing error handling patterns

## 2. API Integration Design

### 2.1 Hook Design Pattern (useProcessDefaults)

```typescript
// Enhanced interface extending current useProcessConfig
interface UseProcessDefaultsProps {
  processId: string;
  windowId: string;
  tabId?: string;
  enabled?: boolean; // Feature flag support
  retryAttempts?: number;
  timeout?: number;
}

interface ProcessDefaultsResponse {
  processId: string;
  defaults: Record<string, DefaultValue>;
  metadata?: {
    timestamp: number;
    version: string;
    partial: boolean; // Indicates if some defaults failed to load
  };
}

interface DefaultValue {
  value: string | number | boolean;
  identifier: string;
  displayValue?: string;
  metadata?: {
    source: 'calculated' | 'static' | 'derived';
    confidence: number;
  };
}

// Hook implementation strategy
export const useProcessDefaults = (props: UseProcessDefaultsProps) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProcessDefaultsError | null>(null);
  const [defaults, setDefaults] = useState<ProcessDefaultsResponse | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  
  // Caching strategy
  const cacheKey = useMemo(() => 
    `defaults_${props.processId}_${props.windowId}_${props.tabId}`, 
    [props.processId, props.windowId, props.tabId]
  );
  
  // Request deduplication
  const { mutateAsync: fetchDefaults } = useMutation({
    mutationKey: [cacheKey],
    mutationFn: fetchDefaultsAPI,
    retry: props.retryAttempts || 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
  
  return {
    fetchDefaults,
    loading,
    error,
    defaults,
    isCached: !!lastFetched && (Date.now() - lastFetched) < 60000, // 1 minute cache
    refetch: () => fetchDefaults(/* payload */),
  };
};
```

### 2.2 Request/Response Payload Structure

**Request Payload**:
```typescript
interface DefaultsRequest {
  // Process identification
  processId: string;
  windowId: string;
  tabId?: string;
  
  // Current context data
  recordContext: Record<string, EntityValue>;
  sessionContext: {
    userId: string;
    roleId: string;
    clientId: string;
    organizationId: string;
    warehouseId?: string;
    // Additional session variables
  };
  
  // Process-specific context
  selectedRecords?: string[];
  gridSelection?: unknown[];
  
  // Request metadata
  requestId: string; // For tracing
  timestamp: number;
  clientVersion: string;
}
```

**Response Payload**:
```typescript
interface DefaultsResponse {
  success: boolean;
  requestId: string;
  
  defaults: Record<string, {
    value: EntityValue;
    identifier: string;
    displayValue?: string;
    readonly?: boolean;
    source: 'calculated' | 'static' | 'derived' | 'inherited';
  }>;
  
  // Error handling
  errors?: Array<{
    fieldName: string;
    code: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  
  // Performance metadata
  metadata: {
    executionTime: number;
    cacheHit: boolean;
    partial: boolean; // Some defaults failed to calculate
    version: string;
  };
}
```

### 2.3 Error Handling and Retry Logic

```typescript
class ProcessDefaultsError extends Error {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'PARTIAL_FAILURE';
  details: Record<string, unknown>;
  retryable: boolean;
}

const errorHandlingStrategy = {
  NETWORK_ERROR: { retry: true, maxAttempts: 3, backoff: 'exponential' },
  TIMEOUT: { retry: true, maxAttempts: 2, backoff: 'linear' },
  VALIDATION_ERROR: { retry: false, fallback: 'graceful' },
  PARTIAL_FAILURE: { retry: false, fallback: 'partial' },
};
```

### 2.4 Loading State Management

```typescript
interface LoadingState {
  isLoading: boolean;
  isRetrying: boolean;
  attempt: number;
  estimatedCompletion?: number;
}

// Progressive loading strategy
const loadingStates = {
  IDLE: 'Ready to fetch defaults',
  FETCHING: 'Loading process defaults...',
  RETRYING: 'Retrying defaults fetch...',
  PARTIAL: 'Some defaults loaded',
  COMPLETE: 'All defaults loaded',
  ERROR: 'Failed to load defaults',
};
```

## 3. Form Integration Strategy

### 3.1 React Hook Form Population

```typescript
// Integration in ProcessDefinitionModal
const ProcessDefinitionModalContent = ({ ... }) => {
  const form = useForm();
  const { fetchDefaults, loading, error, defaults } = useProcessDefaults({
    processId,
    windowId,
    tabId,
    enabled: open, // Only fetch when modal is open
  });

  // Populate form with defaults
  useEffect(() => {
    if (defaults?.defaults && open) {
      const formValues: Record<string, unknown> = {};
      
      Object.entries(defaults.defaults).forEach(([fieldName, defaultValue]) => {
        // Map field names through ProcessParameterMapper
        const mappedField = ProcessParameterMapper.mapToField(
          parameters[fieldName] || { name: fieldName }
        );
        
        formValues[mappedField.hqlName] = defaultValue.value;
      });
      
      // Batch set form values to prevent multiple re-renders
      form.reset(formValues);
    }
  }, [defaults, open, form, parameters]);
  
  // ... rest of component
};
```

### 3.2 Field Name Mapping Strategy

```typescript
// Enhanced ProcessParameterMapper
export class ProcessParameterMapper {
  /**
   * Maps backend field names to form field names
   */
  static mapDefaultsToFormFields(
    defaults: Record<string, DefaultValue>,
    parameters: Record<string, ProcessParameter>
  ): Record<string, unknown> {
    const formValues: Record<string, unknown> = {};
    
    Object.entries(defaults).forEach(([backendFieldName, defaultValue]) => {
      // Find matching parameter
      const parameter = Object.values(parameters).find(p => 
        p.dBColumnName === backendFieldName || 
        p.name === backendFieldName ||
        p.id === backendFieldName
      );
      
      if (parameter) {
        const mappedField = this.mapToField(parameter);
        const formFieldName = mappedField.hqlName || mappedField.inputName;
        
        // Type conversion based on field type
        formValues[formFieldName] = this.convertValueByType(
          defaultValue.value,
          parameter.reference
        );
      }
    });
    
    return formValues;
  }
  
  /**
   * Converts backend values to appropriate form types
   */
  private static convertValueByType(value: EntityValue, reference: string): unknown {
    const fieldType = this.getFieldType({ reference } as ProcessParameter);
    
    switch (fieldType) {
      case 'boolean':
        return value === 'Y' || value === true || value === '1';
      case 'numeric':
      case 'quantity':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'date':
      case 'datetime':
        return value ? new Date(value as string) : null;
      default:
        return value;
    }
  }
}
```

### 3.3 Validation Interaction with Defaults

```typescript
// Enhanced validation that considers defaults
const validationSchema = useMemo(() => {
  return createDynamicValidationSchema(parameters, defaults?.defaults);
}, [parameters, defaults]);

// Validation schema factory
function createDynamicValidationSchema(
  parameters: Record<string, ProcessParameter>,
  defaults?: Record<string, DefaultValue>
) {
  const schema: Record<string, ValidationRule> = {};
  
  Object.values(parameters).forEach(param => {
    const fieldName = param.dBColumnName || param.name;
    const hasDefault = defaults?.[fieldName];
    
    schema[fieldName] = {
      required: param.mandatory && !hasDefault,
      validation: param.validation,
      // Custom validation for fields with defaults
      customValidation: hasDefault ? 
        (value) => validateDefaultValue(value, defaults[fieldName]) : 
        undefined,
    };
  });
  
  return schema;
}
```

### 3.4 User Interaction Flow

```
User Opens Modal
       │
       ▼
Loading State (Spinner + "Loading defaults...")
       │
       ▼
API Call (useProcessDefaults)
       │
       ├─── Success ────▶ Form Pre-populated ────▶ User can override
       │                        │
       │                        ▼
       │                Execute with values (defaults + overrides)
       │
       ├─── Partial ────▶ Some fields pre-populated ────▶ Warning message
       │                        │
       │                        ▼
       │                User fills remaining + executes
       │
       └─── Error ──────▶ Empty form + Error message ────▶ User fills manually
                               │
                               ▼
                        Retry button available
```

## 4. Performance Considerations

### 4.1 API Call Timing Strategy

**Option A: Modal Open (Recommended)**
- **Trigger**: When modal opens (`open === true`)
- **Pros**: Immediate feedback, clear loading state
- **Cons**: Blocks modal rendering briefly
- **Performance Impact**: ~150ms delay on modal open

**Option B: Lazy Load**
- **Trigger**: After modal renders, in background
- **Pros**: Modal opens immediately
- **Cons**: Defaults arrive after user might start typing
- **Performance Impact**: Minimal modal delay, but UX confusion

**Chosen Strategy**: Option A with optimizations:
```typescript
// Pre-fetch defaults when modal is likely to open
const { prefetchDefaults } = useProcessDefaults({
  processId,
  windowId,
  tabId,
  enabled: false, // Don't auto-fetch
});

// Pre-fetch on button hover or focus
const handleButtonHover = useCallback(() => {
  prefetchDefaults(currentRecordContext);
}, [prefetchDefaults, currentRecordContext]);
```

### 4.2 Caching Strategy

```typescript
// Multi-level caching approach
interface CacheStrategy {
  // Level 1: In-memory cache (React Query)
  memory: {
    ttl: 60000; // 1 minute
    maxSize: 50; // 50 different process contexts
  };
  
  // Level 2: Session storage (across modal opens)
  session: {
    ttl: 300000; // 5 minutes
    keyPrefix: 'process_defaults_';
  };
  
  // Level 3: Smart invalidation
  invalidation: {
    onRecordChange: boolean;
    onSessionChange: boolean;
    onProcessUpdate: boolean;
  };
}

// Cache key generation
const generateCacheKey = (
  processId: string,
  windowId: string,
  recordId?: string,
  contextHash?: string
): string => {
  return `defaults_${processId}_${windowId}_${recordId || 'new'}_${contextHash || 'empty'}`;
};
```

### 4.3 Concurrent Request Handling

```typescript
// Request deduplication using React Query
const requestDeduplication = {
  // Prevent duplicate requests for same process+context
  deduplication: true,
  
  // Background refetch for stale data
  staleTime: 30000, // 30 seconds
  
  // Aggressive caching for identical contexts
  cacheTime: 300000, // 5 minutes
  
  // Optimistic updates
  optimisticUpdates: false, // Disabled for defaults
};

// Concurrent modal handling
const ConcurrentModalManager = {
  activeRequests: new Map<string, Promise<ProcessDefaultsResponse>>(),
  
  getOrCreateRequest(key: string, requestFn: () => Promise<ProcessDefaultsResponse>) {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }
    
    const request = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });
    
    this.activeRequests.set(key, request);
    return request;
  }
};
```

### 4.4 Bundle Size Impact

```typescript
// Lazy loading strategy for defaults functionality
const useProcessDefaults = lazy(() => 
  import('./hooks/useProcessDefaults').then(module => ({
    default: module.useProcessDefaults
  }))
);

// Tree-shaking friendly imports
import { 
  type ProcessDefaultsResponse,
  type DefaultValue 
} from './types/processDefaults'; // Types only, no runtime

// Conditional loading based on feature flag
const DefaultsProvider = ({ children, enabled }: Props) => {
  if (!enabled) return <>{children}</>;
  
  return (
    <Suspense fallback={<DefaultsFallback />}>
      <EnhancedProcessModal>
        {children}
      </EnhancedProcessModal>
    </Suspense>
  );
};
```

**Estimated Bundle Impact**:
- New hook: ~2KB gzipped
- Type definitions: 0KB (TypeScript compile-time)
- Enhanced error handling: ~1KB gzipped
- Total impact: ~3KB gzipped

## 5. Error Handling & Resilience

### 5.1 Network Failure Scenarios

```typescript
// Network error classification and handling
enum NetworkErrorType {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

const networkErrorHandlers = {
  [NetworkErrorType.TIMEOUT]: {
    retry: true,
    maxAttempts: 2,
    backoffMs: [1000, 3000],
    fallback: 'graceful',
    userMessage: 'Loading defaults is taking longer than expected. Continue without defaults?',
  },
  
  [NetworkErrorType.CONNECTION_FAILED]: {
    retry: true,
    maxAttempts: 3,
    backoffMs: [500, 1500, 5000],
    fallback: 'graceful',
    userMessage: 'Unable to load default values. You can fill the form manually.',
  },
  
  [NetworkErrorType.SERVER_ERROR]: {
    retry: false,
    fallback: 'graceful',
    userMessage: 'Default values are temporarily unavailable. Please fill the form manually.',
    reportError: true,
  },
  
  [NetworkErrorType.RATE_LIMITED]: {
    retry: true,
    maxAttempts: 1,
    backoffMs: [10000], // 10 second delay
    fallback: 'graceful',
    userMessage: 'Too many requests. Please try again in a moment.',
  },
};
```

### 5.2 Partial Response Handling

```typescript
interface PartialDefaultsResponse {
  success: boolean;
  partial: true;
  
  // Successfully loaded defaults
  defaults: Record<string, DefaultValue>;
  
  // Failed fields with reasons
  failures: Array<{
    fieldName: string;
    error: string;
    severity: 'warning' | 'error';
    retryable: boolean;
  }>;
  
  // Statistics
  stats: {
    total: number;
    successful: number;
    failed: number;
    completionPercentage: number;
  };
}

// Partial response UI handling
const PartialDefaultsIndicator = ({ response }: { response: PartialDefaultsResponse }) => {
  const { stats, failures } = response;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
      <div className="flex">
        <WarningIcon className="h-5 w-5 text-yellow-400" />
        <div className="ml-3">
          <h4 className="text-sm font-medium text-yellow-800">
            Partial Defaults Loaded ({stats.completionPercentage}%)
          </h4>
          <p className="text-sm text-yellow-700">
            {stats.successful} of {stats.total} default values loaded. 
            Please fill the remaining fields manually.
          </p>
          {failures.some(f => f.retryable) && (
            <button 
              className="mt-2 text-sm text-yellow-800 underline"
              onClick={/* retry failed fields */}
            >
              Retry failed fields
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 5.3 Fallback Strategies

```typescript
enum FallbackStrategy {
  GRACEFUL = 'graceful',     // Continue without defaults
  CACHED = 'cached',         // Use last successful defaults
  STATIC = 'static',         // Use static defaults from metadata
  HYBRID = 'hybrid',         // Mix of cached and static
}

const fallbackImplementation = {
  [FallbackStrategy.GRACEFUL]: (parameters: ProcessParameter[]) => {
    // Modal continues with empty form
    // User gets informational message
    return {
      defaults: {},
      message: 'Default values unavailable. Please fill the form manually.',
      severity: 'info' as const,
    };
  },
  
  [FallbackStrategy.CACHED]: (cacheKey: string) => {
    // Attempt to use session storage cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return {
        defaults: JSON.parse(cached),
        message: 'Using previously loaded defaults.',
        severity: 'warning' as const,
      };
    }
    return fallbackImplementation[FallbackStrategy.GRACEFUL]([]);
  },
  
  [FallbackStrategy.STATIC]: (parameters: ProcessParameter[]) => {
    // Use default values from parameter metadata
    const staticDefaults: Record<string, DefaultValue> = {};
    
    Object.values(parameters).forEach(param => {
      if (param.defaultValue) {
        staticDefaults[param.name] = {
          value: param.defaultValue,
          identifier: param.defaultValue,
          source: 'static',
        };
      }
    });
    
    return {
      defaults: staticDefaults,
      message: 'Using static default values.',
      severity: 'warning' as const,
    };
  },
};
```

### 5.4 User Feedback Mechanisms

```typescript
// Error boundary for defaults functionality
class ProcessDefaultsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    logger.error('ProcessDefaults Error Boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      processId: this.props.processId,
      timestamp: Date.now(),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
          <h3 className="text-red-800 font-medium">Default Values Unavailable</h3>
          <p className="text-red-600 text-sm mt-1">
            There was an error loading default values. You can continue filling the form manually.
          </p>
          <button 
            className="mt-2 text-red-700 underline text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Progressive error messages
const ErrorMessageProgression = {
  attempt1: 'Loading default values...',
  attempt2: 'Retrying default values...',
  attempt3: 'Having trouble loading defaults...',
  failed: 'Unable to load default values. Continue without defaults?',
};
```

## 6. Type Safety & Data Validation

### 6.1 TypeScript Interfaces

```typescript
// Comprehensive type definitions
interface ProcessDefaultsAPI {
  request: DefaultsRequest;
  response: DefaultsResponse;
  error: ProcessDefaultsError;
}

// Runtime validation schemas
const DefaultsRequestSchema = z.object({
  processId: z.string().min(1),
  windowId: z.string().min(1),
  tabId: z.string().optional(),
  recordContext: z.record(z.unknown()),
  sessionContext: z.object({
    userId: z.string(),
    roleId: z.string(),
    clientId: z.string(),
    organizationId: z.string(),
  }),
  selectedRecords: z.array(z.string()).optional(),
  requestId: z.string().uuid(),
  timestamp: z.number(),
  clientVersion: z.string(),
});

const DefaultsResponseSchema = z.object({
  success: z.boolean(),
  requestId: z.string().uuid(),
  defaults: z.record(z.object({
    value: z.unknown(),
    identifier: z.string(),
    displayValue: z.string().optional(),
    readonly: z.boolean().optional(),
    source: z.enum(['calculated', 'static', 'derived', 'inherited']),
  })),
  errors: z.array(z.object({
    fieldName: z.string(),
    code: z.string(),
    message: z.string(),
    severity: z.enum(['warning', 'error']),
  })).optional(),
  metadata: z.object({
    executionTime: z.number(),
    cacheHit: z.boolean(),
    partial: z.boolean(),
    version: z.string(),
  }),
});
```

### 6.2 Runtime Validation Strategies

```typescript
// Request validation before sending
const validateDefaultsRequest = (request: unknown): DefaultsRequest => {
  try {
    return DefaultsRequestSchema.parse(request);
  } catch (error) {
    throw new ProcessDefaultsError('VALIDATION_ERROR', {
      message: 'Invalid request format',
      details: error instanceof z.ZodError ? error.errors : error,
      retryable: false,
    });
  }
};

// Response validation after receiving
const validateDefaultsResponse = (response: unknown): DefaultsResponse => {
  try {
    return DefaultsResponseSchema.parse(response);
  } catch (error) {
    throw new ProcessDefaultsError('VALIDATION_ERROR', {
      message: 'Invalid response format from server',
      details: error instanceof z.ZodError ? error.errors : error,
      retryable: true, // Server might send correct format on retry
    });
  }
};
```

### 6.3 Field Type Compatibility Checking

```typescript
// Type compatibility matrix
const TYPE_COMPATIBILITY_MATRIX = {
  // Backend type -> Frontend field types (compatible)
  'String': ['text', 'password', 'list'],
  'Integer': ['numeric', 'quantity'],
  'Decimal': ['numeric', 'quantity'],
  'Boolean': ['boolean'],
  'Date': ['date'],
  'DateTime': ['datetime'],
  'TableDir': ['tabledir', 'select'],
  'Product': ['product', 'tabledir'],
  'List': ['list', 'select'],
} as const;

class TypeCompatibilityChecker {
  static isCompatible(
    backendType: string, 
    frontendFieldType: string
  ): boolean {
    const compatibleTypes = TYPE_COMPATIBILITY_MATRIX[backendType as keyof typeof TYPE_COMPATIBILITY_MATRIX];
    return compatibleTypes?.includes(frontendFieldType as any) ?? false;
  }
  
  static validateDefaultValue(
    value: unknown,
    expectedType: string,
    parameter: ProcessParameter
  ): ValidationResult {
    const fieldType = ProcessParameterMapper.getFieldType(parameter);
    
    // Type-specific validation
    switch (fieldType) {
      case 'boolean':
        if (typeof value !== 'boolean' && !['Y', 'N', '1', '0', 'true', 'false'].includes(String(value))) {
          return {
            valid: false,
            error: `Boolean field expects Y/N/1/0/true/false, got: ${value}`,
            correctedValue: false,
          };
        }
        break;
        
      case 'numeric':
      case 'quantity':
        if (isNaN(Number(value))) {
          return {
            valid: false,
            error: `Numeric field expects number, got: ${value}`,
            correctedValue: 0,
          };
        }
        break;
        
      case 'date':
      case 'datetime':
        if (value && !isValidDate(new Date(String(value)))) {
          return {
            valid: false,
            error: `Date field expects valid date, got: ${value}`,
            correctedValue: null,
          };
        }
        break;
    }
    
    return { valid: true, value };
  }
}

interface ValidationResult {
  valid: boolean;
  value?: unknown;
  error?: string;
  correctedValue?: unknown;
}
```

## 7. Testing Strategy

### 7.1 Unit Testing Approach

```typescript
// Test structure for useProcessDefaults hook
describe('useProcessDefaults', () => {
  // Core functionality tests
  describe('Core Functionality', () => {
    it('should fetch defaults successfully', async () => {
      const mockResponse = createMockDefaultsResponse();
      mockAPI.post.mockResolvedValue({ data: mockResponse });
      
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
      }));
      
      await act(async () => {
        const defaults = await result.current.fetchDefaults(mockPayload);
        expect(defaults).toEqual(mockResponse);
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
    
    it('should handle empty defaults gracefully', async () => {
      mockAPI.post.mockResolvedValue({ data: { defaults: {} } });
      
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
      }));
      
      await act(async () => {
        const defaults = await result.current.fetchDefaults();
        expect(defaults.defaults).toEqual({});
      });
      
      expect(result.current.error).toBe(null);
    });
  });
  
  // Error handling tests
  describe('Error Handling', () => {
    it('should retry on network errors', async () => {
      mockAPI.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: createMockDefaultsResponse() });
      
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
        retryAttempts: 2,
      }));
      
      await act(async () => {
        await result.current.fetchDefaults();
      });
      
      expect(mockAPI.post).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBe(null);
    });
    
    it('should not retry on validation errors', async () => {
      mockAPI.post.mockRejectedValue(new ProcessDefaultsError('VALIDATION_ERROR', {
        message: 'Invalid request',
        retryable: false,
      }));
      
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
        retryAttempts: 3,
      }));
      
      await act(async () => {
        await result.current.fetchDefaults();
      });
      
      expect(mockAPI.post).toHaveBeenCalledTimes(1);
      expect(result.current.error?.code).toBe('VALIDATION_ERROR');
    });
  });
  
  // Performance tests
  describe('Performance', () => {
    it('should deduplicate concurrent requests', async () => {
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
      }));
      
      // Start multiple concurrent requests
      const promises = [
        result.current.fetchDefaults(),
        result.current.fetchDefaults(),
        result.current.fetchDefaults(),
      ];
      
      await act(async () => {
        await Promise.all(promises);
      });
      
      // API should only be called once due to deduplication
      expect(mockAPI.post).toHaveBeenCalledTimes(1);
    });
    
    it('should cache results for repeated calls', async () => {
      const { result } = renderHook(() => useProcessDefaults({
        processId: 'test-process',
        windowId: 'test-window',
      }));
      
      await act(async () => {
        await result.current.fetchDefaults();
        await result.current.fetchDefaults(); // Should use cache
      });
      
      expect(mockAPI.post).toHaveBeenCalledTimes(1);
      expect(result.current.isCached).toBe(true);
    });
  });
});
```

### 7.2 Integration Testing Scenarios

```typescript
// ProcessDefinitionModal integration tests
describe('ProcessDefinitionModal Integration', () => {
  describe('Defaults Loading Flow', () => {
    it('should load defaults on modal open and populate form', async () => {
      const mockDefaults = {
        'field1': { value: 'default1', identifier: 'id1' },
        'field2': { value: 'default2', identifier: 'id2' },
      };
      
      mockAPI.post.mockResolvedValue({ 
        data: { defaults: mockDefaults } 
      });
      
      const { rerender } = render(
        <ProcessDefinitionModal 
          button={mockProcessButton}
          open={false}
          onClose={jest.fn()}
        />
      );
      
      // Open modal
      rerender(
        <ProcessDefinitionModal 
          button={mockProcessButton}
          open={true}
          onClose={jest.fn()}
        />
      );
      
      // Wait for defaults to load
      await waitFor(() => {
        expect(screen.queryByText('Loading defaults...')).not.toBeInTheDocument();
      });
      
      // Check form is populated
      expect(screen.getByDisplayValue('default1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('default2')).toBeInTheDocument();
    });
    
    it('should handle partial defaults gracefully', async () => {
      const partialResponse = {
        success: true,
        partial: true,
        defaults: { 'field1': { value: 'default1', identifier: 'id1' } },
        failures: [
          { fieldName: 'field2', error: 'Calculation failed', severity: 'warning' }
        ],
        stats: { total: 2, successful: 1, failed: 1, completionPercentage: 50 }
      };
      
      mockAPI.post.mockResolvedValue({ data: partialResponse });
      
      render(
        <ProcessDefinitionModal 
          button={mockProcessButton}
          open={true}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Partial Defaults Loaded \(50%\)/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('default1')).toBeInTheDocument();
        expect(screen.getByText(/Please fill the remaining fields manually/)).toBeInTheDocument();
      });
    });
  });
  
  describe('User Interaction Flow', () => {
    it('should allow users to override default values', async () => {
      const mockDefaults = {
        'textField': { value: 'defaultText', identifier: 'defaultText' },
      };
      
      mockAPI.post.mockResolvedValue({ 
        data: { defaults: mockDefaults } 
      });
      
      render(
        <ProcessDefinitionModal 
          button={mockProcessButton}
          open={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('defaultText')).toBeInTheDocument();
      });
      
      // User overrides default value
      const textInput = screen.getByDisplayValue('defaultText');
      fireEvent.change(textInput, { target: { value: 'userValue' } });
      
      expect(textInput).toHaveValue('userValue');
      
      // Execute process with user value
      fireEvent.click(screen.getByRole('button', { name: /execute/i }));
      
      await waitFor(() => {
        expect(mockProcessAPI.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            textField: 'userValue'
          })
        );
      });
    });
  });
});
```

### 7.3 Error Condition Testing

```typescript
describe('Error Conditions', () => {
  it('should handle API timeout gracefully', async () => {
    jest.useFakeTimers();
    
    mockAPI.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 10000))
    );
    
    render(
      <ProcessDefinitionModal 
        button={mockProcessButton}
        open={true}
        onClose={jest.fn()}
      />
    );
    
    // Fast-forward past timeout
    act(() => {
      jest.advanceTimersByTime(6000); // 6 second timeout
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Loading defaults is taking longer than expected/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue without defaults/i })).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
  
  it('should recover from network failures', async () => {
    mockAPI.post
      .mockRejectedValueOnce(new Error('Network failed'))
      .mockResolvedValueOnce({ 
        data: { defaults: { field1: { value: 'recovered', identifier: 'recovered' } } }
      });
    
    render(
      <ProcessDefinitionModal 
        button={mockProcessButton}
        open={true}
        onClose={jest.fn()}
      />
    );
    
    // Wait for retry to succeed
    await waitFor(() => {
      expect(screen.getByDisplayValue('recovered')).toBeInTheDocument();
    });
    
    expect(mockAPI.post).toHaveBeenCalledTimes(2);
  });
  
  it('should provide fallback when all retries fail', async () => {
    mockAPI.post.mockRejectedValue(new Error('Persistent failure'));
    
    render(
      <ProcessDefinitionModal 
        button={mockProcessButton}
        open={true}
        onClose={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to load default values/)).toBeInTheDocument();
      expect(screen.getByText(/You can fill the form manually/)).toBeInTheDocument();
    });
    
    // Form should still be functional
    expect(screen.getByRole('button', { name: /execute/i })).toBeEnabled();
  });
});
```

### 7.4 Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should complete defaults loading within 200ms for typical payloads', async () => {
    const startTime = performance.now();
    
    mockAPI.post.mockResolvedValue({ 
      data: { 
        defaults: generateMockDefaults(10), // 10 fields
        metadata: { executionTime: 150 }
      } 
    });
    
    render(
      <ProcessDefinitionModal 
        button={mockProcessButton}
        open={true}
        onClose={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading defaults...')).not.toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(200); // 200ms SLA
  });
  
  it('should handle large payloads (50+ fields) within 500ms', async () => {
    const startTime = performance.now();
    
    mockAPI.post.mockResolvedValue({ 
      data: { 
        defaults: generateMockDefaults(50), // 50 fields
        metadata: { executionTime: 400 }
      } 
    });
    
    render(
      <ProcessDefinitionModal 
        button={mockProcessButton}
        open={true}
        onClose={jest.fn()}
      />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading defaults...')).not.toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(500); // Extended SLA for large forms
  });
  
  it('should not cause memory leaks with repeated modal opens', async () => {
    const initialHeapUsed = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Open and close modal 100 times
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <ProcessDefinitionModal 
          button={mockProcessButton}
          open={true}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.queryByText('Loading defaults...')).not.toBeInTheDocument();
      });
      
      unmount();
    }
    
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    const finalHeapUsed = (performance as any).memory?.usedJSHeapSize || 0;
    const heapGrowth = finalHeapUsed - initialHeapUsed;
    
    // Heap growth should be minimal (< 1MB)
    expect(heapGrowth).toBeLessThan(1024 * 1024);
  });
});
```

## 8. Migration & Rollout Plan

### 8.1 Backwards Compatibility Strategy

```typescript
// Feature flag implementation
interface ProcessModalFeatureFlags {
  enableDefaults: boolean;
  enableDefaultsCaching: boolean;
  enableDefaultsRetry: boolean;
  defaultsTimeout: number;
}

// Default feature flags (conservative rollout)
const DEFAULT_FEATURE_FLAGS: ProcessModalFeatureFlags = {
  enableDefaults: false, // Disabled by default initially
  enableDefaultsCaching: true,
  enableDefaultsRetry: true,
  defaultsTimeout: 5000,
};

// Environment-based configuration
const getFeatureFlags = (): ProcessModalFeatureFlags => {
  const env = process.env.NODE_ENV;
  const flags = { ...DEFAULT_FEATURE_FLAGS };
  
  // Enable in development for testing
  if (env === 'development') {
    flags.enableDefaults = true;
  }
  
  // Check runtime feature flags
  if (window.__ETENDO_FEATURE_FLAGS__?.processDefaults) {
    flags.enableDefaults = true;
  }
  
  return flags;
};

// Backwards compatible ProcessDefinitionModal
const ProcessDefinitionModalContent = ({ ... }) => {
  const featureFlags = getFeatureFlags();
  
  // Conditional defaults loading
  const defaultsHook = featureFlags.enableDefaults 
    ? useProcessDefaults({ processId, windowId, tabId })
    : { defaults: null, loading: false, error: null };
  
  // Rest of component logic remains the same
  // ...
};
```

### 8.2 Feature Flag Approach

```typescript
// Centralized feature flag management
class FeatureFlagManager {
  private static flags: Map<string, boolean> = new Map();
  
  static initialize(remoteFlags: Record<string, boolean>) {
    // Merge remote flags with local overrides
    Object.entries(remoteFlags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
    
    // Development overrides
    if (process.env.NODE_ENV === 'development') {
      const devOverrides = {
        'process.defaults.enabled': true,
        'process.defaults.caching': true,
        'process.defaults.retry': true,
      };
      
      Object.entries(devOverrides).forEach(([key, value]) => {
        this.flags.set(key, value);
      });
    }
  }
  
  static isEnabled(flagName: string): boolean {
    return this.flags.get(flagName) ?? false;
  }
  
  static getFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }
}

// Usage in components
const useFeatureFlag = (flagName: string) => {
  return FeatureFlagManager.isEnabled(flagName);
};

// Component usage
const ProcessDefinitionModalContent = ({ ... }) => {
  const isDefaultsEnabled = useFeatureFlag('process.defaults.enabled');
  const isCachingEnabled = useFeatureFlag('process.defaults.caching');
  
  // Conditional hook usage
  const defaultsConfig = useMemo(() => ({
    processId,
    windowId,
    tabId,
    enabled: isDefaultsEnabled,
    caching: isCachingEnabled,
  }), [processId, windowId, tabId, isDefaultsEnabled, isCachingEnabled]);
  
  const { defaults, loading, error } = useProcessDefaults(defaultsConfig);
  
  // ...
};
```

### 8.3 Gradual Rollout Phases

**Phase 1: Development & Testing (Weeks 1-2)**
```typescript
// Enable for development and internal testing only
const PHASE_1_FLAGS = {
  'process.defaults.enabled': process.env.NODE_ENV === 'development',
  'process.defaults.beta_testers': false,
  'process.defaults.percentage': 0,
};

// Opt-in beta testing
const isBetaTester = (userId: string): boolean => {
  const betaTesters = [
    'developer1@company.com',
    'qa1@company.com',
    'product1@company.com',
  ];
  return betaTesters.includes(userId);
};
```

**Phase 2: Beta Users (Weeks 3-4)**
```typescript
// Enable for selected beta users
const PHASE_2_FLAGS = {
  'process.defaults.enabled': true,
  'process.defaults.beta_testers': true,
  'process.defaults.percentage': 5, // 5% of all users
};

// Percentage-based rollout
const isInPercentageRollout = (userId: string, percentage: number): boolean => {
  const hash = hashString(userId);
  return (hash % 100) < percentage;
};
```

**Phase 3: Gradual Production (Weeks 5-8)**
```typescript
// Gradual increase in production
const PHASE_3_SCHEDULE = [
  { week: 5, percentage: 10 },
  { week: 6, percentage: 25 },
  { week: 7, percentage: 50 },
  { week: 8, percentage: 100 },
];

// Process-specific rollout
const PROCESS_ROLLOUT_PRIORITY = [
  'simple-processes',     // Week 5
  'medium-processes',     // Week 6
  'complex-processes',    // Week 7
  'critical-processes',   // Week 8
];
```

**Phase 4: Full Production (Week 9+)**
```typescript
// Full rollout with monitoring
const PHASE_4_FLAGS = {
  'process.defaults.enabled': true,
  'process.defaults.beta_testers': true,
  'process.defaults.percentage': 100,
  'process.defaults.monitoring': true,
};
```

### 8.4 Monitoring and Rollback Plan

```typescript
// Monitoring metrics
interface DefaultsMetrics {
  // Performance metrics
  averageLoadTime: number;
  p95LoadTime: number;
  timeoutRate: number;
  
  // Success metrics
  successRate: number;
  partialSuccessRate: number;
  failureRate: number;
  
  // Usage metrics
  adoptionRate: number;
  userSatisfaction: number;
  
  // Error metrics
  errorsByType: Record<string, number>;
  retrySuccessRate: number;
}

// Monitoring implementation
class DefaultsMonitoring {
  private static metrics: DefaultsMetrics = {
    averageLoadTime: 0,
    p95LoadTime: 0,
    timeoutRate: 0,
    successRate: 0,
    partialSuccessRate: 0,
    failureRate: 0,
    adoptionRate: 0,
    userSatisfaction: 0,
    errorsByType: {},
    retrySuccessRate: 0,
  };
  
  static recordMetric(metricName: keyof DefaultsMetrics, value: number) {
    // Send to monitoring service (DataDog, New Relic, etc.)
    analytics.track('process_defaults_metric', {
      metric: metricName,
      value,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
    });
  }
  
  static getHealthScore(): number {
    const { successRate, averageLoadTime, timeoutRate } = this.metrics;
    
    // Health score calculation
    const performanceScore = averageLoadTime < 200 ? 100 : Math.max(0, 100 - (averageLoadTime - 200) / 10);
    const reliabilityScore = successRate;
    const stabilityScore = 100 - (timeoutRate * 10);
    
    return (performanceScore + reliabilityScore + stabilityScore) / 3;
  }
}

// Automatic rollback triggers
const ROLLBACK_TRIGGERS = {
  healthScoreThreshold: 70,    // Below 70% health score
  errorRateThreshold: 10,      // Above 10% error rate
  timeoutRateThreshold: 5,     // Above 5% timeout rate
  userComplaintThreshold: 20,  // 20+ user complaints
};

const AutoRollbackManager = {
  checkRollbackConditions(): boolean {
    const healthScore = DefaultsMonitoring.getHealthScore();
    const metrics = DefaultsMonitoring.getMetrics();
    
    if (healthScore < ROLLBACK_TRIGGERS.healthScoreThreshold) {
      logger.error('Health score below threshold', { healthScore });
      return true;
    }
    
    if (metrics.failureRate > ROLLBACK_TRIGGERS.errorRateThreshold) {
      logger.error('Error rate above threshold', { errorRate: metrics.failureRate });
      return true;
    }
    
    if (metrics.timeoutRate > ROLLBACK_TRIGGERS.timeoutRateThreshold) {
      logger.error('Timeout rate above threshold', { timeoutRate: metrics.timeoutRate });
      return true;
    }
    
    return false;
  },
  
  async executeRollback() {
    logger.warn('Executing automatic rollback of process defaults feature');
    
    // Disable feature flags
    await FeatureFlagManager.updateFlags({
      'process.defaults.enabled': false,
      'process.defaults.emergency_disabled': true,
    });
    
    // Notify engineering team
    await NotificationService.send({
      channel: '#engineering-alerts',
      message: 'Process defaults feature automatically rolled back due to health issues',
      severity: 'high',
    });
    
    // Log rollback event
    analytics.track('feature_rollback', {
      feature: 'process_defaults',
      reason: 'automatic',
      timestamp: Date.now(),
    });
  },
};

// Manual rollback procedure
const ManualRollbackProcedure = {
  async rollback() {
    // 1. Disable feature flags immediately
    await FeatureFlagManager.updateFlags({
      'process.defaults.enabled': false,
      'process.defaults.manual_rollback': true,
    });
    
    // 2. Clear any cached defaults
    await CacheManager.clearAllDefaults();
    
    // 3. Reset user preferences
    await UserPreferencesService.resetDefaultsPreferences();
    
    // 4. Notify users of temporary disablement
    await NotificationService.broadcastToUsers({
      message: 'Process defaults temporarily disabled for maintenance',
      type: 'info',
    });
    
    // 5. Log rollback
    logger.info('Manual rollback of process defaults completed');
  },
  
  async rollforward() {
    // 1. Re-enable feature flags gradually
    await FeatureFlagManager.updateFlags({
      'process.defaults.enabled': true,
      'process.defaults.percentage': 10, // Start with 10%
      'process.defaults.manual_rollback': false,
    });
    
    // 2. Monitor for 30 minutes
    setTimeout(async () => {
      const healthScore = DefaultsMonitoring.getHealthScore();
      if (healthScore > 80) {
        // Increase to 100% if healthy
        await FeatureFlagManager.updateFlags({
          'process.defaults.percentage': 100,
        });
      }
    }, 30 * 60 * 1000);
  },
};
```

## Conclusion

This technical proposal provides a comprehensive approach to integrating DefaultsProcessActionHandler into the ProcessModal system. The design prioritizes:

1. **System Reliability**: Robust error handling and fallback strategies ensure the modal remains functional even when defaults fail
2. **Performance**: Intelligent caching, request deduplication, and optimized loading strategies maintain <200ms performance impact
3. **Type Safety**: Comprehensive TypeScript interfaces and runtime validation prevent data corruption
4. **User Experience**: Progressive loading states, clear error messages, and graceful degradation
5. **Scalability**: Feature flags, monitoring, and rollback capabilities enable safe production deployment

The implementation follows existing architectural patterns in the codebase while introducing minimal complexity. The phased rollout plan ensures careful validation at each stage, with comprehensive testing coverage and monitoring to detect issues early.

**Next Steps**:
1. Review and approve technical design
2. Implement Phase 1 (development and testing)
3. Create comprehensive test suite
4. Set up monitoring and feature flags
5. Execute gradual rollout plan

**Estimated Implementation Timeline**: 4-6 weeks including testing and rollout phases.
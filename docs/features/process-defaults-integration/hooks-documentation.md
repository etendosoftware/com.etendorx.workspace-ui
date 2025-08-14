# Core Hooks Documentation

This document provides detailed documentation for the core hooks that power the ProcessModal defaults integration system.

## 🎣 Hook Overview

The ProcessModal defaults system consists of two primary hooks that work together to fetch and process default values:

1. **`useProcessInitialization`** - Handles API communication with DefaultsProcessActionHandler
2. **`useProcessInitializationState`** - Processes the response for React Hook Form integration

These hooks follow the established FormInitialization pattern, ensuring consistency and reliability.

## 📡 useProcessInitialization

### Purpose
Fetches default values from the backend DefaultsProcessActionHandler API, adapting the proven FormInitialization request/response pattern.

### Interface

```typescript
interface ProcessInitializationParams {
  processId: string;          // Required: Process identifier
  windowId?: string;          // Optional: Window context
  recordId?: string;          // Optional: Record context for defaults
  enabled?: boolean;          // Optional: Feature flag (default: true)
}

interface UseProcessInitialization {
  processInitialization: ProcessDefaultsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: (contextData?: Record<string, EntityValue>) => Promise<void>;
}
```

### Usage Example

```typescript
import { useProcessInitialization } from '@/hooks/useProcessInitialization';

function ProcessModal({ processId, windowId, recordId }) {
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
  if (loading) return <Loading />;
  
  // Handle error state
  if (error) {
    console.error('Failed to load process defaults:', error);
    // Continue with empty defaults
  }

  // Use processInitialization...
}
```

### Key Features

#### 1. **Automatic Request Management**
- Automatically triggers request when dependencies change
- Cancels pending requests when component unmounts
- Handles request deduplication

#### 2. **Smart Caching** (Future Enhancement)
```typescript
// Context-aware caching based on processId, windowId, and recordId
const cacheKey = `${processId}:${windowId}:${recordId}`;
```

#### 3. **Error Handling**
```typescript
// Comprehensive error categorization
const processError: ProcessDefaultsError = {
  code: err.message.includes('timeout') ? 'TIMEOUT' : 'API_ERROR',
  message: `Failed to fetch process defaults: ${err.message}`,
  details: { processId, windowId, originalError: err }
};
```

#### 4. **Performance Optimization**
- Request timeout protection (10 seconds)
- Abort controller for request cancellation
- Minimal payload size with only necessary context data

### API Integration

#### Request Structure
```typescript
const params = new URLSearchParams({
  processId,
  windowId: windowId || "",
  _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler",
});

const requestPayload = {
  ...contextData,
  processId,
  windowId: windowId || "",
  recordId: recordId || "",
  _requestType: "defaults",
  _timestamp: Date.now().toString(),
};
```

#### Response Processing
```typescript
// Transform raw response to expected structure
return {
  defaults: data?.defaults || data || {},
  filterExpressions: data?.filterExpressions || {},
  refreshParent: !!data?.refreshParent,
};
```

### State Management

Uses `useReducer` for complex state management, following FormInitialization pattern:

```typescript
type State =
  | { loading: true; error: null; processInitialization: null }
  | { loading: false; error: null; processInitialization: ProcessDefaultsResponse }
  | { loading: false; error: Error; processInitialization: ProcessDefaultsResponse | null };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_START":
      return { loading: true, error: null, processInitialization: null };
    case "FETCH_SUCCESS":
      return { loading: false, error: null, processInitialization: action.payload };
    case "FETCH_ERROR":
      return { loading: false, error: action.payload, processInitialization: state.processInitialization };
  }
};
```

## 🔄 useProcessInitializationState

### Purpose
Processes the DefaultsProcessActionHandler response into form-compatible data structures, extracting initial values, logic fields, and filter expressions.

### Interface

```typescript
interface ProcessInitializationState {
  initialState: EntityData | null;           // Form initial values
  logicFields: Record<string, boolean>;      // Display/readonly logic
  filterExpressions: Record<string, Record<string, any>>; // Selector filters
  refreshParent: boolean;                    // Parent refresh flag
  hasData: boolean;                          // Convenience flag
}
```

### Usage Example

```typescript
import { useProcessInitializationState } from '@/hooks/useProcessInitialState';

function ProcessModal({ processInitialization, parameters }) {
  const {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent,
    hasData
  } = useProcessInitializationState(processInitialization, parameters);

  // Combine with existing record data
  const availableFormData = useMemo(() => ({
    ...recordValues,
    ...initialState
  }), [recordValues, initialState]);

  // Initialize React Hook Form
  const form = useForm({
    values: availableFormData,
    mode: "onChange"
  });

  // Pass logic fields to selectors
  return (
    <FormProvider {...form}>
      {parameters.map(param => (
        <ProcessParameterSelector
          key={param.name}
          parameter={param}
          logicFields={logicFields}
        />
      ))}
    </FormProvider>
  );
}
```

### Core Processing Functions

#### 1. **useProcessInitialState**
Converts default values to React Hook Form compatible format:

```typescript
const initialState = useMemo(() => {
  if (!processInitialization?.defaults) return null;
  
  // Handle empty defaults
  if (Object.keys(processInitialization.defaults).length === 0) return {};

  const acc = {} as EntityData;
  const { defaults } = processInitialization;

  for (const [fieldName, value] of Object.entries(defaults)) {
    // Skip logic fields
    if (fieldName.endsWith('_display_logic') || fieldName.endsWith('_readonly_logic')) {
      continue;
    }

    const parameter = parameterMap.get(fieldName);
    const formFieldName = parameter?.name || fieldName;

    if (isReferenceValue(value)) {
      // Handle reference objects
      acc[formFieldName] = value.value;
      if (value.identifier) {
        acc[`${formFieldName}$_identifier`] = value.identifier;
      }
    } else if (isSimpleValue(value)) {
      // Handle simple values
      acc[formFieldName] = typeof value === 'boolean' ? value : String(value);
    } else {
      // Handle unexpected types
      if (typeof value === 'object' && value !== null) {
        acc[formFieldName] = JSON.stringify(value);
      } else {
        acc[formFieldName] = String(value || "");
      }
    }
  }

  return acc;
}, [processInitialization, parameterMap]);
```

#### 2. **useProcessLogicFields**
Extracts display and readonly logic from response:

```typescript
const logicFields = useMemo(() => {
  if (!processInitialization?.defaults) return {};

  const logic: Record<string, boolean> = {};
  const { defaults } = processInitialization;

  for (const [fieldName, value] of Object.entries(defaults)) {
    if (fieldName.endsWith('_display_logic')) {
      const baseFieldName = fieldName.replace('_display_logic', '');
      logic[`${baseFieldName}.display`] = value === "Y";
    } else if (fieldName.endsWith('_readonly_logic')) {
      const baseFieldName = fieldName.replace('_readonly_logic', '');
      logic[`${baseFieldName}.readonly`] = value === "Y";
    }
  }

  return logic;
}, [processInitialization]);
```

#### 3. **useProcessFilterExpressions**
Extracts filter expressions for dynamic selector behavior:

```typescript
const filterExpressions = useMemo(() => {
  if (!processInitialization?.filterExpressions) return {};
  return processInitialization.filterExpressions;
}, [processInitialization]);
```

### Parameter Mapping Strategy

The hook creates efficient parameter lookups for field name mapping:

```typescript
const parameterMap = useMemo(() => {
  if (!parameters) return new Map<string, ProcessParameter>();
  
  const map = new Map<string, ProcessParameter>();
  parameters.forEach(param => {
    // Map by name (primary)
    map.set(param.name, param);
    // Map by dBColumnName if different
    if (param.dBColumnName && param.dBColumnName !== param.name) {
      map.set(param.dBColumnName, param);
    }
    // Map by ID as fallback
    if (param.id && param.id !== param.name) {
      map.set(param.id, param);
    }
  });
  return map;
}, [parameters]);
```

## 🔧 Type Guards and Validation

### Purpose
Safely handle mixed value types from DefaultsProcessActionHandler response.

### Implementation

```typescript
// Type guard for reference objects
export function isReferenceValue(value: ProcessDefaultValue): value is { value: string; identifier: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'identifier' in value &&
    typeof value.value === 'string' &&
    typeof value.identifier === 'string'
  );
}

// Type guard for simple values
export function isSimpleValue(value: ProcessDefaultValue): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
```

### Usage in Processing

```typescript
if (isReferenceValue(value)) {
  // Safe to access value.value and value.identifier
  acc[formFieldName] = value.value;
  acc[`${formFieldName}$_identifier`] = value.identifier;
} else if (isSimpleValue(value)) {
  // Safe to treat as primitive
  acc[formFieldName] = typeof value === 'boolean' ? value : String(value);
} else {
  // Handle unexpected types gracefully
  logger.warn(`Unexpected value type for field ${fieldName}:`, value);
  acc[formFieldName] = String(value || "");
}
```

## 🛡️ Error Handling

### Strategy
Multi-layered error handling ensures the system continues to function even when defaults fail.

### Implementation Levels

#### 1. **Hook Level**
```typescript
useEffect(() => {
  if (initializationError) {
    logger.warn("Process initialization error:", initializationError);
    // Continue with empty defaults - don't break the form
  }
}, [initializationError]);
```

#### 2. **Processing Level**
```typescript
try {
  // Process field value
  const processedValue = processFieldValue(fieldName, value);
  acc[formFieldName] = processedValue;
} catch (fieldError) {
  logger.error(`Error processing field ${fieldName}:`, fieldError);
  // Set safe fallback value
  acc[formFieldName] = "";
}
```

#### 3. **Type Guard Level**
```typescript
if (isReferenceValue(value)) {
  // Type-safe processing
} else {
  // Fallback for unexpected types
  logger.warn(`Unexpected value type for field ${fieldName}:`, value);
  acc[formFieldName] = String(value || "");
}
```

## 📊 Performance Optimizations

### 1. **Memoization Strategy**
All hooks use `useMemo` for expensive computations:

```typescript
// Parameter mapping (expensive)
const parameterMap = useMemo(() => {
  // Build efficient lookup map
}, [parameters]);

// Initial state processing (expensive)
const initialState = useMemo(() => {
  // Process all field values
}, [processInitialization, parameterMap]);
```

### 2. **Dependency Management**
Carefully managed dependencies prevent unnecessary re-computations:

```typescript
// Only re-compute when actual data changes, not references
const { initialState, logicFields, filterExpressions } = useProcessInitializationState(
  processInitialization, // Stable reference from useProcessInitialization
  parameters             // Usually stable array from process definition
);
```

### 3. **Early Returns**
Optimize for common cases:

```typescript
// Fast path for no data
if (!processInitialization?.defaults) return null;

// Fast path for empty data
if (Object.keys(processInitialization.defaults).length === 0) return {};
```

## 🧪 Testing Strategy

### 1. **Unit Tests**
Each hook is tested in isolation:

```typescript
describe('useProcessInitialState', () => {
  it('should process simple values correctly', () => {
    const { result } = renderHook(() => 
      useProcessInitialState(mockProcessDefaults, mockParameters)
    );
    
    expect(result.current!['actual_payment']).toBe('1.85');
  });
});
```

### 2. **Integration Tests**
Test hooks working together:

```typescript
describe('ProcessModal Integration', () => {
  it('should combine hooks for complete workflow', () => {
    // Test full integration with mocked API responses
  });
});
```

### 3. **Error Condition Tests**
Test all error scenarios:

```typescript
it('should handle malformed responses gracefully', () => {
  const malformedDefaults = { defaults: { broken_field: { invalid: "structure" } } };
  // Should not throw, should provide fallbacks
});
```

---

These hooks provide a robust, type-safe, and performant foundation for ProcessModal defaults integration, following established patterns while handling the complexity of real-world API responses.
# Process Initialization System

## Overview

The Process Initialization System manages the complete lifecycle of fetching, processing, and integrating process defaults from Etendo's `DefaultsProcessActionHandler` into React forms.

## Core Hook: `useProcessInitialization`

Location: `packages/MainUI/hooks/useProcessInitialization.ts`

### Purpose
Orchestrates the communication with Etendo's backend to retrieve process default values, including field values, logic expressions, and filter configurations.

### Architecture

#### State Management
```typescript
type State =
  | { loading: true; error: null; processInitialization: null; }
  | { loading: false; error: null; processInitialization: ProcessDefaultsResponse; }
  | { loading: false; error: Error; processInitialization: ProcessDefaultsResponse | null; };
```

#### Reducer Pattern
```typescript
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_START": return { loading: true, error: null, processInitialization: null };
    case "FETCH_SUCCESS": return { loading: false, error: null, processInitialization: action.payload };
    case "FETCH_ERROR": return { loading: false, error: action.payload, processInitialization: state.processInitialization };
    default: return state;
  }
};
```

### Payload Construction Strategy

#### Complete Context Payload
When both record and tab data are available:

```typescript
if (record && tab) {
  const processPayload = buildProcessPayload(
    record,           // Complete record data
    tab,             // Tab metadata for context fields
    {},              // No process defaults yet (we're fetching them)
    contextData      // Additional context data
  );

  // Convert to EntityValue compatible format
  payload = {
    ...Object.fromEntries(
      Object.entries(processPayload).map(([key, value]) => [
        key, 
        value === null ? null : String(value) // Ensure EntityValue compatibility
      ])
    ),
    processId,
    windowId: windowId || "",
    recordId: recordId || "",
    _requestType: "defaults",
    _timestamp: Date.now().toString(),
  };
}
```

#### Fallback Basic Payload
When minimal context is available:

```typescript
payload = {
  ...contextData,
  processId,
  windowId: windowId || "",
  recordId: recordId || "",
  _requestType: "defaults",
  _timestamp: Date.now().toString(),
};
```

### Response Processing

#### DefaultsProcessActionHandler Response Structure
```typescript
export interface ProcessDefaultsResponse {
  defaults: Record<string, ProcessDefaultValue>;
  filterExpressions: Record<string, Record<string, any>>;
  refreshParent: boolean;
}
```

#### Value Type Detection
```typescript
export type ProcessDefaultValue = 
  | string 
  | number 
  | boolean 
  | { value: string; identifier: string; };
```

### Integration with Form System

#### Hook Composition
```typescript
const {
  processInitialization,
  loading: initializationLoading,
  error: initializationError,
  refetch: refetchDefaults,
} = useProcessInitialization({
  processId: processId || "",
  windowId: windowId || "",
  recordId: record?.id ? String(record.id) : undefined,
  enabled: !!processId && !!windowId && open,
  record: record || undefined,
  tab: tab || undefined,
});
```

#### State Processing Pipeline
```typescript
const {
  initialState,
  logicFields,
  filterExpressions,
  refreshParent,
  hasData: hasInitialData,
} = useProcessInitializationState(
  processInitialization,
  memoizedParameters
);
```

### Error Handling and Resilience

#### Network Error Recovery
```typescript
try {
  const data = await fetchProcessInitialization(params, payload);
  dispatch({ type: "FETCH_SUCCESS", payload: data });
} catch (err) {
  logger.error(`Error fetching process defaults for ${processId}:`, err);
  dispatch({ type: "FETCH_ERROR", payload: err instanceof Error ? err : new Error("Unknown error") });
}
```

#### Type Safety Conversion
```typescript
// Ensure all values are EntityValue compatible
Object.entries(processPayload).map(([key, value]) => [
  key, 
  value === null ? null : String(value)
])
```

### Performance Optimizations

#### Memoized Parameter Construction
```typescript
const params = useMemo(
  () => (processId && enabled ? buildProcessInitializationParams({ processId, windowId }) : null),
  [processId, windowId, enabled]
);
```

#### Conditional Execution
```typescript
// Auto-fetch on mount if enabled
useMemo(() => {
  if (enabled && params) {
    fetch();
  }
}, [enabled, params, fetch]);
```

#### Dependency Management
```typescript
const fetch = useCallback(async (contextData = {}) => {
  // Implementation
}, [params, enabled, processId, windowId, recordId, record, tab]);
```

### Logging and Debugging

#### Fetch Operation Logging
```typescript
logger.debug(`Fetching process defaults for process ${processId}`, {
  windowId,
  recordId,
  contextKeys: Object.keys(contextData),
  hasCompletePayload: !!(record && tab),
  payloadFieldsCount: Object.keys(payload).length
});
```

#### Success Response Logging
```typescript
logger.debug(`Process defaults fetched successfully`, {
  processId,
  defaultsCount: Object.keys(data.defaults).length,
  hasFilterExpressions: Object.keys(data.filterExpressions).length > 0,
  refreshParent: data.refreshParent,
});
```

### Testing Strategies

#### Mock Implementation
```typescript
const mockProcessInitialization = {
  defaults: {
    'field1': 'value1',
    'field2': { value: 'value2', identifier: 'display2' }
  },
  filterExpressions: {},
  refreshParent: false
};
```

#### Integration Testing
```typescript
describe('useProcessInitialization', () => {
  it('should fetch defaults with complete payload', async () => {
    const { result } = renderHook(() => useProcessInitialization({
      processId: 'test-process',
      windowId: 'test-window',
      record: mockRecord,
      tab: mockTab
    }));
    
    await waitFor(() => {
      expect(result.current.processInitialization).toBeDefined();
    });
  });
});
```

### Common Issues and Solutions

#### Issue: Empty Defaults Response
**Problem**: Process returns empty defaults object
**Solution**: Verify payload includes all required context fields

#### Issue: Type Compatibility Errors
**Problem**: TypeScript errors when passing values between hooks
**Solution**: Ensure proper EntityValue type conversion

#### Issue: Infinite Re-fetching
**Problem**: Hook re-executes continuously
**Solution**: Properly memoize dependencies and parameters

### Future Enhancements

1. **Caching Layer**: Implement response caching for repeated requests
2. **Retry Logic**: Add automatic retry for failed requests
3. **Batch Operations**: Support multiple process initialization in single request
4. **Optimistic Updates**: Show loading states with cached previous values

## Related Documentation

- [Process Defaults Integration](../features/process-defaults-integration/)
- [Entity Value Types](../api/entity-value-types.md)
- [Error Handling Patterns](../architecture/error-handling.md)

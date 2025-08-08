# ProcessModal Defaults Integration - Updated Technical Proposal

## Executive Summary

This proposal outlines the implementation of default value initialization for ProcessModal by reusing the existing FormInitialization pattern. The solution leverages proven infrastructure while adapting it to the ProcessModal context, ensuring consistency and minimizing implementation complexity.

## Current Infrastructure Analysis

### Existing FormInitialization Pattern

**Core Components:**
1. **useFormInitialization Hook** - Fetches initialization data via FormInitializationComponent action
2. **useFormInitialState Hook** - Processes FormInitializationResponse into form-ready state
3. **FormInitializationProvider Context** - Manages initialization lifecycle
4. **FormView Integration** - Combines record data with initialization defaults

**Current Flow:**
```typescript
// FormView.tsx
const { formInitialization, loading } = useFormInitialization({ tab, mode, recordId });
const initialState = useFormInitialState(formInitialization);
const availableFormData = { ...record, ...initialState };
const formMethods = useForm({ values: availableFormData });
```

**FormInitializationResponse Structure:**
```typescript
interface FormInitializationResponse {
  columnValues: Record<string, {
    value: string;
    classicValue?: string;
    identifier?: string;
    entries?: Array<{ id: string; _identifier: string }>;
  }>;
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }>;
  sessionAttributes: Record<string, string>;
  dynamicCols: string[];
  attachmentExists: boolean;
  _readOnly?: boolean;
}
```

### ProcessModal Current State

**Components:**
- ProcessParameterSelector (routes parameters to FormView selectors)
- ProcessParameterMapper (maps ProcessParameter to Field interface)
- ProcessDefinitionModal (main modal component)
- Uses react-hook-form with form context

**Context Differences:**
- Uses processId/windowId instead of tabId/mode/recordId
- Parameters from ProcessDefinition instead of Tab fields
- DefaultsProcessActionHandler instead of FormInitializationComponent

## Technical Solution

### 1. Process Initialization Hooks

Create ProcessModal-specific initialization hooks following the FormInitialization pattern:

```typescript
// hooks/useProcessInitialization.ts
export interface ProcessInitializationParams {
  processId: string;
  windowId: string;
  recordId?: string | null;
  enabled?: boolean;
}

export const buildProcessInitializationParams = ({
  processId,
  windowId,
  recordId
}: ProcessInitializationParams): URLSearchParams =>
  new URLSearchParams({
    processId,
    windowId,
    recordId: recordId ?? "null",
    _action: "DefaultsProcessActionHandler",
  });

export function useProcessInitialization(params: ProcessInitializationParams) {
  // Similar pattern to useFormInitialization but adapted for process context
  // Returns: { processInitialization, loading, error, refetch }
}
```

```typescript
// hooks/useProcessInitialState.ts
export const useProcessInitialState = (
  processInitialization?: ProcessInitializationResponse | null,
  parameters?: ProcessParameter[]
) => {
  // Maps processInitialization to parameter field names using ProcessParameterMapper
  // Returns initial state object compatible with react-hook-form
}
```

### 2. Response Interface Adaptation

```typescript
// api/types.ts
export interface ProcessInitializationResponse {
  // Reuse existing structure for consistency
  columnValues: Record<string, {
    value: string;
    classicValue?: string;
    identifier?: string;
    entries?: Array<{ id: string; _identifier: string }>;
  }>;
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }>;
  sessionAttributes: Record<string, string>;
  dynamicCols: string[];
  attachmentExists: boolean;
  _readOnly?: boolean;
  
  // Process-specific extensions
  processId?: string;
  windowId?: string;
}

export interface ProcessInitializationParams {
  processId: string;
  windowId: string;
  recordId?: string | null;
  enabled?: boolean;
}
```

### 3. ProcessModal Integration

```typescript
// ProcessDefinitionModal.tsx
function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { tab, record } = useTabContext();
  const processId = button.processDefinition.id;
  const windowId = tab?.window || "";
  
  // Add process initialization
  const {
    processInitialization,
    loading: loadingProcessInitialization,
    error: processInitializationError,
    refetch: refetchProcessInitialization
  } = useProcessInitialization({
    processId,
    windowId,
    recordId: record?.id?.toString(),
    enabled: open && !!processId && !!windowId
  });
  
  const initialState = useProcessInitialState(
    processInitialization, 
    button.processDefinition.parameters
  );
  
  // Combine with existing form setup
  const formDefaultValues = useMemo(() => {
    const recordValues = record && tab?.fields ? 
      buildPayloadByInputName(record, tab.fields) : {};
    
    return { ...recordValues, ...initialState };
  }, [record, tab?.fields, initialState]);
  
  const form = useForm({
    defaultValues: formDefaultValues,
    values: formDefaultValues // Ensure form updates when defaults load
  });
  
  // Rest of component logic...
}
```

### 4. Parameter Mapping Enhancement

```typescript
// mappers/ProcessParameterMapper.ts
export class ProcessParameterMapper {
  /**
   * Maps ProcessInitializationResponse to parameter values
   * @param response - The process initialization response
   * @param parameters - Process definition parameters
   * @returns Object with parameter field names as keys
   */
  static mapInitializationToParameters(
    response: ProcessInitializationResponse,
    parameters: ProcessParameter[]
  ): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Create parameter lookup by database column name
    const parametersByColumn = parameters.reduce((acc, param) => {
      const columnName = param.dBColumnName || param.name;
      acc[columnName] = param;
      return acc;
    }, {} as Record<string, ProcessParameter>);
    
    // Map columnValues to parameter field names
    for (const [columnName, { value, identifier }] of Object.entries(response.columnValues)) {
      const parameter = parametersByColumn[columnName];
      if (parameter) {
        const fieldName = parameter.dBColumnName || parameter.name;
        result[fieldName] = value;
        
        if (identifier) {
          result[`${fieldName}$_identifier`] = identifier;
        }
      }
    }
    
    // Map auxiliaryInputValues
    for (const [key, { value }] of Object.entries(response.auxiliaryInputValues)) {
      const parameter = parametersByColumn[key];
      if (parameter) {
        const fieldName = parameter.dBColumnName || parameter.name;
        result[fieldName] = value;
      }
    }
    
    return result;
  }
  
  // Existing methods remain unchanged...
}
```

### 5. Backend Integration

```typescript
// hooks/useProcessInitialization.ts
const fetchProcessInitialization = async (
  params: URLSearchParams,
  payload: ClientOptions["body"]
): Promise<ProcessInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);
    return data;
  } catch (error) {
    logger.warn("Error fetching process initialization data:", error);
    throw new Error("Failed to fetch process initialization data");
  }
};

export function useProcessInitialization({
  processId,
  windowId,
  recordId,
  enabled = true
}: ProcessInitializationParams) {
  const { setSession } = useUserContext();
  const { tab, record } = useTabContext();
  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, initialState);
  
  const params = useMemo(
    () => enabled && processId && windowId ? 
      buildProcessInitializationParams({ processId, windowId, recordId }) : null,
    [processId, windowId, recordId, enabled]
  );
  
  const fetch = useCallback(async () => {
    if (!params || !tab) return;
    
    dispatch({ type: "FETCH_START" });
    
    try {
      // Build payload similar to FormInitialization but for process context
      const payload = {
        processId,
        windowId,
        tabId: tab.id,
        recordId: recordId || "null",
        _entityName: tab.entityName,
        inpTabId: tab.id,
        inpTableId: tab.table,
        inpwindowId: tab.window,
        // Include current record data for context
        ...(record ? buildPayloadByInputName(record, tab.fields) : {})
      };
      
      const data = await fetchProcessInitialization(params, payload);
      
      // Update session with returned attributes
      const sessionUpdates = {
        ...data.sessionAttributes,
        ...Object.entries(data.auxiliaryInputValues).reduce(
          (acc, [key, { value }]) => {
            acc[key] = value || "";
            return acc;
          },
          {} as Record<string, string>
        )
      };
      
      setSession((prev) => ({ ...prev, ...sessionUpdates }));
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err) {
      logger.warn("Process initialization failed:", err);
      dispatch({ 
        type: "FETCH_ERROR", 
        payload: err instanceof Error ? err : new Error("Process initialization failed") 
      });
    }
  }, [params, processId, windowId, recordId, tab, record, setSession]);
  
  // Auto-fetch on mount and param changes
  useEffect(() => {
    if (params) {
      fetch();
    }
  }, [fetch, params]);
  
  const refetch = useCallback(async () => {
    if (params) {
      await fetch();
    }
  }, [fetch, params]);
  
  return {
    processInitialization: state.processInitialization,
    loading: state.loading,
    error: state.error,
    refetch
  };
}
```

### 6. Context Provider (Optional)

```typescript
// contexts/ProcessInitializationContext.tsx
interface ProcessInitializationContextValue {
  processInitialization: ProcessInitializationResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const ProcessInitializationContext = createContext<ProcessInitializationContextValue | null>(null);

export const ProcessInitializationProvider = ({ 
  children, 
  processId, 
  windowId, 
  recordId 
}: PropsWithChildren<ProcessInitializationParams>) => {
  const value = useProcessInitialization({ processId, windowId, recordId });
  
  return (
    <ProcessInitializationContext.Provider value={value}>
      {children}
    </ProcessInitializationContext.Provider>
  );
};

export const useProcessInitializationContext = () => {
  const context = useContext(ProcessInitializationContext);
  if (!context) {
    throw new Error("useProcessInitializationContext must be used within ProcessInitializationProvider");
  }
  return context;
};
```

## Implementation Strategy

### Phase 1: Core Infrastructure
1. **Create Process Initialization Hooks**
   - `useProcessInitialization.ts`
   - `useProcessInitialState.ts`
   - Add ProcessInitializationResponse interface

2. **Backend Integration**
   - Implement DefaultsProcessActionHandler call
   - Map response to ProcessInitializationResponse format
   - Handle error cases and fallbacks

3. **Testing**
   - Unit tests for hooks
   - Integration tests for API calls
   - Mock ProcessInitializationResponse for testing

### Phase 2: ProcessModal Integration
1. **Update ProcessDefinitionModal**
   - Integrate useProcessInitialization hook
   - Combine initialization data with form defaults
   - Handle loading states

2. **Enhance ProcessParameterMapper**
   - Add initialization response mapping
   - Ensure field name consistency
   - Handle identifier mapping for reference fields

3. **Testing**
   - ProcessModal integration tests
   - Parameter mapping validation
   - End-to-end process execution tests

### Phase 3: Advanced Features
1. **Context Provider** (if needed)
   - ProcessInitializationProvider for complex scenarios
   - Hook for accessing initialization context

2. **Performance Optimization**
   - Conditional initialization based on process requirements
   - Caching strategies for repeated process calls
   - Lazy loading for large parameter sets

3. **Error Handling**
   - Graceful degradation when initialization fails
   - User feedback for initialization errors
   - Retry mechanisms

## Benefits of This Approach

### 1. **Consistency with Existing Patterns**
- Reuses proven FormInitialization architecture
- Follows established naming conventions and patterns
- Maintains familiar developer experience

### 2. **Minimal Code Duplication**
- Leverages existing ProcessParameterMapper
- Reuses FormView selectors through ProcessParameterSelector
- Shares common types and interfaces

### 3. **Backwards Compatibility**
- Processes without defaults continue to work unchanged
- Graceful fallback when initialization fails
- Optional feature that doesn't break existing functionality

### 4. **Maintainability**
- Clear separation of concerns
- Testable hooks and components
- Easy to extend for future requirements

### 5. **Type Safety**
- Full TypeScript support
- Consistent interface definitions
- Compile-time validation of parameter mapping

## Migration Path

### Safe Rollout Strategy

1. **Feature Flag Implementation**
   ```typescript
   const ENABLE_PROCESS_DEFAULTS = process.env.REACT_APP_ENABLE_PROCESS_DEFAULTS === 'true';
   
   const shouldUseDefaults = ENABLE_PROCESS_DEFAULTS && 
     processId && 
     windowId && 
     hasDefaultsCapability(processDefinition);
   ```

2. **Gradual Enablement**
   - Start with specific process types
   - Monitor for issues and performance impact
   - Gradually expand to all processes

3. **Monitoring and Observability**
   - Log initialization success/failure rates
   - Track performance impact
   - Monitor user experience metrics

### Backwards Compatibility Guarantees

- All existing ProcessModal functionality remains unchanged
- Processes without defaults work exactly as before
- Initialization failures fall back to current behavior
- No breaking changes to existing APIs

## File Structure

```
packages/MainUI/
├── hooks/
│   ├── useProcessInitialization.ts          # New - Process initialization hook
│   └── useProcessInitialState.ts            # New - Process initial state processing
├── contexts/
│   └── ProcessInitializationContext.tsx     # New - Optional context provider
├── components/ProcessModal/
│   ├── ProcessDefinitionModal.tsx           # Modified - Add initialization integration
│   ├── mappers/
│   │   └── ProcessParameterMapper.ts        # Modified - Add initialization mapping
│   └── selectors/
│       └── ProcessParameterSelector.tsx     # Minimal changes - Use initialization data
└── api-client/src/api/
    └── types.ts                             # Modified - Add ProcessInitializationResponse
```

## Conclusion

This updated proposal leverages the existing, proven FormInitialization pattern while adapting it specifically for ProcessModal requirements. By reusing established infrastructure and patterns, we ensure consistency, maintainability, and reduced implementation complexity while providing a robust foundation for ProcessModal default value initialization.

The solution provides:
- **Immediate Value**: Default values for process parameters
- **Consistency**: Familiar patterns for developers
- **Extensibility**: Foundation for future enhancements
- **Safety**: Backwards compatibility and graceful fallbacks
- **Quality**: Full type safety and comprehensive testing

This approach balances the need for new functionality with the importance of maintaining system stability and developer productivity.
# React Patterns in WorkspaceUI

## Custom Hooks Patterns

### Data Fetching Hooks
```typescript
// Pattern: useXxxConfig hooks for server state
export const useProcessConfig = ({ processId, windowId, tabId, javaClassName }: UseProcessConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<ProcessConfigResponse | null>(null);

  const fetchConfig = useCallback(async (payload: Record<string, EntityValue> = {}) => {
    // Implementation...
  }, [processId, windowId, tabId]);

  return { fetchConfig, loading, error, config };
};
```

### Handler Patterns
```typescript
// Pattern: Separate handlers for different execution paths
const handleWindowReferenceExecute = useCallback(async () => {
  // Window reference specific logic
}, [dependencies]);

const handleDirectJavaProcessExecute = useCallback(async () => {
  // Direct Java process specific logic  
}, [dependencies]);

const handleExecute = useCallback(async () => {
  // Route to appropriate handler based on process type
  if (hasWindowReference) {
    await handleWindowReferenceExecute();
    return;
  }
  
  if (!onProcess && javaClassName && tab) {
    await handleDirectJavaProcessExecute();
    return;
  }
  
  // Default string function execution
}, [hasWindowReference, handleWindowReferenceExecute, handleDirectJavaProcessExecute, ...]);
```

## Component Composition

### Modal Pattern
```typescript
// Pattern: Content component + Wrapper component
function ProcessDefinitionModalContent(props: ProcessDefinitionModalContentProps) {
  // Full implementation
}

export default function ProcessDefinitionModal(props: ProcessDefinitionModalProps) {
  if (!props.button) return null;
  return <ProcessDefinitionModalContent {...props} button={props.button} />;
}
```

## State Management Patterns

### Local State for UI
```typescript
// Pattern: Group related state
const [isExecuting, setIsExecuting] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [response, setResponse] = useState<ResponseMessage>();

// Pattern: Computed state with useMemo
const isActionButtonDisabled = useMemo(() => 
  isExecuting || isSuccess || (hasWindowReference && gridSelection.length === 0),
  [isExecuting, isSuccess, hasWindowReference, gridSelection.length]
);
```

### Context Usage
```typescript
// Pattern: Use contexts for cross-cutting concerns
const { tab, record } = useTabContext();
const { session } = useUserContext();
const { t } = useTranslation();
```

## Error Handling Patterns

### Async Error Handling
```typescript
const handleAsyncOperation = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await someAsyncOperation();
    // Handle success
    
  } catch (error) {
    logger.error("Operation failed:", error);
    setError(error instanceof Error ? error : new Error("Unknown error"));
  } finally {
    setLoading(false);
  }
}, [dependencies]);
```

## Performance Patterns

### Memoization Strategy
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Event handlers that don't change often
const handleClick = useCallback(() => {
  // Handler logic
}, [stableDependencies]);

// Child components with stable props
const MemoizedChild = memo(ChildComponent);
```

## Documentation Standards

### JSDoc for Public APIs
```typescript
/**
 * Custom hook for managing process configuration
 * 
 * @param props Hook configuration
 * @param props.processId ID of the process
 * @param props.javaClassName Optional Java class name for direct execution
 * @returns Object with fetchConfig function and state
 */
export const useProcessConfig = (props: UseProcessConfigProps) => {
  // Implementation
};
```

### Inline Comments for Business Logic
```typescript
// If process has javaClassName but no onProcess, execute directly via servlet
if (!onProcess && javaClassName && tab) {
  await handleDirectJavaProcessExecute();
  return;
}
```
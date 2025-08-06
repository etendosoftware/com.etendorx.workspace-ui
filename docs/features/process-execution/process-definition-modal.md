# ProcessDefinitionModal

## Overview

Modal component for executing Etendo process definitions. Handles three types of process execution with comprehensive error handling and user feedback.

## Component Architecture

### File Structure
```
ProcessModal/
├── ProcessDefinitionModal.tsx          # Main modal component
├── WindowReferenceGrid.tsx            # Grid for window reference processes  
├── selectors/
│   └── BaseSelector.tsx               # Parameter input selectors
└── types.ts                          # TypeScript definitions
```

## Process Execution Types

### 1. Window Reference Processes
```typescript
// Detected when parameter has WINDOW_REFERENCE_ID
const hasWindowReference = useMemo(() => {
  return Object.values(parameters).some((param) => 
    param.reference === WINDOW_REFERENCE_ID
  );
}, [parameters]);
```

**Flow:**
1. Display grid with records from referenced window
2. User selects records from grid
3. Execute with `gridSelection` array
4. Call servlet with selected record IDs

### 2. Direct Java Processes
```typescript
// Detected when javaClassName exists but no onProcess
if (!onProcess && javaClassName && tab) {
  await handleDirectJavaProcessExecute();
}
```

**Flow:**
1. Build servlet URL with `javaClassName` as `_action`
2. Prepare payload with form values and record context
3. Call servlet directly
4. Handle `responseActions` format response

### 3. String Function Processes
```typescript
// Traditional client-side process execution
if (onProcess && tab) {
  const result = await executeStringFunction(onProcess, ...);
}
```

## Key Handlers

### handleDirectJavaProcessExecute()
```typescript
/**
 * Executes processes directly via servlet using javaClassName
 * Used for processes that have javaClassName but no onProcess function
 * Bypasses client-side JavaScript execution and calls servlet directly
 */
const handleDirectJavaProcessExecute = useCallback(async () => {
  // Validation
  if (!tab || !processId || !javaClassName) return;

  // Build servlet parameters
  const params = new URLSearchParams({
    processId,
    windowId: tab.window,
    _action: javaClassName,  // Key difference from other handlers
  });

  // Prepare payload
  const payload = {
    _buttonValue: "DONE",
    _entityName: tab.entityName,
    ...recordValues,      // Current record context
    ...form.getValues()   // Form input values
  };

  // Execute via kernel servlet
  const response = await Metadata.kernelClient.post(`?${params}`, payload);

  // Handle responseActions format
  if (response?.data?.responseActions?.[0]?.showMsgInProcessView) {
    const responseMessage = response.data.responseActions[0].showMsgInProcessView;
    setResponse(responseMessage);
    
    if (responseMessage.msgType === "success") {
      setIsSuccess(true);
      onSuccess?.();
    }
  }
}, [tab, processId, javaClassName, recordValues, form, t, onSuccess]);
```

## Response Handling

### Response Priority Order
1. **responseActions** (Standard format)
   ```json
   {
     "responseActions": [{
       "showMsgInProcessView": {
         "msgType": "success|error|warning",
         "msgTitle": "Title",
         "msgText": "Message content"
       }
     }]
   }
   ```

2. **message** (Legacy format)
   ```json
   {
     "message": {
       "severity": "success|error",
       "text": "Message content"
     }
   }
   ```

3. **Fallback** (Any response without errors = success)

## State Management

### Key States
```typescript
const [parameters, setParameters] = useState(button.processDefinition.parameters);
const [response, setResponse] = useState<ResponseMessage>();
const [isExecuting, setIsExecuting] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [loading, setLoading] = useState(true);
const [gridSelection, setGridSelection] = useState<unknown[]>([]);
```

### Button Disabled Logic
```typescript
const isActionButtonDisabled = 
  isExecuting ||                                    // Process running
  isSuccess ||                                      // Process completed
  (hasWindowReference && gridSelection.length === 0); // Grid selection required
```

## Integration with useProcessConfig

```typescript
const {
  fetchConfig,
  loading: processConfigLoading,
  error: processConfigError,
  config: processConfig,
} = useProcessConfig({
  processId: processId || "",
  windowId: windowId || "",
  tabId,
  javaClassName,  // Important: Pass javaClassName for correct _action
});
```

## Default Values Application

```typescript
useEffect(() => {
  if (processConfig?.defaults) {
    // Apply defaults from DefaultsProcessActionHandler
    for (const [key, data] of Object.entries(processConfig.defaults)) {
      form.setValue(key, data.identifier);
    }
  }
}, [form, processConfig?.defaults]);
```

## Error Scenarios

### Common Issues
1. **Missing javaClassName**: Process has no execution handler defined
2. **Window Reference without selection**: User must select grid records
3. **Network errors**: Backend unavailable or timeout
4. **Process errors**: Business logic validation failures

### Error Display
```typescript
const renderResponse = () => {
  if (!response) return null;

  const isSuccessMessage = response.msgType === "success";
  const messageClasses = `p-3 rounded mb-4 border-l-4 ${
    isSuccessMessage 
      ? "bg-green-50 border-(--color-success-main)" 
      : "bg-gray-50 border-(--color-etendo-main)"
  }`;

  return (
    <div className={messageClasses}>
      <h4 className="font-bold text-sm">{response.msgTitle}</h4>
      <p className="text-sm" dangerouslySetInnerHTML={{ __html: response.msgText }} />
    </div>
  );
};
```

## Testing Considerations

### Unit Tests
- Test each execution handler independently
- Mock servlet responses for different scenarios
- Verify state transitions during execution

### Integration Tests  
- Test full process execution flow
- Verify default values application
- Test error handling and user feedback

### Manual Testing
- Test with real process definitions
- Validate different parameter types
- Verify window reference grid functionality

## Performance Considerations

- **Memoization**: Critical paths use `useCallback` and `useMemo`
- **Conditional Loading**: Only load process config when needed
- **Form Optimization**: React Hook Form for efficient form handling

## Future Enhancements

1. **Process Caching**: Cache process configurations
2. **Batch Operations**: Support multiple process execution
3. **Progress Tracking**: Long-running process progress
4. **Offline Support**: Queue processes when offline
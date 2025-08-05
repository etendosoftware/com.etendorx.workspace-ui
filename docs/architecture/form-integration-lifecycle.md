# Form Integration and Value Lifecycle

## Overview

The Form Integration and Value Lifecycle system manages the complete flow of data from process initialization through user interaction to final process execution, ensuring seamless integration between Etendo backend services and React Hook Form.

## Value Lifecycle Stages

### 1. Initial Data Fetching
Process defaults are fetched with complete context payload:

```typescript
// Complete payload includes system context, record data, and metadata
const processPayload = buildProcessPayload(
  record,           // Current record context
  tab,             // Tab metadata and field mappings
  {},              // Empty defaults (we're fetching them)
  contextData       // Additional runtime context
);
```

### 2. Value Transformation Pipeline
Raw backend values undergo multiple transformations:

#### Stage 1: Type Detection and Routing
```typescript
// Reference values (entity lookups)
if (isReferenceValue(value)) {
  formState[fieldName] = value.value;
  formState[`${fieldName}$_identifier`] = value.identifier;
}
// Simple values (strings, numbers, booleans)
else if (isSimpleValue(value)) {
  formState[fieldName] = typeof value === 'boolean' ? value : String(value);
}
```

#### Stage 2: Field Name Resolution
```typescript
// Original server field names are preserved for form compatibility
const formFieldName = fieldName; // Use server names, not display names
```

#### Stage 3: System Context Augmentation
```typescript
const availableFormData = {
  ...systemContext,     // Window/tab metadata, accounting dimensions
  ...processedDefaults, // Transformed backend values
  ...userInput         // Current form state
};
```

### 3. Form State Management
React Hook Form integration with proper lifecycle handling:

#### Initial Population
```typescript
const form = useForm({
  values: availableFormData,
  mode: "onChange"
});
```

#### Dynamic Updates
```typescript
useEffect(() => {
  if (hasInitialData && Object.keys(availableFormData).length > 0) {
    form.reset(availableFormData); // Update form when new defaults arrive
  }
}, [hasInitialData, availableFormData, form]);
```

### 4. Display Logic Evaluation
Multi-layered logic evaluation with proper timing:

#### Timing Control
```typescript
// Wait for form data to be available before evaluating expressions
const currentValues = getValues();
if (!currentValues || Object.keys(currentValues).length === 0) {
  return true; // Default to visible while loading
}
```

#### Priority Chain
```typescript
// 1. Process defaults logic (highest priority)
const defaultsDisplayLogic = logicFields?.[`${parameter.name}.display`];
if (defaultsDisplayLogic !== undefined) {
  return defaultsDisplayLogic;
}

// 2. Parameter-specific display logic
if (parameter.displayLogic) {
  const compiledExpr = compileExpression(parameter.displayLogic);
  return compiledExpr(session, currentValues);
}

// 3. Default visible state
return true;
```

### 5. User Interaction Handling
Form interaction management with real-time updates:

#### Value Change Propagation
```typescript
// Form changes automatically trigger re-evaluation of dependent fields
const watchedValues = watch(); // React Hook Form automatic watching
```

#### Conditional Field Updates
```typescript
// Fields show/hide based on current form state
if (!isDisplayed) {
  return null; // Remove from DOM when hidden
}
```

### 6. Process Execution
Final payload construction for process execution:

#### Complete Payload Assembly
```typescript
const completePayload = buildProcessPayload(
  record,                 // Original record context
  tab,                   // Tab metadata
  initialState || {},    // Process defaults from server
  form.getValues()       // Current user input
);
```

#### Execution Request
```typescript
const result = await executeStringFunction(onProcess, { Metadata }, processDefinition, {
  buttonValue: "DONE",
  windowId: tab.window,
  entityName: tab.entityName,
  recordIds: selectedRecords?.map((r) => r.id),
  ...completePayload,    // Spread complete payload
});
```

## Memory Management and Performance

### Memoization Strategy
```typescript
// Parameter processing is memoized to prevent infinite loops
const memoizedParameters = useMemo(() => Object.values(parameters), [parameters]);

// Form data is memoized based on key dependencies
const availableFormData = useMemo(() => {
  return buildProcessPayload(record, tab, initialState, {});
}, [record, tab, initialState]);
```

### Dependency Management
Careful management of React dependencies to prevent cascading re-renders:

```typescript
// Stable references prevent unnecessary re-execution
const fetch = useCallback(async (contextData = {}) => {
  // Implementation
}, [params, enabled, processId, windowId, recordId, record, tab]);
```

## Error Resilience Patterns

### Graceful Degradation
```typescript
// Display logic errors don't break the form
try {
  const compiledExpr = compileExpression(parameter.displayLogic);
  return compiledExpr(session, currentValues);
} catch (error) {
  logger.warn("Error executing display logic expression:", parameter.displayLogic, error);
  return true; // Default to visible on error
}
```

### Form State Recovery
```typescript
// Missing field mappings fall back to generic rendering
if (!mappedField.hqlName) {
  logger.warn("Missing hqlName for parameter:", parameter.name);
  return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
}
```

### Type Safety Conversion
```typescript
// Ensure backend values are compatible with form types
Object.fromEntries(
  Object.entries(processPayload).map(([key, value]) => [
    key, 
    value === null ? null : String(value) // Safe type conversion
  ])
)
```

## Integration Testing Patterns

### End-to-End Flow Testing
```typescript
describe('Form Integration Lifecycle', () => {
  it('should handle complete value lifecycle', async () => {
    // 1. Mount component with process configuration
    render(<ProcessDefinitionModal processId="test" />);
    
    // 2. Wait for initial data fetch
    await waitFor(() => {
      expect(screen.getByDisplayValue('default-value')).toBeInTheDocument();
    });
    
    // 3. Simulate user interaction
    fireEvent.change(screen.getByLabelText('Field Name'), {
      target: { value: 'new-value' }
    });
    
    // 4. Verify dependent field updates
    expect(screen.getByText('Updated Dependent Field')).toBeInTheDocument();
    
    // 5. Execute process
    fireEvent.click(screen.getByText('Execute'));
    
    // 6. Verify payload construction
    await waitFor(() => {
      expect(mockExecuteProcess).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldName: 'new-value',
          systemContext: expect.any(Object)
        })
      );
    });
  });
});
```

## Common Anti-Patterns and Solutions

### Anti-Pattern: Direct Backend Value Usage
```typescript
// ❌ Don't use backend values directly
<input value={backendResponse.fieldValue} />

// ✅ Use processed form values
<input {...register('fieldName')} />
```

### Anti-Pattern: Synchronous Logic Evaluation
```typescript
// ❌ Don't evaluate logic without checking data availability
const isVisible = compileExpression(displayLogic)(session, values);

// ✅ Check data availability first
const currentValues = getValues();
if (!currentValues || Object.keys(currentValues).length === 0) {
  return true; // Safe default
}
const isVisible = compileExpression(displayLogic)(session, currentValues);
```

### Anti-Pattern: Unstable Dependencies
```typescript
// ❌ Unstable dependencies cause infinite loops
useEffect(() => {
  processData();
}, [Object.values(parameters)]); // New array each render

// ✅ Memoize complex dependencies
const memoizedParams = useMemo(() => Object.values(parameters), [parameters]);
useEffect(() => {
  processData();
}, [memoizedParams]);
```

## Monitoring and Debugging

### Development Logging
```typescript
// Form state changes
console.log('Resetting form with new values:', availableFormData);

// Display logic evaluation
logger.debug(`Mapped reference field ${fieldName} to ${formFieldName}:`, {
  value: value.value,
  identifier: value.identifier
});

// Performance monitoring
logger.debug(`Process defaults fetched successfully`, {
  processId,
  defaultsCount: Object.keys(data.defaults).length,
  payloadFieldsCount: Object.keys(payload).length
});
```

### Error Tracking
```typescript
// Centralized error logging for debugging
logger.error(`Error processing default value for field ${fieldName}:`, error);
logger.warn("Error executing display logic expression:", parameter.displayLogic, error);
```

## Future Enhancements

1. **State Persistence**: Save form state across browser sessions
2. **Optimistic Updates**: Show immediate feedback before backend confirmation
3. **Conflict Resolution**: Handle concurrent edits gracefully
4. **Performance Monitoring**: Track form interaction performance metrics
5. **Advanced Validation**: Real-time validation with backend integration

## Related Documentation

- [Process Initialization System](./process-initialization-system.md)
- [Display Logic Expression Parsing](../features/display-logic-expression-parsing.md)
- [Process Payload Building](../features/process-payload-building.md)
- [Error Handling Patterns](./error-handling-patterns.md)

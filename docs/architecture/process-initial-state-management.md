# Process Initial State Management

## Overview

The Process Initial State Management system transforms raw process defaults from the `DefaultsProcessActionHandler` into form-ready initial state, handling field mapping, value transformation, and logic field extraction.

## Core Hook: `useProcessInitialState`

Location: `packages/MainUI/hooks/useProcessInitialState.ts`

### Purpose
Converts `ProcessDefaultsResponse` into form initial state compatible with React Hook Form, ensuring proper field name mapping and value transformation.

### Field Name Mapping Strategy

#### Parameter Map Construction
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

#### Field Name Resolution
```typescript
// Find corresponding parameter
const parameter = parameterMap.get(fieldName);
// Use the original field name from server, not the parameter display name
const formFieldName = fieldName; // Prevents mismatch with form field names
```

### Value Type Processing

#### Reference Value Handling
```typescript
if (isReferenceValue(value)) {
  // Handle reference objects with value/identifier pairs
  acc[formFieldName] = value.value;
  
  // Store identifier for display purposes
  if (value.identifier) {
    acc[`${formFieldName}$_identifier`] = value.identifier;
  }
  
  logger.debug(`Mapped reference field ${fieldName} to ${formFieldName}:`, {
    value: value.value,
    identifier: value.identifier
  });
}
```

#### Simple Value Handling
```typescript
else if (isSimpleValue(value)) {
  // Handle simple values (string, number, boolean)
  acc[formFieldName] = typeof value === 'boolean' ? value : String(value);
  
  logger.debug(`Mapped simple field ${fieldName} to ${formFieldName}:`, {
    value: String(value),
    type: typeof value
  });
}
```

#### Fallback Value Processing
```typescript
else {
  // Fallback for unexpected value types
  logger.warn(`Unexpected value type for field ${fieldName}:`, value);
  if (typeof value === 'object' && value !== null) {
    acc[formFieldName] = JSON.stringify(value);
  } else {
    acc[formFieldName] = String(value || "");
  }
}
```

### Logic Fields Extraction

#### Display Logic Processing
```typescript
export const useProcessLogicFields = (processInitialization?: ProcessDefaultsResponse | null) => {
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

  return logicFields;
};
```

### Filter Expressions Processing

#### Dynamic Selector Behavior
```typescript
export const useProcessFilterExpressions = (processInitialization?: ProcessDefaultsResponse | null) => {
  const filterExpressions = useMemo(() => {
    if (!processInitialization?.filterExpressions) return {};

    logger.debug("Process filter expressions:", processInitialization.filterExpressions);
    return processInitialization.filterExpressions;
  }, [processInitialization]);

  return filterExpressions;
};
```

### Combined State Hook

#### Unified Interface
```typescript
export const useProcessInitializationState = (
  processInitialization?: ProcessDefaultsResponse | null,
  parameters?: ProcessParameter[]
) => {
  const initialState = useProcessInitialState(processInitialization, parameters);
  const logicFields = useProcessLogicFields(processInitialization);
  const filterExpressions = useProcessFilterExpressions(processInitialization);

  return {
    initialState,
    logicFields,
    filterExpressions,
    refreshParent: processInitialization?.refreshParent || false,
    hasData: !!initialState && Object.keys(initialState).length > 0
  };
};
```

### Type Guards and Validation

#### Reference Value Detection
```typescript
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
```

#### Simple Value Detection
```typescript
export function isSimpleValue(value: ProcessDefaultValue): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
```

### Error Handling and Recovery

#### Field Processing Error Recovery
```typescript
try {
  // Process field value
} catch (error) {
  logger.error(`Error processing default value for field ${fieldName}:`, error);
  // Set fallback value to prevent form errors
  const parameter = parameterMap.get(fieldName);
  const formFieldName = parameter?.name || fieldName;
  acc[formFieldName] = "";
}
```

#### Logic Field Filtering
```typescript
// Skip logic fields (will be processed separately)
if (fieldName.endsWith('_display_logic') || fieldName.endsWith('_readonly_logic')) {
  continue;
}
```

### Integration with Form System

#### Form Data Population
```typescript
const availableFormData = useMemo(() => {
  // Build base payload with system context fields
  const basePayload = buildProcessPayload(record, tab, {}, {});

  return {
    ...basePayload,        // System context fields
    ...initialState,       // Already processed defaults from useProcessInitializationState
  };
}, [record, tab, initialState]);
```

#### Form Reset Integration
```typescript
useEffect(() => {
  if (hasInitialData && Object.keys(availableFormData).length > 0) {
    console.log('Resetting form with new values:', availableFormData);
    form.reset(availableFormData);
  }
}, [hasInitialData, availableFormData, form]);
```

### Performance Considerations

#### Memoized Processing
All value processing is memoized to prevent unnecessary recomputation:

```typescript
const initialState = useMemo(() => {
  // Process defaults only when processInitialization changes
}, [processInitialization, parameterMap]);
```

#### Efficient Parameter Mapping
Parameter mapping uses Map for O(1) lookups instead of array iteration.

### Testing Strategies

#### Unit Tests
```typescript
describe('useProcessInitialState', () => {
  it('should map reference values correctly', () => {
    const mockDefaults = {
      'c_bpartner_id': { value: '123', identifier: 'Test Partner' }
    };
    const result = useProcessInitialState({ defaults: mockDefaults }, []);
    expect(result['c_bpartner_id']).toBe('123');
    expect(result['c_bpartner_id$_identifier']).toBe('Test Partner');
  });

  it('should handle simple values', () => {
    const mockDefaults = {
      'stringField': 'test value',
      'numberField': 42,
      'booleanField': true
    };
    const result = useProcessInitialState({ defaults: mockDefaults }, []);
    expect(result['stringField']).toBe('test value');
    expect(result['numberField']).toBe('42');
    expect(result['booleanField']).toBe(true);
  });
});
```

### Common Issues and Solutions

#### Issue: Field Names Not Matching Form
**Problem**: Values not appearing in form fields due to name mismatch
**Solution**: Use original field names from server instead of parameter display names

#### Issue: Reference Values Not Displaying
**Problem**: Reference fields showing IDs instead of display values
**Solution**: Ensure both value and identifier are stored correctly

#### Issue: Logic Fields Interfering
**Problem**: Logic field values being treated as regular form fields
**Solution**: Filter out logic fields during initial state processing

### Future Enhancements

1. **Advanced Type Detection**: More sophisticated value type detection
2. **Custom Field Processors**: Allow custom processing for specific field types
3. **Validation Integration**: Add field-level validation during processing
4. **Performance Monitoring**: Track processing performance for optimization

## Related Documentation

- [Process Initialization System](../architecture/process-initialization-system.md)
- [Type Guards and Validation](../types/type-guards.md)
- [Form Integration Patterns](../patterns/form-integration.md)

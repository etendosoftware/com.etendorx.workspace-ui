# Debugging and Troubleshooting Guide

This guide provides comprehensive troubleshooting information for the ProcessModal defaults integration system, covering common issues, debugging techniques, and resolution strategies.

## 🚨 Common Issues and Solutions

### 1. **Defaults Not Loading**

#### Symptom
Process modal opens but fields remain empty despite expecting default values.

#### Diagnostic Steps

```typescript
// Enable debug logging
import { logger } from '@/utils/logger';

// Check if hook is enabled
const { processInitialization, loading, error } = useProcessInitialization({
  processId: "your-process-id",
  windowId: "your-window-id",
  enabled: true // ← Ensure this is true
});

console.log('ProcessInitialization State:', {
  processInitialization,
  loading,
  error,
  enabled: true
});
```

#### Common Causes and Solutions

**Cause 1: Hook Disabled**
```typescript
// ❌ Problem
const { ... } = useProcessInitialization({
  processId,
  windowId,
  enabled: false // ← Hook is disabled
});

// ✅ Solution
const { ... } = useProcessInitialization({
  processId,
  windowId,
  enabled: !!processId && !!windowId // ← Enable when IDs are available
});
```

**Cause 2: Missing Process or Window ID**
```typescript
// ❌ Problem
const { ... } = useProcessInitialization({
  processId: "", // ← Empty process ID
  windowId: undefined, // ← Missing window ID
  enabled: true
});

// ✅ Solution - Add validation
const { ... } = useProcessInitialization({
  processId,
  windowId,
  enabled: !!processId && !!windowId && processId !== "" && windowId !== ""
});
```

**Cause 3: API Error Not Handled**
```typescript
// ✅ Solution - Check for errors
useEffect(() => {
  if (error) {
    console.error('Process defaults error:', error);
    // Check error details
    if (error.message.includes('404')) {
      console.warn('Process not found or no defaults configured');
    } else if (error.message.includes('403')) {
      console.warn('Insufficient permissions for process defaults');
    }
  }
}, [error]);
```

### 2. **Type Errors with isReferenceValue/isSimpleValue**

#### Symptom
```
ReferenceError: isReferenceValue is not defined
```

#### Solution
```typescript
// ❌ Wrong import
import type { isReferenceValue, isSimpleValue } from './types';

// ✅ Correct import
import { isReferenceValue, isSimpleValue } from './types';
// Note: Import as values, not types
```

### 3. **Form Fields Not Pre-populated**

#### Symptom
Hook returns data but form fields remain empty.

#### Diagnostic Steps

```typescript
// Check if initial state is being passed to form
const { initialState, logicFields } = useProcessInitializationState(
  processInitialization,
  parameters
);

console.log('Initial State Data:', initialState);
console.log('Logic Fields:', logicFields);

// Check form initialization
const availableFormData = useMemo(() => ({
  ...recordValues,
  ...initialState // ← Ensure this is spread after recordValues
}), [recordValues, initialState]);

console.log('Available Form Data:', availableFormData);

const form = useForm({
  values: availableFormData, // ← Ensure this is passed
  mode: "onChange"
});
```

#### Common Solutions

**Solution 1: Fix Form Data Combination**
```typescript
// ❌ Problem - initialState overridden by recordValues
const availableFormData = useMemo(() => ({
  ...initialState,
  ...recordValues // ← This overrides defaults
}), [recordValues, initialState]);

// ✅ Solution - Defaults take precedence
const availableFormData = useMemo(() => ({
  ...recordValues,
  ...initialState // ← Defaults override record values
}), [recordValues, initialState]);
```

**Solution 2: Handle Null Initial State**
```typescript
// ✅ Solution - Guard against null
const availableFormData = useMemo(() => ({
  ...recordValues,
  ...(initialState || {}) // ← Guard against null
}), [recordValues, initialState]);
```

### 4. **Logic Fields Not Working**

#### Symptom
Fields show but ignore display_logic or readonly_logic from defaults.

#### Diagnostic Steps

```typescript
// Check if logic fields are extracted correctly
const { logicFields } = useProcessInitializationState(
  processInitialization,
  parameters
);

console.log('Logic Fields:', logicFields);

// Example expected output:
// {
//   "trxtype.display": false,
//   "received_from.readonly": true
// }

// Check if logic fields are passed to selector
<ProcessParameterSelector
  parameter={parameter}
  logicFields={logicFields} // ← Ensure this is passed
/>
```

#### Solution

```typescript
// ✅ Ensure ProcessParameterSelector receives logic fields
const renderParameters = () => {
  return Object.values(parameters).map((parameter) => (
    <ProcessParameterSelector
      key={parameter.name}
      parameter={parameter}
      logicFields={logicFields} // ← Must pass logic fields
    />
  ));
};
```

### 5. **Reference Fields Showing IDs Instead of Names**

#### Symptom
Reference fields show database IDs instead of user-friendly names.

#### Diagnostic Steps

```typescript
// Check if identifier is being processed correctly
const diagnosticProcessing = (value: any, fieldName: string) => {
  console.log(`Processing field ${fieldName}:`, value);
  
  if (isReferenceValue(value)) {
    console.log('Reference value detected:', {
      value: value.value,
      identifier: value.identifier
    });
    return value.value; // ← Should use value for form
    // identifier should be stored as ${fieldName}$_identifier
  }
  
  return value;
};
```

#### Solution

```typescript
// ✅ Ensure proper reference value processing
if (isReferenceValue(value)) {
  // Store value for form submission
  acc[formFieldName] = value.value;
  
  // Store identifier for display
  if (value.identifier) {
    acc[`${formFieldName}$_identifier`] = value.identifier;
  }
  
  logger.debug(`Processed reference field ${fieldName}:`, {
    formField: formFieldName,
    value: value.value,
    identifier: value.identifier
  });
}
```

## 🔍 Debugging Techniques

### 1. **Enable Debug Logging**

```typescript
// Temporary debugging - add to component
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    // Enable verbose logging
    localStorage.setItem('debug', 'process-defaults:*');
    
    // Log all state changes
    console.group('ProcessModal Debug Info');
    console.log('Process ID:', processId);
    console.log('Window ID:', windowId);
    console.log('Parameters:', parameters);
    console.log('Process Initialization:', processInitialization);
    console.log('Initial State:', initialState);
    console.log('Logic Fields:', logicFields);
    console.log('Available Form Data:', availableFormData);
    console.groupEnd();
  }
}, [processId, windowId, parameters, processInitialization, initialState, logicFields, availableFormData]);
```

### 2. **API Request Debugging**

```typescript
// Add request/response logging to useProcessInitialization
const fetchWithLogging = async (params: URLSearchParams, payload: any) => {
  console.group('🌐 Process Defaults API Call');
  console.log('URL:', `${baseUrl}?${params}`);
  console.log('Payload:', payload);
  
  const startTime = performance.now();
  
  try {
    const response = await Metadata.kernelClient.post(`?${params}`, payload);
    const endTime = performance.now();
    
    console.log('✅ Response received in:', `${(endTime - startTime).toFixed(2)}ms`);
    console.log('Response data:', response.data);
    console.groupEnd();
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    
    console.log('❌ Request failed in:', `${(endTime - startTime).toFixed(2)}ms`);
    console.error('Error:', error);
    console.groupEnd();
    
    throw error;
  }
};
```

### 3. **Data Flow Tracing**

```typescript
// Add data flow tracing
const traceDataFlow = (data: any, stage: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Data Flow - ${stage}:`, {
      timestamp: new Date().toISOString(),
      stage,
      data: JSON.parse(JSON.stringify(data)),
      keys: Object.keys(data || {}),
      size: JSON.stringify(data || {}).length
    });
  }
};

// Usage in processing
traceDataFlow(rawResponse, 'Raw API Response');
traceDataFlow(processedDefaults, 'Processed Defaults');
traceDataFlow(initialState, 'Form Initial State');
traceDataFlow(availableFormData, 'Final Form Data');
```

## 🛠️ Development Tools

### 1. **Browser DevTools Integration**

```typescript
// Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  window.processDefaultsDebug = {
    // Access current state
    getCurrentState: () => ({
      processInitialization,
      initialState,
      logicFields,
      filterExpressions,
      availableFormData
    }),
    
    // Force refetch
    refetchDefaults: () => refetch(),
    
    // Test type guards
    testTypeGuards: (value: any) => ({
      isReference: isReferenceValue(value),
      isSimple: isSimpleValue(value),
      type: typeof value
    }),
    
    // Validate response structure
    validateResponse: (response: any) => {
      const validation = {
        hasDefaults: !!response?.defaults,
        hasFilterExpressions: !!response?.filterExpressions,
        hasRefreshParent: typeof response?.refreshParent === 'boolean',
        defaultsCount: Object.keys(response?.defaults || {}).length,
        filterCount: Object.keys(response?.filterExpressions || {}).length
      };
      
      console.table(validation);
      return validation;
    }
  };
}
```

### 2. **React DevTools Integration**

```typescript
// Add display names for easier debugging
useProcessInitialization.displayName = 'useProcessInitialization';
useProcessInitializationState.displayName = 'useProcessInitializationState';

// Add debug props to components
const ProcessDefinitionModal = (props) => {
  // Component logic...
  
  return (
    <div data-testid="process-modal" data-process-id={processId}>
      {/* Component JSX */}
    </div>
  );
};

ProcessDefinitionModal.displayName = 'ProcessDefinitionModal';
```

### 3. **Custom Hook for Debugging**

```typescript
const useProcessDefaultsDebugger = (
  processInitialization: ProcessDefaultsResponse | null,
  parameters: ProcessParameter[]
) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    if (!processInitialization) return;
    
    const debug = {
      timestamp: new Date().toISOString(),
      responseStructure: {
        hasDefaults: !!processInitialization.defaults,
        defaultsCount: Object.keys(processInitialization.defaults).length,
        hasLogicFields: Object.keys(processInitialization.defaults).some(
          key => key.endsWith('_display_logic') || key.endsWith('_readonly_logic')
        ),
        hasReferenceValues: Object.values(processInitialization.defaults).some(isReferenceValue),
        hasSimpleValues: Object.values(processInitialization.defaults).some(isSimpleValue)
      },
      fieldTypes: Object.entries(processInitialization.defaults).reduce((acc, [key, value]) => {
        if (isReferenceValue(value)) acc.reference.push(key);
        else if (isSimpleValue(value)) acc.simple.push(key);
        else if (key.includes('_logic')) acc.logic.push(key);
        else acc.unknown.push(key);
        return acc;
      }, { reference: [], simple: [], logic: [], unknown: [] } as Record<string, string[]>),
      parameterMapping: parameters.map(param => ({
        name: param.name,
        reference: param.reference,
        hasDefault: param.name in processInitialization.defaults,
        defaultValue: processInitialization.defaults[param.name]
      }))
    };
    
    setDebugInfo(debug);
    console.log('🔧 Process Defaults Debug Info:', debug);
  }, [processInitialization, parameters]);
  
  return debugInfo;
};
```

## 📋 Troubleshooting Checklist

### Before Reporting an Issue

- [ ] **Verify Prerequisites**
  - [ ] Process ID is not empty
  - [ ] Window ID is provided
  - [ ] Hook is enabled (`enabled: true`)
  - [ ] Component is mounted

- [ ] **Check Network**
  - [ ] API endpoint is reachable
  - [ ] Authentication is valid
  - [ ] No CORS issues in browser console

- [ ] **Validate Data Flow**
  - [ ] API returns data (check network tab)
  - [ ] Data is processed correctly (check console logs)
  - [ ] Initial state is generated
  - [ ] Form receives combined data

- [ ] **Test Type Guards**
  - [ ] Import type guards as functions, not types
  - [ ] Type guards work with sample data
  - [ ] No runtime errors in processing

- [ ] **Verify Form Integration**
  - [ ] Form uses `values` prop for initialization
  - [ ] Available form data includes initial state
  - [ ] Field names match between response and parameters

### Performance Checklist

- [ ] **Response Time**
  - [ ] API responds within 500ms
  - [ ] Processing completes within 10ms
  - [ ] No memory leaks detected

- [ ] **Caching**
  - [ ] Duplicate requests are avoided
  - [ ] Cache TTL is appropriate
  - [ ] Cache invalidation works correctly

- [ ] **Bundle Size**
  - [ ] No unexpected bundle size increase
  - [ ] Tree shaking works correctly
  - [ ] No duplicate dependencies

## 🚑 Emergency Fixes

### 1. **Quick Disable for Production Issues**

```typescript
// Emergency feature flag to disable defaults
const EMERGENCY_DISABLE_DEFAULTS = process.env.REACT_APP_DISABLE_PROCESS_DEFAULTS === 'true';

const { processInitialization, loading, error } = useProcessInitialization({
  processId,
  windowId,
  recordId,
  enabled: !EMERGENCY_DISABLE_DEFAULTS && !!processId && !!windowId
});

// Set environment variable to disable:
// REACT_APP_DISABLE_PROCESS_DEFAULTS=true
```

### 2. **Fallback to Empty Defaults**

```typescript
// Always provide safe fallback
const safeProcessInitialization = processInitialization || {
  defaults: {},
  filterExpressions: {},
  refreshParent: false
};

const { initialState } = useProcessInitializationState(
  safeProcessInitialization,
  parameters
);
```

### 3. **Skip Logic Fields in Emergency**

```typescript
// Disable logic field processing if causing issues
const EMERGENCY_SKIP_LOGIC = process.env.REACT_APP_SKIP_LOGIC_FIELDS === 'true';

const { initialState, logicFields } = useProcessInitializationState(
  processInitialization,
  parameters
);

// Pass empty logic fields in emergency
const safeLogicFields = EMERGENCY_SKIP_LOGIC ? {} : logicFields;
```

## 📞 Getting Help

### 1. **Information to Collect**

When reporting issues, include:

```typescript
// Run this in browser console and include output
console.log('🐛 Debug Information:', {
  // Environment
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString(),
  
  // Process info
  processId: 'your-process-id',
  windowId: 'your-window-id',
  
  // Hook state
  processInitialization: processInitialization,
  loading: loading,
  error: error?.message,
  
  // Data processing
  initialState: initialState,
  logicFields: logicFields,
  parametersCount: parameters?.length,
  
  // Browser state
  localStorage: Object.keys(localStorage),
  sessionStorage: Object.keys(sessionStorage)
});
```

### 2. **Error Reproduction Steps**

1. Exact steps to reproduce the issue
2. Expected behavior vs. actual behavior
3. Browser and version information
4. Network conditions (if relevant)
5. Authentication state

### 3. **Sample Data**

Provide sanitized sample data:

```typescript
// Sanitize sensitive data before sharing
const sanitizeForSharing = (data: any) => {
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Replace sensitive values
  const replaceSensitive = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        if (key.includes('id') || key.includes('Id')) {
          obj[key] = 'SANITIZED-ID';
        } else if (obj[key].length > 20) {
          obj[key] = 'SANITIZED-LONG-STRING';
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceSensitive(obj[key]);
      }
    }
  };
  
  replaceSensitive(sanitized);
  return sanitized;
};

console.log('Sanitized data for sharing:', sanitizeForSharing(processInitialization));
```

---

This debugging guide should help resolve most issues with the ProcessModal defaults integration system. For complex issues not covered here, please collect the debug information and contact the development team.
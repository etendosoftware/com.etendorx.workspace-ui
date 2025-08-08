# Process Execution API Documentation

This document provides comprehensive API documentation for process execution, including data structures, request/response formats, adapters, and integration patterns based on the actual system implementation.

## Overview

The Process Execution system works with nested `processDefinition` objects that are embedded within window field definitions. This document describes how to locate, parse, and work with these structures as they exist in the current system.

## Data Structure Location

### Finding processDefinition in Window Response

The `processDefinition` is not a top-level API endpoint but is nested within window field definitions:

```
response.json
└── tabs[0] ("Header - Sales Invoice")
    └── fields
        └── aPRMAddpayment
            └── processDefinition: { ... }
```

### Process Definition Structure

Based on the actual system implementation, here's the structure of a `processDefinition`:

```json
{
  "_identifier": "Add Payment",
  "id": "9BED7889E1034FE68BD85D5D16857320",
  "name": "Add Payment", 
  "description": "Add Payment window is intended to deliver capabilities of add payments against invoices and orders.",
  "javaClassName": "org.openbravo.advpaymentmngt.actionHandler.AddPaymentActionHandler",
  "clientSideValidation": "OB.APRM.AddPayment.onProcess",
  "loadFunction": "OB.APRM.AddPayment.onLoad",
  "uIPattern": "A",
  "parameters": {
    "trxtype": {
      "_identifier": "Document",
      "name": "Document",
      "reference": "List",
      "mandatory": true
    },
    "ad_org_id": {
      "_identifier": "Organization",
      "name": "Organization", 
      "reference": "OBUISEL_Selector Reference",
      "mandatory": true
    },
    "bslamount": {
      "_identifier": "Bank Statement Line Amount",
      "name": "Bank Statement Line Amount",
      "reference": "Amount",
      "mandatory": false
    },
    "payment_documentno": {
      "_identifier": "Payment Document No.",
      "name": "Payment Document No.",
      "reference": "String",
      "mandatory": true
    }
  }
}
```

### Process Definition Properties

| Property | Type | Description |
|----------|------|-------------|
| `_identifier` | String | Human-readable identifier for logging/debugging |
| `id` | String | Unique UUID of the process record |
| `name` | String | **UI Key**: Process name to display as modal title |
| `description` | String | **UI Key**: Detailed description for help text/subtitle |
| `javaClassName` | String | Server-side Java class that executes the process logic |
| `clientSideValidation` | String | JavaScript function name for client-side parameter validation |
| `loadFunction` | String | JavaScript function executed when process modal loads |
| `uIPattern` | String | UI pattern - 'A' (Standard) for modal processes |
| `parameters` | Object | **UI Key**: Parameter definitions for form field rendering |

### Parameter Structure

Each parameter in the `parameters` object has this structure:

```json
{
  "_identifier": "Human readable name",
  "name": "Display Label",
  "reference": "Field Type", 
  "mandatory": true|false,
  "defaultValue": "default_value",
  "displaylogic": "@SomeField@==='Y'",
  "readonlylogic": "@AnotherField@!=='N'"
}
```

### Field Reference Types

The `reference` property determines which UI component to render:

| Reference Value | UI Component | Notes |
|----------------|--------------|-------|
| `String` | Text Input | Standard text input |
| `List` | Dropdown/Radio | Values from `valueMap` property |
| `Amount` | Numeric Input | Number formatting and validation |
| `Date` | Date Picker | Calendar date selection |
| `DateTime` | DateTime Picker | Date and time selection |
| `Yes/No` | Checkbox | Boolean value representation |
| `OBUISEL_Selector Reference` | Search Selector | Complex modal search for entity records |
| `Button` | Button | Action buttons within the form |
| `Text` | Textarea | Multi-line text input |
| `TableDir` / `Search` | Search Selector | Entity reference lookup |

## Process Execution Flow

### 1. Locating Process Definition

To find and extract a process definition:

```typescript
// Navigate the nested structure
const processDefinition = response.tabs[0].fields.aPRMAddpayment.processDefinition;

// Extract key properties for UI
const {
  id,
  name,           // Modal title
  description,    // Modal subtitle/help
  parameters,     // Form field definitions
  clientSideValidation, // Validation function name
  loadFunction,   // Load function name
  javaClassName   // Server execution handler
} = processDefinition;
```

### 2. Parameter Processing

Process parameters to build the form UI:

```typescript
// Iterate over parameters to build form fields
Object.entries(parameters).forEach(([paramName, paramDef]) => {
  const {
    name,           // Field label
    reference,      // Field type for component selection
    mandatory,      // Required validation
    defaultValue,   // Pre-fill value
    displaylogic,   // Visibility condition
    readonlylogic   // Read-only condition
  } = paramDef;
  
  // Render appropriate component based on reference type
  const component = selectComponentByReference(reference);
});
```

### 3. Dynamic Logic Evaluation

Handle conditional field behavior:

```typescript
// Display logic evaluation
const evaluateDisplayLogic = (expression: string, context: Record<string, any>): boolean => {
  // Example: "@SomeField@==='Y'"
  if (!expression) return true;
  
  // Replace @FieldName@ with actual values from context
  const evaluableExpression = expression.replace(
    /@(\w+)@/g, 
    (match, fieldName) => context[fieldName] || 'null'
  );
  
  try {
    return new Function('return ' + evaluableExpression)();
  } catch {
    return true; // Default to visible on error
  }
};

// Read-only logic evaluation (similar pattern)
const evaluateReadOnlyLogic = (expression: string, context: Record<string, any>): boolean => {
  // Similar implementation as displaylogic
};
```

## API Endpoints

### Process Execution

#### Execute Process
```http
POST /api/process-execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "processId": "9BED7889E1034FE68BD85D5D16857320",
  "parameters": {
    "trxtype": "Invoice",
    "ad_org_id": "org123",
    "bslamount": 150.00,
    "payment_documentno": "PAY-001"
  },
  "context": {
    "windowId": "invoiceWindow",
    "tabId": "headerTab", 
    "recordId": "invoice456",
    "user": {
      "id": "user123",
      "organizationId": "org456",
      "clientId": "client789"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "msgType": "success",
    "msgTitle": "Process Completed Successfully", 
    "msgText": "Payment added successfully",
    "details": "Payment PAY-001 for amount 150.00 has been created"
  },
  "data": {
    "paymentId": "payment789",
    "amount": 150.00,
    "documentNo": "PAY-001"
  },
  "errors": [],
  "warnings": [],
  "refreshParent": true,
  "showInIframe": false
}
```

#### Process Validation (Client-Side)

The system supports client-side validation through JavaScript functions:

```typescript
// Client-side validation function
if (processDefinition.clientSideValidation) {
  const validationFunction = window[processDefinition.clientSideValidation];
  if (typeof validationFunction === 'function') {
    const isValid = validationFunction(parameters, context);
    if (!isValid) {
      // Handle validation failure
      return;
    }
  }
}

// Process load function
if (processDefinition.loadFunction) {
  const loadFunction = window[processDefinition.loadFunction];
  if (typeof loadFunction === 'function') {
    loadFunction(parameters, context);
  }
}
```

### Error Handling

#### Error Response Format
```json
{
  "success": false,
  "message": {
    "msgType": "error",
    "msgTitle": "Process Execution Failed",
    "msgText": "Parameter validation failed",
    "details": "Required field 'Document' is missing"
  },
  "errors": [
    {
      "code": "REQUIRED_FIELD_MISSING",
      "message": "Document field is required",
      "field": "trxtype",
      "severity": "error"
    }
  ],
  "data": null
}
```

## Data Processing Adapters

### Process Definition Adapter

```typescript
class ProcessDefinitionAdapter {
  /**
   * Extracts processDefinition from nested window field structure
   */
  extractFromWindowResponse(windowResponse: any, fieldName: string): ProcessDefinition | null {
    try {
      // Navigate: tabs[0].fields[fieldName].processDefinition
      const tabs = windowResponse.tabs;
      if (!tabs || tabs.length === 0) return null;
      
      const fields = tabs[0].fields;
      if (!fields || !fields[fieldName]) return null;
      
      const processDefinition = fields[fieldName].processDefinition;
      if (!processDefinition) return null;
      
      return this.adapt(processDefinition);
    } catch (error) {
      console.error('Failed to extract processDefinition:', error);
      return null;
    }
  }

  /**
   * Adapts raw processDefinition to standardized format
   */
  adapt(rawProcessDefinition: any): ProcessDefinition {
    return {
      id: rawProcessDefinition.id,
      _identifier: rawProcessDefinition._identifier,
      name: rawProcessDefinition.name,
      description: rawProcessDefinition.description,
      javaClassName: rawProcessDefinition.javaClassName,
      clientSideValidation: rawProcessDefinition.clientSideValidation,
      loadFunction: rawProcessDefinition.loadFunction,
      uIPattern: rawProcessDefinition.uIPattern,
      parameters: this.adaptParameters(rawProcessDefinition.parameters || {})
    };
  }

  private adaptParameters(rawParameters: any): ProcessParameters {
    const result: ProcessParameters = {};
    
    for (const [key, rawParam] of Object.entries(rawParameters)) {
      const param = rawParam as any;
      result[key] = {
        _identifier: param._identifier,
        name: param.name,
        reference: param.reference,
        mandatory: param.mandatory || false,
        defaultValue: param.defaultValue,
        displaylogic: param.displaylogic,
        readonlylogic: param.readonlylogic,
        // Map additional properties as needed
        dBColumnName: key // Use parameter key as database column name
      };
    }
    
    return result;
  }
}
```

### Field Reference Mapper

```typescript
class FieldReferenceMapper {
  /**
   * Maps textual reference types to component types
   */
  private static REFERENCE_MAPPING: Record<string, string> = {
    'String': 'text',
    'List': 'select',
    'Amount': 'number',
    'Date': 'date',
    'DateTime': 'datetime',
    'Yes/No': 'boolean',
    'OBUISEL_Selector Reference': 'search',
    'Button': 'button',
    'Text': 'textarea',
    'TableDir': 'search',
    'Search': 'search'
  };

  static getComponentType(reference: string): string {
    return this.REFERENCE_MAPPING[reference] || 'text';
  }

  static isSearchType(reference: string): boolean {
    return ['OBUISEL_Selector Reference', 'TableDir', 'Search'].includes(reference);
  }

  static isListType(reference: string): boolean {
    return reference === 'List';
  }

  static isNumericType(reference: string): boolean {
    return ['Amount', 'Number'].includes(reference);
  }

  static isDateType(reference: string): boolean {
    return ['Date', 'DateTime'].includes(reference);
  }

  static isBooleanType(reference: string): boolean {
    return reference === 'Yes/No';
  }
}
```

### Process Parameter to FormView Field Mapper

```typescript
class ProcessParameterToFieldMapper {
  /**
   * Maps ProcessParameter to FormView Field interface for component reuse
   */
  mapToField(parameter: ProcessParameter, parameterName: string): Field {
    return {
      // Basic field properties
      hqlName: parameterName,
      columnName: parameterName,
      name: parameter.name,
      _identifier: parameter._identifier,
      
      // Validation properties
      isMandatory: parameter.mandatory,
      
      // Column metadata for selector components
      column: {
        reference: parameter.reference,
        defaultValue: parameter.defaultValue,
        // Add other column properties as needed
      },
      
      // Logic expressions
      readOnlyLogicExpression: parameter.readonlylogic,
      displayLogicExpression: parameter.displaylogic,
      
      // Default value
      defaultValue: parameter.defaultValue,
      
      // Additional properties that FormView selectors might expect
      isReadOnly: false, // Will be calculated dynamically based on readonlylogic
      isVisible: true,   // Will be calculated dynamically based on displaylogic
      
      // For list/select parameters, map valueMap if available
      valueMap: this.extractValueMap(parameter),
      
      // For search parameters, include window metadata if available
      window: parameter.window
    };
  }

  private extractValueMap(parameter: ProcessParameter): Record<string, string> | undefined {
    // If parameter has refList, convert it to valueMap format
    if (parameter.refList && Array.isArray(parameter.refList)) {
      const valueMap: Record<string, string> = {};
      parameter.refList.forEach(item => {
        valueMap[item.value] = item.name || item.label;
      });
      return valueMap;
    }
    return undefined;
  }

  /**
   * Calculates if field should be read-only based on readonlylogic expression
   */
  calculateReadOnly(parameter: ProcessParameter, context: Record<string, any>): boolean {
    if (!parameter.readonlylogic) return false;
    
    try {
      // Replace @FieldName@ tokens with actual values
      const expression = parameter.readonlylogic.replace(
        /@(\w+)@/g,
        (match, fieldName) => {
          const value = context[fieldName];
          return typeof value === 'string' ? `'${value}'` : String(value || 'null');
        }
      );
      
      return new Function('return ' + expression)();
    } catch (error) {
      console.warn('Failed to evaluate readonlylogic:', parameter.readonlylogic, error);
      return false;
    }
  }

  /**
   * Calculates if field should be visible based on displaylogic expression
   */
  calculateVisibility(parameter: ProcessParameter, context: Record<string, any>): boolean {
    if (!parameter.displaylogic) return true;
    
    try {
      // Replace @FieldName@ tokens with actual values
      const expression = parameter.displaylogic.replace(
        /@(\w+)@/g,
        (match, fieldName) => {
          const value = context[fieldName];
          return typeof value === 'string' ? `'${value}'` : String(value || 'null');
        }
      );
      
      return new Function('return ' + expression)();
    } catch (error) {
      console.warn('Failed to evaluate displaylogic:', parameter.displaylogic, error);
      return true;
    }
  }
}
```

### Process Execution Request Builder

```typescript
class ProcessExecutionRequestBuilder {
  /**
   * Builds execution request from form data and process definition
   */
  buildRequest(
    processDefinition: ProcessDefinition,
    formData: Record<string, any>,
    context: ProcessContext
  ): ProcessExecutionRequest {
    return {
      processId: processDefinition.id,
      parameters: this.serializeParameters(formData, processDefinition.parameters),
      context: {
        windowId: context.windowId,
        tabId: context.tabId,
        recordId: context.recordId,
        user: context.user
      }
    };
  }

  private serializeParameters(
    formData: Record<string, any>, 
    parameterDefinitions: ProcessParameters
  ): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [paramName, paramDef] of Object.entries(parameterDefinitions)) {
      const value = formData[paramName];
      result[paramName] = this.serializeParameterValue(value, paramDef.reference);
    }
    
    return result;
  }

  private serializeParameterValue(value: any, reference: string): any {
    if (value === null || value === undefined) return null;
    
    switch (reference) {
      case 'Yes/No':
        // Convert boolean to Y/N string
        return typeof value === 'boolean' ? (value ? 'Y' : 'N') : value;
      
      case 'Date':
      case 'DateTime':
        // Ensure date is in ISO format
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      
      case 'Amount':
        // Ensure numeric values are properly formatted
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      
      default:
        return value;
    }
  }
}

### Process Response Handler

```typescript
class ProcessResponseHandler {
  /**
   * Processes execution response and handles different result types
   */
  handleResponse(response: ProcessExecutionResponse): ProcessHandlerResult {
    if (!response.success) {
      return this.handleError(response);
    }
    
    return {
      success: true,
      message: response.message,
      data: response.data,
      shouldRefreshParent: response.refreshParent,
      shouldShowIframe: response.showInIframe,
      iframeUrl: response.iframeUrl
    };
  }

  private handleError(response: ProcessExecutionResponse): ProcessHandlerResult {
    return {
      success: false,
      message: response.message,
      errors: response.errors || [],
      warnings: response.warnings || []
    };
  }

  /**
   * Handles client-side validation before execution
   */
  validateBeforeExecution(
    processDefinition: ProcessDefinition,
    formData: Record<string, any>,
    context: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check mandatory fields
    for (const [paramName, paramDef] of Object.entries(processDefinition.parameters)) {
      if (paramDef.mandatory && !formData[paramName]) {
        errors.push(`${paramDef.name} is required`);
      }
    }
    
    // Execute client-side validation function if available
    if (processDefinition.clientSideValidation) {
      try {
        const validationFn = (window as any)[processDefinition.clientSideValidation];
        if (typeof validationFn === 'function') {
          const customValidation = validationFn(formData, context);
          if (customValidation && !customValidation.valid) {
            errors.push(...(customValidation.errors || []));
            warnings.push(...(customValidation.warnings || []));
          }
        }
      } catch (error) {
        console.warn('Client-side validation function failed:', error);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## Real-time Communication

### Server-Sent Events (SSE)

For long-running processes, the system uses SSE for real-time progress updates:

```typescript
class ProcessExecutionSSEClient {
  private eventSource: EventSource | null = null;
  private executionId: string | null = null;

  startListening(executionId: string, onProgress: (progress: ExecutionProgress) => void): void {
    this.executionId = executionId;
    this.eventSource = new EventSource(`/api/process-execute/${executionId}/stream`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const progress: ExecutionProgress = JSON.parse(event.data);
        onProgress(progress);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.reconnect();
    };
  }

  stopListening(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.executionId = null;
  }

  private reconnect(): void {
    if (this.executionId) {
      setTimeout(() => {
        this.stopListening();
        // Restart with same execution ID
      }, 5000);
    }
  }
}
```

### WebSocket Integration

For more complex real-time scenarios:

```typescript
class ProcessExecutionWebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('/ws/process-execution');
      
      this.ws.onopen = () => resolve();
      this.ws.onerror = (error) => reject(error);
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    });
  }

  subscribe(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  unsubscribe(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  send(messageType: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: messageType, data }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}
```

## Error Handling

### API Error Types

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  requestId: string;
}

interface ProcessApiError extends ApiError {
  processId?: string;
  parameter?: string;
  validationErrors?: ValidationError[];
}

class ProcessApiErrorHandler {
  handleError(error: ProcessApiError): ProcessExecutionError {
    switch (error.code) {
      case 'PROCESS_NOT_FOUND':
        return {
          code: error.code,
          message: 'Process definition not found',
          severity: 'fatal',
          recoverable: false
        };
      
      case 'PARAMETER_VALIDATION_FAILED':
        return {
          code: error.code,
          message: error.message,
          field: error.parameter,
          severity: 'error',
          recoverable: true
        };
      
      case 'INSUFFICIENT_PERMISSIONS':
        return {
          code: error.code,
          message: 'Insufficient permissions to execute process',
          severity: 'fatal',
          recoverable: false
        };
      
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          severity: 'error',
          recoverable: true
        };
    }
  }
}
```

## Caching Strategy

### API Response Caching

```typescript
class ProcessApiCache {
  private cache = new Map<string, CachedData<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.updatedAt > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      updatedAt: Date.now()
    });
    
    // Set expiration timer
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl || this.defaultTTL);
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## Performance Optimizations

### Request Batching

```typescript
class ProcessApiBatcher {
  private batchQueue = new Map<string, ProcessExecutionRequest[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private batchDelay = 100; // ms

  addToBatch(processId: string, request: ProcessExecutionRequest): Promise<ProcessExecutionResponse> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(processId)) {
        this.batchQueue.set(processId, []);
      }
      
      const batch = this.batchQueue.get(processId)!;
      batch.push({ ...request, resolve, reject } as any);
      
      this.scheduleBatchExecution(processId);
    });
  }

  private scheduleBatchExecution(processId: string): void {
    if (this.batchTimers.has(processId)) {
      clearTimeout(this.batchTimers.get(processId));
    }
    
    const timer = setTimeout(() => {
      this.executeBatch(processId);
    }, this.batchDelay);
    
    this.batchTimers.set(processId, timer);
  }

  private async executeBatch(processId: string): Promise<void> {
    const batch = this.batchQueue.get(processId);
    if (!batch || batch.length === 0) return;
    
    this.batchQueue.delete(processId);
    this.batchTimers.delete(processId);
    
    try {
      const responses = await this.executeBatchRequest(processId, batch);
      
      batch.forEach((request: any, index: number) => {
        request.resolve(responses[index]);
      });
    } catch (error) {
      batch.forEach((request: any) => {
        request.reject(error);
      });
    }
  }

  private async executeBatchRequest(
    processId: string, 
    requests: ProcessExecutionRequest[]
  ): Promise<ProcessExecutionResponse[]> {
    const response = await fetch(`/api/process-execute/${processId}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });
    
    if (!response.ok) {
      throw new Error(`Batch execution failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.responses;
  }
}
```

## Usage Examples

### Complete API Integration

```typescript
// Set up API client with adapters
const processDefinitionAdapter = new ProcessDefinitionApiAdapter();
const processConfigAdapter = new ProcessConfigurationApiAdapter();
const processExecutionAdapter = new ProcessExecutionApiAdapter();
const apiCache = new ProcessApiCache();

// Process execution service
class ProcessExecutionService {
  async getProcessDefinition(processId: string): Promise<ProcessDefinition> {
    const cacheKey = `process-definition-${processId}`;
    const cached = apiCache.get<ProcessDefinition>(cacheKey);
    if (cached) return cached;
    
    const response = await fetch(`/api/process-definition/${processId}`);
    const apiData = await response.json();
    const processDefinition = processDefinitionAdapter.adapt(apiData);
    
    apiCache.set(cacheKey, processDefinition);
    return processDefinition;
  }

  async getProcessConfiguration(
    processId: string,
    context: ProcessContext,
    recordValues: RecordValues
  ): Promise<ProcessConfigResponse> {
    const response = await fetch(`/api/process-config/${processId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        windowId: context.windowId,
        tabId: context.tabId,
        recordId: context.recordId,
        context: {
          userId: context.user.id,
          organizationId: context.user.organizationId,
          clientId: context.user.clientId
        },
        recordValues
      })
    });
    
    const apiData = await response.json();
    return processConfigAdapter.adapt(apiData);
  }

  async executeProcess(
    processId: string,
    request: ProcessExecutionRequest
  ): Promise<ProcessExecutionResponse> {
    const apiRequest = processExecutionAdapter.adaptRequest(request);
    
    const response = await fetch(`/api/process-execute/${processId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequest)
    });
    
    const apiResponse = await response.json();
    return processExecutionAdapter.adaptResponse(apiResponse);
  }
}
```

## Summary

This documentation describes the actual process execution system implementation where:

1. **Process definitions are nested** within window field structures, not standalone API endpoints
2. **Field references use textual names** ("String", "List", "Amount") rather than UUIDs
3. **Logic expressions** use simple string patterns ("@FieldName@==='Y'") for conditional behavior
4. **Client-side functions** are referenced by global function names for validation and loading
5. **Parameter structure** is simpler and focused on UI rendering needs

The key to successful implementation is:
- **Proper navigation** of the nested data structure
- **Accurate mapping** of textual field references to UI components  
- **Dynamic evaluation** of display and readonly logic expressions
- **Seamless integration** with existing FormView selector components
- **Robust error handling** and fallback mechanisms

This approach enables the ProcessDefinitionModal to support all 11 FIELD_REFERENCE_CODES while maintaining compatibility with the existing system architecture and data structures.

---

**Document Status**: Updated to match actual system implementation  
**Last Updated**: 2025-08-04  
**Based on**: WINDOW_METADATA.md analysis and system requirements

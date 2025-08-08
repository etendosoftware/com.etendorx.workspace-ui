# Process Execution Type System

This document provides comprehensive documentation for the enhanced type system used in process execution, including interfaces, adapters, transformers, and type safety patterns.

## Overview

The type system provides compile-time type safety, runtime validation, and consistent data transformation across the process execution pipeline. It ensures that data flows correctly between different layers of the application while maintaining type integrity.

## Core Type Definitions

### Base Types

```typescript
// Entity value type - can be string, number, boolean, or null
type EntityValue = string | number | boolean | null;

// Generic entity data structure
type EntityData = Record<string, EntityValue>;

// Record values for process context
type RecordValues = Record<string, EntityValue>;

// Process execution context
interface ProcessContext {
  windowId: string;
  tabId: string;
  recordId?: string;
  selectedRecords?: EntityData[];
  user: UserContext;
  session: SessionData;
}
```

### Process Definition Types

```typescript
// Enhanced process parameter interface
interface ProcessParameter {
  id: string;
  name: string;
  description?: string;
  reference: string;
  mandatory?: boolean;
  defaultValue?: EntityValue;
  refList?: RefListOption[];
  tab?: string;
  window?: ProcessWindow;
  validationRules?: ValidationRule[];
  displayLogic?: string;
  readOnlyLogic?: string;
}

// Process window configuration
interface ProcessWindow {
  id: string;
  name: string;
  tabs: ProcessWindowTab[];
  entityName: string;
}

// Process window tab configuration
interface ProcessWindowTab {
  id: string;
  name: string;
  entityName: string;
  fields: Field[];
  filters?: FilterExpression[];
}

// Reference list option
interface RefListOption {
  id: string;
  name: string;
  value: string;
  searchKey: string;
  description?: string;
  enabled?: boolean;
}

// Validation rule
interface ValidationRule {
  type: ValidationType;
  expression: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  PATTERN = 'pattern',
  CUSTOM = 'custom',
  RANGE = 'range'
}
```

### Process Configuration Types

```typescript
// Enhanced process configuration
interface ProcessConfigResponse {
  processId: string;
  windowId: string;
  tabId: string;
  defaults?: Record<string, ProcessDefaultValue>;
  filters?: ProcessFilterConfig[];
  options?: ProcessOptionConfig[];
  validation?: ProcessValidationConfig;
  permissions?: ProcessPermissionConfig;
}

// Process default value
interface ProcessDefaultValue {
  identifier: EntityValue;
  displayValue: string;
  source: 'static' | 'dynamic' | 'context' | 'user';
}

// Process filter configuration
interface ProcessFilterConfig {
  fieldName: string;
  operator: FilterOperator;
  value: EntityValue;
  dynamic?: boolean;
  source?: string;
}

enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull'
}

// Process option configuration
interface ProcessOptionConfig {
  parameterName: string;
  options: RefListOption[];
  dynamic?: boolean;
  source?: string;
}

// Process validation configuration
interface ProcessValidationConfig {
  rules: ValidationRule[];
  clientSideValidation: boolean;
  serverSideValidation: boolean;
}

// Process permission configuration
interface ProcessPermissionConfig {
  canExecute: boolean;
  canView: boolean;
  restrictions?: string[];
}
```

### Execution Types

```typescript
// Process execution request
interface ProcessExecutionRequest {
  processId: string;
  parameters: Record<string, EntityValue>;
  context: ProcessContext;
  options?: ProcessExecutionOptions;
}

// Process execution options
interface ProcessExecutionOptions {
  validateParameters?: boolean;
  useTransaction?: boolean;
  timeout?: number;
  onProgress?: (progress: ExecutionProgress) => void;
}

// Execution progress
interface ExecutionProgress {
  step: string;
  percentage: number;
  message?: string;
  data?: unknown;
}

// Process execution response
interface ProcessExecutionResponse {
  success: boolean;
  message?: ResponseMessage;
  data?: unknown;
  errors?: ProcessExecutionError[];
  warnings?: ProcessExecutionWarning[];
  refreshParent?: boolean;
  showInIframe?: boolean;
  iframeUrl?: string;
}

// Process execution error
interface ProcessExecutionError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'fatal';
  recoverable?: boolean;
}

// Process execution warning
interface ProcessExecutionWarning {
  code: string;
  message: string;
  field?: string;
  canProceed: boolean;
}

// Response message
interface ResponseMessage {
  msgType: 'success' | 'error' | 'warning' | 'info';
  msgTitle: string;
  msgText: string;
  details?: string;
}
```

### Component Types

```typescript
// Generic component props
interface BaseComponentProps {
  id: string;
  name: string;
  value?: EntityValue;
  onChange: (value: EntityValue) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  help?: string;
}

// Parameter selector props
interface ParameterSelectorProps extends BaseComponentProps {
  parameter: ProcessParameter;
  context: ProcessContext;
  validation?: ValidationResult;
}

// Window reference grid props
interface WindowReferenceGridProps {
  parameter: ProcessParameter;
  onSelectionChange: (selection: EntityData[]) => void;
  context: ProcessContext;
  configuration: WindowReferenceConfiguration;
  loading?: boolean;
  error?: Error;
}

// Window reference configuration
interface WindowReferenceConfiguration {
  entityName: string;
  windowTab: ProcessWindowTab;
  filters: ProcessFilterConfig[];
  columns: GridColumnConfig[];
  pagination: PaginationConfig;
  selection: SelectionConfig;
}

// Grid column configuration
interface GridColumnConfig {
  field: string;
  header: string;
  type: ColumnType;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: EntityValue) => string;
}

enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  REFERENCE = 'reference'
}

// Pagination configuration
interface PaginationConfig {
  pageSize: number;
  pageSizes: number[];
  showPageSizeSelector: boolean;
  showPageInfo: boolean;
}

// Selection configuration
interface SelectionConfig {
  mode: 'single' | 'multiple';
  required: boolean;
  maxSelections?: number;
  selectOnRowClick: boolean;
}
```

### Data Transformation Types

```typescript
// Data transformer interface
interface DataTransformer<TInput, TOutput> {
  transform(input: TInput): TOutput;
  reverse?(output: TOutput): TInput;
  validate?(input: TInput): ValidationResult;
}

// Parameter value transformer
interface ParameterValueTransformer extends DataTransformer<EntityValue, EntityValue> {
  parameterType: string;
  referenceType: string;
}

// Record data transformer
interface RecordDataTransformer extends DataTransformer<EntityData, RecordValues> {
  fields: Field[];
  context: ProcessContext;
}

// Filter expression transformer
interface FilterExpressionTransformer extends DataTransformer<ProcessFilterConfig[], Criteria[]> {
  context: ProcessContext;
  dynamicValues: Record<string, EntityValue>;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Validation error
interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: EntityValue;
}

// Validation warning
interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: EntityValue;
}
```

### Adapter Types

```typescript
// Generic adapter interface
interface Adapter<TSource, TTarget> {
  adapt(source: TSource): TTarget;
  adaptBack?(target: TTarget): TSource;
}

// API response adapter
interface ApiResponseAdapter<TApiResponse, TClientData> extends Adapter<TApiResponse, TClientData> {
  version: string;
  supportedTypes: string[];
}

// Process parameter adapter
interface ProcessParameterAdapter extends Adapter<ProcessParameter, ParameterSelectorProps> {
  parameterType: string;
  componentType: string;
}

// Datasource options adapter
interface DatasourceOptionsAdapter extends Adapter<ProcessConfigResponse, DatasourceOptions> {
  processId: string;
  context: ProcessContext;
}

// Grid configuration adapter
interface GridConfigurationAdapter extends Adapter<ProcessWindowTab, WindowReferenceConfiguration> {
  context: ProcessContext;
  filters: ProcessFilterConfig[];
}
```

## Type Guards and Utilities

### Type Guards

```typescript
// Process parameter type guards
function isWindowReferenceParameter(parameter: ProcessParameter): boolean {
  return parameter.reference === FIELD_REFERENCE_CODES.WINDOW;
}

function isListParameter(parameter: ProcessParameter): boolean {
  return parameter.reference === FIELD_REFERENCE_CODES.LIST_17 || 
         parameter.reference === FIELD_REFERENCE_CODES.LIST_13;
}

function isMandatoryParameter(parameter: ProcessParameter): boolean {
  return parameter.mandatory === true;
}

// Validation result type guards  
function hasValidationErrors(result: ValidationResult): boolean {
  return result.errors.length > 0;
}

function hasValidationWarnings(result: ValidationResult): boolean {
  return result.warnings.length > 0;
}

// Response type guards
function isSuccessResponse(response: ProcessExecutionResponse): boolean {
  return response.success && !response.errors?.length;
}

function isErrorResponse(response: ProcessExecutionResponse): boolean {
  return !response.success || (response.errors?.length || 0) > 0;
}
```

### Type Utilities

```typescript
// Extract parameter types
type ParameterKeys<T extends ProcessParameters> = keyof T;
type ParameterValue<T extends ProcessParameters, K extends ParameterKeys<T>> = T[K];

// Extract component props
type ComponentPropsFor<T extends ProcessParameter> = 
  T['reference'] extends typeof FIELD_REFERENCE_CODES.WINDOW 
    ? WindowReferenceGridProps
    : ParameterSelectorProps;

// Extract validation types
type ValidationFor<T extends ProcessParameter> = 
  T['validationRules'] extends ValidationRule[]
    ? T['validationRules']
    : never;

// Conditional types for parameter handling
type ParameterComponent<T extends ProcessParameter> = 
  T['reference'] extends typeof FIELD_REFERENCE_CODES.WINDOW
    ? React.ComponentType<WindowReferenceGridProps>
    : React.ComponentType<ParameterSelectorProps>;
```

## Value Transformers

### Parameter Value Transformers

```typescript
// Date value transformer
class DateValueTransformer implements ParameterValueTransformer {
  parameterType = 'date';
  referenceType = FIELD_REFERENCE_CODES.DATE;

  transform(input: EntityValue): EntityValue {
    if (!input) return null;
    // Transform from DD-MM-YYYY to YYYY-MM-DD
    return String(input).split('-').reverse().join('-');
  }

  reverse(output: EntityValue): EntityValue {
    if (!output) return null;
    // Transform from YYYY-MM-DD to DD-MM-YYYY
    return String(output).split('-').reverse().join('-');
  }

  validate(input: EntityValue): ValidationResult {
    if (!input) return { valid: true, errors: [], warnings: [] };
    
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    const valid = typeof input === 'string' && dateRegex.test(input);
    
    return {
      valid,
      errors: valid ? [] : [{
        code: 'INVALID_DATE_FORMAT',
        message: 'Date must be in DD-MM-YYYY format',
        value: input
      }],
      warnings: []
    };
  }
}

// Boolean value transformer
class BooleanValueTransformer implements ParameterValueTransformer {
  parameterType = 'boolean';
  referenceType = FIELD_REFERENCE_CODES.BOOLEAN;

  transform(input: EntityValue): EntityValue {
    if (input === true || input === 'true') return 'Y';
    if (input === false || input === 'false') return 'N';
    return input;
  }

  reverse(output: EntityValue): EntityValue {
    if (output === 'Y') return true;
    if (output === 'N') return false;
    return output;
  }

  validate(input: EntityValue): ValidationResult {
    const valid = input === true || input === false || 
                  input === 'Y' || input === 'N' ||
                  input === 'true' || input === 'false';
    
    return {
      valid,
      errors: valid ? [] : [{
        code: 'INVALID_BOOLEAN_VALUE',
        message: 'Value must be a boolean',
        value: input
      }],
      warnings: []
    };
  }
}

// Numeric value transformer
class NumericValueTransformer implements ParameterValueTransformer {
  parameterType = 'numeric';
  referenceType = FIELD_REFERENCE_CODES.DECIMAL;

  constructor(private precision?: number) {}

  transform(input: EntityValue): EntityValue {
    if (input === null || input === undefined) return null;
    const num = Number(input);
    if (isNaN(num)) return input;
    
    return this.precision ? num.toFixed(this.precision) : num;
  }

  validate(input: EntityValue): ValidationResult {
    if (input === null || input === undefined) {
      return { valid: true, errors: [], warnings: [] };
    }
    
    const num = Number(input);
    const valid = !isNaN(num);
    
    return {
      valid,
      errors: valid ? [] : [{
        code: 'INVALID_NUMERIC_VALUE',
        message: 'Value must be a number',
        value: input
      }],
      warnings: []
    };
  }
}
```

### Record Data Transformers

```typescript
// Process record transformer
class ProcessRecordTransformer implements RecordDataTransformer {
  constructor(
    public fields: Field[],
    public context: ProcessContext
  ) {}

  transform(input: EntityData): RecordValues {
    const result: RecordValues = {};
    
    for (const field of this.fields) {
      const value = input[field.columnName];
      if (value !== undefined) {
        result[field.inputName] = this.transformFieldValue(value, field);
      }
    }
    
    return result;
  }

  reverse(output: RecordValues): EntityData {
    const result: EntityData = {};
    
    for (const field of this.fields) {
      const value = output[field.inputName];
      if (value !== undefined) {
        result[field.columnName] = this.reverseTransformFieldValue(value, field);
      }
    }
    
    return result;
  }

  private transformFieldValue(value: EntityValue, field: Field): EntityValue {
    const transformer = getTransformerForField(field);
    return transformer ? transformer.transform(value) : value;
  }

  private reverseTransformFieldValue(value: EntityValue, field: Field): EntityValue {
    const transformer = getTransformerForField(field);
    return transformer?.reverse ? transformer.reverse(value) : value;
  }
}
```

## Adapter Implementations

### Process Parameter Adapter

```typescript
class WindowReferenceParameterAdapter implements ProcessParameterAdapter {
  parameterType = 'windowReference';
  componentType = 'WindowReferenceGrid';

  adapt(parameter: ProcessParameter): WindowReferenceGridProps {
    if (!isWindowReferenceParameter(parameter)) {
      throw new Error('Parameter is not a window reference parameter');
    }

    return {
      parameter,
      onSelectionChange: () => {}, // Will be provided by component
      context: {} as ProcessContext, // Will be provided by component
      configuration: this.buildGridConfiguration(parameter),
      loading: false,
      error: undefined
    };
  }

  private buildGridConfiguration(parameter: ProcessParameter): WindowReferenceConfiguration {
    const windowTab = parameter.window?.tabs[0];
    if (!windowTab) {
      throw new Error('Window reference parameter missing tab configuration');
    }

    return {
      entityName: windowTab.entityName,
      windowTab,
      filters: windowTab.filters || [],
      columns: this.buildColumnConfiguration(windowTab.fields),
      pagination: {
        pageSize: 100,
        pageSizes: [50, 100, 200],
        showPageSizeSelector: true,
        showPageInfo: true
      },
      selection: {
        mode: 'multiple',
        required: parameter.mandatory || false,
        selectOnRowClick: true
      }
    };
  }

  private buildColumnConfiguration(fields: Field[]): GridColumnConfig[] {
    return fields
      .filter(field => field.showInGridView)
      .map(field => ({
        field: field.hqlName,
        header: field.name,
        type: this.getColumnType(field),
        sortable: true,
        filterable: true,
        formatter: this.getColumnFormatter(field)
      }));
  }

  private getColumnType(field: Field): ColumnType {
    const fieldType = getFieldReference(field.column.reference);
    switch (fieldType) {
      case FieldType.DATE:
      case FieldType.DATETIME:
        return ColumnType.DATE;
      case FieldType.NUMBER:
        return ColumnType.NUMBER;
      case FieldType.BOOLEAN:
        return ColumnType.BOOLEAN;
      case FieldType.LIST:
      case FieldType.SELECT:
        return ColumnType.SELECT;
      default:
        return ColumnType.TEXT;
    }
  }

  private getColumnFormatter(field: Field): ((value: EntityValue) => string) | undefined {
    const fieldType = getFieldReference(field.column.reference);
    
    switch (fieldType) {
      case FieldType.BOOLEAN:
        return (value) => value === 'Y' || value === true ? 'Yes' : 'No';
      case FieldType.DATE:
        return (value) => value ? formatDate(String(value)) : '';
      case FieldType.DATETIME:
        return (value) => value ? formatDateTime(String(value)) : '';
      default:
        return undefined;
    }
  }
}
```

### Datasource Options Adapter

```typescript
class ProcessDatasourceOptionsAdapter implements DatasourceOptionsAdapter {
  constructor(
    public processId: string,
    public context: ProcessContext
  ) {}

  adapt(config: ProcessConfigResponse): DatasourceOptions {
    const baseOptions: DatasourceOptions = {
      windowId: config.windowId,
      tabId: config.tabId,
      pageSize: 100
    };

    // Apply static options from process definition
    const processDefinition = PROCESS_DEFINITION_DATA[this.processId];
    if (processDefinition?.staticOptions) {
      Object.assign(baseOptions, processDefinition.staticOptions);
    }

    // Apply dynamic options from configuration
    if (config.options) {
      const dynamicOptions = this.buildDynamicOptions(config.options);
      Object.assign(baseOptions, dynamicOptions);
    }

    // Apply filters from configuration
    if (config.filters) {
      baseOptions.criteria = this.buildCriteria(config.filters);
    }

    return baseOptions;
  }

  private buildDynamicOptions(options: ProcessOptionConfig[]): Record<string, EntityValue> {
    const result: Record<string, EntityValue> = {};
    
    for (const option of options) {
      if (option.dynamic && option.source) {
        const value = this.resolveDynamicValue(option.source);
        if (value !== undefined) {
          result[option.parameterName] = value;
        }
      }
    }
    
    return result;
  }

  private buildCriteria(filters: ProcessFilterConfig[]): Criteria[] {
    return filters.map(filter => ({
      fieldName: filter.fieldName,
      operator: filter.operator,
      value: filter.dynamic ? this.resolveDynamicValue(filter.source || '') : filter.value
    }));
  }

  private resolveDynamicValue(source: string): EntityValue {
    // Resolve dynamic values from context
    if (source.startsWith('@') && source.endsWith('@')) {
      const key = source.slice(1, -1);
      return this.getContextValue(key);
    }
    return source;
  }

  private getContextValue(key: string): EntityValue {
    // Extract value from context based on key
    const parts = key.split('.');
    let value: any = this.context;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    
    return value;
  }
}
```

## Usage Examples

### Type-Safe Parameter Handling

```typescript
// Define process parameters with full type safety
const processParameters: ProcessParameters = {
  startDate: {
    id: 'startDate',
    name: 'Start Date',
    reference: FIELD_REFERENCE_CODES.DATE,
    mandatory: true,
    validationRules: [{
      type: ValidationType.REQUIRED,
      expression: 'value != null',
      message: 'Start date is required',
      severity: 'error'
    }]
  },
  salesOrder: {
    id: 'salesOrder',
    name: 'Sales Order',
    reference: FIELD_REFERENCE_CODES.WINDOW,
    mandatory: true,
    window: {
      id: 'salesOrderWindow',
      name: 'Sales Order',
      entityName: 'SalesOrder',
      tabs: [salesOrderTab]
    }
  }
};

// Type-safe parameter rendering
const renderParameter = <T extends ProcessParameter>(
  parameter: T,
  context: ProcessContext
): React.ReactElement => {
  if (isWindowReferenceParameter(parameter)) {
    const adapter = new WindowReferenceParameterAdapter();
    const props = adapter.adapt(parameter);
    return <WindowReferenceGrid {...props} context={context} />;
  }
  
  const props: ParameterSelectorProps = {
    parameter,
    context,
    id: parameter.id,
    name: parameter.name,
    required: parameter.mandatory,
    onChange: () => {},
    validation: validateParameter(parameter, context)
  };
  
  return <BaseSelector {...props} />;
};
```

### Data Transformation Pipeline

```typescript
// Set up transformation pipeline
const setupTransformationPipeline = (fields: Field[], context: ProcessContext) => {
  const recordTransformer = new ProcessRecordTransformer(fields, context);
  const valueTransformers = new Map<string, ParameterValueTransformer>();
  
  // Register value transformers
  valueTransformers.set(FIELD_REFERENCE_CODES.DATE, new DateValueTransformer());
  valueTransformers.set(FIELD_REFERENCE_CODES.BOOLEAN, new BooleanValueTransformer());
  valueTransformers.set(FIELD_REFERENCE_CODES.DECIMAL, new NumericValueTransformer(2));
  
  return { recordTransformer, valueTransformers };
};

// Use transformation pipeline
const { recordTransformer, valueTransformers } = setupTransformationPipeline(fields, context);

// Transform entity data to record values
const recordValues = recordTransformer.transform(entityData);

// Transform individual parameter values
for (const [paramId, parameter] of Object.entries(parameters)) {
  const transformer = valueTransformers.get(parameter.reference);
  if (transformer) {
    const rawValue = formValues[paramId];
    const transformedValue = transformer.transform(rawValue);
    processPayload[paramId] = transformedValue;
  }
}
```

## Best Practices

### 1. Type Safety

- Always use type guards before type assertions
- Prefer union types over any types
- Use generic types for reusable components
- Implement proper error boundaries for type mismatches

### 2. Data Transformation

- Always validate data before transformation
- Implement reversible transformations when possible
- Use adapters for external API integration
- Cache transformation results when appropriate

### 3. Error Handling

- Provide meaningful error messages with context
- Use proper error types for different scenarios
- Implement graceful degradation for missing data
- Log errors with sufficient detail for debugging

### 4. Performance

- Memoize expensive type checks and transformations
- Use lazy loading for complex type definitions
- Implement proper cleanup for cached transformers
- Monitor transformation performance in production

## Migration Guide

### From Untyped to Typed System

1. **Update Interface Definitions**: Add proper types to existing interfaces
2. **Add Type Guards**: Implement type guards for runtime type checking  
3. **Implement Transformers**: Create transformers for data conversion
4. **Update Components**: Modify components to use typed props
5. **Add Validation**: Implement proper validation with typed results

### Breaking Changes

- **ProcessParameter Interface**: Now includes additional type information
- **Component Props**: Updated to use typed props instead of any
- **Validation Results**: Now return structured validation results
- **Error Handling**: Updated to use typed error objects

This enhanced type system provides the foundation for reliable, maintainable, and scalable process execution functionality while ensuring type safety throughout the application.

# Technical Proposal: ProcessModal Defaults Integration - Comprehensive Implementation
## Based on Real DefaultsProcessActionHandler Response Structure

**Document Version:** 3.0  
**Date:** 2025-08-05  
**Status:** Comprehensive Technical Proposal - Ready for Implementation  
**Previous Versions:** V1.0 TECHNICAL_PROPOSAL_DEFAULTS_INTEGRATION.md, V2.0 TECHNICAL_PROPOSAL_PROCESS_DEFAULTS_REVISED.md  

---

## Executive Summary

This comprehensive technical proposal provides a complete blueprint for implementing ProcessModal default values based on the **real response structure** from DefaultsProcessActionHandler. Unlike previous proposals that made assumptions about the response format, this document is grounded in actual API response analysis and provides concrete implementation strategies for all discovered complexities.

### Key Findings from Real Response Analysis

**Real Response Structure Discovered:**
```json
{
  "defaults": {
    "trxtype": "",
    "ad_org_id": {
      "value": "E443A31992CB4635AFCAEABE7183CE85",
      "identifier": "F&B España - Región Norte"
    },
    "bslamount": "",
    "payment_documentno": "<1000373>",
    "c_currency_id": {
      "value": "102",
      "identifier": "EUR"
    },
    "actual_payment": "1.85",
    "payment_date": "05-08-2025",
    "overpayment_action_display_logic": "N",
    "trxtype_display_logic": "N",
    "payment_documentno_readonly_logic": "N",
    "received_from_readonly_logic": "Y"
  },
  "filterExpressions": {
    "order_invoice": {
      "paymentMethodName": "Transferencia"
    }
  },
  "refreshParent": true
}
```

### Critical Differences from Previous Assumptions

1. **Complex Field Values**: Mix of simple strings/numbers and reference objects with value/identifier structure
2. **Logic Fields**: Separate fields for display_logic and readonly_logic control  
3. **FilterExpressions**: Dedicated section for dynamic filtering capabilities
4. **RefreshParent Flag**: Boolean indicator for parent form refresh requirements

### Strategic Approach

- **Build on Existing Infrastructure**: Leverage current ProcessModal, ProcessParameterSelector, and ProcessParameterMapper
- **Incremental Enhancement**: Extend current systems rather than replace them
- **Real Response Adaptation**: Design interfaces and processing logic based on actual API response
- **Comprehensive Testing**: Plan for all discovered field types and logic scenarios

---

## Response Structure Analysis

### 1. Defaults Section Structure

The `defaults` section contains three distinct types of values:

#### A. Simple Values (Strings/Numbers/Booleans)
```json
{
  "trxtype": "",
  "bslamount": "",
  "payment_documentno": "<1000373>",
  "actual_payment": "1.85",
  "payment_date": "05-08-2025"
}
```

#### B. Reference Objects (Value/Identifier Pairs)
```json
{
  "ad_org_id": {
    "value": "E443A31992CB4635AFCAEABE7183CE85",
    "identifier": "F&B España - Región Norte"
  },
  "c_currency_id": {
    "value": "102",
    "identifier": "EUR"
  }
}
```

#### C. Logic Control Fields
```json
{
  "overpayment_action_display_logic": "N",
  "trxtype_display_logic": "N", 
  "payment_documentno_readonly_logic": "N",
  "received_from_readonly_logic": "Y"
}
```

### 2. FilterExpressions Section
```json
{
  "filterExpressions": {
    "order_invoice": {
      "paymentMethodName": "Transferencia"
    }
  }
}
```

**Purpose**: Provides dynamic filtering criteria for dependent fields
**Impact**: Affects dropdown options and field dependencies

### 3. RefreshParent Flag
```json
{
  "refreshParent": true
}
```

**Purpose**: Indicates whether parent form should be refreshed after process execution
**Impact**: Triggers parent form re-rendering/data fetching

---

## Technical Architecture Design

### 1. Enhanced Response Type Definitions

```typescript
/**
 * Complete response structure from DefaultsProcessActionHandler
 */
export interface ProcessDefaultsResponse {
  defaults: ProcessDefaultsCollection;
  filterExpressions: FilterExpressionsCollection;
  refreshParent: boolean;
}

/**
 * Collection of default values with mixed types
 */
export interface ProcessDefaultsCollection {
  [fieldName: string]: ProcessDefaultValue | ProcessLogicValue;
}

/**
 * Union type for all possible default value types
 */
export type ProcessDefaultValue = 
  | string 
  | number 
  | boolean 
  | ProcessReferenceValue;

/**
 * Reference object with value and identifier
 */
export interface ProcessReferenceValue {
  value: string;
  identifier: string;
}

/**
 * Logic control values for field behavior
 */
export type ProcessLogicValue = "Y" | "N";

/**
 * Filter expressions for dynamic field filtering
 */
export interface FilterExpressionsCollection {
  [fieldName: string]: Record<string, any>;
}

/**
 * Type guards for runtime type checking
 */
export const isReferenceValue = (value: unknown): value is ProcessReferenceValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'identifier' in value &&
    typeof (value as any).value === 'string' &&
    typeof (value as any).identifier === 'string'
  );
};

export const isLogicField = (fieldName: string): boolean => {
  return fieldName.endsWith('_display_logic') || fieldName.endsWith('_readonly_logic');
};

export const isSimpleValue = (value: unknown): value is string | number | boolean => {
  return ['string', 'number', 'boolean'].includes(typeof value);
};
```

### 2. Enhanced Processing Service

```typescript
/**
 * Service for processing DefaultsProcessActionHandler responses
 */
export class ProcessDefaultsProcessor {
  /**
   * Processes the complete response and separates concerns
   */
  static processResponse(response: ProcessDefaultsResponse): ProcessedDefaults {
    const { defaults, filterExpressions, refreshParent } = response;
    
    const fieldValues: Record<string, ProcessDefaultValue> = {};
    const logicStates: Record<string, ProcessLogicStates> = {};
    const fieldNames = new Set<string>();

    // Process all defaults
    for (const [key, value] of Object.entries(defaults)) {
      if (isLogicField(key)) {
        this.processLogicField(key, value as ProcessLogicValue, logicStates);
      } else {
        fieldValues[key] = value as ProcessDefaultValue;
        fieldNames.add(key);
      }
    }

    return {
      fieldValues,
      logicStates,
      filterExpressions,
      refreshParent,
      fieldNames: Array.from(fieldNames),
    };
  }

  /**
   * Processes logic fields and maps them to field names
   */
  private static processLogicField(
    logicFieldName: string,
    value: ProcessLogicValue,
    logicStates: Record<string, ProcessLogicStates>
  ): void {
    const fieldName = this.extractFieldNameFromLogic(logicFieldName);
    
    if (!logicStates[fieldName]) {
      logicStates[fieldName] = {
        displayLogic: null,
        readonlyLogic: null,
      };
    }

    if (logicFieldName.endsWith('_display_logic')) {
      logicStates[fieldName].displayLogic = value === 'Y';
    } else if (logicFieldName.endsWith('_readonly_logic')) {
      logicStates[fieldName].readonlyLogic = value === 'Y';
    }
  }

  /**
   * Extracts base field name from logic field name
   */
  private static extractFieldNameFromLogic(logicFieldName: string): string {
    return logicFieldName
      .replace(/_display_logic$/, '')
      .replace(/_readonly_logic$/, '');
  }

  /**
   * Maps field values to form values for react-hook-form
   */
  static mapToFormValues(
    fieldValues: Record<string, ProcessDefaultValue>,
    parameterMapping: Record<string, string>
  ): Record<string, any> {
    const formValues: Record<string, any> = {};

    for (const [fieldName, value] of Object.entries(fieldValues)) {
      const parameterName = parameterMapping[fieldName] || fieldName;
      
      if (isReferenceValue(value)) {
        // For reference values, use identifier for display, store value separately
        formValues[parameterName] = value.identifier;
        formValues[`${parameterName}_value`] = value.value;
      } else {
        formValues[parameterName] = value;
      }
    }

    return formValues;
  }
}

/**
 * Result of processing defaults response
 */
export interface ProcessedDefaults {
  fieldValues: Record<string, ProcessDefaultValue>;
  logicStates: Record<string, ProcessLogicStates>;
  filterExpressions: FilterExpressionsCollection;
  refreshParent: boolean;
  fieldNames: string[];
}

/**
 * Logic states for a field
 */
export interface ProcessLogicStates {
  displayLogic: boolean | null;
  readonlyLogic: boolean | null;
}
```

### 3. Enhanced Hook Integration

```typescript
/**
 * Enhanced hook that integrates with existing ProcessModal infrastructure
 */
export const useProcessDefaultsIntegration = ({
  processId,
  windowId,
  tabId,
  parameters,
  enabled = true,
}: UseProcessDefaultsIntegrationProps) => {
  const { fetchConfig, loading, error, config } = useProcessConfig({
    processId,
    windowId,
    tabId,
  });

  const [processedDefaults, setProcessedDefaults] = useState<ProcessedDefaults | null>(null);
  const [parameterMapping, setParameterMapping] = useState<Record<string, string>>({});

  // Build parameter mapping from ProcessParameter names to DB column names
  useEffect(() => {
    const mapping: Record<string, string> = {};
    
    Object.values(parameters).forEach(param => {
      const dbColumnName = param.dBColumnName || param.name;
      mapping[dbColumnName] = param.name;
    });

    setParameterMapping(mapping);
  }, [parameters]);

  // Process the configuration when it changes
  useEffect(() => {
    if (config?.defaults) {
      try {
        const processed = ProcessDefaultsProcessor.processResponse({
          defaults: config.defaults,
          filterExpressions: config.filterExpressions || {},
          refreshParent: config.refreshParent || false,
        });

        setProcessedDefaults(processed);
      } catch (error) {
        logger.error('Error processing defaults response:', error);
        setProcessedDefaults(null);
      }
    }
  }, [config]);

  // Fetch defaults with context
  const fetchDefaults = useCallback(async (contextData: Record<string, any> = {}) => {
    if (!enabled) return null;
    
    try {
      return await fetchConfig(contextData);
    } catch (error) {
      logger.error('Error fetching process defaults:', error);
      return null;
    }
  }, [enabled, fetchConfig]);

  // Get form values for react-hook-form initialization
  const getFormValues = useCallback(() => {
    if (!processedDefaults) return {};

    return ProcessDefaultsProcessor.mapToFormValues(
      processedDefaults.fieldValues,
      parameterMapping
    );
  }, [processedDefaults, parameterMapping]);

  // Get logic states for field rendering
  const getFieldLogicState = useCallback((parameterName: string) => {
    if (!processedDefaults) return { isDisplayed: true, isReadOnly: false };

    // Try to find by parameter name or DB column name
    const dbColumnName = Object.keys(parameterMapping).find(
      key => parameterMapping[key] === parameterName
    );
    
    const fieldName = dbColumnName || parameterName;
    const logicState = processedDefaults.logicStates[fieldName];

    return {
      isDisplayed: logicState?.displayLogic !== false,
      isReadOnly: logicState?.readonlyLogic === true,
    };
  }, [processedDefaults, parameterMapping]);

  // Get filter expressions for a field
  const getFieldFilter = useCallback((parameterName: string) => {
    if (!processedDefaults) return null;

    const dbColumnName = Object.keys(parameterMapping).find(
      key => parameterMapping[key] === parameterName
    );
    
    const fieldName = dbColumnName || parameterName;
    return processedDefaults.filterExpressions[fieldName] || null;
  }, [processedDefaults, parameterMapping]);

  return {
    fetchDefaults,
    getFormValues,
    getFieldLogicState,
    getFieldFilter,
    processedDefaults,
    shouldRefreshParent: processedDefaults?.refreshParent || false,
    loading,
    error,
    hasDefaults: !!processedDefaults,
  };
};
```

---

## Field Mapping Strategy

### 1. Parameter Name to DB Column Mapping

The response uses database column names, but ProcessParameters use logical names. We need bidirectional mapping:

```typescript
/**
 * Enhanced ProcessParameterMapper with defaults support
 */
export class ProcessParameterMapperEnhanced extends ProcessParameterMapper {
  /**
   * Creates bidirectional mapping between parameter names and DB columns
   */
  static createParameterMapping(
    parameters: Record<string, ProcessParameter>
  ): ParameterMappingResult {
    const paramToColumn: Record<string, string> = {};
    const columnToParam: Record<string, string> = {};
    const mappingIssues: string[] = [];

    Object.values(parameters).forEach(param => {
      const dbColumnName = param.dBColumnName || param.name;
      
      paramToColumn[param.name] = dbColumnName;
      columnToParam[dbColumnName] = param.name;

      // Log potential mapping issues
      if (!param.dBColumnName) {
        mappingIssues.push(`Parameter ${param.name} missing dBColumnName, using name as fallback`);
      }
    });

    return {
      paramToColumn,
      columnToParam,
      mappingIssues,
    };
  }

  /**
   * Maps defaults response field name to ProcessParameter
   */
  static findParameterForField(
    fieldName: string,
    parameters: Record<string, ProcessParameter>,
    mapping: ParameterMappingResult
  ): ProcessParameter | null {
    // Direct parameter name match
    if (parameters[fieldName]) {
      return parameters[fieldName];
    }

    // DB column name match
    const paramName = mapping.columnToParam[fieldName];
    if (paramName && parameters[paramName]) {
      return parameters[paramName];
    }

    // Pattern matching for logic fields
    if (isLogicField(fieldName)) {
      const baseFieldName = fieldName
        .replace(/_display_logic$/, '')
        .replace(/_readonly_logic$/, '');
      
      return this.findParameterForField(baseFieldName, parameters, mapping);
    }

    return null;
  }
}

export interface ParameterMappingResult {
  paramToColumn: Record<string, string>;
  columnToParam: Record<string, string>;
  mappingIssues: string[];
}
```

### 2. Value Type Processing

Different value types require different processing strategies:

```typescript
/**
 * Value processor for different default value types
 */
export class DefaultValueProcessor {
  /**
   * Processes a default value based on parameter type
   */
  static processValue(
    value: ProcessDefaultValue,
    parameter: ProcessParameter
  ): ProcessedValue {
    if (isReferenceValue(value)) {
      return this.processReferenceValue(value, parameter);
    } else {
      return this.processSimpleValue(value, parameter);
    }
  }

  /**
   * Processes reference values (value/identifier pairs)
   */
  private static processReferenceValue(
    value: ProcessReferenceValue,
    parameter: ProcessParameter
  ): ProcessedValue {
    return {
      displayValue: value.identifier,
      formValue: value.identifier,
      rawValue: value.value,
      type: 'reference',
      parameter: parameter.name,
    };
  }

  /**
   * Processes simple values (strings, numbers, booleans)
   */
  private static processSimpleValue(
    value: string | number | boolean,
    parameter: ProcessParameter
  ): ProcessedValue {
    // Convert based on parameter type
    let processedValue = value;

    if (parameter.reference === 'Yes/No' || parameter.reference === 'Boolean') {
      processedValue = this.convertToBoolean(value);
    } else if (parameter.reference === 'Date') {
      processedValue = this.convertToDate(value);
    } else if (parameter.reference === 'DateTime') {
      processedValue = this.convertToDateTime(value);
    } else if (['Amount', 'Number', 'Decimal', 'Integer'].includes(parameter.reference)) {
      processedValue = this.convertToNumber(value);
    }

    return {
      displayValue: String(processedValue),
      formValue: processedValue,
      rawValue: value,
      type: 'simple',
      parameter: parameter.name,
    };
  }

  private static convertToBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === 'Y' || value === '1';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  private static convertToDate(value: unknown): string {
    if (typeof value === 'string' && value.length > 0) {
      // Handle different date formats from backend
      try {
        const date = new Date(value);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private static convertToDateTime(value: unknown): string {
    if (typeof value === 'string' && value.length > 0) {
      try {
        const date = new Date(value);
        return date.toISOString(); // Full ISO format
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private static convertToNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}

export interface ProcessedValue {
  displayValue: string;
  formValue: any;
  rawValue: ProcessDefaultValue;
  type: 'reference' | 'simple';
  parameter: string;
}
```

---

## Logic Processing Design

### 1. Display Logic Handler

```typescript
/**
 * Handles display logic for ProcessModal fields
 */
export class ProcessDisplayLogicHandler {
  /**
   * Determines if a field should be displayed based on logic state
   */
  static shouldDisplayField(
    parameterName: string,
    logicStates: Record<string, ProcessLogicStates>,
    parameterMapping: Record<string, string>
  ): boolean {
    const dbColumnName = this.getDbColumnName(parameterName, parameterMapping);
    const logicState = logicStates[dbColumnName];

    // If no logic state defined, default to visible
    if (!logicState || logicState.displayLogic === null) {
      return true;
    }

    return logicState.displayLogic;
  }

  /**
   * Determines if a field should be readonly based on logic state
   */
  static shouldFieldBeReadonly(
    parameterName: string,
    logicStates: Record<string, ProcessLogicStates>,
    parameterMapping: Record<string, string>
  ): boolean {
    const dbColumnName = this.getDbColumnName(parameterName, parameterMapping);
    const logicState = logicStates[dbColumnName];

    // If no logic state defined, default to editable
    if (!logicState || logicState.readonlyLogic === null) {
      return false;
    }

    return logicState.readonlyLogic;
  }

  private static getDbColumnName(
    parameterName: string,
    parameterMapping: Record<string, string>
  ): string {
    // Find DB column name for this parameter
    return Object.keys(parameterMapping).find(
      key => parameterMapping[key] === parameterName
    ) || parameterName;
  }
}
```

### 2. Enhanced ProcessParameterSelector

The existing ProcessParameterSelector needs enhancement to handle defaults and logic:

```typescript
/**
 * Enhanced ProcessParameterSelector with defaults support
 */
export const ProcessParameterSelectorEnhanced = ({ 
  parameter,
  defaultValue,
  isDisplayed,
  isReadOnly,
  filterExpressions,
}: EnhancedProcessParameterSelectorProps) => {
  const { session } = useUserContext();
  const { getValues, setValue } = useFormContext();

  // Map ProcessParameter to Field interface for FormView selector compatibility
  const mappedField = useMemo(() => {
    const field = ProcessParameterMapper.mapToField(parameter);
    
    // Apply filter expressions if available
    if (filterExpressions) {
      field.filterExpression = filterExpressions;
    }

    return field;
  }, [parameter, filterExpressions]);

  // Set default value when component mounts or default changes
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      const fieldName = mappedField.hqlName;
      const currentValue = getValues(fieldName);
      
      // Only set if current value is empty/undefined
      if (currentValue === undefined || currentValue === null || currentValue === '') {
        setValue(fieldName, defaultValue);
      }
    }
  }, [defaultValue, mappedField.hqlName, getValues, setValue]);

  // Don't render if display logic evaluates to false
  if (!isDisplayed) {
    return null;
  }

  // Apply readonly state from defaults logic
  const effectiveReadOnly = isReadOnly || parameter.readOnlyLogicExpression ? (
    isReadOnly || this.evaluateReadOnlyLogic(parameter.readOnlyLogicExpression, session, getValues())
  ) : false;

  // Render the appropriate selector with enhanced properties
  const renderSelector = () => {
    const fieldType = ProcessParameterMapper.getFieldType(parameter);

    // Enhanced props for all selectors
    const commonProps = {
      field: mappedField,
      isReadOnly: effectiveReadOnly,
      defaultValue,
    };

    switch (fieldType) {
      case "boolean":
        return <BooleanSelector {...commonProps} />;
      
      case "numeric":
        return (
          <NumericSelector 
            {...commonProps}
            disabled={effectiveReadOnly}
            placeholder={parameter.description}
          />
        );

      case "date":
        return <DateSelector {...commonProps} />;

      case "datetime":
        return <DatetimeSelector {...commonProps} />;

      case "select":
      case "tabledir":
        return (
          <TableDirSelector 
            {...commonProps}
            filterExpressions={filterExpressions}
          />
        );

      case "list":
        return <ListSelector {...commonProps} />;

      default:
        return <GenericSelector parameter={parameter} readOnly={effectiveReadOnly} />;
    }
  };

  return (
    <div className="flex flex-col gap-4 items-start justify-start" title={parameter.description}>
      <div className="relative pr-2">
        {parameter.mandatory && (
          <span className="absolute -top-1 right-0 text-[#DC143C] font-bold" aria-required>
            *
          </span>
        )}
        <Label htmlFor={mappedField.hqlName} name={parameter.name} />
      </div>
      <div className="w-full pb-8">
        {renderSelector()}
      </div>
    </div>
  );

  private evaluateReadOnlyLogic(
    expression: string | undefined,
    session: any,
    getValues: () => any
  ): boolean {
    if (!expression) return false;
    
    try {
      const compiledExpr = compileExpression(expression);
      return compiledExpr(session, getValues());
    } catch (error) {
      logger.warn("Error executing readonly logic expression:", expression, error);
      return false;
    }
  }
};

export interface EnhancedProcessParameterSelectorProps {
  parameter: ProcessParameter | ExtendedProcessParameter;
  defaultValue?: any;
  isDisplayed?: boolean;
  isReadOnly?: boolean;
  filterExpressions?: Record<string, any>;
}
```

---

## FilterExpressions Integration

### 1. Filter Application Strategy

```typescript
/**
 * Service for applying filter expressions to fields
 */
export class ProcessFilterService {
  /**
   * Applies filter expressions to field selectors
   */
  static applyFilters(
    filterExpressions: FilterExpressionsCollection,
    fieldName: string,
    existingConfig: any
  ): any {
    const filters = filterExpressions[fieldName];
    if (!filters) return existingConfig;

    // Clone existing configuration
    const enhancedConfig = { ...existingConfig };

    // Apply each filter expression
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      switch (filterKey) {
        case 'paymentMethodName':
          enhancedConfig.additionalFilters = {
            ...enhancedConfig.additionalFilters,
            name: filterValue,
          };
          break;
          
        case 'activeOnly':
          enhancedConfig.additionalFilters = {
            ...enhancedConfig.additionalFilters,
            isActive: filterValue,
          };
          break;
          
        case 'organizationId':
          enhancedConfig.additionalFilters = {
            ...enhancedConfig.additionalFilters,
            organization: filterValue,
          };
          break;
          
        default:
          // Generic filter application
          enhancedConfig.additionalFilters = {
            ...enhancedConfig.additionalFilters,
            [filterKey]: filterValue,
          };
      }
    });

    return enhancedConfig;
  }

  /**
   * Converts filter expressions to datasource query parameters
   */
  static buildQueryParameters(
    filterExpressions: Record<string, any>
  ): Record<string, string> {
    const queryParams: Record<string, string> = {};

    Object.entries(filterExpressions).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        queryParams[key] = String(value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex filter objects
        queryParams[key] = JSON.stringify(value);
      }
    });

    return queryParams;
  }
}
```

### 2. Enhanced TableDirSelector Integration

```typescript
/**
 * Enhanced TableDirSelector that supports filter expressions
 */
export const TableDirSelectorWithFilters = ({
  field,
  isReadOnly,
  filterExpressions,
  ...props
}: TableDirSelectorProps & { filterExpressions?: Record<string, any> }) => {
  // Apply filter expressions to field configuration
  const enhancedField = useMemo(() => {
    if (!filterExpressions) return field;

    return ProcessFilterService.applyFilters(
      { [field.hqlName]: filterExpressions },
      field.hqlName,
      field
    );
  }, [field, filterExpressions]);

  return (
    <TableDirSelector
      field={enhancedField}
      isReadOnly={isReadOnly}
      {...props}
    />
  );
};
```

---

## FormInitialization Pattern Adaptation

### 1. Reusing Existing Infrastructure

Instead of creating entirely new infrastructure, we adapt the proven FormInitialization pattern:

```typescript
/**
 * Adapter that makes ProcessDefaults work with existing FormInitialization patterns
 */
export class ProcessFormInitializationAdapter {
  /**
   * Converts ProcessDefaultsResponse to FormInitializationResponse format
   */
  static adaptToFormInitialization(
    processDefaults: ProcessDefaultsResponse,
    parameters: Record<string, ProcessParameter>
  ): FormInitializationResponse {
    const columnValues: Record<string, any> = {};
    const auxiliaryInputValues: Record<string, any> = {};
    
    const processed = ProcessDefaultsProcessor.processResponse(processDefaults);

    // Map field values to form initialization format
    Object.entries(processed.fieldValues).forEach(([fieldName, value]) => {
      const parameter = ProcessParameterMapperEnhanced.findParameterForField(
        fieldName,
        parameters,
        { paramToColumn: {}, columnToParam: {}, mappingIssues: [] }
      );

      if (parameter) {
        const processedValue = DefaultValueProcessor.processValue(value, parameter);
        
        // Use parameter name as key for consistency
        columnValues[parameter.name] = processedValue.formValue;
        
        // Store raw value for reference fields
        if (processedValue.type === 'reference') {
          auxiliaryInputValues[`${parameter.name}_value`] = processedValue.rawValue;
        }
      }
    });

    return {
      columnValues,
      auxiliaryInputValues,
      sessionAttributes: {
        processId: processDefaults.processId || '',
        refreshParent: processDefaults.refreshParent,
        filterExpressions: processDefaults.filterExpressions,
        logicStates: processed.logicStates,
      },
    };
  }

  /**
   * Creates a ProcessModal-specific form initialization hook
   */
  static createProcessFormInitializationHook() {
    return function useProcessFormInitialization({
      processId,
      windowId,
      tabId,
      parameters,
      contextData = {},
    }: ProcessFormInitializationProps) {
      
      const defaultsIntegration = useProcessDefaultsIntegration({
        processId,
        windowId,
        tabId,
        parameters,
      });

      const [formInitialization, setFormInitialization] = useState<FormInitializationResponse | null>(null);

      // Fetch defaults when component mounts or context changes
      useEffect(() => {
        const fetchDefaults = async () => {
          const defaults = await defaultsIntegration.fetchDefaults(contextData);
          if (defaults) {
            const adapted = ProcessFormInitializationAdapter.adaptToFormInitialization(
              defaults,
              parameters
            );
            setFormInitialization(adapted);
          }
        };

        fetchDefaults();
      }, [processId, windowId, tabId, contextData]);

      // Use existing useFormInitialState hook with adapted data
      const initialState = useFormInitialState(formInitialization);

      return {
        formInitialization,
        initialState,
        loading: defaultsIntegration.loading,
        error: defaultsIntegration.error,
        refetch: () => defaultsIntegration.fetchDefaults(contextData),
      };
    };
  }
}

export interface ProcessFormInitializationProps {
  processId: string;
  windowId: string;
  tabId: string;
  parameters: Record<string, ProcessParameter>;
  contextData?: Record<string, any>;
}
```

---

## Interface Definitions

### 1. Complete Type System

```typescript
// Core response interfaces
export interface ProcessDefaultsResponse {
  defaults: ProcessDefaultsCollection;
  filterExpressions: FilterExpressionsCollection;
  refreshParent: boolean;
}

export interface ProcessDefaultsCollection {
  [fieldName: string]: ProcessDefaultValue | ProcessLogicValue;
}

export type ProcessDefaultValue = string | number | boolean | ProcessReferenceValue;

export interface ProcessReferenceValue {
  value: string;
  identifier: string;
}

export type ProcessLogicValue = "Y" | "N";

export interface FilterExpressionsCollection {
  [fieldName: string]: Record<string, any>;
}

// Processing interfaces
export interface ProcessedDefaults {
  fieldValues: Record<string, ProcessDefaultValue>;
  logicStates: Record<string, ProcessLogicStates>;
  filterExpressions: FilterExpressionsCollection;
  refreshParent: boolean;
  fieldNames: string[];
}

export interface ProcessLogicStates {
  displayLogic: boolean | null;
  readonlyLogic: boolean | null;
}

export interface ProcessedValue {
  displayValue: string;
  formValue: any;
  rawValue: ProcessDefaultValue;
  type: 'reference' | 'simple';
  parameter: string;
}

// Mapping interfaces
export interface ParameterMappingResult {
  paramToColumn: Record<string, string>;
  columnToParam: Record<string, string>;
  mappingIssues: string[];
}

// Hook interfaces
export interface UseProcessDefaultsIntegrationProps {
  processId: string;
  windowId: string;
  tabId: string;
  parameters: Record<string, ProcessParameter>;
  enabled?: boolean;
}

export interface UseProcessDefaultsIntegrationReturn {
  fetchDefaults: (contextData?: Record<string, any>) => Promise<ProcessDefaultsResponse | null>;
  getFormValues: () => Record<string, any>;
  getFieldLogicState: (parameterName: string) => { isDisplayed: boolean; isReadOnly: boolean };
  getFieldFilter: (parameterName: string) => Record<string, any> | null;
  processedDefaults: ProcessedDefaults | null;
  shouldRefreshParent: boolean;
  loading: boolean;
  error: any;
  hasDefaults: boolean;
}

// Component interfaces
export interface EnhancedProcessParameterSelectorProps {
  parameter: ProcessParameter | ExtendedProcessParameter;
  defaultValue?: any;
  isDisplayed?: boolean;
  isReadOnly?: boolean;
  filterExpressions?: Record<string, any>;
}

// Service interfaces
export interface FormInitializationResponse {
  columnValues: Record<string, any>;
  auxiliaryInputValues: Record<string, any>;
  sessionAttributes: Record<string, any>;
}
```

### 2. Error Handling Interfaces

```typescript
export interface ProcessDefaultsError {
  code: 'FETCH_ERROR' | 'PROCESSING_ERROR' | 'MAPPING_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: {
    processId?: string;
    windowId?: string;
    tabId?: string;
    fieldName?: string;
    originalError?: Error;
  };
}

export interface ProcessDefaultsValidationResult {
  isValid: boolean;
  errors: ProcessDefaultsError[];
  warnings: string[];
}
```

---

## Integration Points

### 1. ProcessDefinitionModal Integration

The main integration point is in ProcessDefinitionModal component:

```typescript
// Enhanced ProcessDefinitionModal with defaults support
export const ProcessDefinitionModalWithDefaults = ({ 
  button, 
  onSuccess, 
  ...props 
}: ProcessDefinitionModalProps) => {
  const { t } = useTranslation();
  const { tab, record } = useTabContext();
  const { session } = useUserContext();
  
  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const form = useForm();

  // Use enhanced defaults integration
  const {
    fetchDefaults,
    getFormValues,
    getFieldLogicState,
    getFieldFilter,
    shouldRefreshParent,
    loading: defaultsLoading,
    hasDefaults,
  } = useProcessDefaultsIntegration({
    processId: button.processDefinition.id,
    windowId: tab?.window || '',
    tabId: tab?.id || '',
    parameters,
  });

  // Fetch defaults when modal opens
  useEffect(() => {
    if (props.open && hasWindowReference) {
      const contextData = {
        ...recordValues,
        ...session,
      };
      
      fetchDefaults(contextData);
    }
  }, [props.open, hasWindowReference, recordValues, session, fetchDefaults]);

  // Apply form values when defaults are loaded
  useEffect(() => {
    if (hasDefaults) {
      const formValues = getFormValues();
      
      // Apply each default value to the form
      Object.entries(formValues).forEach(([fieldName, value]) => {
        form.setValue(fieldName, value);
      });
    }
  }, [hasDefaults, getFormValues, form]);

  // Enhanced parameter rendering with defaults and logic
  const renderParameters = () => {
    if (isSuccess) return null;

    return Object.values(parameters).map((parameter) => {
      if (parameter.reference === WINDOW_REFERENCE_ID) {
        return (
          <WindowReferenceGrid
            key={parameter.id}
            parameter={parameter}
            onSelectionChange={setGridSelection}
            // ... other props
          />
        );
      }

      // Get logic states and filters for this field
      const { isDisplayed, isReadOnly } = getFieldLogicState(parameter.name);
      const filterExpressions = getFieldFilter(parameter.name);
      const defaultValue = form.getValues(parameter.name);

      return (
        <ProcessParameterSelectorEnhanced
          key={parameter.name}
          parameter={parameter}
          defaultValue={defaultValue}
          isDisplayed={isDisplayed}
          isReadOnly={isReadOnly}
          filterExpressions={filterExpressions}
        />
      );
    });
  };

  // Handle success with parent refresh if needed
  const handleSuccess = useCallback(() => {
    if (shouldRefreshParent) {
      // Trigger parent refresh logic
      window.dispatchEvent(new CustomEvent('process-success-refresh'));
    }
    
    onSuccess?.();
  }, [shouldRefreshParent, onSuccess]);

  // ... rest of component logic
};
```

### 2. Existing Hook Integration

We need to modify the existing useProcessConfig hook to return the complete response:

```typescript
// Modified useProcessConfig to return full response
export const useProcessConfig = ({ processId, windowId, tabId }: UseProcessConfigProps) => {
  // ... existing state management

  const fetchConfig = useCallback(
    async (payload: Record<string, EntityValue> = {}) => {
      if (!processId || !windowId || !tabId) {
        return null;
      }

      const params = new URLSearchParams({
        processId,
        windowId,
        _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler",
      });

      try {
        setLoading(true);
        setError(null);

        const { data } = await Metadata.kernelClient.post(`?${params}`, payload);

        // Return the complete response structure
        const processedConfig: ProcessDefaultsResponse = {
          defaults: data?.defaults || {},
          filterExpressions: data?.filterExpressions || {},
          refreshParent: !!data?.refreshParent,
        };

        setConfig(processedConfig);
        return processedConfig;
      } catch (err) {
        // ... error handling
        return null;
      } finally {
        setLoading(false);
      }
    },
    [processId, windowId, tabId]
  );

  return {
    fetchConfig,
    loading,
    error,
    config,
  };
};
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Establish core infrastructure for processing real response structure

**Tasks**:
1. **Enhanced Type Definitions** (1 day)
   - Create complete TypeScript interfaces for real response structure
   - Implement type guards and validation functions
   - Add comprehensive JSDoc documentation

2. **Response Processing Service** (2 days)
   - Implement ProcessDefaultsProcessor class
   - Add logic field extraction and processing
   - Create value type detection and conversion
   - Add comprehensive unit tests

3. **Enhanced Parameter Mapping** (2 days)
   - Extend ProcessParameterMapper with defaults support
   - Implement bidirectional mapping (param names ↔ DB columns)
   - Add field type detection for all discovered types
   - Create mapping validation and error reporting

**Deliverables**:
- Complete type system for real response structure
- Functional ProcessDefaultsProcessor with tests
- Enhanced ProcessParameterMapper with mapping validation
- Documentation for all new interfaces and services

### Phase 2: Core Integration (Week 2)
**Goal**: Integrate defaults processing with existing ProcessModal infrastructure

**Tasks**:
1. **Enhanced Hook Development** (2 days)
   - Implement useProcessDefaultsIntegration hook
   - Integrate with existing useProcessConfig
   - Add caching and performance optimizations
   - Implement error handling and retry logic

2. **Logic Processing Implementation** (2 days)
   - Implement ProcessDisplayLogicHandler
   - Add support for display_logic and readonly_logic fields
   - Create logic state evaluation and caching
   - Add comprehensive testing for all logic scenarios

3. **Default Value Processing** (1 day)  
   - Implement DefaultValueProcessor for all value types
   - Add type conversion for dates, numbers, booleans
   - Handle reference values with value/identifier pairs
   - Create validation for processed values

**Deliverables**:
- Functional useProcessDefaultsIntegration hook
- Working logic processing for all field states
- Value processing for all discovered data types
- Integration tests with mock data

### Phase 3: UI Enhancement (Week 3)
**Goal**: Enhance ProcessParameterSelector and form integration

**Tasks**:
1. **Enhanced ProcessParameterSelector** (2 days)
   - Modify ProcessParameterSelector to accept defaults
   - Implement logic-based display/readonly behavior
   - Add default value application on component mount
   - Ensure compatibility with all existing field types

2. **FilterExpressions Integration** (2 days)
   - Implement ProcessFilterService
   - Enhance TableDirSelector with filter support
   - Add dynamic filtering for dependent fields
   - Test filter application with various field types

3. **Form Integration** (1 day)
   - Integrate with react-hook-form for default values
   - Ensure proper form state management
   - Add validation for default value application
   - Handle form reset scenarios

**Deliverables**:
- Enhanced ProcessParameterSelector with full defaults support
- Working filter expressions for dependent fields
- Complete form integration with default values
- UI tests for all enhanced components

### Phase 4: Complete Integration (Week 4)
**Goal**: Full ProcessDefinitionModal integration and testing

**Tasks**:
1. **ProcessDefinitionModal Enhancement** (2 days)
   - Integrate enhanced defaults system into main modal
   - Add context data collection and processing
   - Implement refresh parent functionality
   - Ensure backward compatibility with existing processes

2. **FormInitialization Pattern Adaptation** (2 days)
   - Create ProcessFormInitializationAdapter
   - Implement adapter pattern for existing infrastructure reuse
   - Add comprehensive mapping between response formats
   - Test adapter with various response scenarios

3. **Comprehensive Testing** (1 day)
   - End-to-end testing with real API responses
   - Performance testing with large parameter sets
   - Error scenario testing (network failures, malformed responses)
   - Browser compatibility testing

**Deliverables**:
- Fully integrated ProcessDefinitionModal with defaults
- Working FormInitialization pattern adaptation
- Complete test suite with high coverage
- Performance benchmarks and optimization recommendations

### Phase 5: Production Readiness (Week 5)
**Goal**: Production deployment preparation and documentation

**Tasks**:
1. **Error Handling & Monitoring** (2 days)
   - Implement comprehensive error handling
   - Add monitoring and logging for production
   - Create error recovery strategies
   - Add performance monitoring hooks

2. **Documentation & Training** (2 days)
   - Create developer documentation
   - Add inline code documentation
   - Create troubleshooting guides
   - Prepare training materials for team

3. **Production Deployment** (1 day)
   - Final testing in staging environment
   - Deployment scripts and rollback procedures
   - Monitoring setup and alerting
   - Production deployment and validation

**Deliverables**:
- Production-ready defaults system with monitoring
- Complete documentation suite
- Deployment procedures and rollback plans
- Training materials and knowledge transfer

---

## Risk Assessment

### High Risk Areas

#### 1. Complex Response Structure Complexity
**Risk**: Real response structure is more complex than initially assumed
**Impact**: High - Could require significant rework of processing logic
**Mitigation**: 
- Based on real response analysis, risk is now well-understood
- Comprehensive type system designed to handle all discovered patterns
- Extensive testing with real response data
- Fallback mechanisms for unknown response patterns

#### 2. Parameter Name Mapping Issues
**Risk**: Mismatch between ProcessParameter names and response field names
**Impact**: High - Fields won't receive their default values
**Mitigation**:
- Bidirectional mapping system with fallbacks
- Comprehensive mapping validation and error reporting
- Logging for all mapping issues to aid debugging
- Pattern matching for common naming conventions

#### 3. Logic Field Processing Complexity
**Risk**: Display/readonly logic fields have complex interaction patterns
**Impact**: Medium - Fields may not show/hide correctly
**Mitigation**:
- Separate logic processing service with clear responsibilities
- Comprehensive testing of all logic combinations
- Fallback to safe defaults (visible/editable) on logic errors
- Clear separation between logic processing and UI rendering

### Medium Risk Areas

#### 4. Performance with Large Parameter Sets
**Risk**: Processing many defaults could impact modal open performance
**Impact**: Medium - Slower modal opening for complex processes
**Mitigation**:
- Asynchronous processing with loading states
- Caching of processed results
- Performance monitoring and optimization
- Progressive loading for complex forms

#### 5. FilterExpressions Integration Complexity
**Risk**: Filter expressions may not integrate well with existing selectors
**Impact**: Medium - Dependent fields may not filter correctly
**Mitigation**:
- Gradual rollout starting with simple filter patterns
- Fallback to non-filtered behavior on filter errors
- Comprehensive testing with various selector types
- Clear separation between filtering and base functionality

#### 6. FormInitialization Pattern Compatibility
**Risk**: Adaptation to existing patterns may introduce inconsistencies
**Impact**: Medium - May break existing form behavior
**Mitigation**:
- Adapter pattern preserves existing interfaces
- Extensive testing with existing processes
- Gradual rollout with feature flags
- Clear rollback procedures

### Low Risk Areas

#### 7. Type Conversion Edge Cases
**Risk**: Some value types may not convert correctly
**Impact**: Low - Individual fields may show incorrect default values
**Mitigation**:
- Comprehensive type conversion testing
- Fallback to string representation for unknown types
- Error handling for conversion failures
- User-friendly error messages

#### 8. Browser Compatibility Issues
**Risk**: Enhanced functionality may not work in all browsers
**Impact**: Low - Functionality may degrade in older browsers
**Mitigation**:
- Use of proven libraries and patterns
- Progressive enhancement approach
- Browser compatibility testing
- Graceful degradation for unsupported features

---

## Performance Considerations

### 1. Response Processing Performance

**Optimization Strategies**:
```typescript
// Optimized processing with memoization
export class OptimizedProcessDefaultsProcessor {
  private static cache = new Map<string, ProcessedDefaults>();
  
  static processResponseCached(
    response: ProcessDefaultsResponse,
    cacheKey: string
  ): ProcessedDefaults {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const processed = this.processResponse(response);
    this.cache.set(cacheKey, processed);
    
    return processed;
  }
  
  // Batch processing for multiple defaults
  static batchProcessDefaults(
    defaults: Record<string, ProcessDefaultValue>
  ): Record<string, ProcessedValue> {
    const results: Record<string, ProcessedValue> = {};
    
    // Process all simple values first (faster)
    const simpleValues = Object.entries(defaults).filter(([, value]) => isSimpleValue(value));
    const referenceValues = Object.entries(defaults).filter(([, value]) => isReferenceValue(value));
    
    // Batch process simple values
    simpleValues.forEach(([key, value]) => {
      results[key] = this.processSimpleValueFast(value);
    });
    
    // Process reference values
    referenceValues.forEach(([key, value]) => {
      results[key] = this.processReferenceValueFast(value as ProcessReferenceValue);
    });
    
    return results;
  }
}
```

**Performance Metrics**:
- Target processing time: < 50ms for 20 parameters
- Memory usage: < 1MB for processed defaults
- Cache hit ratio: > 80% for repeated processes

### 2. Form Rendering Performance

**Optimization Strategies**:
```typescript
// Optimized component rendering with React.memo
export const OptimizedProcessParameterSelector = React.memo(({ 
  parameter,
  defaultValue,
  isDisplayed, 
  isReadOnly,
  filterExpressions 
}: EnhancedProcessParameterSelectorProps) => {
  // Use useMemo for expensive computations
  const mappedField = useMemo(() => 
    ProcessParameterMapper.mapToField(parameter), 
    [parameter.id, parameter.reference] // Only recompute on key changes
  );
  
  // Memoize selector rendering
  const renderedSelector = useMemo(() => {
    return renderSelectorByType(parameter, mappedField, isReadOnly);
  }, [parameter.reference, mappedField.hqlName, isReadOnly]);
  
  // Early return for hidden fields
  if (!isDisplayed) {
    return null;
  }
  
  return (
    <div className="parameter-container">
      {renderedSelector}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.parameter.id === nextProps.parameter.id &&
    prevProps.defaultValue === nextProps.defaultValue &&
    prevProps.isDisplayed === nextProps.isDisplayed &&
    prevProps.isReadOnly === nextProps.isReadOnly &&
    JSON.stringify(prevProps.filterExpressions) === JSON.stringify(nextProps.filterExpressions)
  );
});
```

### 3. Memory Management

**Optimization Strategies**:
- **Lazy Loading**: Only process parameters that are currently visible
- **Cache Management**: LRU cache with size limits for processed defaults
- **Memory Profiling**: Monitor memory usage in development
- **Garbage Collection**: Proper cleanup of event listeners and timeouts

### 4. Network Performance

**Optimization Strategies**:
- **Request Batching**: Combine multiple default requests when possible
- **Response Caching**: Cache responses at the HTTP level
- **Request Deduplication**: Avoid duplicate requests for same process
- **Timeout Management**: Reasonable timeouts with retry logic

---

## Testing Strategy

### 1. Unit Testing

#### A. Response Processing Tests
```typescript
describe('ProcessDefaultsProcessor', () => {
  describe('processResponse', () => {
    it('should handle mixed value types correctly', () => {
      const response = {
        defaults: {
          'simple_field': 'test_value',
          'reference_field': { value: '123', identifier: 'Test Reference' },
          'boolean_field': true,
          'number_field': 42.5,
          'field_display_logic': 'Y',
          'field_readonly_logic': 'N'
        },
        filterExpressions: {
          'dependent_field': { category: 'active' }
        },
        refreshParent: true
      };

      const result = ProcessDefaultsProcessor.processResponse(response);

      expect(result.fieldValues).toEqual({
        'simple_field': 'test_value',
        'reference_field': { value: '123', identifier: 'Test Reference' },
        'boolean_field': true,
        'number_field': 42.5
      });

      expect(result.logicStates['field']).toEqual({
        displayLogic: true,
        readonlyLogic: false
      });

      expect(result.filterExpressions['dependent_field']).toEqual({
        category: 'active'
      });

      expect(result.refreshParent).toBe(true);
    });

    it('should handle empty response gracefully', () => {
      const response = {
        defaults: {},
        filterExpressions: {},
        refreshParent: false
      };

      const result = ProcessDefaultsProcessor.processResponse(response);

      expect(result.fieldValues).toEqual({});
      expect(result.logicStates).toEqual({});
      expect(result.filterExpressions).toEqual({});
      expect(result.refreshParent).toBe(false);
    });
  });
});
```

#### B. Type Guard Tests
```typescript
describe('Type Guards', () => {
  describe('isReferenceValue', () => {
    it('should identify reference values correctly', () => {
      expect(isReferenceValue({ value: '123', identifier: 'Test' })).toBe(true);
      expect(isReferenceValue('simple string')).toBe(false);
      expect(isReferenceValue({ value: '123' })).toBe(false);
      expect(isReferenceValue({ identifier: 'Test' })).toBe(false);
    });
  });

  describe('isLogicField', () => {
    it('should identify logic fields correctly', () => {
      expect(isLogicField('field_display_logic')).toBe(true);
      expect(isLogicField('field_readonly_logic')).toBe(true);
      expect(isLogicField('regular_field')).toBe(false);
    });
  });
});
```

#### C. Parameter Mapping Tests  
```typescript
describe('ProcessParameterMapperEnhanced', () => {
  describe('createParameterMapping', () => {
    it('should create bidirectional mapping correctly', () => {
      const parameters = {
        'param1': { name: 'param1', dBColumnName: 'db_column1' },
        'param2': { name: 'param2', dBColumnName: 'db_column2' },
        'param3': { name: 'param3' } // Missing dBColumnName
      };

      const result = ProcessParameterMapperEnhanced.createParameterMapping(parameters);

      expect(result.paramToColumn).toEqual({
        'param1': 'db_column1',
        'param2': 'db_column2', 
        'param3': 'param3'
      });

      expect(result.columnToParam).toEqual({
        'db_column1': 'param1',
        'db_column2': 'param2',
        'param3': 'param3'
      });

      expect(result.mappingIssues).toContain(
        'Parameter param3 missing dBColumnName, using name as fallback'
      );
    });
  });
});
```

### 2. Integration Testing

#### A. Hook Integration Tests
```typescript
describe('useProcessDefaultsIntegration', () => {
  it('should fetch and process defaults correctly', async () => {
    const mockResponse = {
      defaults: {
        'test_field': 'test_value',
        'ref_field': { value: '123', identifier: 'Test Ref' }
      },
      filterExpressions: {},
      refreshParent: false
    };

    mockPost.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useProcessDefaultsIntegration({
      processId: 'test-process',
      windowId: 'test-window',
      tabId: 'test-tab',
      parameters: mockParameters
    }));

    await act(async () => {
      await result.current.fetchDefaults();
    });

    expect(result.current.hasDefaults).toBe(true);
    expect(result.current.getFormValues()).toEqual({
      'test_field': 'test_value',
      'ref_field': 'Test Ref',
      'ref_field_value': '123'
    });
  });
});
```

#### B. Component Integration Tests
```typescript
describe('ProcessParameterSelectorEnhanced', () => {
  it('should apply default values correctly', () => {
    const mockParameter = {
      id: 'test-param',
      name: 'test_param',
      reference: 'String',
      mandatory: false
    };

    render(
      <FormProvider {...mockForm}>
        <ProcessParameterSelectorEnhanced 
          parameter={mockParameter}
          defaultValue="test default"
          isDisplayed={true}
          isReadOnly={false}
        />
      </FormProvider>
    );

    expect(mockForm.setValue).toHaveBeenCalledWith('test_param', 'test default');
  });

  it('should hide field when isDisplayed is false', () => {
    const { container } = render(
      <FormProvider {...mockForm}>
        <ProcessParameterSelectorEnhanced 
          parameter={mockParameter}
          isDisplayed={false}
        />
      </FormProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});
```

### 3. End-to-End Testing

#### A. Complete Process Flow Tests
```typescript
describe('ProcessModal with Defaults - E2E', () => {
  it('should load defaults and allow process execution', async () => {
    // Mock the defaults API response
    mockPost.mockResolvedValueOnce({
      data: {
        defaults: {
          'payment_amount': '100.00',
          'currency_id': { value: '102', identifier: 'EUR' },
          'payment_date': '2025-08-05'
        },
        filterExpressions: {},
        refreshParent: true
      }
    });

    // Render ProcessModal
    render(<ProcessDefinitionModal button={mockProcessButton} open={true} />);

    // Wait for defaults to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('100.00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-08-05')).toBeInTheDocument();
    });

    // Execute process
    fireEvent.click(screen.getByText('Execute'));

    // Verify process execution with form values
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('processId=test-process'),
        expect.objectContaining({
          'payment_amount': '100.00',
          'currency_id': '102',
          'payment_date': '2025-08-05'
        })
      );
    });
  });
});
```

#### B. Error Scenario Tests
```typescript
describe('Error Scenarios', () => {
  it('should handle API errors gracefully', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    render(<ProcessDefinitionModal button={mockProcessButton} open={true} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading defaults/i)).toBeInTheDocument();
    });

    // Should still allow manual input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'manual value' } });
    expect(input.value).toBe('manual value');
  });

  it('should handle malformed response gracefully', async () => {
    mockPost.mockResolvedValueOnce({ data: { invalid: 'response' } });

    render(<ProcessDefinitionModal button={mockProcessButton} open={true} />);

    // Should not crash and should show warning
    await waitFor(() => {
      expect(screen.queryByText(/unexpected response/i)).toBeInTheDocument();
    });
  });
});
```

### 4. Performance Testing

#### A. Load Testing
```typescript
describe('Performance Tests', () => {
  it('should process large parameter sets efficiently', async () => {
    const largeResponse = {
      defaults: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`field_${i}`, `value_${i}`])
      ),
      filterExpressions: {},
      refreshParent: false
    };

    const startTime = performance.now();
    const result = ProcessDefaultsProcessor.processResponse(largeResponse);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // Should process in < 100ms
    expect(Object.keys(result.fieldValues)).toHaveLength(100);
  });

  it('should render many parameters efficiently', async () => {
    const manyParameters = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        `param_${i}`, 
        { id: `param_${i}`, name: `param_${i}`, reference: 'String' }
      ])
    );

    const startTime = performance.now();
    
    render(
      <FormProvider {...mockForm}>
        {Object.values(manyParameters).map(param => (
          <ProcessParameterSelectorEnhanced 
            key={param.id}
            parameter={param}
            isDisplayed={true}
            isReadOnly={false}
          />
        ))}
      </FormProvider>
    );

    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(500); // Should render in < 500ms
  });
});
```

---

## Migration Strategy

### 1. Backward Compatibility Strategy

**Phase 1: Additive Changes Only**
- All new functionality is opt-in via feature flags
- Existing ProcessModal functionality remains unchanged
- New defaults system runs in parallel with existing system
- No breaking changes to existing APIs

**Implementation**:
```typescript
// Feature flag for defaults system
const USE_PROCESS_DEFAULTS = process.env.REACT_APP_USE_PROCESS_DEFAULTS === 'true';

export const ProcessDefinitionModal = (props) => {
  if (USE_PROCESS_DEFAULTS) {
    return <ProcessDefinitionModalWithDefaults {...props} />;
  } else {
    return <ProcessDefinitionModalLegacy {...props} />;
  }
};
```

### 2. Gradual Rollout Plan

**Week 1-2: Internal Testing**
- Deploy to development environment with feature flag disabled by default
- Enable for specific test processes only
- Gather feedback from development team
- Fix any critical issues discovered

**Week 3-4: Limited Production**
- Deploy to production with feature flag disabled
- Enable for 5-10% of processes using A/B testing
- Monitor error rates and performance metrics
- Collect user feedback and usage analytics

**Week 5-6: Expanded Rollout**
- Expand to 25% of processes if no major issues
- Monitor system performance under increased load
- Address any scalability issues discovered
- Continue gathering user feedback

**Week 7-8: Full Rollout**
- Enable for all processes if stability is confirmed
- Remove feature flag and legacy code paths
- Monitor system performance and error rates
- Provide training and documentation to users

### 3. Rollback Procedures

**Immediate Rollback**
- Feature flag can be disabled instantly via environment variable
- No code deployment required for rollback
- System automatically falls back to legacy behavior
- All existing functionality remains intact

**Rollback Triggers**:
- Error rate > 5% for processes using defaults
- Performance degradation > 20% in modal open time
- Critical bugs affecting process execution
- User experience issues reported by > 10% of users

**Rollback Process**:
1. Disable feature flag: `REACT_APP_USE_PROCESS_DEFAULTS=false`
2. Clear application cache to ensure immediate effect
3. Monitor error rates return to baseline
4. Investigate and fix issues before re-enabling
5. Communicate rollback to development team and stakeholders

### 4. Data Safety Measures

**Data Validation**:
- All processed default values are validated before application
- Malformed responses are handled gracefully without crashing
- User can always override or clear default values
- Form submission validates all values regardless of source

**Audit Logging**:
- Log all defaults API calls and responses
- Track which processes use defaults functionality  
- Monitor for unusual patterns or errors
- Maintain detailed logs for debugging and analysis

**Fallback Mechanisms**:
- If defaults processing fails, form operates normally without defaults
- Network errors don't prevent manual form completion
- Malformed responses result in warning but don't block functionality
- All existing form validation remains in place

---

## Conclusion

This comprehensive technical proposal provides a complete blueprint for implementing ProcessModal defaults based on the real DefaultsProcessActionHandler response structure. The approach is grounded in actual API analysis, leverages existing proven infrastructure, and provides concrete implementation strategies for all discovered complexities.

### Key Success Factors

1. **Real Response Analysis**: Based on actual API response structure, not assumptions
2. **Incremental Enhancement**: Builds on existing ProcessModal infrastructure 
3. **Comprehensive Type System**: Handles all discovered value types and patterns
4. **Robust Error Handling**: Graceful degradation for all error scenarios
5. **Performance Optimization**: Designed for scalability and responsiveness
6. **Thorough Testing Strategy**: Comprehensive test coverage for all scenarios
7. **Safe Migration Path**: Backward compatible with clear rollback procedures

### Implementation Readiness

This proposal provides:
- ✅ Complete technical architecture based on real response structure  
- ✅ Detailed implementation plan with concrete deliverables
- ✅ Comprehensive risk assessment with mitigation strategies
- ✅ Full testing strategy covering all aspects of the system
- ✅ Safe migration path with rollback procedures
- ✅ Performance considerations and optimization strategies

The system is designed to integrate seamlessly with existing ProcessModal infrastructure while providing comprehensive support for the complex default values structure discovered in the real DefaultsProcessActionHandler response. The implementation can begin immediately with confidence in the technical approach and expected outcomes.
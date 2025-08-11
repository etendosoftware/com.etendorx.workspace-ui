# Process Payload Building System

## Overview

The process payload building system is responsible for constructing complete payloads that include all necessary context fields, system metadata, and user input for process execution in Etendo.

## Core Function: `buildProcessPayload`

Location: `packages/MainUI/utils/index.ts`

### Purpose
Combines record data, system context, process defaults, and user input into a comprehensive payload that matches Etendo's expected format for process execution.

### Payload Components

#### 1. Record Values with Input Name Mapping
```typescript
const recordValues = buildPayloadByInputName(record, tab.fields);
```
- Maps record field names to their corresponding input names
- Handles field reference transformations
- Sanitizes values according to field types

#### 2. System Context Fields
```typescript
const systemContext = {
  // Window/Tab metadata
  [`inp${tab.entityName?.replace(/^C_/, '')?.toLowerCase() || 'record'}Id`]: record.id,
  inpTabId: String(tab.id),
  inpwindowId: String(tab.window),
  inpTableId: String(tab.table),
  inpkeyColumnId: `${tab.entityName}_ID`,
  keyProperty: "id",
  inpKeyName: `inp${tab.entityName}_ID`,
  keyColumnName: `${tab.entityName}_ID`,
  keyPropertyType: "_id_13",

  // Process execution fields
  PromotionsDefined: "N",
  IsReversalDocument: "N",
  DOCBASETYPE: record.docBaseType || "",
  VoidAutomaticallyCreated: 0,
  FinancialManagement: "Y",
  _ShowAcct: "Y",

  // Accounting dimension display logic
  ACCT_DIMENSION_DISPLAY: "",
  "$IsAcctDimCentrally": "Y",

  // Element context fields (accounting configuration)
  $Element_BP: record.cBpartnerId ? "Y" : "",
  $Element_OO: record.adOrgId ? "Y" : "",
  $Element_PJ: record.cProjectId ? "Y" : "",
  // ... additional element fields
};
```

#### 3. Element Visibility Matrix
The system generates element visibility flags based on document types:

```typescript
// Document-specific element visibility
"$Element_BP_ARI_H": "Y",  // Business Partner for AR Invoice Header
"$Element_OO_ARI_H": "Y",  // Organization for AR Invoice Header
"$Element_PJ_ARI_H": "Y",  // Project for AR Invoice Header
"$Element_CC_ARI_H": "",   // Cost Center (hidden for AR Invoice Header)
"$Element_U1_ARI_H": "N",  // User Dimension 1 (not shown)
"$Element_U2_ARI_H": "N",  // User Dimension 2 (not shown)
```

### Naming Conventions

#### Entity Name Processing
```typescript
// Convert entity name to input field pattern
const entityLower = tab.entityName?.replace(/^C_/, '')?.toLowerCase() || 'record';
const inputFieldName = `inp${entityLower}Id`;
```

#### Key Column Pattern
```typescript
// Standard Etendo key column naming
const keyColumn = `${tab.entityName}_ID`;
// Examples: C_Invoice_ID, C_BPartner_ID, M_Product_ID
```

### Integration with Process Initialization

#### For DefaultsProcessActionHandler
```typescript
// Convert payload to EntityValue compatible format
const payload = {
  ...Object.fromEntries(
    Object.entries(processPayload).map(([key, value]) => [
      key, 
      value === null ? null : String(value)
    ])
  ),
  processId,
  windowId: windowId || "",
  recordId: recordId || "",
  _requestType: "defaults",
  _timestamp: Date.now().toString(),
};
```

#### For Process Execution
```typescript
const completePayload = buildProcessPayload(
  record,                 // Complete record data
  tab,                   // Tab metadata
  initialState || {},    // Process defaults from server
  form.getValues()       // User input from form
);
```

### Field Mapping Strategies

#### Input Name Resolution
```typescript
export const buildPayloadByInputName = (values, fields) => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    const field = fields?.[key];
    const newKey = field?.inputName ?? key;
    acc[newKey] = sanitizeValue(value, field);
    return acc;
  }, {});
};
```

#### Value Sanitization
```typescript
export const sanitizeValue = (value, field) => {
  const reference = getFieldReference(field?.column?.reference);

  if (reference === FieldType.DATE) {
    return value ? String(value).split("-").toReversed().join("-") : null;
  }

  const valueMap = {
    true: "Y",
    false: "N",
    null: null,
  };

  return valueMap[String(value)] ?? value;
};
```

### Error Handling and Validation

#### Type Safety
- Ensures all values are compatible with `EntityValue` type
- Handles null and undefined values appropriately
- Converts complex objects to string representations when needed

#### Fallback Mechanisms
- Provides default values for missing system fields
- Uses entity name patterns when specific mappings are unavailable
- Maintains backward compatibility with legacy field names

### Performance Considerations

#### Memoization
The payload building should be memoized to avoid unnecessary recomputation:

```typescript
const availableFormData = useMemo(() => {
  return buildProcessPayload(record, tab, initialState, {});
}, [record, tab, initialState]);
```

#### Field Resolution Caching
- Tab field mappings should be cached
- Input name lookups should be optimized
- System context generation should be memoized

### Testing Strategies

#### Unit Tests
```typescript
describe('buildProcessPayload', () => {
  it('should include all required system fields', () => {
    const payload = buildProcessPayload(mockRecord, mockTab, {}, {});
    expect(payload).toHaveProperty('inpTabId');
    expect(payload).toHaveProperty('inpwindowId');
    expect(payload).toHaveProperty('FinancialManagement');
  });

  it('should handle entity name transformations', () => {
    const tab = { entityName: 'C_Invoice' };
    const payload = buildProcessPayload({}, tab, {}, {});
    expect(payload.inpkeyColumnId).toBe('C_Invoice_ID');
  });
});
```

#### Integration Tests
- Test with real record data from different entities
- Verify payload structure matches Etendo expectations
- Test with various tab configurations

### Common Issues and Solutions

#### Issue: Missing System Context Fields
**Problem**: Process execution fails due to missing required context
**Solution**: Ensure `buildProcessPayload` includes all necessary system fields

#### Issue: Incorrect Field Name Mapping
**Problem**: Values not appearing in process due to name mismatches
**Solution**: Use `buildPayloadByInputName` for proper field mapping

#### Issue: Type Incompatibility
**Problem**: TypeScript errors when passing payload to different functions
**Solution**: Use proper type conversion and EntityValue compatibility

### Future Enhancements

1. **Dynamic Element Detection**: Auto-detect which accounting elements are active
2. **Document Type Specific Logic**: Customize payload based on document type
3. **Performance Optimization**: Cache system context generation
4. **Validation**: Add payload validation before process execution

## Related Documentation

- [Process Initialization System](./process-initialization-system.md)
- [Field Mapping and Validation](./field-mapping-validation.md)
- [Entity Value Types](../../api/entity-value-types.md)

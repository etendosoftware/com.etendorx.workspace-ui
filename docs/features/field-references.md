# Field Reference Constants

This document provides comprehensive information about the field reference constants used throughout the Etendo WorkspaceUI to identify different field types and their corresponding UI components.

## Overview

The field reference system maps backend field reference IDs to frontend component types. This enables the UI to render appropriate input controls based on the field's data type and behavior requirements.

## FIELD_REFERENCE_CODES

**File**: `packages/MainUI/utils/form/constants.ts:25-61`

### Security Fields
```typescript
// Password field reference
PASSWORD: "C5C21C28B39E4683A91779F16C112E40"
```
- **Component**: `PasswordSelector`
- **UI Behavior**: Masked input field for sensitive data
- **Usage**: User passwords, API keys, secure tokens

### Data Reference Fields
```typescript
// Product reference to datasource
PRODUCT: "95E2A8B50A254B2AAE6774B8C2F28120"

// Table directory references
TABLE_DIR_19: "19"
TABLE_DIR_18: "18"
```
- **Component**: `TableDirSelector`
- **UI Behavior**: Dropdown/autocomplete with datasource integration
- **Usage**: Product selection, entity references, foreign key relationships

### Window Reference
```typescript
// Window reference
WINDOW: "FF80818132D8F0F30132D9BC395D0038"
```
- **Component**: `WindowReferenceGrid` (in process execution)
- **UI Behavior**: Full data grid for record selection
- **Usage**: Process parameters requiring record selection from another window

### Date and Time Fields
```typescript
// Date and time references
DATE: "15"
DATETIME: "16"
```
- **Component**: `DateSelector` / `DatetimeSelector`
- **UI Behavior**: Date picker controls with localization
- **Usage**: Order dates, timestamps, scheduling fields

### Boolean Fields
```typescript
// Boolean reference
BOOLEAN: "20"
```
- **Component**: `BooleanSelector`
- **UI Behavior**: Checkbox or toggle switch
- **Usage**: Active flags, enabled/disabled states, yes/no options

### Numeric Fields
```typescript
// Numeric references
QUANTITY_29: "29"
QUANTITY_22: "22"
DECIMAL: "800008"
INTEGER: "11"
```
- **Component**: `QuantitySelector` / `NumericSelector`
- **UI Behavior**: Numeric input with validation and formatting
- **Usage**: Quantities, amounts, prices, counts

### List Fields
```typescript
// List references
LIST_17: "17"
LIST_13: "13"
```
- **Component**: `ListSelector` / `RadioSelector` (in process execution)
- **UI Behavior**: Dropdown with predefined options
- **Usage**: Status fields, categories, predefined choices

### Selection Fields
```typescript
// Select reference with location support
SELECT_30: "30"
LOCATION_21: "21"
```
- **Component**: `SelectSelector` / `LocationSelector`
- **UI Behavior**: Enhanced dropdown with search and filtering
- **Usage**: Location selection, complex entity references

## FieldType Enum Mapping

**File**: `packages/api-client/src/api/types.ts`

The reference codes are mapped to TypeScript enum values:

```typescript
export enum FieldType {
  TEXT = "text",
  NUMBER = "number", 
  DATE = "date",
  BOOLEAN = "boolean",
  SELECT = "select",
  SEARCH = "search",
  TABLEDIR = "tabledir",
  QUANTITY = "quantity",
  LIST = "list",
  BUTTON = "button",
  WINDOW = "window",
  DATETIME = "datetime",
}
```

## Component Mapping Logic

### Form Fields (`GenericSelector`)
**File**: `packages/MainUI/components/Form/FormView/selectors/GenericSelector.tsx:11-78`

```typescript
switch (reference) {
  case FIELD_REFERENCE_CODES.PASSWORD:
    return <PasswordSelector field={field} readOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.PRODUCT:
  case FIELD_REFERENCE_CODES.TABLE_DIR_19:
  case FIELD_REFERENCE_CODES.TABLE_DIR_18:
    return <TableDirSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.DATE:
    return <DateSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.DATETIME:
    return <DatetimeSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.BOOLEAN:
    return <BooleanSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.QUANTITY_29:
  case FIELD_REFERENCE_CODES.QUANTITY_22:
    return <QuantitySelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.LIST_17:
  case FIELD_REFERENCE_CODES.LIST_13:
    return <ListSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.SELECT_30:
    // Special handling for location fields
    if (field.column.referenceSearchKey === FIELD_REFERENCE_CODES.LOCATION_21) {
      return <LocationSelector field={field} isReadOnly={isReadOnly} />;
    }
    return <SelectSelector field={field} isReadOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.DECIMAL:
    return <NumericSelector field={field} type="decimal" readOnly={isReadOnly} />;
  
  case FIELD_REFERENCE_CODES.INTEGER:
    return <NumericSelector field={field} type="integer" readOnly={isReadOnly} />;
  
  default:
    return <TextSelector field={field} isReadOnly={isReadOnly} />;
}
```

### Field Type Resolution (`getFieldReference`)
**File**: `packages/MainUI/utils/index.ts:30-57`

```typescript
export const getFieldReference = (reference?: string): FieldType => {
  switch (reference) {
    case "10":
      return FieldType.DATETIME;
    case FIELD_REFERENCE_CODES.TABLE_DIR_19:
    case FIELD_REFERENCE_CODES.PRODUCT:
    case FIELD_REFERENCE_CODES.TABLE_DIR_18:
      return FieldType.TABLEDIR;
    case FIELD_REFERENCE_CODES.DATE:
    case FIELD_REFERENCE_CODES.DATETIME:
      return FieldType.DATE;
    case FIELD_REFERENCE_CODES.BOOLEAN:
      return FieldType.BOOLEAN;
    case FIELD_REFERENCE_CODES.QUANTITY_29:
      return FieldType.QUANTITY;
    case FIELD_REFERENCE_CODES.LIST_17:
    case FIELD_REFERENCE_CODES.LIST_13:
      return FieldType.LIST;
    case "28":
      return FieldType.BUTTON;
    case FIELD_REFERENCE_CODES.SELECT_30:
      return FieldType.SELECT;
    case FIELD_REFERENCE_CODES.WINDOW:
      return FieldType.WINDOW;
    default:
      return FieldType.TEXT;
  }
};
```

## Process Execution Context

In process execution workflows, some reference types have special behavior:

### Window Reference Process Parameters
- **Reference**: `FIELD_REFERENCE_CODES.WINDOW`
- **Component**: `WindowReferenceGrid`
- **Behavior**: Displays a full data grid for multi-record selection

### List Process Parameters  
- **Reference**: `FIELD_REFERENCE_CODES.LIST_17` or `FIELD_REFERENCE_CODES.LIST_13`
- **Component**: `RadioSelector` (instead of `ListSelector`)
- **Behavior**: Radio button group for single selection

## Additional Reference Codes

### Process Reference Codes
**File**: `packages/MainUI/utils/form/constants.ts:66-72`

```typescript
export const PROCESS_REFERENCE_CODES = {
  // Client reference
  CLIENT: "23C59575B9CF467C9620760EB255B389",
  
  // Process reference
  PROCESS: "7BABA5FF80494CAFA54DEBD22EC46F01",
} as const;
```

### Datasource Reference Codes
**File**: `packages/MainUI/utils/form/constants.ts:77-83`

```typescript
export const DATASOURCE_REFERENCE_CODES = {
  // Product datasource
  PRODUCT: "95E2A8B50A254B2AAE6774B8C2F28120",
  
  // Fallback selector
  FALLBACK_SELECTOR_ID: "EB3C41F0973A4EDA91E475833792A6D4",
} as const;
```

## Value Sanitization

The `sanitizeValue` function handles data transformation based on field reference types:

```typescript
export const sanitizeValue = (value: unknown, field?: Field) => {
  const reference = getFieldReference(field?.column?.reference);

  if (reference === FieldType.DATE) {
    return value ? String(value).split("-").toReversed().join("-") : null;
  }

  // Boolean value mapping
  const valueMap = {
    true: "Y",
    false: "N", 
    null: null,
  } as const;

  // Apply transformation if needed
  return Object.prototype.hasOwnProperty.call(valueMap, String(value))
    ? valueMap[String(value) as keyof typeof valueMap]
    : value;
};
```

## Table Column Rendering

Field references also affect how data is displayed in tables:

```typescript
// Boolean fields
if (reference === FieldType.BOOLEAN) {
  const yesText = t ? t("common.trueText") : "Yes";
  const noText = t ? t("common.falseText") : "No";
  return cellValue === "Y" || cellValue === true ? yesText : noText;
}

// List fields with reference lists
if (reference === FieldType.LIST && column.refList && Array.isArray(column.refList)) {
  const codeValue = v[column.hqlName];
  const matchingItem = column.refList.find(item => item.searchKey === codeValue);
  return matchingItem ? matchingItem.name : codeValue;
}
```

## Usage Examples

### Form Field Definition
```typescript
const field = {
  column: {
    reference: FIELD_REFERENCE_CODES.DATE
  },
  // ... other field properties
};
// Results in: <DateSelector field={field} isReadOnly={false} />
```

### Process Parameter
```typescript
const parameter = {
  reference: FIELD_REFERENCE_CODES.WINDOW,
  // ... other parameter properties  
};
// Results in: <WindowReferenceGrid parameter={parameter} {...otherProps} />
```

### Conditional Logic
```typescript
const fieldType = getFieldReference(field.column?.reference);
if (fieldType === FieldType.BUTTON) {
  // Handle as action button
} else {
  // Handle as data field
}
```

## Best Practices

1. **Always use constants**: Use `FIELD_REFERENCE_CODES` constants instead of hardcoded strings
2. **Type safety**: Use `FieldType` enum for type checking and switch statements
3. **Fallback handling**: Always provide default cases for unknown reference types
4. **Context awareness**: Consider whether the field is in a form vs. process vs. table context
5. **Value sanitization**: Use `sanitizeValue` when preparing data for backend submission
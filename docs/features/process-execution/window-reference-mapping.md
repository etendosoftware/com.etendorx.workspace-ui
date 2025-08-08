# Window Reference Mapping

This document explains how the `WINDOW_REFERENCE_ID` constant maps to UI components in the Etendo WorkspaceUI process execution system.

## Overview

The window reference mapping system enables processes to display data grids for record selection. When a process parameter has a reference type that matches `WINDOW_REFERENCE_ID`, the system automatically renders a `WindowReferenceGrid` component instead of standard form inputs.

## WINDOW_REFERENCE_ID Constant

**File**: `packages/MainUI/utils/form/constants.ts:33`

```typescript
export const FIELD_REFERENCE_CODES = {
  // Window reference
  WINDOW: "FF80818132D8F0F30132D9BC395D0038",
  // ... other reference codes
} as const;
```

**Usage**: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx:63`

```typescript
const WINDOW_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW;
```

## Component Mapping Logic

The mapping occurs in the `ProcessDefinitionModalContent` component through the following logic:

### 1. Detection Logic

```typescript
const hasWindowReference = useMemo(() => {
  return Object.values(parameters).some(
    (param) => param.reference === WINDOW_REFERENCE_ID
  );
}, [parameters]);
```

**Location**: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx:109`

### 2. Component Rendering

```typescript
return Object.values(parameters).map((parameter) => {
  if (parameter.reference === WINDOW_REFERENCE_ID) {
    return (
      <WindowReferenceGrid
        key={parameter.id}
        parameter={parameter}
        onSelectionChange={setGridSelection}
        tabId={tab?.id || ""}
        entityName={windowReferenceTab?.entity}
        windowReferenceTab={windowReferenceTab}
        processConfig={processConfig}
        processConfigLoading={processConfigLoading}
        processConfigError={processConfigError}
        recordValues={recordValues}
      />
    );
  }
  // ... other parameter types
});
```

**Location**: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx:174-188`

## Process Flow

1. **Process Definition Loading**: Process parameters are loaded from the backend
2. **Reference Type Check**: Each parameter's `reference` field is compared against `WINDOW_REFERENCE_ID`
3. **Component Selection**: 
   - If match → Render `WindowReferenceGrid`
   - If no match → Render standard form controls (`BaseSelector`, inputs, etc.)
4. **Grid Configuration**: The grid is configured using:
   - `windowReferenceTab`: Tab metadata for columns and fields
   - `processConfig`: Process-specific configuration
   - `entityName`: Target entity for data fetching

## Related Components

- **WindowReferenceGrid**: Main grid component for record selection
- **ProcessDefinitionModal**: Parent modal component handling the mapping logic
- **BaseSelector**: Alternative component for non-window reference parameters

## Configuration Files

The mapping system integrates with:

- **Process Definition Data**: `packages/MainUI/utils/processes/definition/constants.ts`
- **Field Reference Codes**: `packages/MainUI/utils/form/constants.ts`
- **Component Types**: `packages/MainUI/components/ProcessModal/types.ts`

## Example Use Cases

### Window Reference Process
```typescript
// Process parameter with window reference
{
  id: "salesOrder",
  name: "Sales Order",
  reference: "FF80818132D8F0F30132D9BC395D0038", // WINDOW_REFERENCE_ID
  // ... other properties
}
```

This parameter will automatically render as a `WindowReferenceGrid` showing sales orders in a selectable table format.

### Non-Window Reference Process
```typescript
// Process parameter with different reference
{
  id: "startDate",
  name: "Start Date", 
  reference: "15", // DATE reference
  // ... other properties
}
```

This parameter will render as a standard date picker input via `BaseSelector`.
# WindowReferenceGrid Component

This document provides comprehensive documentation for the `WindowReferenceGrid` component, which renders a data grid for record selection in process execution workflows.

## Overview

The `WindowReferenceGrid` component is a specialized table component that displays records from a specific entity in a selectable grid format. It's used in process execution workflows where users need to select records from a related window/tab before executing a process.

**File**: `packages/MainUI/components/ProcessModal/WindowReferenceGrid.tsx`

## Component Props

```typescript
interface WindowReferenceGridProps {
  parameter: ProcessParameter;           // Process parameter configuration
  onSelectionChange: (selection: unknown[]) => void; // Selection callback
  entityName?: EntityValue;              // Target entity name
  recordId?: EntityValue;                // Current record ID
  tabId: string;                        // Tab identifier
  windowReferenceTab: Tab;              // Tab metadata for columns
  windowId?: string;                    // Window identifier
  processConfig?: ProcessConfigResponse | null; // Process configuration
  processConfigLoading: boolean;        // Loading state for process config
  processConfigError: Error | null;     // Error state for process config
  recordValues: RecordValues | null;    // Current record values for filtering
}
```

## Key Features

### 1. Record Selection
- **Multi-selection**: Users can select multiple records using checkboxes
- **Row clicking**: Records can be selected by clicking anywhere on the row
- **Selection feedback**: Selected rows are highlighted with blue background
- **Clear selection**: Button to clear all selections when records are selected

### 2. Data Management
- **Dynamic filtering**: Supports column-based filtering
- **Pagination**: Load-more functionality for large datasets (100 records per page)
- **Real-time updates**: Responds to filter changes and data updates
- **Empty states**: Displays appropriate empty state when no data is available

### 3. Process Integration
- **Process-specific configuration**: Adapts behavior based on process type
- **Dynamic options**: Configures datasource options based on process requirements
- **Filter expressions**: Applies process-defined filters to the grid data
- **Default values**: Pre-populates filters with process defaults

## Configuration Logic

### Datasource Options
The component builds datasource options based on several factors:

```typescript
const datasourceOptions = useMemo(() => {
  const processId = processConfig?.processId;
  const currentOptionData = PROCESS_DEFINITION_DATA[processId];
  
  const options: Record<string, EntityValue> = {
    ...staticOptions,
    tabId: parameter.tab || tabId,
    pageSize: PAGE_SIZE,
  };
  
  // Apply process-specific configurations
  // Apply default values from process config
  // Apply filter expressions
  
  return options;
}, [tabId, parameter.tab, processConfig, recordValues]);
```

### Process-Specific Behavior

#### Create Lines from Order Process
For the "Create Lines from Order" process (`CREATE_LINES_FROM_ORDER_PROCESS_ID`), the component applies dynamic filtering based on invoice data:

```typescript
if (processId === CREATE_LINES_FROM_ORDER_PROCESS_ID && dynamicKeys) {
  const { invoiceClient, invoiceBusinessPartner, invoicePriceList, invoiceCurrency } = dynamicKeys;
  options[invoiceClient] = recordValues?.inpadClientId || "";
  options[invoiceBusinessPartner] = recordValues?.inpcBpartnerId || "";
  options[invoicePriceList] = recordValues?.inpmPricelistId || "";
  options[invoiceCurrency] = recordValues?.inpcCurrencyId || "";
}
```

## UI Components

### Top Toolbar
- **Parameter name**: Displays the process parameter name
- **Selection counter**: Shows count of selected records
- **Clear button**: Allows clearing all selections

### Table Features
- **Sticky header**: Header remains visible during scrolling
- **Column filtering**: Individual column filters with real-time updates
- **Row selection**: Visual feedback for selected rows
- **Loading states**: Opacity changes during data loading
- **Responsive design**: Adjusts to container size

### Bottom Toolbar
- **Load More button**: Appears when additional records are available
- **Pagination info**: Implicit through load-more pattern

## Styling

The component uses Tailwind CSS classes and integrates with Material-UI's styling system:

```typescript
const tableOptions: MRT_TableOptions<EntityData> = {
  muiTablePaperProps: {
    className: tableStyles.paper,
    style: {
      borderRadius: "1rem",
      boxShadow: "none",
    },
  },
  // ... other styling options
};
```

### Selection States
- **Unselected rows**: `hover:bg-gray-50 cursor-pointer`
- **Selected rows**: `bg-blue-50 hover:bg-blue-100 cursor-pointer`
- **Loading state**: `opacity-40 cursor-wait cursor-to-children`

## Error Handling

The component handles multiple error states:

1. **Tab loading errors**: When window reference tab fails to load
2. **Process config errors**: When process configuration fails
3. **Datasource errors**: When data fetching fails
4. **Empty states**: When no data or fields are available

```typescript
const isLoading = tabLoading || processConfigLoading || datasourceLoading;
const error = tabError || processConfigError || datasourceError;

if (error) {
  return <ErrorDisplay title={t("errors.missingData")} description={error?.message} showRetry onRetry={refetch} />;
}
```

## Performance Optimizations

### Memoization
- **Columns**: Column definitions are memoized based on fields and translations
- **Datasource options**: Options are recalculated only when dependencies change
- **Fields**: Field processing is memoized to prevent unnecessary re-renders

### Callback Optimization
- **Selection handling**: Uses `useCallback` to prevent unnecessary re-renders
- **Filter handling**: Optimized to only trigger updates on real changes
- **Row interactions**: Efficient event handling for large datasets

## Integration Points

### With ProcessDefinitionModal
The component is rendered when a process parameter has `WINDOW_REFERENCE_ID` reference type:

```typescript
if (parameter.reference === WINDOW_REFERENCE_ID) {
  return <WindowReferenceGrid {...props} />;
}
```

### With Datasource Hook
Uses the `useDatasource` hook for data management:

```typescript
const {
  records,
  loading: datasourceLoading,
  error: datasourceError,
  updateColumnFilters,
  refetch,
  hasMoreRecords,
  fetchMore,
} = useDatasource({
  entity: String(entityName),
  params: datasourceOptions,
});
```

### With Tab System
Integrates with the tab metadata system for column definitions and field information.

## Constants

```typescript
const MAX_WIDTH = 100;        // Maximum width for empty state
const PAGE_SIZE = 100;        // Records per page for pagination
```

## Translation Keys

The component uses several translation keys:
- `"table.selection.multiple"`: Selection count text
- `"common.clear"`: Clear selection button
- `"common.loadMore"`: Load more records button
- `"errors.missingData"`: Error display title

## Usage Example

```typescript
<WindowReferenceGrid
  parameter={processParameter}
  onSelectionChange={(selectedRecords) => {
    // Handle selection changes
    setGridSelection(selectedRecords);
  }}
  tabId="current-tab-id"
  entityName="SalesOrder"
  windowReferenceTab={salesOrderTab}
  processConfig={processConfig}
  processConfigLoading={false}
  processConfigError={null}
  recordValues={currentRecordValues}
/>
```
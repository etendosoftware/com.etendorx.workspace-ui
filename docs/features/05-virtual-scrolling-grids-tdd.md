
# Technical Design Document: 05 - Standardizing and Enhancing Table Virtualization

**Author:** Gemini
**Associated PRD:** `PRD-06: Implementation of Virtual Scrolling for Grids`

### 1. Summary and Objective

This document outlines the technical plan to address gaps in our current implementation of table virtualization. While the core feature is active in the `MainUI` package, it is inconsistent with our `ComponentLibrary`, lacks advanced configuration, and operates on unstated assumptions.

The objectives are:
1.  **Unify the implementation** by making the `Table` component in `ComponentLibrary` the single source of truth for virtualization.
2.  **Expose advanced controls** for fine-tuning virtualization behavior.
3.  **Formally document** the architectural constraints of the implementation.

### 2. Analysis of Identified Gaps

Based on a code review of `context.md`, the following issues require action:

1.  **Inconsistent Implementation:** The `DynamicTable` in `packages/MainUI/components/Table/index.tsx` has virtualization enabled (`enableRowVirtualization: true`). However, the reusable `Table` component in `packages/ComponentLibrary/src/components/Table/index.tsx` does **not** have this enabled, creating a divergence in behavior and performance characteristics.
2.  **Lack of Fine-Tuning:** The current implementation does not expose optional but useful props from `material-react-table`, such as `virtualizerInstanceRef` (for imperative scrolling) or `virtualizerProps` (for adjusting the `overscan` count), which limits advanced control.
3.  **Implicit Assumption of Fixed Row Height:** Virtualization performs optimally only when all rows have a consistent, fixed height. This critical constraint is not documented or enforced, posing a risk for future UI changes.

### 3. Detailed Implementation Plan

#### **Step 3.1: Unify Table Implementations (CRITICAL)**

The primary task is to refactor the `Table` component in the `ComponentLibrary` to be the definitive, virtualized table, and then refactor `MainUI`'s `DynamicTable` to use it.

**File to Modify:** `packages/ComponentLibrary/src/components/Table/index.tsx`

The `EnhancedTableProps` interface and the `Table` component will be updated to accept and pass virtualization props.

```typescript
// packages/ComponentLibrary/src/components/Table/index.tsx

// ... (imports)

type TableDataType = Record<string, unknown>;

// UPDATE THE PROPS INTERFACE
export interface EnhancedTableProps extends TableProps {
  onRowClick: (row: MRT_Row<TableDataType>) => void;
  onRowDoubleClick: (row: MRT_Row<TableDataType>) => void;
  // ADD these props to control virtualization from the outside
  enableRowVirtualization?: boolean;
  enableColumnVirtualization?: boolean;
  virtualizerProps?: any; // For advanced options like 'overscan'
}

const Table: React.FC<EnhancedTableProps> = ({ 
  data = [], 
  onRowClick, 
  onRowDoubleClick,
  // DESTRUCTURE the new props with default values
  enableRowVirtualization = true,
  enableColumnVirtualization = true,
  virtualizerProps,
}) => {
  const { sx } = useStyle();
  const columns = useMemo(() => getColumns(), []);

  // ... (tableData memoization remains the same)

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    
    // --- APPLY THE NEW PROPS HERE ---
    enableRowVirtualization: enableRowVirtualization,
    enableColumnVirtualization: enableColumnVirtualization,
    virtualizerProps: virtualizerProps,
    // --- END OF CHANGES ---

    // ... (rest of the existing configuration)
    enableTopToolbar: false,
    enableBottomToolbar: false,
    initialState: {
      density: 'compact',
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onRowClick(row),
      onDoubleClick: () => onRowDoubleClick(row),
      sx: sx.tableBodyRow,
    }),
    // ...
  } as MRT_TableOptions<any>);

  return <MaterialReactTable table={table} />;
};

export default Table;
```

**File to Refactor:** `packages/MainUI/components/Table/index.tsx`

This component must be refactored to import and use the enhanced `Table` component from `@workspaceui/componentlibrary` instead of implementing its own `MaterialReactTable` instance. This centralizes the logic.

#### **Step 3.2: Document Architectural Constraints**

A `README.md` or Storybook documentation (`Table.stories.tsx`) must be created or updated for the `Table` component in `ComponentLibrary`. It must clearly state the following:

> **Performance Constraint:** For virtualization to function correctly and efficiently, all table rows must have a **consistent, fixed height**. Using dynamic content that changes the height of rows (e.g., expandable text, variable-sized images) will lead to incorrect scroll calculations, visual glitches, and degraded performance. Please ensure row layouts are uniform.

### 4. Implementation Checklist

-   [ ] Modify `packages/ComponentLibrary/src/components/Table/index.tsx` to accept and apply virtualization props (`enableRowVirtualization`, `enableColumnVirtualization`, `virtualizerProps`).
-   [ ] Refactor `packages/MainUI/components/Table/index.tsx` to consume the unified `Table` component from `ComponentLibrary`.
-   [ ] Create/Update documentation for the `Table` component in `ComponentLibrary` to include the fixed-row-height constraint.
-   [ ] Create a Storybook story that demonstrates the use of `virtualizerProps`, specifically by setting a different `overscan` value to visually verify it works.

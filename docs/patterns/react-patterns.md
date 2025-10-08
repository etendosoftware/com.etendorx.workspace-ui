# React Patterns in WorkspaceUI

## Custom Hooks Patterns

### Data Fetching Hooks
```typescript
// Pattern: useXxxConfig hooks for server state
export const useProcessConfig = ({ processId, windowId, tabId, javaClassName }: UseProcessConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<ProcessConfigResponse | null>(null);

  const fetchConfig = useCallback(async (payload: Record<string, EntityValue> = {}) => {
    // Implementation...
  }, [processId, windowId, tabId]);

  return { fetchConfig, loading, error, config };
};
```

### Handler Patterns
```typescript
// Pattern: Separate handlers for different execution paths
const handleWindowReferenceExecute = useCallback(async () => {
  // Window reference specific logic
}, [dependencies]);

const handleDirectJavaProcessExecute = useCallback(async () => {
  // Direct Java process specific logic  
}, [dependencies]);

const handleExecute = useCallback(async () => {
  // Route to appropriate handler based on process type
  if (hasWindowReference) {
    await handleWindowReferenceExecute();
    return;
  }
  
  if (!onProcess && javaClassName && tab) {
    await handleDirectJavaProcessExecute();
    return;
  }
  
  // Default string function execution
}, [hasWindowReference, handleWindowReferenceExecute, handleDirectJavaProcessExecute, ...]);
```

## Component Composition

### Custom JavaScript Evaluation Pattern

The custom JavaScript evaluation pattern provides a secure way to execute dynamic code in table cells while maintaining React's architecture principles.

#### Cell Component Pattern
```typescript
// Pattern: Separate React component for custom evaluation
export const CustomJsCell: React.FC<CustomJsCellProps> = React.memo(({
  cell,
  row,
  customJsCode,
  column
}) => {
  const [result, setResult] = useState<unknown>(cell.getValue());
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const evaluateCode = async () => {
      setIsEvaluating(true);
      try {
        const evaluated = await evaluateCustomJs(customJsCode, {
          record: row.original,
          column,
        });
        setResult(evaluated);
      } catch (error) {
        console.error('Custom JS evaluation failed:', error);
        setResult(cell.getValue()); // Fallback to original value
      } finally {
        setIsEvaluating(false);
      }
    };

    if (customJsCode?.trim()) {
      evaluateCode();
    }
  }, [customJsCode, cell.getValue(), row.original, column]);

  // Handle loading state
  if (isEvaluating) {
    return null; // or loading indicator
  }

  // Handle different result types
  if (isColorString(result)) {
    return <ColorCell color={result as string} />;
  }

  if (React.isValidElement(result)) {
    return result;
  }

  return <span>{String(result)}</span>;
});
```

#### Column Transformation Pattern
```typescript
// Pattern: Pure transformation function for column processing
export const transformColumnsWithCustomJs = (
  originalColumns: Column[], 
  fields: Field[]
): Column[] => {
  return originalColumns.map((column) => {
    const field = fields.find(f => f.id === column.fieldId);
    
    if (field?.etmetaCustomjs?.trim()) {
      return {
        ...column,
        Cell: ({ cell, row }: { cell: MRT_Cell<EntityData, unknown>; row: MRT_Row<EntityData> }) => (
          <CustomJsCell
            cell={cell}
            row={row}
            customJsCode={field.etmetaCustomjs}
            column={column}
          />
        ),
      };
    }

    return column;
  });
};
```

#### Integration with useColumns Hook
```typescript
// Pattern: Integration in existing hooks without violating React rules
export const useColumns = (tab: Tab) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    const originalColumns = parseColumns(fieldsAsArray);

    // Apply reference columns first
    const referencedColumns = originalColumns.map((column: Column) => {
      // Reference column logic...
      return column;
    });

    // Apply custom JavaScript transformations
    const customJsColumns = transformColumnsWithCustomJs(
      referencedColumns,
      fieldsAsArray
    );

    return customJsColumns;
  }, [tab.fields, handleClickRedirect, handleKeyDownRedirect]);

  return columns;
};
```

#### Security and Error Handling Pattern
```typescript
// Pattern: Safe JavaScript evaluation with error boundaries
export async function evaluateCustomJs(
  jsCode: string,
  context: CustomJsContext
): Promise<unknown> {
  try {
    // Use existing executeStringFunction for security
    return await executeStringFunction(jsCode, { Metadata }, context);
  } catch (error) {
    console.error("Error evaluating custom JS:", error);
    // Return user-friendly error format
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `[Error: ${errorMessage}]`;
  }
}
```

#### Anti-Patterns to Avoid

❌ **Don't use hooks inside transformation functions**:
```typescript
// WRONG: Hooks inside utility functions
export const transformColumnsWithCustomJs = (columns: Column[]) => {
  return columns.map(column => {
    const [result, setResult] = useState(); // ❌ Violates Rules of Hooks
    // ...
  });
};
```

✅ **Do use hooks only in React components**:
```typescript
// CORRECT: Hooks only in React components
export const CustomJsCell: React.FC<Props> = ({ customJsCode }) => {
  const [result, setResult] = useState(); // ✅ Proper hook usage
  // ...
};
```

❌ **Don't perform side effects in render**:
```typescript
// WRONG: Side effects during render
const CustomJsCell = ({ customJsCode }) => {
  evaluateCustomJs(customJsCode); // ❌ Side effect in render
  return <span>Result</span>;
};
```

✅ **Do use useEffect for side effects**:
```typescript
// CORRECT: Side effects in useEffect
const CustomJsCell = ({ customJsCode }) => {
  const [result, setResult] = useState();
  
  useEffect(() => {
    evaluateCustomJs(customJsCode).then(setResult); // ✅ Proper side effect
  }, [customJsCode]);
  
  return <span>{result}</span>;
};
```

### Modal Pattern
```typescript
// Pattern: Content component + Wrapper component
function ProcessDefinitionModalContent(props: ProcessDefinitionModalContentProps) {
  // Full implementation
}

export default function ProcessDefinitionModal(props: ProcessDefinitionModalProps) {
  if (!props.button) return null;
  return <ProcessDefinitionModalContent {...props} button={props.button} />;
}
```

## State Management Patterns

### Local State for UI
```typescript
// Pattern: Group related state
const [isExecuting, setIsExecuting] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [response, setResponse] = useState<ResponseMessage>();

// Pattern: Computed state with useMemo
const isActionButtonDisabled = useMemo(() => 
  isExecuting || isSuccess || (hasWindowReference && gridSelection.length === 0),
  [isExecuting, isSuccess, hasWindowReference, gridSelection.length]
);
```

### Context Usage
```typescript
// Pattern: Use contexts for cross-cutting concerns
const { tab, record } = useTabContext();
const { session } = useUserContext();
const { t } = useTranslation();
```

### Global State Persistence

#### Table State Persistence Pattern

For persisting table configurations across window switches:

```typescript
// Pattern: Use tab-specific persistence hook
import { useTableStatePersistenceTab } from '@/hooks/useTableStatePersistenceTab';

function TableComponent({ windowId, tabId }) {
  const {
    tableColumnFilters,
    setTableColumnFilters,
    tableColumnVisibility,
    setTableColumnVisibility,
    tableColumnSorting,
    setTableColumnSorting,
    tableColumnOrder,
    setTableColumnOrder,
  } = useTableStatePersistenceTab(windowId, tabId);

  // Use exactly like useState - supports both direct values and updater functions
  const handleFilterChange = useCallback((newFilters) => {
    setTableColumnFilters(newFilters);
  }, [setTableColumnFilters]);

  const handleToggleVisibility = useCallback((columnId) => {
    setTableColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  }, [setTableColumnVisibility]);

  return (
    <MaterialReactTable
      state={{
        columnFilters: tableColumnFilters,
        columnVisibility: tableColumnVisibility,
        sorting: tableColumnSorting,
        columnOrder: tableColumnOrder,
      }}
      onColumnFiltersChange={setTableColumnFilters}
      onColumnVisibilityChange={setTableColumnVisibility}
      onSortingChange={setTableColumnSorting}
      onColumnOrderChange={setTableColumnOrder}
    />
  );
}
```

#### Direct Context Access Pattern

For advanced use cases like window management:

```typescript
// Pattern: Direct context access for system-level operations
import { useTableStatePersistence } from '@/contexts/tableStatePersistence';

function WindowManager() {
  const { cleanupWindow, getAllState } = useTableStatePersistence();

  const handleWindowClose = useCallback((windowId: string) => {
    // Clean up all table state for the window before closing
    cleanupWindow(windowId);
    // Then proceed with normal window closing logic
    closeWindow(windowId);
  }, [cleanupWindow]);

  const debugState = useCallback(() => {
    const state = getAllState();
    console.log('Current table states:', state);
    console.log('Total windows with state:', Object.keys(state).length);
  }, [getAllState]);

  return (
    <div>
      <button onClick={() => handleWindowClose('window123')}>
        Close Window
      </button>
      <button onClick={debugState}>
        Debug State
      </button>
    </div>
  );
}
```

#### Integration with Existing Hooks Pattern

```typescript
// Pattern: Integration in existing data hooks
export const useTableData = (tab: Tab) => {
  // Replace local state with persistent state
  const {
    tableColumnFilters,
    setTableColumnFilters,
    tableColumnVisibility,
    setTableColumnVisibility,
    tableColumnSorting,
    setTableColumnSorting,
    tableColumnOrder,
    setTableColumnOrder,
  } = useTableStatePersistenceTab(tab.window, tab.id);

  // All existing handlers work without modification
  const handleMRTColumnVisibilityChange = useCallback(
    (updater: MRT_VisibilityUpdater<EntityData>) => {
      setTableColumnVisibility(updater);
    },
    [setTableColumnVisibility]
  );

  const handleMRTColumnFiltersChange = useCallback(
    (updater: MRT_ColumnFiltersUpdater<EntityData>) => {
      setTableColumnFilters(updater);
    },
    [setTableColumnFilters]
  );

  return {
    // Return persistent state instead of local state
    tableColumnFilters,
    setTableColumnFilters,
    tableColumnVisibility,
    setTableColumnVisibility,
    tableColumnSorting,
    setTableColumnSorting,
    tableColumnOrder,
    setTableColumnOrder,
    // ... other returns
    handleMRTColumnVisibilityChange,
    handleMRTColumnFiltersChange,
  };
};
```

#### Provider Setup Pattern

```typescript
// Pattern: Application root provider setup
import TableStatePersistenceProvider from '@/contexts/tableStatePersistence';

function App() {
  return (
    <TableStatePersistenceProvider>
      {/* All other providers and components */}
      <UserProvider>
        <ThemeProvider>
          <MainApplication />
        </ThemeProvider>
      </UserProvider>
    </TableStatePersistenceProvider>
  );
}
```

### State Persistence Anti-Patterns

❌ **Don't use multiple providers**:
```typescript
// WRONG: Multiple providers cause state isolation
function ComponentA() {
  return (
    <TableStatePersistenceProvider>
      <TableComponent />
    </TableStatePersistenceProvider>
  );
}

function ComponentB() {
  return (
    <TableStatePersistenceProvider> {/* ❌ Separate instance */}
      <AnotherTableComponent />
    </TableStatePersistenceProvider>
  );
}
```

✅ **Do use single provider at app root**:
```typescript
// CORRECT: Single provider at application root
function App() {
  return (
    <TableStatePersistenceProvider>
      <ComponentA />
      <ComponentB />
    </TableStatePersistenceProvider>
  );
}
```

❌ **Don't forget cleanup on window close**:
```typescript
// WRONG: Memory leaks from uncleaned state
const handleWindowClose = (windowId) => {
  closeWindow(windowId); // ❌ State persists in memory
};
```

✅ **Do cleanup before closing windows**:
```typescript
// CORRECT: Clean up state before closing
const { cleanupWindow } = useTableStatePersistence();

const handleWindowClose = (windowId) => {
  cleanupWindow(windowId); // ✅ Clean up first
  closeWindow(windowId);   // Then close window
};
```

## Error Handling Patterns

### Async Error Handling
```typescript
const handleAsyncOperation = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await someAsyncOperation();
    // Handle success
    
  } catch (error) {
    logger.error("Operation failed:", error);
    setError(error instanceof Error ? error : new Error("Unknown error"));
  } finally {
    setLoading(false);
  }
}, [dependencies]);
```

## Performance Patterns

### Memoization Strategy
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Event handlers that don't change often
const handleClick = useCallback(() => {
  // Handler logic
}, [stableDependencies]);

// Child components with stable props
const MemoizedChild = memo(ChildComponent);
```

## Documentation Standards

### JSDoc for Public APIs
```typescript
/**
 * Custom hook for managing process configuration
 * 
 * @param props Hook configuration
 * @param props.processId ID of the process
 * @param props.javaClassName Optional Java class name for direct execution
 * @returns Object with fetchConfig function and state
 */
export const useProcessConfig = (props: UseProcessConfigProps) => {
  // Implementation
};
```

### Inline Comments for Business Logic
```typescript
// If process has javaClassName but no onProcess, execute directly via servlet
if (!onProcess && javaClassName && tab) {
  await handleDirectJavaProcessExecute();
  return;
}
```
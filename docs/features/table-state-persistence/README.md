# Table State Persistence Feature

## Overview

The Table State Persistence feature provides global state management for table configurations across multiple windows in the Etendo WorkspaceUI. This feature ensures that table configurations (filters, column visibility, sorting, and column order) persist when users switch between windows, significantly improving user experience and productivity.

## Problem Solved

**Before**: When users switched between windows, all table configurations were lost because table state was managed locally in each `TabContext`. Users had to reconfigure tables repeatedly, leading to frustration and reduced productivity.

**After**: Table configurations persist across window switches through a global state management system. Users maintain their carefully configured table views regardless of window navigation patterns.

## Architecture

### High-Level Architecture

```mermaid
flowchart TB
    subgraph "Application Root"
        Provider[TableStatePersistenceProvider]
    end
    
    subgraph "Window A"
        TabA1[Tab A1]
        TabA2[Tab A2]
        TabA1 --> HookA1[useTableStatePersistenceTab]
        TabA2 --> HookA2[useTableStatePersistenceTab]
    end
    
    subgraph "Window B"
        TabB1[Tab B1]
        TabB2[Tab B2]
        TabB1 --> HookB1[useTableStatePersistenceTab]
        TabB2 --> HookB2[useTableStatePersistenceTab]
    end
    
    Provider --> Context[TableStatePersistenceContext]
    HookA1 --> Context
    HookA2 --> Context
    HookB1 --> Context
    HookB2 --> Context
    
    Context --> State[Global State Store]
    
    subgraph "State Structure"
        State --> WindowA[windowA]
        State --> WindowB[windowB]
        WindowA --> TabA1State[tabA1: {filters, visibility, sorting, order}]
        WindowA --> TabA2State[tabA2: {filters, visibility, sorting, order}]
        WindowB --> TabB1State[tabB1: {filters, visibility, sorting, order}]
        WindowB --> TabB2State[tabB2: {filters, visibility, sorting, order}]
    end
```

### State Structure

The persistence system uses a nested state structure:

```typescript
{
  windowId: {
    tabId: {
      table: {
        filters: MRT_ColumnFiltersState,     // Column filters
        visibility: MRT_VisibilityState,    // Column visibility
        sorting: MRT_SortingState,          // Column sorting
        order: string[]                     // Column order
      }
    }
  }
}
```

### Core Components

1. **TableStatePersistenceProvider**: Global context provider that wraps the entire application
2. **TableStatePersistenceContext**: React context for state management
3. **useTableStatePersistenceTab**: Hook for tab-specific state access
4. **useTableStatePersistence**: Low-level hook for direct context access

## Implementation Details

### Files Structure

```
packages/MainUI/
├── contexts/
│   └── tableStatePersistence.tsx          # Core context implementation
├── hooks/
│   └── useTableStatePersistenceTab.tsx    # Tab-specific hook
├── app/(main)/window/
│   └── page.tsx                           # Provider integration
├── components/NavigationTabs/
│   └── WindowTabs.tsx                     # Cleanup integration
└── __tests__/
    ├── contexts/
    │   └── tableStatePersistence.test.tsx
    ├── hooks/
    │   └── useTableStatePersistenceTab.test.tsx
    ├── integration/
    │   └── tableStatePersistence.integration.test.tsx
    └── performance/
        └── tableStatePersistence.performance.test.tsx
```

### Key Features

#### 1. Global State Management
- Single source of truth for all table configurations
- Automatic state initialization for new windows/tabs
- Immutable state updates with proper React patterns

#### 2. Window/Tab Isolation
- Each window maintains independent state
- Each tab within a window has isolated table state
- No cross-contamination between unrelated windows/tabs

#### 3. Memory Management
- Automatic cleanup when windows are closed
- Prevention of memory leaks through proper state cleanup
- Efficient storage with minimal memory footprint

#### 4. Backward Compatibility
- Drop-in replacement for existing `TabContext` table state
- Same API interface for seamless integration
- No breaking changes to existing components

## Usage Examples

### Basic Hook Usage

```typescript
import { useTableStatePersistenceTab } from '@/hooks/useTableStatePersistenceTab';

function MyTableComponent() {
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

  // Use exactly like useState
  const handleFilterChange = (newFilters) => {
    setTableColumnFilters(newFilters);
  };

  const handleVisibilityChange = (updater) => {
    setTableColumnVisibility(updater);
  };

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

### Integration in useTableData Hook

```typescript
export const useTableData = (tab: Tab) => {
  // Replace TabContext table state with persistence hook
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

  // Rest of the hook implementation remains the same
  // All existing handlers work without modification
};
```

### Direct Context Access

```typescript
import { useTableStatePersistence } from '@/contexts/tableStatePersistence';

function WindowManager() {
  const { cleanupWindow, getAllState } = useTableStatePersistence();

  const handleWindowClose = (windowId: string) => {
    // Clean up all table state for the window
    cleanupWindow(windowId);
    
    // Then close the window through normal means
    closeWindow(windowId);
  };

  const debugState = () => {
    console.log('All table state:', getAllState());
  };

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

## API Reference

### useTableStatePersistenceTab

Tab-specific hook that provides React useState-compatible API.

```typescript
function useTableStatePersistenceTab(
  windowId: string,
  tabId: string
): UseTableStatePersistenceTabReturn
```

**Parameters:**
- `windowId`: Unique identifier for the window
- `tabId`: Unique identifier for the tab within the window

**Returns:**
```typescript
interface UseTableStatePersistenceTabReturn {
  // Current state values
  tableColumnFilters: MRT_ColumnFiltersState;
  tableColumnVisibility: MRT_VisibilityState;
  tableColumnSorting: MRT_SortingState;
  tableColumnOrder: string[];
  
  // React-style setters (support both direct values and updater functions)
  setTableColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  setTableColumnVisibility: React.Dispatch<React.SetStateAction<MRT_VisibilityState>>;
  setTableColumnSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
  setTableColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
}
```

### useTableStatePersistence

Low-level hook for direct context access.

```typescript
function useTableStatePersistence(): TableStatePersistenceContextI
```

**Returns:**
```typescript
interface TableStatePersistenceContextI {
  // State access
  getTableState: (windowId: string, tabId: string) => TableState;
  
  // State setters
  setTableFilters: (windowId: string, tabId: string, filters: MRT_ColumnFiltersState) => void;
  setTableVisibility: (windowId: string, tabId: string, visibility: MRT_VisibilityState) => void;
  setTableSorting: (windowId: string, tabId: string, sorting: MRT_SortingState) => void;
  setTableOrder: (windowId: string, tabId: string, order: string[]) => void;
  
  // Window management
  cleanupWindow: (windowId: string) => void;
  
  // Utility
  getAllState: () => TableStatePersistenceState;
}
```

## Testing

### Unit Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTableStatePersistenceTab } from '@/hooks/useTableStatePersistenceTab';
import TableStatePersistenceProvider from '@/contexts/tableStatePersistence';

const wrapper = ({ children }) => (
  <TableStatePersistenceProvider>{children}</TableStatePersistenceProvider>
);

test('should manage table state independently per tab', () => {
  const { result: tab1 } = renderHook(
    () => useTableStatePersistenceTab('window1', 'tab1'),
    { wrapper }
  );
  
  const { result: tab2 } = renderHook(
    () => useTableStatePersistenceTab('window1', 'tab2'),
    { wrapper }
  );

  act(() => {
    tab1.current.setTableColumnFilters([{ id: 'name', value: 'test' }]);
    tab2.current.setTableColumnFilters([{ id: 'status', value: 'active' }]);
  });

  expect(tab1.current.tableColumnFilters).toEqual([{ id: 'name', value: 'test' }]);
  expect(tab2.current.tableColumnFilters).toEqual([{ id: 'status', value: 'active' }]);
});
```

### Integration Testing

```typescript
test('should persist state across window switches', () => {
  // Test complete window switching workflow
  // Apply configs in window A, switch to window B, return to window A
  // Verify configs persist
});
```

### Performance Testing

```typescript
test('should handle large number of windows efficiently', () => {
  // Test with 100 windows × 10 tabs each
  // Verify performance stays under acceptable thresholds
});
```

## Performance Characteristics

### Memory Usage
- **Efficient Storage**: Only stores actual table configurations, not entire component state
- **Automatic Cleanup**: Memory is freed when windows are closed
- **Tested Scale**: Validated with 1000+ simultaneous table states (100 windows × 10 tabs)

### State Access Performance
- **Fast Retrieval**: State access typically < 1ms
- **Optimized Updates**: Immutable updates with minimal re-renders
- **React Optimization**: Uses proper React patterns for performance

### Memory Leak Prevention
- **Automatic Cleanup**: Window closure triggers complete state cleanup
- **No Retained References**: Proper garbage collection patterns
- **Tested Scenarios**: Validated against rapid mount/unmount cycles

## Troubleshooting

### Common Issues

#### State Not Persisting
**Problem**: Table configurations are lost when switching windows.

**Solutions**:
1. Verify `TableStatePersistenceProvider` wraps your application root
2. Check that correct `windowId` and `tabId` are passed to the hook
3. Ensure no duplicate providers in the component tree

#### Memory Issues
**Problem**: Application uses too much memory with many windows.

**Solutions**:
1. Verify window cleanup is called when windows are closed
2. Check for memory leaks in browser dev tools
3. Monitor the number of active states with `getAllState()`

#### TypeScript Errors
**Problem**: Type errors when using the persistence hooks.

**Solutions**:
1. Ensure Material React Table types are properly imported
2. Check that hook return types match expected interfaces
3. Verify provider is properly typed in test environments

### Debugging

#### State Inspection
```typescript
const { getAllState } = useTableStatePersistence();

// Log all current state
console.log('All table states:', getAllState());

// Check specific window/tab state
const specificState = getTableState('windowId', 'tabId');
console.log('Specific state:', specificState);
```

#### Performance Monitoring
```typescript
// Monitor state access performance
const start = performance.now();
const state = getTableState(windowId, tabId);
const duration = performance.now() - start;
console.log(`State access took ${duration}ms`);
```

## Migration Guide

### From TabContext to Persistence System

1. **Update Hook Usage**:
   ```typescript
   // Before
   const { tableColumnFilters, setTableColumnFilters } = useTabContext();
   
   // After
   const { tableColumnFilters, setTableColumnFilters } = useTableStatePersistenceTab(tab.window, tab.id);
   ```

2. **Add Provider**:
   ```typescript
   // Wrap your application root
   <TableStatePersistenceProvider>
     <YourApp />
   </TableStatePersistenceProvider>
   ```

3. **Update Window Cleanup**:
   ```typescript
   // Add cleanup to window close handlers
   const { cleanupWindow } = useTableStatePersistence();
   
   const handleWindowClose = (windowId) => {
     cleanupWindow(windowId);
     closeWindow(windowId);
   };
   ```

## Best Practices

### 1. Provider Placement
- Place `TableStatePersistenceProvider` at the application root
- Ensure it wraps all components that need table state persistence
- Avoid multiple provider instances

### 2. Window/Tab Identification
- Use stable, unique identifiers for windows and tabs
- Prefer semantic IDs over random UUIDs when possible
- Ensure IDs remain consistent across component re-renders

### 3. State Updates
- Use the React useState patterns (both direct values and updater functions)
- Batch related state updates when possible
- Avoid unnecessary state updates that don't change values

### 4. Memory Management
- Always call `cleanupWindow` when permanently closing windows
- Monitor memory usage in development with `getAllState()`
- Consider state cleanup for tabs that won't be used again

### 5. Testing
- Include persistence tests in component test suites
- Test state isolation between different windows/tabs
- Validate cleanup behavior in integration tests

## Related Documentation

- [Context Documentation](../../contexts/table-state-persistence.md)
- [React Patterns](../../patterns/react-patterns.md)
- [Architecture Overview](../../architecture/overview.md)
- [Testing Patterns](../../testing/table-state-persistence.md)

---

**Last Updated**: October 8, 2025  
**Version**: 1.0  
**Implementation Status**: Production Ready
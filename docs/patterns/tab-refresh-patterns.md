# Tab Refresh Development Patterns

## Overview

This document provides development guidelines and patterns for working with the tab parent refresh functionality in Etendo WorkspaceUI. The tab refresh system automatically coordinates refresh operations across hierarchical tab structures.

## Core Principles

### 1. Automatic Integration
The tab refresh functionality is designed to work automatically without requiring changes to existing code. All save and delete operations automatically trigger parent refreshes when successful.

### 2. Error Resilience
The system is designed to handle errors gracefully:
- Failed save/delete operations don't trigger parent refreshes
- Failed parent refreshes don't interrupt the remaining refresh flow
- All errors are properly logged for debugging

### 3. Performance Optimization
- Refresh operations execute sequentially to prevent race conditions
- Callbacks are stored efficiently to minimize memory usage
- Component re-renders are minimized through proper context design

## Best Practices

### Component Development

#### 1. Use Provided Contexts
Always use the established context hooks rather than implementing custom solutions:

```typescript
// ✅ Correct - Use the provided context
import { useTabRefreshContext } from '@/contexts/TabRefreshContext';
import { useToolbarContext } from '@/contexts/ToolbarContext';

const MyTabComponent = () => {
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const { onSave, onDelete } = useToolbarContext();
  
  // Component implementation
};
```

```typescript
// ❌ Incorrect - Don't implement custom refresh coordination
const MyTabComponent = () => {
  const [refreshCallbacks, setRefreshCallbacks] = useState(new Map());
  // Custom implementation...
};
```

#### 2. Proper Cleanup
Always unregister refresh callbacks when components unmount:

```typescript
// ✅ Correct - Proper registration and cleanup
useEffect(() => {
  registerRefresh(tab.tabLevel, customRefresh);
  
  return () => {
    unregisterRefresh(tab.tabLevel);
  };
}, [tab.tabLevel, customRefresh, registerRefresh, unregisterRefresh]);
```

```typescript
// ❌ Incorrect - Missing cleanup
useEffect(() => {
  registerRefresh(tab.tabLevel, customRefresh);
  // Missing cleanup - causes memory leaks
}, []);
```

#### 3. Handle Async Operations Properly
Ensure refresh callbacks are properly awaited and handle errors:

```typescript
// ✅ Correct - Proper async handling
const customRefresh = useCallback(async () => {
  try {
    setLoading(true);
    await fetchLatestData();
    updateLocalState();
  } catch (error) {
    console.error('Refresh failed:', error);
    // Don't throw - let other refreshes continue
  } finally {
    setLoading(false);
  }
}, []);
```

```typescript
// ❌ Incorrect - Throwing errors breaks the refresh chain
const customRefresh = useCallback(async () => {
  await fetchLatestData(); // If this throws, it stops other refreshes
  updateLocalState();
}, []);
```

### Save and Delete Operations

#### 1. Use Toolbar Actions
For save operations, always use the toolbar context which automatically handles parent refreshes:

```typescript
// ✅ Correct - Use toolbar context
const { onSave } = useToolbarContext();

const handleSave = async () => {
  await onSave(false); // Parent refreshes handled automatically
};
```

```typescript
// ❌ Incorrect - Manual save without parent refresh coordination
const handleSave = async () => {
  await customSaveFunction();
  // Missing parent refresh trigger
};
```

#### 2. Register Actions Properly
When registering toolbar actions, follow the established pattern:

```typescript
// ✅ Correct - Register actions with toolbar context
useEffect(() => {
  const actions = {
    save: customSaveHandler,
    delete: customDeleteHandler,
    // other actions...
  };
  registerActions(actions);
}, [registerActions, customSaveHandler, customDeleteHandler]);
```

#### 3. Use Established Delete Patterns
For delete operations, use the `useDeleteRecord` hook which integrates with parent refresh:

```typescript
// ✅ Correct - Use useDeleteRecord hook
const { deleteRecord, loading } = useDeleteRecord({
  tab,
  onSuccess: (deletedCount) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});
```

## Common Patterns

### 1. Standard Tab Implementation
Most tabs don't need any special handling - the refresh functionality works automatically:

```typescript
const StandardTab = ({ tab }: { tab: Tab }) => {
  // No special refresh handling needed
  return (
    <div>
      <TabToolbar /> {/* Handles save/delete automatically */}
      <TabContent />
    </div>
  );
};
```

### 2. Custom Refresh Logic
When a tab needs custom refresh behavior beyond the standard `onRefresh`:

```typescript
const CustomRefreshTab = ({ tab }: { tab: Tab }) => {
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  
  const customRefresh = useCallback(async () => {
    // Custom refresh implementation
    await Promise.all([
      fetchSpecialData(),
      updateSpecialState(),
      refreshSpecialComponents(),
    ]);
  }, []);
  
  useEffect(() => {
    registerRefresh(tab.tabLevel, customRefresh);
    return () => unregisterRefresh(tab.tabLevel);
  }, [tab.tabLevel, customRefresh, registerRefresh, unregisterRefresh]);
  
  return <TabContent tab={tab} />;
};
```

### 3. Mixed Operations Tab
For tabs that handle both save and delete operations:

```typescript
const MixedOperationsTab = ({ tab }: { tab: Tab }) => {
  const { registerActions } = useToolbarContext();
  
  // Custom save handler
  const handleSave = useCallback(async (showModal: boolean) => {
    await performCustomSave();
    if (showModal) {
      showSuccessMessage();
    }
  }, []);
  
  // Custom delete handler  
  const handleDelete = useCallback(async (records: EntityData | EntityData[]) => {
    await performCustomDelete(records);
    showDeleteSuccess();
  }, []);
  
  useEffect(() => {
    registerActions({
      save: handleSave,
      delete: handleDelete,
    });
  }, [registerActions, handleSave, handleDelete]);
  
  return <TabContent tab={tab} />;
};
```

### 4. Conditional Refresh Registration
For tabs that conditionally need different refresh behavior:

```typescript
const ConditionalRefreshTab = ({ tab, mode }: { tab: Tab; mode: 'simple' | 'complex' }) => {
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  const { onRefresh } = useToolbarContext();
  
  const complexRefresh = useCallback(async () => {
    await performComplexRefresh();
  }, []);
  
  useEffect(() => {
    const refreshFunction = mode === 'complex' ? complexRefresh : onRefresh;
    registerRefresh(tab.tabLevel, refreshFunction);
    
    return () => unregisterRefresh(tab.tabLevel);
  }, [tab.tabLevel, mode, complexRefresh, onRefresh, registerRefresh, unregisterRefresh]);
  
  return <TabContent tab={tab} mode={mode} />;
};
```

## Testing Patterns

### 1. Unit Test Setup
When testing components that use tab refresh functionality:

```typescript
import { useTabRefreshContext } from '@/contexts/TabRefreshContext';
import { useToolbarContext } from '@/contexts/ToolbarContext';

// Mock the contexts
jest.mock('@/contexts/TabRefreshContext');
jest.mock('@/contexts/ToolbarContext');

const mockUseTabRefreshContext = useTabRefreshContext as jest.MockedFunction<typeof useTabRefreshContext>;
const mockUseToolbarContext = useToolbarContext as jest.MockedFunction<typeof useToolbarContext>;

describe('MyTabComponent', () => {
  const mockRegisterRefresh = jest.fn();
  const mockUnregisterRefresh = jest.fn();
  const mockOnSave = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseTabRefreshContext.mockReturnValue({
      registerRefresh: mockRegisterRefresh,
      unregisterRefresh: mockUnregisterRefresh,
      triggerParentRefreshes: jest.fn(),
    });
    
    mockUseToolbarContext.mockReturnValue({
      onSave: mockOnSave,
      registerActions: jest.fn(),
      // ... other toolbar actions
    } as any);
  });
  
  it('should register refresh callback on mount', () => {
    render(<MyTabComponent tab={mockTab} />);
    expect(mockRegisterRefresh).toHaveBeenCalledWith(mockTab.tabLevel, expect.any(Function));
  });
  
  it('should unregister refresh callback on unmount', () => {
    const { unmount } = render(<MyTabComponent tab={mockTab} />);
    unmount();
    expect(mockUnregisterRefresh).toHaveBeenCalledWith(mockTab.tabLevel);
  });
});
```

### 2. Integration Test Patterns
For testing the complete refresh flow:

```typescript
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <TabRefreshProvider>
      <ToolbarProvider>
        {children}
      </ToolbarProvider>
    </TabRefreshProvider>
  </ThemeProvider>
);

describe('Tab Refresh Integration', () => {
  it('should trigger parent refreshes after successful save', async () => {
    const refreshTracker: number[] = [];
    
    const MultiTabComponent = () => {
      // Implementation that tracks refresh calls
    };
    
    render(
      <TestWrapper>
        <MultiTabComponent />
      </TestWrapper>
    );
    
    // Trigger save operation and verify refresh order
    // ...
  });
});
```

### 3. Error Scenario Testing
Always test error scenarios to ensure proper handling:

```typescript
it('should handle refresh errors gracefully', async () => {
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  
  // Setup component with failing refresh
  // ...
  
  // Trigger operation
  // ...
  
  // Verify error was logged but flow continued
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Failed to refresh parent tab'),
    expect.any(Error)
  );
  
  consoleSpy.mockRestore();
});
```

## Debugging and Troubleshooting

### 1. Enable Debug Logging
To debug refresh operations, enable debug logging:

```typescript
// In browser console or component
import { logger } from '@/utils/logger';
logger.setLevel('debug');

// Or use localStorage (if supported)
localStorage.setItem('debug', 'TabRefreshContext');
```

### 2. Common Issues and Solutions

#### Issue: Parent refreshes not triggering
**Cause**: Tab not properly registered with TabRefreshContext  
**Solution**: Ensure `registerRefresh` is called in `useEffect`

#### Issue: Memory leaks
**Cause**: Missing cleanup in `useEffect`  
**Solution**: Always return cleanup function from `useEffect`

#### Issue: Refresh callbacks executing in wrong order
**Cause**: Race condition or incorrect level assignment  
**Solution**: Verify tab levels are correctly assigned and sequential execution is preserved

#### Issue: Save operations not triggering parent refreshes
**Cause**: Using custom save instead of toolbar context  
**Solution**: Use `onSave` from `useToolbarContext()`

### 3. Performance Monitoring
Monitor refresh performance using browser dev tools:

```typescript
const performanceRefresh = useCallback(async () => {
  const startTime = performance.now();
  
  try {
    await actualRefreshLogic();
  } finally {
    const endTime = performance.now();
    console.log(`Refresh took ${endTime - startTime} milliseconds`);
  }
}, []);
```

## Migration Guide

### From Custom Refresh Logic
If you have existing custom refresh coordination:

```typescript
// ❌ Old pattern - Custom refresh coordination
const OldTabComponent = () => {
  const [parentRefreshFn, setParentRefreshFn] = useState(null);
  
  const handleSave = async () => {
    await saveData();
    // Manual parent refresh
    if (parentRefreshFn) {
      await parentRefreshFn();
    }
  };
};
```

```typescript
// ✅ New pattern - Use TabRefreshContext
const NewTabComponent = () => {
  const { onSave } = useToolbarContext();
  
  // Register save action - parent refresh automatic
  useEffect(() => {
    registerActions({
      save: async (showModal) => {
        await saveData();
        // Parent refresh handled automatically by ToolbarContext
      },
    });
  }, [registerActions]);
};
```

### From Manual Delete Coordination
If you have custom delete with manual parent refresh:

```typescript
// ❌ Old pattern - Manual delete coordination
const handleDelete = async (records) => {
  await deleteRecords(records);
  await manuallyRefreshParents();
};
```

```typescript
// ✅ New pattern - Use useDeleteRecord hook
const { deleteRecord } = useDeleteRecord({
  tab,
  onSuccess: (count) => {
    // Success handling - parent refresh automatic
  },
});
```

## Future Considerations

### 1. Extensibility
The system is designed to be extensible:
- Custom refresh strategies can be implemented
- Additional trigger events can be added
- Performance optimizations can be layered on

### 2. Monitoring Integration
Future monitoring capabilities:
- Refresh success/failure metrics
- Performance tracking
- User behavior analytics

### 3. Advanced Features
Potential future enhancements:
- Conditional parent refresh based on data changes
- Batched refresh operations
- Real-time data synchronization
- Cross-window refresh coordination

---

**Last Updated**: October 2, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
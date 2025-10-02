# Tab Parent Refresh Coordination

## Overview

The Etendo WorkspaceUI tab system implements automatic parent refresh functionality when child tabs perform save or delete operations. This ensures data consistency across the hierarchical tab structure by automatically updating parent tabs when their children are modified.

## Architecture

### Core Components

#### TabRefreshContext
- **Location**: `packages/MainUI/contexts/TabRefreshContext.tsx`
- **Purpose**: Centralized coordination of refresh actions across tab levels
- **Functionality**:
  - Maintains registry of refresh callbacks indexed by tab level
  - Provides `triggerParentRefreshes()` function for sequential parent refresh execution
  - Handles error scenarios gracefully with proper logging

#### ToolbarContext Enhancement
- **Location**: `packages/MainUI/contexts/ToolbarContext.tsx`
- **Purpose**: Intercepts save and delete operations to trigger parent refreshes
- **Key Features**:
  - Wraps `onSave` to automatically trigger parent refreshes after successful saves
  - Wraps `onDelete` to automatically trigger parent refreshes after successful deletes
  - Works regardless of which component registers the save/delete actions
  - Maintains backward compatibility with existing code

#### Tab Component Integration
- **Location**: `packages/MainUI/components/window/Tab.tsx`
- **Purpose**: Registers refresh callbacks and handles tab-specific actions
- **Responsibilities**:
  - Registers tab's refresh callback with TabRefreshContext on mount
  - Unregisters callback on unmount to prevent memory leaks
  - Does not wrap save operations (handled by ToolbarContext)

#### useDeleteRecord Hook Enhancement
- **Location**: `packages/MainUI/hooks/useDeleteRecord.ts`
- **Purpose**: Integrates delete operations with parent refresh system
- **Integration**: Triggers parent refreshes after successful delete operations

### Hierarchical Structure

```
TabsContainer.tsx (TabRefreshProvider)
├── Level 0 Tab (Root)
│   ├── Level 1 Tab (Child)
│   │   ├── Level 2 Tab (Grandchild)
│   │   │   └── Level 3 Tab (Great-grandchild)
│   │   └── Level 2 Tab (Another grandchild)
│   └── Level 1 Tab (Another child)
└── Level 0 Tab (Another root)
```

### Data Flow

#### Save Operation Flow
1. User clicks "Save" in any tab (Level N where N > 0)
2. Component calls `onSave` from ToolbarContext
3. ToolbarContext executes wrapped save:
   - Calls original registered save function
   - If save succeeds and tab level > 0 → calls `triggerParentRefreshes(N)`
   - If save fails → no parent refreshes triggered
4. `triggerParentRefreshes` executes refreshes sequentially: Level N-1 → N-2 → ... → 0

#### Delete Operation Flow
1. User performs delete operation in any tab (Level N where N > 0)
2. `useDeleteRecord` hook executes delete operation
3. After successful delete → calls `triggerParentRefreshes(N)`
4. Parent refreshes execute sequentially: Level N-1 → N-2 → ... → 0

#### Refresh Execution Order
- **Sequential**: Parent refreshes execute one after another, not in parallel
- **Top-down**: Direct parent (Level N-1) refreshes first, then Level N-2, etc.
- **Error Resilient**: Failed refreshes log warnings but don't stop subsequent refreshes

## Context Registration Pattern

### Tab Registration
Each tab registers its refresh callback when mounted and unregisters when unmounted:

```typescript
// In Tab component
const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
const { onRefresh } = useToolbarContext();

useEffect(() => {
  // Register this tab's refresh callback
  registerRefresh(tab.tabLevel, onRefresh);
  
  return () => {
    // Cleanup on unmount
    unregisterRefresh(tab.tabLevel);
  };
}, [tab.tabLevel, onRefresh, registerRefresh, unregisterRefresh]);
```

### Save Operation Interception
ToolbarContext automatically wraps all save operations:

```typescript
// In ToolbarContext
const wrappedOnSave = useCallback(
  async (showModal: boolean) => {
    try {
      // Execute original save operation
      await originalOnSave(showModal);
      
      // If save succeeded and this tab has parents, trigger parent refreshes
      if (tab?.tabLevel && tab.tabLevel > 0) {
        await triggerParentRefreshes(tab.tabLevel);
      }
    } catch (error) {
      // If save fails, don't trigger parent refreshes
      throw error;
    }
  },
  [originalOnSave, tab?.tabLevel, triggerParentRefreshes]
);
```

## Error Handling and Edge Cases

### Handled Scenarios

1. **Save Operation Fails**: No parent refreshes are triggered
2. **Delete Operation Fails**: No parent refreshes are triggered
3. **Parent Refresh Fails**: Logs warning, continues with remaining parents
4. **Missing Parent Tab**: Gracefully handles missing refresh callbacks
5. **Rapid Operations**: Each operation triggers its own refresh cycle
6. **Component Unmounting**: Properly cleans up registered callbacks
7. **Level 0 Operations**: No parent refreshes (level 0 has no parents)
8. **Multiple Registrations**: ToolbarContext wrapping works regardless of registration order
9. **Missing Tab Context**: Gracefully handles cases where tab context is unavailable

### Error Messages and Logging

- `TabRefreshContext: Registered refresh for level {N}` - Debug: Successful registration
- `TabRefreshContext: Unregistered refresh for level {N}` - Debug: Successful unregistration
- `TabRefreshContext: Starting parent refreshes for level {N}` - Debug: Refresh cycle started
- `TabRefreshContext: Refreshing parent level {N}` - Debug: Individual parent refresh
- `TabRefreshContext: Successfully refreshed parent level {N}` - Debug: Successful parent refresh
- `TabRefreshContext: Failed to refresh parent tab at level {N}:` - Warning: Parent refresh failed
- `TabRefreshContext: No refresh callback found for level {N}` - Debug: Parent tab not registered
- `TabRefreshContext: No parent levels to refresh` - Debug: Level 0 operation
- `TabRefreshContext: Completed parent refreshes for level {N}` - Debug: Refresh cycle completed

## Performance Considerations

### Optimizations
- **Ref Storage**: Refresh callbacks stored in refs to avoid unnecessary re-renders
- **Sequential Execution**: Prevents race conditions and ensures data consistency
- **Error Isolation**: Failed refreshes don't block subsequent ones
- **Minimal Re-renders**: Context changes don't cause component re-renders

### Memory Management
- Automatic cleanup of refresh callbacks when tabs unmount
- No memory leaks from orphaned callback references
- Efficient Map-based storage for callback registry

## Testing Strategy

### Unit Tests
- **TabRefreshContext**: Tests registration, unregistration, and trigger functionality
- **ToolbarContext**: Tests save/delete wrapping and parent refresh integration
- **Tab Component**: Tests refresh callback registration lifecycle
- **useDeleteRecord**: Tests delete operation integration with parent refresh

### Integration Tests
- **Complete Save Flow**: Tests end-to-end save → parent refresh flow
- **Complete Delete Flow**: Tests end-to-end delete → parent refresh flow
- **Error Scenarios**: Tests error handling and recovery
- **Edge Cases**: Tests rapid operations, missing parents, mixed operations

## Backward Compatibility

### No Breaking Changes
- Existing tab components work without modification
- Existing save/delete operations automatically benefit from parent refresh
- All APIs remain unchanged
- No migration required for existing code

### Automatic Integration
- New functionality is additive and works automatically
- No configuration required
- Existing toolbar actions continue to work as before
- Delete operations from any source automatically trigger parent refreshes

## Usage Examples

### Standard Tab Implementation
```typescript
// No changes needed - automatic integration
const MyTab = ({ tab }: { tab: Tab }) => {
  // Existing tab implementation works automatically
  return <TabContent tab={tab} />;
};
```

### Custom Refresh Logic
```typescript
const MyTabWithCustomRefresh = ({ tab }: { tab: Tab }) => {
  const { registerRefresh, unregisterRefresh } = useTabRefreshContext();
  
  const customRefresh = useCallback(async () => {
    // Custom refresh implementation
    await fetchSpecificData();
    updateCustomState();
  }, []);
  
  useEffect(() => {
    registerRefresh(tab.tabLevel, customRefresh);
    return () => unregisterRefresh(tab.tabLevel);
  }, [tab.tabLevel, customRefresh, registerRefresh, unregisterRefresh]);
  
  return <TabContent tab={tab} />;
};
```

## Monitoring and Debugging

### Debug Logging
Enable debug logging to monitor refresh operations:
```typescript
// In development
localStorage.setItem('debug', 'TabRefreshContext');
```

### Performance Monitoring
- Monitor refresh execution times in browser dev tools
- Track refresh success/failure rates
- Watch for excessive refresh operations

---

**Last Updated**: October 2, 2025  
**Status**: Implemented and tested
# Session Sync Integration Patterns

## Overview

This document describes integration patterns and best practices for using the table selection session synchronization feature in Etendo WorkspaceUI applications.

## Automatic Integration

### useTableSelection Hook Integration

The session sync functionality is automatically integrated into the `useTableSelection` hook. No additional configuration is required for standard table components.

#### Default Behavior

```typescript
// Standard table selection usage - session sync is automatic
function MyTableComponent() {
  const [rowSelection, setRowSelection] = useState({});
  const { tab, records } = useTableData();
  
  // Session sync happens automatically when rowSelection changes
  useTableSelection(tab, records, rowSelection, handleSelectionChange);
  
  return (
    <MaterialReactTable
      data={records}
      enableRowSelection
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
    />
  );
}
```

#### What Happens Automatically

1. **Selection Detection**: Hook detects changes in `rowSelection` state
2. **Debouncing**: Uses 150ms debounce to prevent excessive API calls
3. **Session Sync**: Automatically calls `syncSelectedRecordsToSession`
4. **Error Handling**: Errors are logged but don't affect UI functionality
5. **Session Update**: Frontend session context is updated with backend response

## Manual Integration

### Direct Session Sync Usage

For custom table implementations or non-standard use cases:

```typescript
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';
import { useUserContext } from '@/hooks/useUserContext';

function CustomTableComponent() {
  const { setSession } = useUserContext();
  const { tab } = useTabContext();
  
  const handleCustomSelection = async (selectedRecords) => {
    // Manual session sync call
    await syncSelectedRecordsToSession({
      tab,
      selectedRecords,
      setSession,
      parentId: getParentId() // optional
    });
    
    // Continue with custom logic
    handleUIUpdate(selectedRecords);
  };
  
  return <CustomTable onSelectionChange={handleCustomSelection} />;
}
```

### Conditional Session Sync

```typescript
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';

function ConditionalSyncComponent() {
  const { setSession, user } = useUserContext();
  const { tab } = useTabContext();
  
  const handleSelectionChange = async (selectedRecords) => {
    // Only sync for certain user roles or conditions
    if (user.hasPermission('MODIFY_SESSION') && selectedRecords.length > 0) {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
    }
  };
}
```

## Advanced Integration Patterns

### Batch Selection Processing

```typescript
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';
import { debounce } from '@/utils/debounce';

function BatchSelectionComponent() {
  const { setSession } = useUserContext();
  const { tab } = useTabContext();
  
  // Create debounced version for rapid selections
  const debouncedSessionSync = useCallback(
    debounce(async (selectedRecords) => {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
    }, 300), // 300ms debounce
    [tab, setSession]
  );
  
  const handleRapidSelectionChanges = (newSelection) => {
    updateUIImmediately(newSelection); // Fast UI update
    debouncedSessionSync(newSelection); // Debounced session sync
  };
}
```

### Error Recovery Pattern

```typescript
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';

function RobustSelectionComponent() {
  const { setSession } = useUserContext();
  const [syncStatus, setSyncStatus] = useState('idle');
  
  const handleSelectionWithFallback = async (selectedRecords) => {
    setSyncStatus('syncing');
    
    try {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
      
      // Fallback: Store selection locally
      localStorage.setItem('pendingSelection', JSON.stringify(selectedRecords));
      
      // Optional: Show user notification
      showNotification('Selection saved locally. Will sync when connection is restored.');
    }
  };
}
```

## Integration with Form Components

### Form-Table Integration

```typescript
function FormWithTableSelection() {
  const { setSession, session } = useUserContext();
  const { tab } = useTabContext();
  
  // Table selection automatically updates session
  const handleTableSelection = async (selectedRecords) => {
    await syncSelectedRecordsToSession({
      tab,
      selectedRecords,
      setSession
    });
    
    // Form automatically receives updated session data
    // through useUserContext
  };
  
  return (
    <>
      <FormComponent session={session} />
      <TableComponent onSelectionChange={handleTableSelection} />
    </>
  );
}
```

### Cross-Tab Session Sharing

```typescript
function MultiTabComponent() {
  const { setSession, session } = useUserContext();
  
  const handleSelectionInTabA = async (selectedRecords) => {
    await syncSelectedRecordsToSession({
      tab: tabAConfig,
      selectedRecords,
      setSession
    });
    // Session data now available in tabB
  };
  
  const handleSelectionInTabB = async (selectedRecords) => {
    await syncSelectedRecordsToSession({
      tab: tabBConfig,
      selectedRecords,
      setSession
    });
    // Combined session data from both tabs
  };
}
```

## Performance Optimization Patterns

### Selective Session Sync

```typescript
function OptimizedSelectionComponent() {
  const lastSyncRef = useRef(null);
  
  const shouldSync = (selectedRecords) => {
    const currentSelection = selectedRecords.map(r => r.id).sort().join(',');
    const changed = lastSyncRef.current !== currentSelection;
    
    if (changed) {
      lastSyncRef.current = currentSelection;
      return true;
    }
    return false;
  };
  
  const handleSelectionChange = async (selectedRecords) => {
    if (shouldSync(selectedRecords)) {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
    }
  };
}
```

### Lazy Session Sync

```typescript
function LazySyncComponent() {
  const [pendingSelection, setPendingSelection] = useState(null);
  
  const handleSelectionChange = (selectedRecords) => {
    // Update UI immediately
    updateSelectionUI(selectedRecords);
    
    // Store selection for later sync
    setPendingSelection(selectedRecords);
  };
  
  // Sync when user navigates away or performs action
  useEffect(() => {
    const syncOnUnload = () => {
      if (pendingSelection) {
        syncSelectedRecordsToSession({
          tab,
          selectedRecords: pendingSelection,
          setSession
        });
      }
    };
    
    window.addEventListener('beforeunload', syncOnUnload);
    return () => window.removeEventListener('beforeunload', syncOnUnload);
  }, [pendingSelection]);
}
```

## Testing Integration

### Mock Session Sync in Tests

```typescript
// In test setup
jest.mock('@/utils/hooks/useTableSelection/sessionSync', () => ({
  syncSelectedRecordsToSession: jest.fn().mockResolvedValue(undefined)
}));

// In test cases
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';

describe('Table Selection Integration', () => {
  it('should sync session when selection changes', async () => {
    const mockSetSession = jest.fn();
    const component = render(
      <TableComponent setSession={mockSetSession} />
    );
    
    // Simulate selection
    await selectTableRows(component, ['row1', 'row2']);
    
    // Verify session sync was called
    expect(syncSelectedRecordsToSession).toHaveBeenCalledWith({
      tab: expect.any(Object),
      selectedRecords: expect.arrayContaining([
        expect.objectContaining({ id: 'row1' }),
        expect.objectContaining({ id: 'row2' })
      ]),
      setSession: mockSetSession
    });
  });
});
```

## Error Handling Integration

### Component-Level Error Handling

```typescript
function ErrorAwareTableComponent() {
  const [sessionSyncError, setSessionSyncError] = useState(null);
  
  const handleSelectionChange = async (selectedRecords) => {
    try {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
      setSessionSyncError(null); // Clear previous errors
    } catch (error) {
      setSessionSyncError(error.message);
      // UI continues to work despite sync error
    }
  };
  
  return (
    <div>
      <Table onSelectionChange={handleSelectionChange} />
      {sessionSyncError && (
        <ErrorBanner message={`Session sync failed: ${sessionSyncError}`} />
      )}
    </div>
  );
}
```

### Global Error Handling

```typescript
// Error boundary for session sync issues
class SessionSyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    // Check if error is from session sync
    if (error.message.includes('session sync')) {
      return { hasError: true };
    }
    return null;
  }
  
  componentDidCatch(error, errorInfo) {
    // Log session sync errors
    console.error('Session sync error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Session sync temporarily unavailable. Table functionality continues normally.</div>;
    }
    
    return this.props.children;
  }
}
```

## Migration Patterns

### Gradual Integration

```typescript
// Feature flag for gradual rollout
function TableWithOptionalSessionSync() {
  const { setSession } = useUserContext();
  const isSessionSyncEnabled = useFeatureFlag('table-session-sync');
  
  const handleSelectionChange = async (selectedRecords) => {
    // Always update UI
    updateTableSelection(selectedRecords);
    
    // Conditionally sync session
    if (isSessionSyncEnabled) {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
    }
  };
}
```

### Legacy Component Upgrade

```typescript
// Backward-compatible upgrade of existing table
function UpgradedLegacyTable({ onSelectionChange, ...props }) {
  const { setSession } = useUserContext();
  const { tab } = useTabContext();
  
  const enhancedSelectionHandler = async (selectedRecords) => {
    // Call original handler first
    if (onSelectionChange) {
      onSelectionChange(selectedRecords);
    }
    
    // Add new session sync functionality
    if (selectedRecords.length > 0) {
      await syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession
      });
    }
  };
  
  return <LegacyTableComponent onSelectionChange={enhancedSelectionHandler} {...props} />;
}
```

## Best Practices

### 1. Always Handle Errors Gracefully

```typescript
// ✅ Good: Error handling that doesn't break UI
const handleSelection = async (records) => {
  try {
    await syncSelectedRecordsToSession({ tab, selectedRecords: records, setSession });
  } catch (error) {
    console.error('Session sync failed:', error);
    // UI continues to work
  }
};

// ❌ Bad: Letting errors propagate
const handleSelection = async (records) => {
  await syncSelectedRecordsToSession({ tab, selectedRecords: records, setSession }); // Can break UI
};
```

### 2. Use Debouncing for Rapid Changes

```typescript
// ✅ Good: Debounced session sync
const debouncedSync = debounce(syncSelectedRecordsToSession, 150);

// ❌ Bad: Sync on every change
const handleEveryChange = (records) => {
  syncSelectedRecordsToSession({ tab, selectedRecords: records, setSession });
};
```

### 3. Validate Input Data

```typescript
// ✅ Good: Validate before sync
const handleSelection = async (records) => {
  if (!tab || !records || !Array.isArray(records)) {
    console.warn('Invalid data for session sync');
    return;
  }
  
  await syncSelectedRecordsToSession({ tab, selectedRecords: records, setSession });
};
```

### 4. Provide User Feedback When Appropriate

```typescript
// ✅ Good: Optional user feedback for long operations
const handleLargeSelection = async (records) => {
  if (records.length > 100) {
    showLoadingIndicator('Syncing selection...');
  }
  
  try {
    await syncSelectedRecordsToSession({ tab, selectedRecords: records, setSession });
  } finally {
    hideLoadingIndicator();
  }
};
```

## Common Patterns Summary

1. **Automatic Integration**: Use standard `useTableSelection` hook
2. **Manual Integration**: Import and call `syncSelectedRecordsToSession` directly
3. **Error Handling**: Always handle errors gracefully without breaking UI
4. **Performance**: Use debouncing for rapid selection changes
5. **Testing**: Mock session sync functions in unit tests
6. **Migration**: Gradual integration with feature flags
7. **Validation**: Validate input data before attempting sync
8. **User Experience**: Provide feedback for long operations when appropriate

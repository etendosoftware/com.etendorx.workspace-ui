# useFormInitialization Hook Documentation

## Overview

The `useFormInitialization` hook manages form initialization state and data fetching for Etendo forms. It handles form data loading, session synchronization, and provides loading state management for better user experience.

## Location

- **Hook**: `packages/MainUI/hooks/useFormInitialization.ts`
- **Utils**: `packages/MainUI/utils/hooks/useFormInitialization/utils.ts`
- **Types**: `packages/MainUI/utils/hooks/useFormInitialization/types.ts`

## Key Features

- **Form Data Initialization**: Loads and processes form data from ERP backend
- **Session Synchronization**: Manages ERP session attributes during form operations
- **Loading State Management**: Provides loading feedback during async operations
- **Error Handling**: Comprehensive error management with user feedback
- **Parent Record Integration**: Handles parent-child record relationships

## Loading State Management

The hook now manages session sync loading state during fetch operations to provide better user feedback.

### Interface

```typescript
interface FormInitializationReturn {
  // Data properties
  auxiliaryInputValues: AuxiliaryInputValues;
  columnValues: ColumnValues;
  dynamicCols: DynamicColumn[];
  attachmentExists: boolean;
  
  // State properties
  loading: boolean;
  error: Error | null;
  
  // Methods
  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface FormInitializationParams {
  tab: Tab;
  mode: FormMode;
  recordId: string | null;
  parentId?: string | null;
}
```

### Implementation Details

```typescript
export function useFormInitialization({ 
  tab, 
  mode, 
  recordId, 
  parentId 
}: FormInitializationParams): FormInitializationReturn {
  const { setSession, setSessionSyncLoading } = useUserContext();
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetch = useCallback(async () => {
    if (!params) return;

    try {
      // Set loading state for UI feedback
      setSessionSyncLoading(true);
      
      const entityKeyColumn = findEntityKeyColumn(tab.fields);
      if (!entityKeyColumn) {
        throw new Error("Missing key column");
      }

      // Build payload and fetch data
      const payload = buildFormInitializationPayload(
        tab, 
        mode, 
        parentData, 
        entityKeyColumn
      );
      
      const data: FormInitializationResponse = await fetchFormInitialization(
        params, 
        payload
      );

      // Process and enrich data
      const enrichedData = enrichWithAuditFields(data, record, mode);
      const storedInSessionAttributes = buildSessionAttributes(enrichedData);

      // Update session with new attributes
      setSession((prev) => ({
        ...prev,
        ...storedInSessionAttributes,
      }));

      // Update local state
      dispatch({ type: "FETCH_SUCCESS", payload: enrichedData });
      
    } catch (err) {
      logger.warn(err);
      dispatch({ 
        type: "FETCH_ERROR", 
        payload: err instanceof Error ? err : new Error("Unknown error") 
      });
    } finally {
      // Always reset loading state
      setSessionSyncLoading(false);
    }
  }, [
    mode, 
    params, 
    parentData, 
    setSession, 
    setSessionSyncLoading, 
    tab, 
    record
  ]);

  // Refetch method
  const refetch = useCallback(async () => {
    await fetch();
  }, [fetch]);

  return {
    ...state,
    fetch,
    refetch,
  };
}
```

## Usage Examples

### Basic Form Initialization

```typescript
import { useFormInitialization } from '@/hooks/useFormInitialization';
import { FormMode } from '@workspaceui/api-client/src/api/types';

function FormComponent({ tab, recordId }: FormComponentProps) {
  const {
    auxiliaryInputValues,
    columnValues,
    loading,
    error,
    fetch,
    refetch
  } = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  useEffect(() => {
    if (recordId) {
      fetch();
    }
  }, [recordId, fetch]);

  if (loading) {
    return <FormSkeleton />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return (
    <Form
      auxiliaryInputValues={auxiliaryInputValues}
      columnValues={columnValues}
    />
  );
}
```

### New Record Mode

```typescript
function NewRecordForm({ tab }: { tab: Tab }) {
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.NEW,
    recordId: null,
  });

  useEffect(() => {
    // Initialize form for new record
    formInit.fetch();
  }, []);

  return <FormFields {...formInit} />;
}
```

### Parent-Child Relationship

```typescript
function ChildForm({ tab, parentId }: ChildFormProps) {
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.NEW,
    recordId: null,
    parentId, // Parent record ID
  });

  useEffect(() => {
    if (parentId) {
      formInit.fetch();
    }
  }, [parentId]);

  return <FormFields {...formInit} />;
}
```

### Loading State Integration

```typescript
function FormWithLoadingState({ tab, recordId }: FormProps) {
  const { isSessionSyncLoading } = useUserContext();
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  const isLoading = formInit.loading || isSessionSyncLoading;

  return (
    <div>
      {isLoading && <LoadingOverlay />}
      <FormFields {...formInit} disabled={isLoading} />
    </div>
  );
}
```

### Manual Refetch

```typescript
function FormWithRefresh({ tab, recordId }: FormProps) {
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  const handleRefresh = async () => {
    try {
      await formInit.refetch();
      showSuccessToast('Form data refreshed');
    } catch (error) {
      showErrorToast('Failed to refresh form data');
    }
  };

  return (
    <div>
      <button onClick={handleRefresh}>
        Refresh Data
      </button>
      <FormFields {...formInit} />
    </div>
  );
}
```

## Advanced Usage

### Error Handling

```typescript
function FormWithErrorHandling({ tab, recordId }: FormProps) {
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        await formInit.fetch();
      } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
          showErrorToast('You do not have permission to access this record');
          navigate('/dashboard');
        } else if (error.code === 'RECORD_NOT_FOUND') {
          showErrorToast('Record not found');
          navigate(-1);
        } else {
          showErrorToast('Failed to load form data');
        }
      }
    };

    if (recordId) {
      initializeForm();
    }
  }, [recordId]);

  // Rest of component
}
```

### Performance Optimization

```typescript
function OptimizedForm({ tab, recordId }: FormProps) {
  const formInit = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  // Memoize expensive computations
  const processedData = useMemo(() => {
    return processFormData(formInit.auxiliaryInputValues);
  }, [formInit.auxiliaryInputValues]);

  // Debounce refetch calls
  const debouncedRefetch = useMemo(
    () => debounce(formInit.refetch, 300),
    [formInit.refetch]
  );

  return <FormFields data={processedData} onRefetch={debouncedRefetch} />;
}
```

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFormInitialization } from '@/hooks/useFormInitialization';
import { useUserContext } from '@/hooks/useUserContext';

jest.mock('@/hooks/useUserContext');
const mockUseUserContext = jest.mocked(useUserContext);

describe('useFormInitialization', () => {
  beforeEach(() => {
    mockUseUserContext.mockReturnValue({
      setSession: jest.fn(),
      setSessionSyncLoading: jest.fn(),
      // ... other properties
    });
  });

  test('should set loading state during fetch operation', async () => {
    const mockSetSessionSyncLoading = jest.fn();
    mockUseUserContext.mockReturnValue({
      setSession: jest.fn(),
      setSessionSyncLoading: mockSetSessionSyncLoading,
    });

    const { result } = renderHook(() => useFormInitialization({
      tab: mockTab,
      mode: FormMode.EDIT,
      recordId: '123',
    }));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(true);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(false);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledTimes(2);
  });

  test('should reset loading state on error', async () => {
    const mockSetSessionSyncLoading = jest.fn();
    
    // Mock fetch to throw error
    jest.mocked(fetchFormInitialization).mockRejectedValueOnce(
      new Error('Test error')
    );

    const { result } = renderHook(() => useFormInitialization({
      tab: mockTab,
      mode: FormMode.EDIT,
      recordId: '123',
    }));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(false);
  });
});
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { useFormInitialization } from '@/hooks/useFormInitialization';

function TestComponent({ recordId }: { recordId: string }) {
  const formInit = useFormInitialization({
    tab: mockTab,
    mode: FormMode.EDIT,
    recordId,
  });

  useEffect(() => {
    formInit.fetch();
  }, []);

  return (
    <div>
      {formInit.loading && <div data-testid="loading">Loading...</div>}
      {formInit.error && <div data-testid="error">{formInit.error.message}</div>}
      {!formInit.loading && !formInit.error && (
        <div data-testid="success">Form loaded</div>
      )}
    </div>
  );
}

describe('useFormInitialization Integration', () => {
  test('should handle complete form initialization workflow', async () => {
    render(<TestComponent recordId="123" />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
```

## Best Practices

### Loading State Management

1. **Always Reset in Finally Block**
   ```typescript
   try {
     setSessionSyncLoading(true);
     await fetchData();
   } finally {
     setSessionSyncLoading(false); // Always reset
   }
   ```

2. **Handle Multiple Loading States**
   ```typescript
   const isLoading = formInit.loading || isSessionSyncLoading;
   ```

3. **Provide User Feedback**
   ```typescript
   if (isSessionSyncLoading) {
     return <div>Synchronizing session...</div>;
   }
   ```

### Error Handling

1. **Specific Error Messages**
   ```typescript
   if (error?.code === 'VALIDATION_ERROR') {
     return <ValidationErrorMessage errors={error.details} />;
   }
   ```

2. **Retry Mechanisms**
   ```typescript
   const handleRetry = () => {
     formInit.refetch();
   };
   ```

### Performance

1. **Memoize Dependencies**
   ```typescript
   const params = useMemo(() => 
     buildFormInitializationParams({ tab, mode, recordId, parentId }),
     [tab, mode, recordId, parentId]
   );
   ```

2. **Avoid Unnecessary Fetches**
   ```typescript
   useEffect(() => {
     if (recordId && !formInit.loading) {
       formInit.fetch();
     }
   }, [recordId]);
   ```

## Related Hooks

- [useUserContext](../contexts/user-context.md) - For session and loading state management
- [useTableSelection](./useTableSelection.md) - For table selection and sync operations
- [useTabContext](./useTabContext.md) - For tab-related data and state

## Related Documentation

- [Form Initialization Utils](../utilities/form-initialization-utils.md)
- [Session Sync](../utilities/session-sync.md)
- [Toolbar Component](../components/toolbar.md)

## Migration Guide

For upgrading existing code to use the new loading state features, see the [Migration Guide](../migration/form-initialization-loading-state.md).
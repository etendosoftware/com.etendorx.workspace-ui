# UserContext Documentation

## Overview

The UserContext is the central state management system for user-related data in the Etendo WorkspaceUI. It provides authentication state, session management, and coordination of user-related operations across the application.

## Location

- **Context Definition**: `packages/MainUI/contexts/user.tsx`
- **Type Definitions**: `packages/MainUI/contexts/types.ts`
- **Hook**: `packages/MainUI/hooks/useUserContext.tsx`

## Core Features

- **User Authentication**: Login/logout state and user information
- **Session Management**: ERP session data synchronization
- **Role Management**: User roles and permissions
- **Profile Management**: User profile and preferences
- **Session Sync Loading State**: Loading state for session synchronization operations

## Session Sync Loading State

The UserContext now provides session synchronization loading state management to improve user experience during async operations.

### Interface Definition

```typescript
interface IUserContext {
  // ... existing properties
  isSessionSyncLoading: boolean;
  setSessionSyncLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
```

### Implementation

```typescript
export default function UserProvider(props: React.PropsWithChildren) {
  // ... existing state
  const [isSessionSyncLoading, setSessionSyncLoading] = useState(false);

  const value = useMemo<IUserContext>(
    () => ({
      // ... existing properties
      isSessionSyncLoading,
      setSessionSyncLoading,
    }),
    [
      // ... existing dependencies
      isSessionSyncLoading,
    ]
  );

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>;
}
```

### Usage Patterns

#### Basic Usage

```typescript
import { useUserContext } from '@/hooks/useUserContext';

function MyComponent() {
  const { isSessionSyncLoading, setSessionSyncLoading } = useUserContext();

  const handleOperation = async () => {
    try {
      setSessionSyncLoading(true);
      
      // Perform session sync operation
      await performSessionSync();
      
    } catch (error) {
      console.error('Session sync failed:', error);
    } finally {
      setSessionSyncLoading(false);
    }
  };

  if (isSessionSyncLoading) {
    return <LoadingSpinner />;
  }

  return (
    <button onClick={handleOperation}>
      Start Session Sync
    </button>
  );
}
```

#### Conditional Rendering

```typescript
function ProcessButton() {
  const { isSessionSyncLoading } = useUserContext();

  return (
    <button disabled={isSessionSyncLoading}>
      {isSessionSyncLoading ? 'Syncing...' : 'Execute Process'}
    </button>
  );
}
```

#### Multiple Operations Coordination

```typescript
function DataManager() {
  const { isSessionSyncLoading, setSessionSyncLoading } = useUserContext();

  const handleFormInit = async () => {
    setSessionSyncLoading(true);
    try {
      await initializeForm();
    } finally {
      setSessionSyncLoading(false);
    }
  };

  const handleTableSync = async () => {
    setSessionSyncLoading(true);
    try {
      await syncTableSelection();
    } finally {
      setSessionSyncLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleFormInit} disabled={isSessionSyncLoading}>
        Initialize Form
      </button>
      <button onClick={handleTableSync} disabled={isSessionSyncLoading}>
        Sync Selection
      </button>
      {isSessionSyncLoading && <div>Operation in progress...</div>}
    </div>
  );
}
```

### Integration with Hooks

The loading state integrates seamlessly with existing hooks:

#### useFormInitialization Integration

```typescript
export function useFormInitialization({ tab, mode, recordId }: FormInitializationParams) {
  const { setSession, setSessionSyncLoading } = useUserContext();

  const fetch = useCallback(async () => {
    if (!params) return;

    try {
      setSessionSyncLoading(true);
      
      // Form initialization logic
      const data = await fetchFormInitialization(params, payload);
      
      // Update session
      setSession((prev) => ({
        ...prev,
        ...sessionAttributes,
      }));
      
    } catch (error) {
      // Error handling
    } finally {
      setSessionSyncLoading(false);
    }
  }, [setSession, setSessionSyncLoading, /* other deps */]);

  return { fetch, /* other returns */ };
}
```

#### useTableSelection Integration

```typescript
export function useTableSelection(tab, records, rowSelection) {
  const { setSession, setSessionSyncLoading } = useUserContext();

  const syncToSession = useCallback(async (selectedRecords) => {
    await syncSelectedRecordsToSession({
      tab,
      selectedRecords,
      setSession,
      setSessionSyncLoading, // Passed to sync function
    });
  }, [tab, setSession, setSessionSyncLoading]);

  // Rest of hook implementation
}
```

## Complete UserContext API

### State Properties

```typescript
interface IUserContext {
  // User Authentication
  user: User | undefined;
  token: string | undefined;
  
  // Session Management
  session: ISession;
  setSession: (updater: (prev: ISession) => ISession) => void;
  
  // Loading States
  isSessionSyncLoading: boolean;
  setSessionSyncLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Role Management
  roles: Role[];
  currentRole: Role | undefined;
  prevRole: Role | undefined;
  
  // Profile Management
  profile: UserProfile;
  
  // Organization & Client
  currentWarehouse: Warehouse | undefined;
  currentClient: Client | undefined;
  currentOrganization: Organization | undefined;
  
  // Languages
  languages: Language[];
  
  // Methods
  login: (credentials: LoginCredentials) => Promise<void>;
  changeProfile: (profile: Partial<UserProfile>) => void;
  setToken: (token: string) => void;
  clearUserData: () => void;
  setDefaultConfiguration: (config: DefaultConfiguration) => void;
}
```

### Provider Setup

The UserProvider should wrap your application root:

```typescript
import UserProvider from '@/contexts/user';

function App() {
  return (
    <UserProvider>
      <YourAppContent />
    </UserProvider>
  );
}
```

## Testing UserContext

### Mock Setup

```typescript
import { useUserContext } from '@/hooks/useUserContext';

// Mock the hook
jest.mock('@/hooks/useUserContext');
const mockUseUserContext = jest.mocked(useUserContext);

// Setup mock return value
const mockUserContextValue = {
  user: mockUser,
  session: mockSession,
  isSessionSyncLoading: false,
  setSessionSyncLoading: jest.fn(),
  // ... other properties
};

beforeEach(() => {
  mockUseUserContext.mockReturnValue(mockUserContextValue);
});
```

### Testing Loading State

```typescript
describe('UserContext Session Sync Loading', () => {
  test('should provide session sync loading state', () => {
    const TestComponent = () => {
      const { isSessionSyncLoading, setSessionSyncLoading } = useUserContext();
      
      return (
        <div>
          <span data-testid="loading-state">
            {isSessionSyncLoading ? 'Loading' : 'Not Loading'}
          </span>
          <button 
            data-testid="set-loading" 
            onClick={() => setSessionSyncLoading(true)}
          >
            Set Loading
          </button>
        </div>
      );
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    
    fireEvent.click(screen.getByTestId('set-loading'));
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
  });
});
```

### Integration Testing

```typescript
describe('UserContext Integration', () => {
  test('should coordinate loading state across components', () => {
    const Component1 = () => {
      const { setSessionSyncLoading } = useUserContext();
      return (
        <button onClick={() => setSessionSyncLoading(true)}>
          Start Loading
        </button>
      );
    };

    const Component2 = () => {
      const { isSessionSyncLoading } = useUserContext();
      return (
        <div data-testid="loading-indicator">
          {isSessionSyncLoading ? 'Loading...' : 'Ready'}
        </div>
      );
    };

    render(
      <UserProvider>
        <Component1 />
        <Component2 />
      </UserProvider>
    );

    fireEvent.click(screen.getByText('Start Loading'));
    
    expect(screen.getByTestId('loading-indicator')).toHaveTextContent('Loading...');
  });
});
```

## Best Practices

### Loading State Management

1. **Always Reset in Finally Block**
   ```typescript
   try {
     setSessionSyncLoading(true);
     await operation();
   } catch (error) {
     handleError(error);
   } finally {
     setSessionSyncLoading(false); // Always reset
   }
   ```

2. **Check Loading State Before Operations**
   ```typescript
   const handleOperation = async () => {
     if (isSessionSyncLoading) {
       return; // Prevent concurrent operations
     }
     
     // Proceed with operation
   };
   ```

3. **Use Loading State for UI Feedback**
   ```typescript
   <button disabled={isSessionSyncLoading}>
     {isSessionSyncLoading ? 'Processing...' : 'Submit'}
   </button>
   ```

### Performance Optimization

1. **Memoize Context Value**
   - The UserProvider already memoizes the context value
   - Include all dependencies in the dependency array

2. **Minimize State Updates**
   - Batch related state updates when possible
   - Use functional updates for complex state changes

3. **Avoid Unnecessary Re-renders**
   - Split context if it becomes too large
   - Use React.memo for expensive child components

## Error Handling

### Loading State Errors

```typescript
const handleOperationWithError = async () => {
  try {
    setSessionSyncLoading(true);
    
    const result = await riskyOperation();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('Operation failed:', error);
    // Show user-friendly error message
    showErrorToast('Operation failed. Please try again.');
  } finally {
    setSessionSyncLoading(false); // Always reset
  }
};
```

## Related Documentation

- [Toolbar Component](../components/toolbar.md)
- [Form Initialization Hook](../hooks/useFormInitialization.md)
- [Table Selection Hook](../hooks/useTableSelection.md)
- [Session Sync Utilities](../utilities/session-sync.md)

## Migration Guide

For upgrading existing code to use the new loading state features, see the [Migration Guide](../migration/user-context-loading-state.md).
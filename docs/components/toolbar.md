# Toolbar Component Documentation

## Overview

The Toolbar component is the main navigation and action bar for the Etendo WorkspaceUI. It provides quick access to various operations including record management, process execution, and search functionality.

## Location

- **Component**: `packages/MainUI/components/Toolbar/Toolbar.tsx`
- **Utils**: `packages/MainUI/utils/toolbar/process-button/utils.tsx`
- **Sections**: `packages/MainUI/components/Toolbar/ToolbarSection/`

## Key Features

- **Process Button**: Available Process button for executing business processes
- **Record Management**: New, Save, Delete, and Copy actions
- **Search Integration**: Global search functionality
- **Form Navigation**: Form view specific actions
- **Session Sync Loading**: Real-time loading states during session operations

## Process Button Loading State

The Available Process button in the toolbar displays a loading state during session synchronization operations, providing better user feedback for async operations.

### Visual States

- **Loading State**: 
  - Shows "Loading..." text 
  - Button is disabled
  - Loading indicator visible
  
- **Normal State**: 
  - Shows "Processes" text 
  - Button is enabled (when record is selected)
  - Fully interactive

### Triggers for Loading State

1. **Form Initialization**: When `useFormInitialization` hook's `fetch` function executes
2. **Table Selection Sync**: When `syncSelectedRecordsToSession` function executes
3. **Manual Refetch**: When user triggers data refetch operations

### Technical Implementation

The loading state is managed through the `UserContext`:

```typescript
const ToolbarCmp: React.FC<ToolbarProps> = ({ windowId, isFormView = false }) => {
  const { isSessionSyncLoading } = useUserContext();
  
  const toolbarConfig = useMemo(() => {
    // ... existing configuration
    
    const config = {
      ...baseConfig,
      processButton:
        processButtons.length > 0
          ? createProcessMenuButton(
              processButtons.length,
              hasSelectedRecord,
              handleMenuToggle,
              t,
              anchorEl,
              isSessionSyncLoading // Loading state passed here
            )
          : undefined,
    };
    
    return config;
  }, [
    // ... other dependencies
    isSessionSyncLoading, // Loading state as dependency
  ]);
};
```

### Process Button Configuration

The `createProcessMenuButton` function accepts a loading parameter:

```typescript
export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void,
  t: TranslateFunction,
  anchorEl: HTMLElement | null,
  isLoading = false // Loading state parameter
): ProcessAvailableButton => ({
  key: "process-menu",
  leftIcon: <ProcessIcon width="1rem" height="1rem" />,
  rightIcon: <ChevronDownIcon width="1rem" height="1rem" />,
  text: isLoading ? t("common.loading") : t("common.processes"),
  anchorEl: anchorEl,
  disabled: !hasSelectedRecord || isLoading, // Disabled when loading
  customContainerStyles: getProcessButtonStyles(anchorEl),
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
```

## Usage Examples

### Basic Toolbar Implementation

```typescript
import { Toolbar } from '@/components/Toolbar/Toolbar';

function WindowView({ windowId }: { windowId: string }) {
  return (
    <div>
      <Toolbar windowId={windowId} />
      {/* Rest of your content */}
    </div>
  );
}
```

### Form View Toolbar

```typescript
import { Toolbar } from '@/components/Toolbar/Toolbar';

function FormView({ windowId }: { windowId: string }) {
  return (
    <div>
      <Toolbar windowId={windowId} isFormView={true} />
      {/* Form content */}
    </div>
  );
}
```

### Accessing Loading State

If you need to access the loading state in other components:

```typescript
import { useUserContext } from '@/contexts/user';

function MyComponent() {
  const { isSessionSyncLoading } = useUserContext();
  
  if (isSessionSyncLoading) {
    return <div>Session synchronization in progress...</div>;
  }
  
  return <div>Ready for user interaction</div>;
}
```

## Component Architecture

### Main Components

- **Toolbar**: Main container component
- **TopToolbar**: Layout component for toolbar sections
- **ToolbarSection**: Individual section renderer
- **ProcessMenu**: Dropdown menu for available processes

### State Management

- **Loading State**: Managed via UserContext
- **Process Selection**: Local state management
- **Button Configuration**: Memoized configuration object

### Event Handling

- **Process Button Click**: Opens process selection menu
- **Action Button Click**: Executes respective actions
- **Search Integration**: Triggers search modal

## Testing

### Unit Tests

```typescript
// Testing loading state
describe('Toolbar Process Button Loading', () => {
  test('should show loading state during session sync', () => {
    const mockUserContext = {
      isSessionSyncLoading: true,
      setSessionSyncLoading: jest.fn(),
    };

    jest.mocked(useUserContext).mockReturnValue(mockUserContext);

    render(<Toolbar windowId="test-window" />);

    const processButton = screen.getByTestId('process-button');
    expect(processButton).toHaveTextContent('Loading...');
    expect(processButton).toBeDisabled();
  });
});
```

### Integration Tests

```typescript
// Testing complete workflow
describe('Toolbar Integration', () => {
  test('should handle selection sync with loading state', async () => {
    // Setup user context with loading capability
    // Trigger table selection
    // Verify loading state appears
    // Wait for sync completion
    // Verify loading state disappears
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Toolbar configuration is memoized to prevent unnecessary re-renders
2. **State Isolation**: Loading state changes only trigger relevant component updates
3. **Debounced Operations**: Session sync operations are debounced to prevent excessive calls

### Best Practices

- Always include loading state dependencies in `useMemo` dependencies
- Use the centralized `UserContext` for loading state management
- Implement proper error handling to ensure loading state resets

## Accessibility

### ARIA Attributes

- Loading buttons have appropriate `aria-disabled` attributes
- Loading state is announced to screen readers
- Keyboard navigation remains functional during loading

### Focus Management

- Focus is preserved during loading state transitions
- Tab order remains logical when buttons are disabled

## Browser Support

The Toolbar component supports all modern browsers with React 18+ compatibility.

## Related Components

- [Process Menu](./process-menu.md)
- [UserContext](../contexts/user-context.md)
- [Session Sync](../hooks/useFormInitialization.md)

## Migration Guide

See [Migration Guide](../migration/toolbar-loading-state.md) for upgrading existing implementations.
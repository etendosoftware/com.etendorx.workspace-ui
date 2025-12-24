# Linked Items - Open Window Feature

## Overview

The **Linked Items Open Window** feature enables users to open related records in new windows directly from the Linked Items section. This provides seamless navigation between related entities while maintaining full context and state.

## Architecture

This feature leverages the **URL-driven recovery system** instead of duplicating state calculation logic, ensuring consistency and maintainability.

### Key Components

1. **LinkedItemsSection** (`packages/MainUI/components/Form/FormView/Sections/LinkedItemsSection.tsx`)
   - Handles user clicks on linked items
   - Triggers recovery mechanism
   - Updates URL with new window parameters

2. **useGlobalUrlStateRecovery** (`packages/MainUI/hooks/useGlobalUrlStateRecovery.ts`)
   - Orchestrates window recovery from URL parameters
   - Fetches metadata and reconstructs window state
   - Provides `triggerRecovery()` function to reset guard

3. **WindowProvider** (`packages/MainUI/contexts/window.tsx`)
   - Manages window state globally
   - Syncs state to URL automatically
   - Exposes recovery state and controls

4. **appendWindowToUrl** (`packages/MainUI/utils/url/utils.ts`)
   - Utility to append new window parameters to URL
   - Finds next available index
   - Preserves existing windows

## Flow Diagram

```
User clicks Linked Item
    ↓
LinkedItemsSection.handleItemClick()
    ↓
1. Check isRecoveryLoading (prevent multiple clicks)
    ↓
2. Generate new window identifier (windowId_timestamp)
    ↓
3. Call triggerRecovery() [Resets hasRun guard]
    ↓
4. Build URL with appendWindowToUrl(currentParams, newWindow)
    ↓
5. router.replace(`window?${newUrlParams}`)
    ↓
useGlobalUrlStateRecovery detects URL change
    ↓
6. Parse all window parameters from URL
    ↓
7. For new window: Fetch metadata
    ↓
8. Calculate tab hierarchy (bottom-up)
    ↓
9. Query parent records and reconstruct state
    ↓
10. Create WindowState with all tabs configured
    ↓
11. Set new window as active (highest index)
    ↓
WindowProvider receives recoveredWindows
    ↓
12. Update state, trigger re-render
    ↓
13. Window component displays new window with record
```

## URL Parameter Format

```
/window?wi_0={windowId}_{timestamp}&ti_0={tabId}&ri_0={recordId}&wi_1=...

Parameters:
- wi_N: Window identifier (unique instance)
  Format: {windowId}_{timestamp}
  Example: 143_1732640000

- ti_N: Tab identifier (deepest tab with selection)
  Format: {tabId}
  Example: LocationTab

- ri_N: Record identifier (selected record)
  Format: {recordId}
  Example: 2000015

Index N:
- Starts at 0
- Increments for each window
- Last index (highest N) is active window
```

## Example Scenario

**Use Case**: User viewing Business Partner record wants to open a related Location

1. **Initial State**:
   ```
   URL: /window?wi_0=143_1732640000&ti_0=BPartnerTab&ri_0=1000001
   Windows: [Business Partner #1000001]
   ```

2. **User Action**: Click on Location "New York Office" in Linked Items section

3. **Updated URL**:
   ```
   /window?wi_0=143_1732640000&ti_0=BPartnerTab&ri_0=1000001&wi_1=144_1732640500&ti_1=LocationTab&ri_1=2000015
   ```

4. **Recovery Process**:
   - Window 0: Business Partner (already loaded, unchanged)
   - Window 1: Location (new window)
     - Fetch window 144 metadata
     - Calculate hierarchy: LocationTab → BPartnerTab (parent)
     - Query Business Partner record (already selected: 1000001)
     - Query Location record (2000015)
     - Build complete window state with both tabs

5. **Result**: Two windows open, Location window active, showing record 2000015

## Edge Cases Handled

### 1. Multiple Rapid Clicks
**Protection**: Loading state guard prevents clicks during recovery
```typescript
if (isRecoveryLoading) return;
```

### 2. Deleted Records
**Handling**: Recovery system catches datasource errors and displays error message

### 3. Permission Errors
**Handling**: Backend returns 403, recovery system propagates error to UI

### 4. Network Failures
**Handling**: Recovery system catch block sets `recoveryError` state

### 5. Deep Tab Hierarchies
**Handling**: `calculateHierarchy` supports any tab level (0, 1, 2, ...)

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Click to Loading | < 50ms | Immediate UI feedback |
| Metadata Fetch | ~200ms | Cached if previously loaded |
| Hierarchy Calculation | ~20ms | Bottom-up algorithm |
| Per-Parent Query | ~200ms | Database query time |
| Total Recovery (Level 1) | ~420ms | One parent tab |
| Total Recovery (Level 2) | ~620ms | Two parent tabs |

**Optimization**: Multiple windows recover in parallel using `Promise.all()`

## Testing

Comprehensive test coverage includes:
- **useGlobalUrlStateRecovery**: 20 test cases (520 lines)
- **appendWindowToUrl**: 23 test cases (380 lines)
- **LinkedItemsSection**: 26 test cases (420 lines)

See individual test files for detailed coverage.

## Future Enhancements

1. **Optimistic UI**: Show window immediately with placeholder, update when ready
2. **Progress Indicator**: Show detailed steps ("Loading metadata...", "Loading records...")
3. **Background Opening**: `Ctrl+Click` to open without switching focus
4. **Retry Mechanism**: Automatic retry with exponential backoff on network errors
5. **URL Cleanup**: Remove failed window parameters on error
6. **Deep Link Validation**: Pre-validate URLs before attempting recovery

## Related Documentation

- [TDD: Linked Items Open Window](/TDD-LINKED-ITEMS-OPEN-WINDOW.md) - Comprehensive technical design
- [URL State Recovery](/docs/architecture/url-state-recovery.md) - Recovery system architecture
- [Window Management](/docs/architecture/window-management.md) - Window context and state
- [Testing Strategy](/docs/testing/linked-items-testing.md) - Test approach and coverage

## Maintenance Notes

- **No Manual State Calculation**: Always use URL-driven recovery, never duplicate hierarchy logic
- **Guard Management**: Only reset via `triggerRecovery()`, never manipulate `hasRun` directly
- **URL Building**: Use `appendWindowToUrl()` utility, don't build URLs manually
- **Error Handling**: Rely on recovery system's error handling, don't add duplicate error logic
- **Performance**: Recovery is already optimized with parallel execution and metadata caching

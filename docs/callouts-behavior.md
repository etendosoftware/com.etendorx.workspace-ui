# Fo## Execution Model

- User-triggered: A callout runs only when the user changes a field value. The change is captured in the selector and `useCallout` builds a payload with the current form context.
- Single-flight queue: `GlobalCalloutManager` enqueues callouts and runs them sequentially per field to avoid overlapping work.
- Batch application: The response (`FormInitializationResponse`) can update many fields at once (`columnValues`, `auxiliaryInputValues`). These updates are applied as a single "batch" while callouts are globally suppressed. This prevents further callouts from firing as a side effect of each individual `setValue`.
- Resume: After the batch finishes, suppression is lifted so future user interactions can trigger callouts normally.

## Enhanced Save Button Integration

The Save button now uses an event-driven architecture for better performance and user feedback:

### Technical Decision: Why Event-Based Architecture?

**Problem Identified:**
The original polling-based approach had significant technical drawbacks:
- **Performance Impact**: 50ms polling intervals created ~20 CPU cycles per second per component
- **Scalability Issues**: Multiple form components polling simultaneously multiplied CPU overhead
- **Response Latency**: Maximum 50ms delay between callout state change and UI update
- **Resource Waste**: Continuous polling even when no callouts were running

**Solution Rationale:**
Event-driven architecture was chosen because:
1. **Zero Idle Overhead**: No CPU usage when callouts aren't running
2. **Instant Response**: UI updates immediately when callout state changes
3. **Scalable Architecture**: Multiple components can subscribe without multiplying overhead
4. **Industry Standard**: Event-driven patterns are proven in high-performance applications

### Event-Based Loading State (NEW)
The system subscribes to callout events for optimal performance:
- `calloutStart`: Button shows loading state immediately (0ms latency)
- `calloutEnd`: Button clears loading state when all callouts complete  
- `calloutProgress`: Optional progress feedback for long-running operations

### Implementation
```typescript
// Event-based monitoring (replaces polling)
useEffect(() => {
  const handleCalloutStart = () => {
    setSaveButtonState(prev => ({ ...prev, isCalloutLoading: true }));
  };

  const handleCalloutEnd = () => {
    setSaveButtonState(prev => ({ ...prev, isCalloutLoading: false }));
  };

  globalCalloutManager.on('calloutStart', handleCalloutStart);
  globalCalloutManager.on('calloutEnd', handleCalloutEnd);
  
  return () => {
    globalCalloutManager.off('calloutStart', handleCalloutStart);
    globalCalloutManager.off('calloutEnd', handleCalloutEnd);
  };
}, []);
```

### Performance Improvements
- **No Polling**: Eliminates 50ms polling intervals, reducing CPU usage
- **Instant Response**: Button state updates immediately on callout events
- **Memory Efficient**: Event listeners are properly cleaned up
- **Scalable**: Works efficiently with multiple concurrent callouts

### Client-Side Validation Integration

The Save button now includes client-side validation to improve user experience:

#### Required Field Validation
Before form submission, the system validates all mandatory fields:

```typescript
const handleSave = useCallback(async (showModal: boolean) => {
  // 1. Callout State Check - Prevent race conditions
  if (globalCalloutManager.isCalloutRunning()) {
    return; // Wait for callouts to complete
  }
  
  // 2. Required Fields Validation - Fail fast on predictable errors
  const validation = validateRequiredFields();
  if (!validation.isValid) {
    showErrorModal(validation.errorMessage);
    return;
  }
  
  // 3. Proceed with Save - Only after validation passes
  await save(showModal);
}, []);
```

#### Field Type-Aware Validation
- **String fields**: `value.trim() !== ''` - handles whitespace-only inputs
- **Reference fields**: Validates both value AND identifier - ensures complete reference data
- **Numeric fields**: Allows zero values - business logic requirement
- **Boolean fields**: Both true/false are valid - ensures proper selectionlouts: Execution Model and Data Flow

This document describes how form field callouts run, how results are applied without cascading side effects, and how select options get populated when the backend returns restricted entries.

## Execution Model

- User-triggered: A callout runs only when the user changes a field value. The change is captured in the selector and `useCallout` builds a payload with the current form context.
- Single-flight queue: `GlobalCalloutManager` enqueues callouts and runs them sequentially per field to avoid overlapping work.
- Batch application: The response (`FormInitializationResponse`) can update many fields at once (`columnValues`, `auxiliaryInputValues`). These updates are applied as a single “batch” while callouts are globally suppressed. This prevents further callouts from firing as a side effect of each individual `setValue`.
- Resume: After the batch finishes, suppression is lifted so future user interactions can trigger callouts normally.

## Data Application

- `columnValues`: For each item, the form sets both the value and its `${hqlName}$_identifier` when provided.
- `auxiliaryInputValues`: The form sets the raw value for auxiliary inputs.
- `entries` support: If the backend returns `entries` for a field, the form injects them into `${hqlName}$_entries`. The select hook (`useSelectFieldOptions`) will prefer these entries over remote datasource records for a consistent post-callout UI state.

## Post-Save Behavior

- After saving, the form applies the server-updated values using a short `isFormInitializing` window to silence callouts during `reset/setValue`. This avoids cascades or refetch loops immediately after a save.
- A redundant refetch after save is removed; the only refetch happens when `recordId` changes.

## APIs and Hooks

- `GlobalCalloutManager`
  - `executeCallout(fieldName, fn)`: queues and runs callouts sequentially.
  - `suppress()` / `resume()`: silence/resume callouts during batch application.
  - `isSuppressed()` / `isCalloutRunning()` / `arePendingCalloutsEmpty()`
  - **NEW**: `on(event, listener)` / `off(event, listener)`: event-based monitoring
  - **NEW**: `getState()`: comprehensive state information
- `BaseSelector`
  - Triggers callouts on user change.
  - Applies results in a suppressed batch (values + entries) to avoid cascades.
- `useSelectFieldOptions`
  - Builds select options from datasource records.
  - If `${hqlName}$_entries` exist, they take precedence (from callout response).
- **NEW**: `useFormValidation`
  - Client-side validation for required fields
  - Type-aware validation logic for different field types
  - Integration with display logic for conditional fields

## Debugging

- Set `DEBUG_CALLOUTS=true` (or `NEXT_PUBLIC_DEBUG_CALLOUTS=true`) in env, or `localStorage.setItem('DEBUG_CALLOUTS','true')` in the browser, to enable callout debug logs:
  - Trigger by user, executing/completed, suppress/resume, applying values.

## Tests

- `services/__tests__/callouts.manager.test.ts`: suppress/resume and queue ordering
- **NEW**: `services/__tests__/callouts.enhanced.test.ts`: event system testing
- `hooks/__tests__/useSelectFieldOptions.entries.test.tsx`: entries injection preferred
- **NEW**: `hooks/__tests__/useFormValidation.test.tsx`: client-side validation testing
- **NEW**: `contexts/__tests__/ToolbarContext.eventBased.test.tsx`: event-based integration
- `components/Form/FormView/selectors/__tests__/BaseSelector.callout.applyEntries.test.tsx`: end-to-end application of callout results without cascades
- **NEW**: `__tests__/integration/save-button-complete-flow.test.tsx`: complete flow integration


# URL State Recovery System

## Overview

The URL State Recovery system enables users to reload pages or share deep-link URLs without losing their window state. When a page loads with URL parameters, the system reconstructs the complete window state including tab hierarchy and record selections.

## How It Works

### URL Parameters

The system uses indexed URL parameters to store window state:

- `wi_N` - Window identifier (format: `{windowId}_{timestamp}`)
- `ti_N` - Target tab ID (deepest tab with selection)
- `ri_N` - Record ID of the selected record in target tab

**Example URL:**
```
/?wi_0=143_1732640000&ti_0=LocationTab&ri_0=2000015
```

This URL represents:
- Window instance `143_1732640000` (Business Partner window)
- Selected tab: `LocationTab` (level 1)
- Selected record: `2000015` (a specific location)

### Recovery Algorithm

The recovery process follows three main phases:

#### Phase 1: Parse URL
1. Extract window identifier, tab ID, and record ID from URL
2. Fetch window metadata from backend via `ComputeWindowActionHandler`
3. Validate tab exists in window metadata
4. Get tab level and title information

#### Phase 2: Calculate Hierarchy
1. Find target tab in metadata using tabId
2. Walk upward to root using `isParentRecordProperty` fields
3. Build parent chain: target → intermediate tabs → root
4. Store recordId from URL in target tab node
5. Extract parent key field names for each child-parent relationship

**Key Insight:** We store the **field KEY** (e.g., `"cBpartnerId"`) not field properties, because datasource responses use field keys to access data.

#### Phase 3: Reconstruct State (Bottom-Up)
1. Start with target tab's recordId (from URL)
2. For target tab: set form state with recordId
3. For each parent tab (moving upward):
   - Query child record to extract parent recordId
   - Assign calculated recordId to parent tab
   - Keep parent tabs in table mode (no form state)
4. Set navigation state with only target level active

**Critical:** Iteration must be **target → root** (bottom-up) because we only know the target's recordId from URL. Parent recordIds are calculated by querying each child record.

### Key Concepts

#### Phantom Windows
Temporary window objects created from URL parameters before full state is loaded. Characteristics:
- Have `initialized: false` until recovery completes
- Contain minimal data: `windowIdentifier`, `isActive`
- Created by `WindowProvider.parseWindowRecoveryData()`
- Hydrated by `useUrlStateRecovery` hook

#### Bottom-Up Iteration
Recovery processes tabs from target (deepest) to root (shallowest). This is necessary because:
- We only know the target's recordId from the URL
- Parent recordIds must be calculated by querying child records
- Going root → target is impossible (we'd need parent data we don't have)

**Example:**
```
URL: LocationTab (level 1), recordId="2000015"

Iteration 1: LocationTab
  - recordId = "2000015" (from URL)
  - Query: GET /Location?_recordId=2000015
  - Response: { id: "2000015", cBpartnerId: "1000001", ... }
  
Iteration 2: BPartnerTab  
  - Extract parent: childRecord["cBpartnerId"] = "1000001"
  - recordId = "1000001" (calculated)
  
Result: Both tabs have correct recordIds
```

#### Parent Key Field
Each child tab has exactly one field with `isParentRecordProperty: true`. This field's **KEY** (e.g., `"cBpartnerId"`) is used to access the parent recordId from child record data.

**Important:** We store the field's KEY (the object property name), NOT the field's internal `name` property.

```typescript
// Tab metadata structure
fields: {
  "cBpartnerId": {           // ← This is the KEY we store
    name: "Business Partner", // ← NOT this property
    isParentRecordProperty: true,
    referencedTabId: "BPartnerTab"
  }
}

// Accessing parent recordId from child record
const parentRecordId = childRecord["cBpartnerId"]; // ✅ Correct
const parentRecordId = childRecord["Business Partner"]; // ❌ Wrong
```

## File Structure

```
packages/MainUI/
├── hooks/
│   └── useUrlStateRecovery.ts          # Main recovery hook
├── utils/recovery/
│   ├── urlStateParser.ts               # Parse URL parameters
│   ├── hierarchyCalculator.ts          # Build tab hierarchy
│   ├── stateReconstructor.ts           # Reconstruct complete state
│   └── errorHandler.ts                 # Error handling utilities
├── utils/url/
│   └── utils.ts                        # URL building and parsing
└── contexts/window.tsx                 # Window state management
```

## Component Integration

### WindowProvider (window.tsx)
- Parses URL parameters on app load
- Creates phantom windows for each `wi_N` parameter
- Stores recovery info: `windowIdentifier`, `tabId`, `recordId`, `hasRecoveryData`

### Window Component
- Detects uninitialized phantom windows
- Triggers `useUrlStateRecovery` hook when:
  - `window.initialized === false`
  - Window metadata is loaded
  - Component is mounted

### useUrlStateRecovery Hook
- Orchestrates the recovery process
- Provides loading state and error handling
- Updates window state when recovery completes

## Error Handling

### Common Errors

#### 1. Invalid Record ID
**Cause:** Record no longer exists or user lacks permission
**Error Message:** `"Failed to fetch child record data for recordId: {id} in tab {name}"`
**Action:** Show error message, open window in default state

#### 2. Missing Parent Key Field
**Cause:** Tab metadata incomplete or corrupted
**Error Message:** `"Parent key field not found in child tab {name}. Available fields: [...]"`
**Action:** Log error with available fields, halt recovery

#### 3. Datasource Failure
**Cause:** Network error or backend unavailable
**Error Message:** `"Failed to fetch child record data for recordId: {id}"`
**Action:** Retry with backoff, show loading state, fallback to default

#### 4. Malformed URL
**Cause:** Invalid or corrupted URL parameters
**Action:** Ignore parameters, open window in default state

#### 5. Hierarchy Calculation Error
**Cause:** Missing tab references or circular dependencies
**Error Message:** `"Parent tab {id} not found in window metadata"`
**Action:** Log error, open window in default state

### Error Recovery Strategy

All errors follow graceful degradation:
1. Log detailed error information to console
2. Show user-friendly error message (via `recoveryError` state)
3. Mark window as initialized with default state
4. User can still interact with window (empty state)

## Performance

### Expected Recovery Times

| Hierarchy Depth | Normal Network | Slow 3G |
|-----------------|----------------|---------|
| 1 level (root)  | ~300ms        | ~2s     |
| 2 levels        | ~680ms        | ~5s     |
| 3 levels        | ~880ms        | ~6s     |

**Per-Level Breakdown:**
- URL Parse: ~10ms
- Phantom Window Creation: ~50ms
- Metadata Fetch: ~200ms
- Hierarchy Calculation: ~20ms
- Per-Parent Query: ~200ms each
- Total: Base (300ms) + (200ms × parent levels)

### Optimization Tips

1. **Minimize Tab Hierarchy Depth**
   - Prefer 2-3 levels maximum
   - Deep hierarchies increase recovery time linearly

2. **Cache Window Metadata**
   - Metadata rarely changes
   - Consider localStorage caching
   - Reduces initial fetch time

3. **Loading Indicators**
   - Always show loading state during recovery
   - Improves perceived performance
   - Prevents user frustration

4. **Timeout Handling**
   - Consider 5-second timeout for slow networks
   - Fallback to default state after timeout
   - Notify user of slow connection

## Testing

### Unit Tests

**hierarchyCalculator.test.ts**
- Test field key extraction (not field properties)
- Test recordId propagation from URL
- Test parent chain building
- Test edge cases (root tab, missing fields)

**stateReconstructor.test.ts**
- Test bottom-up iteration order
- Test parent recordId calculation
- Test form state assignment (target only)
- Test navigation state (single active level)

**urlStateParser.test.ts**
- Test URL parameter parsing
- Test window action handler calls
- Test validation logic

### Integration Tests

**urlStateRecovery.integration.test.ts**
- Test complete recovery flow
- Test with real window metadata
- Test error scenarios
- Test multiple windows

### Manual Testing

1. **Basic Recovery**
   - Open window, select record
   - Copy URL
   - Reload page
   - Verify state is restored

2. **Hierarchical Recovery**
   - Navigate to child tab (level 1+)
   - Select record in child tab
   - Copy URL
   - Reload page
   - Verify all parent selections are correct

3. **Multiple Windows**
   - Open 2+ windows
   - Select records in each
   - Copy URL
   - Reload page
   - Verify all windows recovered independently

4. **Error Cases**
   - Invalid recordId in URL → Error handling
   - Deleted record → Graceful fallback
   - No permissions → Permission error
   - Malformed URL → Ignore and use defaults

## Troubleshooting

### State Not Recovering

**Symptoms:**
- Page reloads to empty state
- No errors in console
- URL parameters present

**Diagnosis:**
1. Check browser console for errors
2. Verify URL parameters format: `wi_0`, `ti_0`, `ri_0`
3. Check Network tab for failed requests
4. Validate window metadata is loaded

**Solutions:**
- Clear browser cache
- Check backend connectivity
- Verify user permissions
- Check window metadata in database

### Wrong Record Displayed

**Symptoms:**
- Page recovers but shows different record
- Parent selections incorrect

**Diagnosis:**
1. Verify recordId in URL matches expected
2. Check datasource response data in Network tab
3. Validate parent key field extraction
4. Review browser console logs for warnings

**Solutions:**
- Verify datasource returns correct data
- Check field metadata (isParentRecordProperty)
- Validate record relationships in database

### Slow Recovery

**Symptoms:**
- Recovery takes > 5 seconds
- Multiple network requests visible
- UI feels sluggish

**Diagnosis:**
1. Check network latency in DevTools
2. Count number of datasource requests
3. Measure per-request time
4. Check tab hierarchy depth

**Solutions:**
- Reduce tab hierarchy depth
- Optimize backend datasource queries
- Add request caching
- Implement recovery timeout

### Console Errors

**Common Error Messages:**

```typescript
// Missing recordId
"Target tab {id} is missing recordId. This should have been set during hierarchy calculation"
→ Check hierarchyCalculator stores urlState.recordId

// Wrong field key
"Parent record ID not found in field {name}"
→ Check using field KEY not field.name property

// Iteration error
"Cannot calculate parent recordId for tab {id}: no children found"
→ Check hierarchy calculation links parent-child correctly
```

## API References

### ComputeWindowActionHandler
```
GET /kernel?_action=org.openbravo.client.application.ComputeWindowActionHandler
    &tabId={tabId}
    &recordId={recordId}

Response:
{
  windowId: "143",
  tabTitle: "Location",
  tabLevel: 1,
  keyParameter: "cLocationId"
}
```

### Datasource Servlet
```
GET /{EntityName}?windowId={windowId}
                  &tabId={tabId}
                  &moduleId={moduleId}
                  &_recordId={recordId}
                  &...

Response:
{
  response: {
    status: 0,
    data: [{
      id: "2000015",
      cBpartnerId: "1000001",
      // ... other fields
    }]
  }
}
```

## Related Documentation

- [Window Context](/docs/architecture/window-context.md) - Window state management
- [Tab Navigation](/docs/features/tab-navigation.md) - Tab hierarchy system
- [URL State Management](/docs/features/url-state-management.md) - URL parameter handling
- [Datasource Integration](/docs/api/datasource-proxy.md) - Backend communication

## Migration Guide

### From Old Recovery System

The old system used root→target iteration. To migrate:

1. **Update iteration order** in any custom recovery logic
2. **Change field access** from `field.name` to field KEY
3. **Update navigation state** to use single active level
4. **Test thoroughly** with multi-level hierarchies

### Breaking Changes

- ✅ No public API changes
- ✅ All changes internal to recovery logic
- ✅ Existing URLs remain compatible
- ✅ No migration needed for users

## Future Improvements

### Planned Enhancements

1. **Request Caching**
   - Cache datasource responses
   - Reduce redundant queries
   - Improve performance

2. **Parallel Queries**
   - Query multiple levels simultaneously
   - Reduce total recovery time
   - Better for deep hierarchies

3. **Optimistic Updates**
   - Show UI immediately with cached data
   - Update in background
   - Better perceived performance

4. **Recovery Metrics**
   - Track success rate
   - Monitor performance
   - Alert on failures

### Known Limitations

1. **Sequential Queries**
   - Parent recordIds calculated one at a time
   - Could be parallelized with proper metadata

2. **No Caching**
   - Every reload queries backend
   - Could cache window metadata

3. **Single Active Level**
   - Only target level shown as active
   - Could support multi-level expansion

## Support

For issues or questions:
- Check console for detailed error logs
- Review this documentation
- Contact development team
- Create issue in project repository

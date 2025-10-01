# Session Synchronization Architecture

## Overview

The table selection session synchronization feature integrates with Etendo's existing form initialization system to maintain backend session state when users select records in table components. This document describes the architectural design and component interactions.

## System Architecture

```
Frontend Table Selection
    ↓
useTableSelection Hook
    ↓
syncSelectedRecordsToSession Utility
    ↓
Form Initialization API (SETSESSION mode)
    ↓
Backend Session Update
    ↓
Session Attributes Response
    ↓
Frontend Session Context Update
```

## Key Components

### 1. SessionMode Type Definition

**Location**: `/packages/api-client/src/api/types.ts`
**Purpose**: Defines SETSESSION mode for API communication

```typescript
// New independent mode for session operations
export const SessionMode = {
  SETSESSION: "SETSESSION"
} as const;

export type SessionModeType = typeof SessionMode[keyof typeof SessionMode];
```

**Design Decision**: Created as independent constant object rather than extending FormMode enum to maintain strict separation between form operations and session operations.

### 2. Session Synchronization Utility

**Location**: `/packages/MainUI/utils/hooks/useTableSelection/sessionSync.ts`
**Purpose**: Handles API communication and response processing

**Key Functions**:
- `syncSelectedRecordsToSession`: Core synchronization function
- Error handling and logging
- Response processing through existing form initialization utilities

**Architecture Patterns**:
- **Single Responsibility**: Only handles session synchronization
- **Error Isolation**: Failures don't propagate to UI components
- **Reuse**: Leverages existing form initialization infrastructure

### 3. useTableSelection Integration

**Location**: `/packages/MainUI/hooks/useTableSelection.ts`
**Purpose**: Integrates session sync into table selection workflow

**Integration Points**:
- Session sync triggered after `updateGraphSelection`
- Uses existing effect dependency array
- Accesses `setSession` from `useUserContext`

**Design Considerations**:
- **Non-blocking**: Session sync runs asynchronously
- **Conditional**: Only executes when records are selected
- **Debounced**: Inherits debouncing from existing URL update mechanism

### 4. Session Attribute Processing

**Location**: `/packages/MainUI/utils/hooks/useFormInitialization/utils.ts`
**Purpose**: Processes API response into session-compatible format

**Enhanced Functions**:
- `buildSessionAttributes`: New utility for response processing
- `buildFormInitializationParams`: Extended to support SessionMode
- `buildFormInitializationPayload`: Extended to support SessionMode

## Data Flow

### Single Record Selection

1. User selects record in table
2. `useTableSelection` effect triggers
3. `syncSelectedRecordsToSession` called with single record
4. API request with `ROW_ID` set to selected record
5. Standard payload without `MULTIPLE_ROW_IDS`
6. Backend processes SETSESSION request
7. Response contains session attributes
8. `buildSessionAttributes` processes response
9. Frontend session updated via `setSession`

### Multiple Record Selection

1. User selects multiple records in table
2. `useTableSelection` effect triggers
3. `syncSelectedRecordsToSession` called with all records
4. API request with `ROW_ID` set to last selected record
5. Payload includes `MULTIPLE_ROW_IDS` array
6. Backend processes all selected record IDs
7. Response contains combined session attributes
8. `buildSessionAttributes` processes response
9. Frontend session updated via `setSession`

## Error Handling Strategy

### Levels of Error Handling

1. **Utility Level**: `syncSelectedRecordsToSession` catches and logs errors
2. **Hook Level**: Errors don't propagate to component rendering
3. **UI Level**: Selection functionality remains intact regardless of sync status

### Error Recovery

- **No Retry Logic**: Simplifies implementation, reduces complexity
- **Graceful Degradation**: UI continues to function normally
- **Logging**: Errors logged for debugging and monitoring
- **Session State**: Previous session state preserved on failure

## Performance Considerations

### Optimization Strategies

1. **Single Request**: Multiple selections handled in one API call
2. **Debouncing**: Inherits debouncing from URL update mechanism
3. **Conditional Execution**: Only runs when records are selected
4. **Async Processing**: Non-blocking execution

### Resource Usage

- **Network**: One request per selection change
- **Memory**: Minimal additional state storage
- **CPU**: Lightweight data processing
- **Session**: Efficient attribute merging

## Security Considerations

### Data Validation

- **Input Validation**: Validates tab structure and record IDs
- **Type Safety**: Full TypeScript coverage
- **Error Boundaries**: Prevents invalid data from reaching API

### Session Management

- **Authentication**: Uses existing authentication context
- **Authorization**: Inherits existing form initialization permissions
- **Session Isolation**: User-specific session updates

## Testing Architecture

### Test Strategy

1. **Unit Tests**: Individual utility functions
2. **Integration Tests**: Hook and utility interaction
3. **Type Tests**: TypeScript type definitions
4. **Error Tests**: Error handling scenarios

### Mock Strategy

- **API Mocking**: Jest mocks for form initialization functions
- **Context Mocking**: Mock user context and session management
- **Hook Testing**: React Testing Library for hook behavior

## Deployment Considerations

### Backwards Compatibility

- **FormMode Unchanged**: Existing code continues to work
- **Additive Changes**: No breaking changes to existing APIs
- **Optional Feature**: Session sync can be disabled without affecting core functionality

### Monitoring

- **Error Logging**: Session sync failures logged but don't break functionality
- **Performance Metrics**: API request timing and success rates
- **User Impact**: Minimal impact on existing table selection behavior

## Future Enhancements

### Potential Improvements

1. **Retry Logic**: Automatic retry for failed sync attempts
2. **Caching**: Cache session attributes to reduce API calls
3. **Batch Processing**: Combine multiple rapid selection changes
4. **Configuration**: User preferences for session sync behavior

### Extension Points

- **Custom Session Processors**: Plugin architecture for custom session handling
- **Additional Modes**: New session modes for specific use cases
- **Event System**: Hooks for session sync events
- **Analytics**: Detailed session sync usage analytics

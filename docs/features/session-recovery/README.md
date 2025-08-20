# Automatic Session Fallback Mechanism

This implementation provides automatic session recovery for expired JSESSIONID cookies in the Etendo WorkspaceUI. When ERP sessions expire, the system transparently re-authenticates using stored JWT tokens and retries the failed request.

## Architecture

### Components

1. **Session Validator** (`sessionValidator.ts`)
   - Detects session expiration from HTTP responses
   - Checks for 401/403 status codes and session-related error messages
   - Determines if automatic recovery should be attempted

2. **Session Recovery Service** (`sessionRecovery.ts`)
   - Re-authenticates with ERP using JWT tokens
   - Extracts new JSESSIONID from login response
   - Updates session store with fresh session cookie
   - Implements retry limits and timeout protection

3. **Session Retry Orchestrator** (`sessionRetry.ts`)
   - Coordinates the entire retry flow
   - Executes original request, detects failures, triggers recovery, and retries
   - Provides transparent operation for calling code

4. **Updated Datasource Route** (`datasource/route.ts`)
   - Integrates session retry logic for non-cached requests
   - Preserves existing caching behavior for performance
   - Maintains backward compatibility

## Flow

```
1. Client makes datasource request
2. Backend forwards to ERP with stored JSESSIONID
3. If ERP returns session expired (401/403):
   a. Session validator detects expiration
   b. Session recovery re-authenticates with JWT
   c. New JSESSIONID stored in session store
   d. Original request retried with new session
4. Response returned to client (transparent operation)
```

## Key Features

- **Automatic Detection**: Recognizes session expiration patterns
- **Transparent Recovery**: Users don't see login prompts
- **Retry Limits**: Maximum 3 attempts per token to prevent loops
- **Timeout Protection**: 30-second timeout for recovery requests
- **Error Handling**: Comprehensive error reporting and logging
- **Performance**: Caching behavior preserved, no impact on cached requests
- **Backward Compatibility**: Existing API contracts maintained

## Configuration

The mechanism is enabled by default. No configuration changes required.

Environment variables used:
- `ETENDO_CLASSIC_URL`: ERP backend URL (existing)
- `ERP_FORWARD_COOKIES`: Cookie forwarding control (existing)

## Testing

Comprehensive test coverage includes:
- Session expiration detection scenarios
- Recovery success and failure cases
- Retry logic and error handling
- Integration with datasource API
- Edge cases and timeout scenarios

## Error Scenarios Handled

- Session expired (401 responses)
- Permission denied (403 - no retry to avoid loops)
- Network timeouts during recovery
- Invalid JWT tokens
- Missing JSESSIONID in recovery response
- Maximum retry attempts exceeded
- ERP backend unavailable

## Logging

The system logs:
- Session recovery attempts and results
- Error conditions during recovery
- Successful recoveries with token prefixes (for debugging)

Log messages use console.log/error for consistency with existing codebase.
# ERP Request Debugger

The ERP Request Debugger is a development-only tool that provides real-time visualization of all HTTP communications between Next.js and Etendo Classic.

## Features

- **Real-time Monitoring**: Live view of all API requests and responses
- **Comprehensive Logging**: Captures headers, body, status codes, timing, and errors
- **Data Masking**: Automatically masks sensitive data (Bearer tokens, cookies)
- **Filtering & Search**: Filter by method, status, route, or search request/response content
- **Development-Only**: Zero impact on production performance
- **Memory Management**: Automatic cleanup with configurable limits

## Setup

### 1. Environment Configuration

Add the following environment variables to enable debugging:

```bash
# .env.local or .env.development
NODE_ENV=development
DEBUG_ERP_REQUESTS=true
```

### 2. Access the Debug Interface

Navigate to the debug interface in your browser:

```
http://localhost:3000/debug/requests
```

## Usage

### Starting a Debug Session

1. **Enable Debug Mode**: Set the environment variables as shown above
2. **Restart Development Server**: Restart your Next.js development server
3. **Open Debug Interface**: Navigate to `/debug/requests` in your browser
4. **Trigger API Calls**: Use your application normally to generate API traffic

### Interface Features

#### Connection Status
- **Green**: Connected and receiving updates
- **Red**: Connection error (check console for details)
- **Gray**: Connecting or disconnected

#### Request Table
- **Time**: Relative time since request (e.g., "2m ago")
- **Method**: HTTP method with color coding (GET=blue, POST=gray, etc.)
- **Route**: Next.js API route that handled the request
- **Status**: HTTP status code with color coding (2xx=green, 4xx=orange, 5xx=red)
- **Timing**: Request duration in milliseconds
- **URL**: Target ERP URL (truncated in table view)

#### Filtering Options
- **Method**: Filter by HTTP method (GET, POST, PUT, DELETE, PATCH)
- **Status**: Filter by response status (Success 2xx, Error 4xx/5xx, specific codes)
- **Route**: Filter by specific API route
- **Search**: Search in URL or request/response body content

#### Request Details
Click any request to view detailed information:
- **Request Headers**: All headers sent to ERP (with sensitive data masked)
- **Request Body**: JSON formatted request payload
- **Response Headers**: Headers returned from ERP
- **Response Body**: JSON formatted response data
- **Error Information**: Error details if request failed

### Statistics Panel
- **Total Requests**: Number of requests captured
- **Filtered**: Number of requests matching current filters
- **Success Rate**: Percentage of successful requests (2xx status codes)
- **Avg Response Time**: Average response time across all requests

## Security Features

### Data Masking
The debugger automatically masks sensitive information:

- **Bearer Tokens**: Shows only first 8 characters (e.g., `Bearer abcd1234...***`)
- **Session Cookies**: Masks JSESSIONID and other session identifiers
- **Custom Patterns**: Configurable patterns for additional sensitive fields

### Access Control
- **Development Only**: Interface returns 404 in production
- **Environment Gated**: Only active when `DEBUG_ERP_REQUESTS=true`
- **Memory Only**: No persistent storage of debug data

## Technical Details

### Architecture

```
Frontend (React) ←→ SSE Stream ←→ Debug Store ←→ API Routes ←→ Etendo Classic
```

#### Components
- **Debug Logger**: Captures request/response data with minimal overhead
- **Debug Store**: In-memory storage with automatic cleanup
- **SSE Endpoint**: Real-time streaming to frontend via Server-Sent Events
- **React Interface**: Material-UI based debug interface

#### Storage Limits
- **Maximum Entries**: 500 requests (oldest removed automatically)
- **Maximum Age**: 1 hour (entries older than 1 hour are removed)
- **Memory Only**: No persistent storage beyond browser session

### Monitored API Routes

The debugger captures all requests from these Next.js API routes to Etendo Classic:

- `/api/auth/login` - Authentication requests
- `/api/datasource` - Data source queries
- `/api/erp/[...slug]` - Generic ERP API calls
- `/api/copilot/[...path]` - Copilot AI service calls

### Performance Impact

- **Development**: <10ms overhead per request
- **Production**: Zero impact (completely disabled)
- **Memory**: ~1-5KB per logged request (depending on payload size)

## Troubleshooting

### Common Issues

#### Debug Interface Shows 404
- Verify `NODE_ENV=development`
- Check that `DEBUG_ERP_REQUESTS=true` is set
- Restart the development server

#### No Requests Appearing
- Confirm environment variables are set correctly
- Check browser console for SSE connection errors
- Verify API calls are actually happening in your application

#### Connection Errors
- Check browser network tab for failed SSE requests
- Verify `/api/debug/stream` endpoint is accessible
- Look for CORS or firewall issues

#### Performance Issues
- Clear logs using the "Clear Logs" button
- Check memory usage if running for extended periods
- Restart development server to reset state

### Debug Console Commands

For advanced debugging, you can access the debug logger from browser console:

```javascript
// Check debug status (in browser console)
fetch('/api/debug/stream')
  .then(response => console.log('Debug endpoint status:', response.status))

// Clear logs programmatically
fetch('/api/debug/clear', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log('Logs cleared:', data))
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | - | Must be `development` for debugger to activate |
| `DEBUG_ERP_REQUESTS` | `false` | Enable/disable ERP request debugging |
| `ETENDO_CLASSIC_URL` | - | Base URL for Etendo Classic (required for all API calls) |

### Customizing Data Masking

The debugger uses configurable patterns to mask sensitive data. To add custom patterns, modify the `maskSensitiveData` method in `debugLogger.ts`:

```typescript
// Example: Add custom field masking
if (masked.apikey || masked['X-API-Key']) {
  // Mask API keys
  const apiKey = masked.apikey || masked['X-API-Key'];
  masked.apikey = `${apiKey.substring(0, 4)}...***`;
  delete masked['X-API-Key'];
}
```

## Best Practices

### Development Workflow
1. **Enable Early**: Turn on debugging at the start of development sessions
2. **Filter Intelligently**: Use filters to focus on specific request types
3. **Clear Regularly**: Clear logs when switching between different features
4. **Check Performance**: Monitor timing information to identify slow requests

### Debugging Scenarios

#### Authentication Issues
1. Filter by route: `/api/auth/login`
2. Check request headers for proper Authorization format
3. Verify response status and error messages

#### Data Loading Problems
1. Filter by route: `/api/datasource`
2. Examine request body for proper entity and parameters
3. Check response data structure and error codes

#### Generic ERP Communication
1. Filter by route: `/api/erp`
2. Review request URL and parameters
3. Analyze response timing and success rates

## API Reference

### Debug Endpoints

#### `GET /api/debug/stream`
Server-Sent Events endpoint for real-time log streaming.

**Response**: Stream of JSON log entries
**Access**: Development only

#### `POST /api/debug/clear`
Clears all stored debug logs.

**Response**: `{ success: true, message: "Debug logs cleared" }`
**Access**: Development only

### Log Entry Format

```typescript
interface DebugLogEntry {
  id: string;                           // Unique identifier
  timestamp: string;                    // ISO 8601 timestamp
  route: string;                        // API route (e.g., "/api/datasource")
  method: string;                       // HTTP method
  url: string;                          // Target ERP URL
  requestHeaders: Record<string, string>; // Masked request headers
  requestBody: any;                     // Request payload
  responseStatus: number;               // HTTP status code
  responseHeaders: Record<string, string>; // Response headers
  responseBody: any;                    // Response payload
  timing: number;                       // Duration in milliseconds
  error?: string;                       // Error message if failed
}
```

## Contributing

When modifying the debugger:

1. **Maintain Security**: Ensure new data types are properly masked
2. **Performance First**: Keep logging overhead minimal
3. **Development Only**: Never enable debugging features in production
4. **Test Coverage**: Add tests for new functionality
5. **Documentation**: Update this guide for new features

## Known Limitations

- **Memory Usage**: Long debugging sessions may consume significant memory
- **Network Overhead**: SSE polling every 1 second (acceptable for debugging)
- **Response Bodies**: Large response bodies may impact browser performance
- **Concurrent Requests**: High-traffic scenarios may overwhelm the interface

## Future Enhancements

Potential improvements for future versions:

- **Export Functionality**: Export logs as JSON or CSV
- **Advanced Filtering**: Regex patterns, time ranges, custom filters
- **Performance Analytics**: Response time trends, success rate graphs
- **Request Replay**: Re-execute captured requests for testing
- **WebSocket Support**: Replace SSE polling with WebSocket for better real-time performance
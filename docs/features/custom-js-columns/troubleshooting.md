# Troubleshooting Guide - Custom JS Columns

## Common Issues and Solutions

### Evaluation Errors

#### Issue: `[Error: Cannot read property 'X' of undefined]`

**Cause**: Trying to access a property that doesn't exist on the record.

**Solutions:**
```javascript
// ❌ Problem
"(record) => record.user.name"  // user might be null

// ✅ Solution 1: Optional chaining
"(record) => record.user?.name || 'N/A'"

// ✅ Solution 2: Null check
"(record) => record.user ? record.user.name : 'N/A'"

// ✅ Solution 3: Default values
"(record) => (record.user && record.user.name) || 'Unknown'"
```

#### Issue: `[Error: Unexpected token ']']`

**Cause**: Syntax error in the JavaScript expression.

**Solutions:**
```javascript
// ❌ Problem
"(record) => record.items[0].name]"  // Extra bracket

// ✅ Solution
"(record) => record.items[0].name"

// ❌ Problem  
"(record) => record.status === 'active' ? 'Yes' : 'No'"  // Missing quotes

// ✅ Solution
"(record) => record.status === 'active' ? 'Yes' : 'No'"
```

#### Issue: `[Error: record.amount.toFixed is not a function]`

**Cause**: Trying to call a method that doesn't exist on the data type.

**Solutions:**
```javascript
// ❌ Problem (amount might be string)
"(record) => record.amount.toFixed(2)"

// ✅ Solution
"(record) => Number(record.amount).toFixed(2)"

// ✅ Better solution with validation
"(record) => typeof record.amount === 'number' ? record.amount.toFixed(2) : record.amount"
```

### Display Issues

#### Issue: Cell shows `[object Object]` instead of expected content

**Cause**: Returning an object that can't be converted to string.

**Solutions:**
```javascript
// ❌ Problem
"(record) => ({ name: record.name, value: record.amount })"

// ✅ Solution 1: Return specific property
"(record) => record.name + ': ' + record.amount"

// ✅ Solution 2: JSON stringify for debugging
"(record) => JSON.stringify({ name: record.name, value: record.amount })"
```

#### Issue: Color not applying to cell background

**Cause**: Color format not recognized or invalid.

**Solutions:**
```javascript
// ❌ Problem
"(record) => 'red-500'"  // Tailwind class, not CSS color

// ✅ Solution
"(record) => '#ef4444'"  // Valid hex color

// ✅ Valid color formats
"(record) => 'rgb(239, 68, 68)"    // RGB
"(record) => 'hsl(0, 84%, 60%)"    // HSL  
"(record) => 'red'"                // Named color
```

#### Issue: Cell appears empty or shows nothing

**Cause**: Expression returns `null`, `undefined`, or empty value.

**Solutions:**
```javascript
// ❌ Problem
"(record) => record.optionalField"  // Might be undefined

// ✅ Solution
"(record) => record.optionalField || 'N/A'"

// ✅ Better handling
"(record) => {
  if (record.optionalField === null) return 'Not set';
  if (record.optionalField === undefined) return 'N/A';
  return record.optionalField;
}"
```

### Performance Issues

#### Issue: Table is slow to load or scroll

**Cause**: Complex custom JS expressions running for many rows.

**Solutions:**
```javascript
// ❌ Slow - Complex calculation
"(record) => {
  let total = 0;
  for (let i = 0; i < 1000; i++) {
    total += record.amount * Math.random();
  }
  return total.toFixed(2);
}"

// ✅ Fast - Simple calculation
"(record) => (record.amount * 1.21).toFixed(2)"

// ✅ Optimize complex logic
"(record) => record.preCalculatedField || (record.amount * 1.21).toFixed(2)"
```

#### Issue: Browser becomes unresponsive

**Cause**: Infinite loops or very expensive operations.

**Solutions:**
```javascript
// ❌ Problem - Infinite loop
"(record) => { while(true) { /* some logic */ } }"

// ❌ Problem - Expensive operation
"(record) => { 
  const bigArray = new Array(1000000).fill(0);
  return bigArray.reduce((sum, val) => sum + val, 0);
}"

// ✅ Solution - Simple operations only
"(record) => record.value > 1000 ? 'High' : 'Low'"
```

### Data Type Issues

#### Issue: Numbers not formatting correctly

**Cause**: Data type mismatch or incorrect formatting.

**Solutions:**
```javascript
// ❌ Problem
"(record) => record.price + record.tax"  // String concatenation if strings

// ✅ Solution
"(record) => Number(record.price) + Number(record.tax)"

// ✅ With validation
"(record) => {
  const price = parseFloat(record.price) || 0;
  const tax = parseFloat(record.tax) || 0;
  return (price + tax).toFixed(2);
}"
```

#### Issue: Date formatting not working

**Cause**: Date fields might be strings or timestamps.

**Solutions:**
```javascript
// ❌ Problem
"(record) => record.date.toLocaleDateString()"  // date might be string

// ✅ Solution
"(record) => new Date(record.date).toLocaleDateString()"

// ✅ With error handling
"(record) => {
  try {
    return new Date(record.date).toLocaleDateString();
  } catch (e) {
    return record.date;
  }
}"
```

### Integration Issues

#### Issue: Custom JS not working for some columns

**Cause**: Field configuration or column mapping issues.

**Troubleshooting:**
1. Verify `etmetaCustomjs` property exists on field
2. Check field `id` matches column `fieldId`
3. Ensure field has non-empty custom JS code

```typescript
// Debug field configuration
console.log('Field:', field);
console.log('Custom JS:', field.etmetaCustomjs);
console.log('Field ID:', field.id);
```

#### Issue: Reference columns not working with custom JS

**Cause**: Custom JS overrides reference column rendering.

**Solution:**
```javascript
// Create custom JS that includes reference functionality
"(record) => {
  // Custom logic here
  const customValue = record.amount > 1000 ? 'High: ' : 'Low: ';
  // Include reference display
  return customValue + record.referencedValue;
}"
```

## Debugging Techniques

### Console Debugging

#### Basic Data Inspection
```javascript
// Inspect available record fields
"(record) => JSON.stringify(record)"

// Check specific field types
"(record) => typeof record.amount + ': ' + record.amount"

// List all available properties
"(record) => Object.keys(record).join(', ')"
```

#### Error Investigation
```javascript
// Wrap in try-catch for debugging
"(record) => {
  try {
    return record.complexOperation();
  } catch (error) {
    return 'Error: ' + error.message;
  }
}"
```

### Development Tools

#### Browser Console
1. Open Developer Tools (F12)
2. Check Console tab for evaluation errors
3. Look for stack traces and error details

#### Network Tab
1. Check for failed API requests during evaluation
2. Monitor performance impact of custom JS

### Testing Strategies

#### Incremental Testing
```javascript
// Start simple
"(record) => record.id"

// Add complexity gradually  
"(record) => record.id + ': ' + record.name"

// Add business logic
"(record) => record.id + ': ' + (record.status === 'active' ? '✅' : '❌') + ' ' + record.name"
```

#### Edge Case Testing
```javascript
// Test with null values
record = { id: 1, name: null, amount: undefined }

// Test with empty strings
record = { id: 2, name: '', amount: '' }

// Test with zero values
record = { id: 3, name: 'Test', amount: 0 }
```

## Error Reference

### Common Error Patterns

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Cannot read property 'X' of undefined` | Accessing property of null/undefined | Add null checks |
| `X is not a function` | Calling method on wrong type | Validate data type first |
| `Unexpected token` | Syntax error | Check JavaScript syntax |
| `Maximum call stack size exceeded` | Infinite recursion | Remove recursive calls |
| `X is not defined` | Accessing undefined variable | Use only provided context |

### Security Error Messages

| Error Message | Cause | Action |
|---------------|-------|--------|
| `eval is not allowed` | Trying to use eval() | Remove dynamic evaluation |
| `window is not defined` | Accessing global objects | Use only record/column data |
| `fetch is not defined` | Network requests | Remove network calls |
| `setTimeout is not defined` | Timer functions | Remove async operations |

## Performance Optimization

### Best Practices

#### Keep Expressions Simple
```javascript
// ✅ Good - Simple and fast
"(record) => record.amount > 1000 ? 'High' : 'Low'"

// ❌ Avoid - Complex and slow
"(record) => {
  const calculations = [];
  for (let i = 0; i < record.items.length; i++) {
    calculations.push(complexCalculation(record.items[i]));
  }
  return calculations.reduce((sum, val) => sum + val, 0);
}"
```

#### Precompute When Possible
```javascript
// ❌ Compute in custom JS
"(record) => record.items.reduce((sum, item) => sum + item.price, 0)"

// ✅ Precompute on backend and use in custom JS
"(record) => record.totalPrice"
```

### Memory Management

#### Avoid Large Objects
```javascript
// ❌ Creates large objects
"(record) => { 
  const largeArray = new Array(10000);
  return largeArray.length;
}"

// ✅ Simple operations
"(record) => record.itemCount || 0"
```

## Getting Help

### Before Asking for Help

1. **Check Console**: Look for JavaScript errors
2. **Test Simply**: Start with basic expressions
3. **Verify Data**: Ensure record contains expected fields
4. **Review Docs**: Check API reference and examples

### Information to Provide

When reporting issues, include:
- JavaScript expression causing the problem
- Error message (exact text)
- Sample record data structure
- Expected vs actual behavior
- Browser and version information

### Support Channels

- **Documentation**: This guide and API reference
- **Development Team**: For complex integration issues
- **Security Team**: For security-related concerns
- **Community**: For general questions and best practices

## Preventive Measures

### Code Review Checklist

- [ ] Expression syntax is valid JavaScript
- [ ] All referenced fields exist in record data
- [ ] Null/undefined values are handled
- [ ] No complex or expensive operations
- [ ] No attempts to access restricted APIs
- [ ] Error handling is appropriate
- [ ] Performance impact is acceptable

### Testing Checklist

- [ ] Expression works with normal data
- [ ] Handles null/undefined gracefully
- [ ] Performance is acceptable with large datasets
- [ ] No console errors during execution
- [ ] Output format is as expected
- [ ] Color values render correctly (if applicable)

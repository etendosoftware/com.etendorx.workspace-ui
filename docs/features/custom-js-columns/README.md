# Custom JavaScript Columns

## Overview

The Custom JavaScript Columns feature allows dynamic evaluation of JavaScript expressions in Material React Table columns when the field has the `etmetaCustomjs` attribute. This enables real-time computation, conditional formatting, and data transformation directly within table cells.

## Features

- **Dynamic Evaluation**: Execute JavaScript expressions for each table row
- **Conditional Rendering**: Display different content based on record data
- **Safe Execution**: Secure sandbox environment with limited context
- **Error Handling**: Graceful fallback to original values on evaluation errors
- **Color Support**: Automatic detection and rendering of color values
- **Type Safety**: Full TypeScript support with proper Material React Table integration

## Quick Start

### Basic Usage

1. **Add Custom JS to Field Definition**:
```javascript
const field = {
  name: "statusDisplay",
  etmetaCustomjs: "(record) => record.status === 'active' ? '✅ Active' : '❌ Inactive'"
};
```

2. **The table will automatically detect and render the custom JS**:
```
Original Status: "active"
Rendered Output: "✅ Active"
```

### Common Use Cases

#### 1. Conditional Formatting
```javascript
// Status indicators
"(record) => record.amount > 1000 ? 'High Priority' : 'Normal'"

// Color coding
"(record) => record.status === 'error' ? '#ff0000' : '#00ff00'"
```

#### 2. Data Transformation
```javascript
// String manipulation
"(record) => record.firstName + ' ' + record.lastName"

// Number formatting
"(record) => '$' + (record.price * record.quantity).toFixed(2)"
```

#### 3. Mathematical Operations
```javascript
// Calculations
"(record) => Math.round(record.value * 1.21 * 100) / 100"

// Percentages
"(record) => ((record.completed / record.total) * 100).toFixed(1) + '%'"
```

## Supported Return Types

The custom JavaScript expressions can return various types:

| Type | Example | Rendering |
|------|---------|-----------|
| String | `"Hello World"` | Plain text |
| Number | `42` | Formatted number |
| Boolean | `true` | "true" or "false" |
| Color | `"#ff0000"` | Colored cell background |
| JSX Element | `<div>Custom</div>` | React component |

## Color Support

When a custom JS expression returns a color value, the cell automatically applies background styling:

```javascript
// Supported color formats
"(record) => '#ff0000'"           // Hex
"(record) => 'rgb(255, 0, 0)'"    // RGB
"(record) => 'red'"               // Named colors
"(record) => 'hsl(0, 100%, 50%)'" // HSL
```

The system automatically calculates appropriate text color (black/white) based on background luminance.

## Security & Limitations

### Allowed Operations
- ✅ Record field access (`record.fieldName`)
- ✅ Basic JavaScript operators (`+`, `-`, `*`, `/`, `===`, etc.)
- ✅ String methods (`toUpperCase()`, `substring()`, etc.)
- ✅ Math object (`Math.round()`, `Math.max()`, etc.)
- ✅ Conditional expressions (`? :`)
- ✅ Basic array/object operations

### Restricted Operations
- ❌ DOM access (`window`, `document`)
- ❌ Network requests (`fetch`, `XMLHttpRequest`)
- ❌ Timers (`setTimeout`, `setInterval`)
- ❌ Dynamic evaluation (`eval`, `Function`)
- ❌ Module imports (`import`, `require`)

### Context Available
- `record`: Current row data
- `column`: Column metadata
- `Metadata`: Etendo metadata API (read-only)

## Performance Considerations

- **Evaluation Frequency**: Code executes for every visible row
- **Complexity**: Keep expressions simple for better performance
- **Large Datasets**: Consider performance impact with 1000+ rows
- **Caching**: Results are re-evaluated when dependencies change

## Error Handling

When evaluation fails, the system:
1. Logs error to console for debugging
2. Displays `[Error: message]` format in cell
3. Falls back to original field value when possible

```javascript
// This will show: [Error: Cannot read property 'property' of undefined]
"(record) => record.nonexistent.property"
```

## Integration with Existing Features

### Reference Columns
- Custom JS takes precedence over reference column rendering
- Use custom JS to override default reference behavior

### Material React Table
- Full compatibility with MRT features (sorting, filtering, etc.)
- Integrates seamlessly with existing column processing

## Examples

### Complete Field Configuration
```typescript
const field: Field = {
  name: "customStatus",
  showInGridView: true,
  etmetaCustomjs: `(record) => {
    const status = record.status;
    const colors = {
      'active': '#4CAF50',
      'inactive': '#F44336',
      'pending': '#FF9800'
    };
    return colors[status] || '#9E9E9E';
  }`,
  // ... other field properties
};
```

### Advanced Example with Multiple Conditions
```javascript
`(record) => {
  if (record.priority === 'high' && record.dueDate < Date.now()) {
    return '🔥 Urgent';
  }
  if (record.status === 'completed') {
    return '✅ Done';
  }
  return record.title;
}`
```

## Troubleshooting

### Common Issues

1. **Syntax Errors**: Check JavaScript syntax in expressions
2. **Undefined Fields**: Verify field names exist in record data
3. **Type Errors**: Ensure operations match data types
4. **Performance**: Simplify complex expressions

### Debugging Tips

1. **Console Logs**: Check browser console for evaluation errors
2. **Simple Tests**: Start with simple expressions like `"(record) => record.id"`
3. **Data Inspection**: Verify available fields with `"(record) => JSON.stringify(record)"`

## Migration Guide

### From Static Columns
```javascript
// Before: Static display
{
  header: "Status",
  accessorKey: "status"
}

// After: Dynamic display with custom JS
{
  header: "Status",
  accessorKey: "status",
  etmetaCustomjs: "(record) => record.status === 'active' ? '✅ Active' : '❌ Inactive'"
}
```

### From Custom Cell Components
```javascript
// Before: Custom React component
Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />

// After: Custom JS expression
etmetaCustomjs: "(record) => record.status === 'active' ? '✅ Active' : '❌ Inactive'"
```

## Best Practices

1. **Keep It Simple**: Prefer simple expressions over complex logic
2. **Test Thoroughly**: Verify expressions with various data scenarios
3. **Handle Edge Cases**: Check for null/undefined values
4. **Use Meaningful Names**: Choose descriptive field names
5. **Document Complex Logic**: Add comments for complex expressions

## API Reference

For detailed API documentation, see [API Reference](./api-reference.md).

## Support

For issues and questions:
- Check [Troubleshooting Guide](./troubleshooting.md)
- Review [Security Guidelines](./security-guidelines.md)
- Consult development team for advanced use cases

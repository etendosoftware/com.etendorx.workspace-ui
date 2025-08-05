# Display Logic Expression Parsing

## Overview

The display logic expression parsing system handles the transformation of Etendo-specific expressions into valid JavaScript that can be executed at runtime. This system is crucial for evaluating field visibility and readonly states in process parameters.

## Core Function: `parseDynamicExpression`

Location: `packages/MainUI/utils/index.ts`

### Purpose
Transforms Etendo display logic expressions into executable JavaScript code that can access form values and context data.

### Expression Transformations

#### 1. Field Reference Transformation
Converts Etendo field references to JavaScript property access:

```typescript
// Input: @field_name@='Y'
// Output: (currentValues["field_name"] || context["field_name"])=='Y'
```

**Regex Pattern**: `/@([a-zA-Z_][a-zA-Z0-9_]*)@/g`

#### 2. Comparison Operator Transformation
Converts Etendo comparison operators to JavaScript equivalents:

```typescript
// Input: field='value'
// Output: field=='value'
```

**Regex Pattern**: `/([^=!<>])=([^=])/g`

#### 3. Context Property Access
Handles context property references:

```typescript
// Input: context.fieldName
// Output: context.fieldName (unchanged)
```

### Supported Expression Types

#### Basic Field References
```javascript
// Etendo Expression
"@trxtype_display_logic@='Y'"

// Transformed JavaScript
"(currentValues[\"trxtype_display_logic\"] || context[\"trxtype_display_logic\"])=='Y'"
```

#### Complex Logical Expressions
```javascript
// Etendo Expression
"@Processed@='Y' | (@Status@='Active' & @Type@='Invoice')"

// Transformed JavaScript
"(currentValues[\"Processed\"] || context[\"Processed\"])=='Y' || ((currentValues[\"Status\"] || context[\"Status\"])=='Active' && (currentValues[\"Type\"] || context[\"Type\"])=='Invoice')"
```

#### Legacy OB.Utilities Support
```javascript
// Input: OB.Utilities.getValue(obj, 'property')
// Output: obj["property"]
```

### Error Handling

The parsing system includes multiple fallback mechanisms:

1. **Compilation Errors**: Returns a function that always returns `true`
2. **Malformed Expressions**: Logs warnings and defaults to visible state
3. **Missing Context**: Uses fallback values from either `currentValues` or `context`

### Integration Points

#### ProcessParameterSelector
Uses parsed expressions to determine field visibility:

```typescript
const isDisplayed = useMemo(() => {
  // Check process defaults logic first
  const defaultsDisplayLogic = logicFields?.[`${parameter.name}.display`];
  if (defaultsDisplayLogic !== undefined) {
    return defaultsDisplayLogic;
  }
  
  // Parse and evaluate parameter's display logic
  if (parameter.displayLogic) {
    const compiledExpr = compileExpression(parameter.displayLogic);
    return compiledExpr(session, currentValues);
  }
  
  return true; // Default to visible
}, [parameter.displayLogic, logicFields, session, getValues]);
```

#### BaseSelector (FormView)
Similar integration for form field visibility and readonly states.

### Performance Considerations

1. **Memoization**: Compiled expressions should be memoized to avoid re-compilation
2. **Error Boundaries**: Malformed expressions should not crash the application
3. **Fallback Values**: Always provide sensible defaults when expressions fail

### Testing Strategies

#### Unit Tests
```typescript
describe('parseDynamicExpression', () => {
  it('should transform field references', () => {
    const input = "@fieldName@='Y'";
    const output = parseDynamicExpression(input);
    expect(output).toBe("(currentValues[\"fieldName\"] || context[\"fieldName\"])=='Y'");
  });

  it('should handle complex logical expressions', () => {
    const input = "@field1@='Y' | (@field2@='N' & @field3@='X')";
    const output = parseDynamicExpression(input);
    expect(output).toContain("||");
    expect(output).toContain("&&");
  });
});
```

#### Integration Tests
- Test with real process parameter data
- Verify display logic evaluation in different contexts
- Test error scenarios and fallback behavior

### Common Issues and Solutions

#### Issue: Invalid Syntax Errors
**Problem**: Expressions like `@field@='Y'` causing "Invalid left-hand side in assignment"
**Solution**: Ensure comparison operators are properly transformed (`=` to `==`)

#### Issue: Missing Field References
**Problem**: Fields not found in `currentValues` or `context`
**Solution**: Use fallback chain: `currentValues["field"] || context["field"]`

#### Issue: Malformed Field Names
**Problem**: Display logic contains field names instead of expressions
**Solution**: Add validation to detect and skip malformed expressions

### Future Enhancements

1. **Expression Validation**: Pre-validate expressions before compilation
2. **Advanced Operators**: Support for more complex logical operators
3. **Performance Optimization**: Cache compiled expressions
4. **Developer Tools**: Better error messages and debugging support

## Related Documentation

- [Process Parameter Extensions](../types/process-parameter-extensions.md)
- [Display Logic Troubleshooting](../../troubleshooting/display-logic-implementation-en.md)
- [Form Field Validation](../form/field-validation.md)

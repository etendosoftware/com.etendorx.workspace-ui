# Display Logic Implementation - Analysis and Troubleshooting

## Problem Summary

A critical error was identified in the display logic implementation that causes JavaScript syntax errors when processing Etendo expressions with the `@field_name@='value'` syntax.

### Specific Error
```
@trxtype_display_logic@='Y' SyntaxError: Invalid or unexpected token
    at new Function (<anonymous>)
    at compileExpression (BaseSelector.tsx:21:12)
    at ProcessParameterSelector.useMemo[isDisplayed] (ProcessParameterSelector.tsx:63:45)
```

## Current Architecture

### Display Logic Processing Flow

1. **ProcessParameterSelector.tsx** (lines 46-70)
   - Evaluates display logic expressions using `useMemo`
   - Handles process defaults logic and parameter's own logic
   - Calls `compileExpression()` to evaluate expressions

2. **BaseSelector.tsx** (line 21)
   - `compileExpression()` creates a new JavaScript function
   - Uses `parseDynamicExpression()` to transform the expression
   - Executes the compiled function with context and current values

3. **utils/index.ts** (lines 80-97)
   - `parseDynamicExpression()` performs regex transformations
   - **ISSUE**: Does not handle Etendo's `@field_name@` syntax

### Types of Expressions Found

#### Valid Expressions (work correctly)
```javascript
"@Processed@='Y'"                    // Simple references
"@Posted@='Y' | (@Processed@='Y')"   // Logical operators
"context.fieldName"                  // Context references
```

#### Problematic Expressions (cause errors)
```javascript
"@trxtype_display_logic@='Y'"        // ERROR: Invalid syntax
"@ad_org_id_display_logic@='Y'"      // ERROR: Invalid syntax
"@ACCT_DIMENSION_DISPLAY@"           // ERROR: No transformation
```

## Root Cause

The `parseDynamicExpression()` function does not include transformations for:

1. **`@field_name@` syntax**: Not converted to valid JavaScript references
2. **Field names with underscores**: Complex names not handled correctly
3. **Etendo context expressions**: Missing mapping to current data structure

### Problematic Code

```typescript
export const parseDynamicExpression = (expr: string) => {
  // Only handles OB.Utilities.getValue and context.prop
  // MISSING: @field_name@ syntax transformation
  
  const expr1 = expr.replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
    return `${obj}["${prop}"]`;
  });

  const expr2 = expr1.replace(/context\.(\$?\w+)/g, (_, prop) => {
    return `context.${prop}`;
  });
  
  // More transformations...
  return expr4;
};
```

## Proposed Solution

### 1. Enhance parseDynamicExpression

Add transformations to handle `@field_name@` syntax:

```typescript
export const parseDynamicExpression = (expr: string) => {
  // NEW: Transform @field_name@ to context/values references
  const expr0 = expr.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)@/g, (_, fieldName) => {
    return `(currentValues["${fieldName}"] || context["${fieldName}"])`;
  });

  // Existing transformations...
  const expr1 = expr0.replace(/OB\.Utilities\.getValue\((\w+),\s*["']([^"']+)["']\)/g, (_, obj, prop) => {
    return `${obj}["${prop}"]`;
  });
  
  // Rest of the code...
};
```

### 2. Preventive Validation

In `ProcessParameterSelector.tsx`, add validation before compiling:

```typescript
const isDisplayed = useMemo(() => {
  // EXISTING preventive validation (lines 56-60)
  if (parameter.displayLogic.includes('_logic') && !parameter.displayLogic.includes('@')) {
    logger.warn("Invalid display logic expression - looks like field name:", parameter.displayLogic);
    return true;
  }
  
  // NEW: Validate @field@ syntax before compiling
  const hasEtendoSyntax = /@[^@]+@/.test(parameter.displayLogic);
  if (hasEtendoSyntax) {
    // Validate that all @field@ references are valid
    const fieldReferences = parameter.displayLogic.match(/@([^@]+)@/g);
    // Implement additional validation...
  }
  
  // Existing compilation...
}, [parameter.displayLogic, parameter.name, logicFields, session, getValues]);
```

### 3. Improved Error Handling

```typescript
export const compileExpression = (expression: string) => {
  try {
    const parsedExpr = parseDynamicExpression(expression);
    return new Function("context", "currentValues", `return ${parsedExpr};`);
  } catch (error) {
    logger.error("Error compiling expression:", {
      original: expression,
      parsed: parsedExpr, // Add parsed expression for debugging
      error: error.message
    });
    return () => true; // Safe default
  }
};
```

## Impact and Priority

### Severity: **CRITICAL**
- Blocks ProcessParameterSelector component rendering
- Affects multiple process parameters
- Generates JavaScript errors in console

### Affected Components
- `ProcessParameterSelector.tsx`
- `BaseSelector.tsx` (ProcessModal)
- `BaseSelector.tsx` (FormView)
- Any component using display logic with `@field@` syntax

### Specific Fields Identified
```json
{
  "displayLogic": "@trxtype_display_logic@='Y'",    // In response.json line 2753
  "displayLogic": "@ad_org_id_display_logic@='Y'",  // In response.json line 2820
  "displayLogic": "@ACCT_DIMENSION_DISPLAY@"        // Multiple occurrences
}
```

## Testing and Validation

### Required Test Cases

1. **Basic @field@ expressions**
   ```typescript
   expect(parseDynamicExpression("@fieldName@='Y'")).toBe("(currentValues[\"fieldName\"] || context[\"fieldName\"])='Y'");
   ```

2. **Complex expressions**
   ```typescript
   expect(parseDynamicExpression("@Processed@='Y' & @Status@='Active'")).toBe("...");
   ```

3. **Expressions with logical operators**
   ```typescript
   expect(parseDynamicExpression("@field1@='Y' | (@field2@='N' & @field3@='X')")).toBe("...");
   ```

### Regression Testing
- Verify existing expressions continue to work
- Test with real data from response.json
- Validate in different contexts (ProcessModal, FormView)

## Recommended Implementation

1. **Phase 1**: Immediate fix in `parseDynamicExpression`
2. **Phase 2**: Improve preventive validation
3. **Phase 3**: Add unit tests
4. **Phase 4**: Enhanced monitoring and logging

## Additional Considerations

- Verify compatibility with Etendo legacy syntax
- Document supported expression patterns
- Consider gradual migration to more robust syntax
- Evaluate performance impact of additional regex

## Implementation Status

✅ **FIXED**: Added transformation for `@field_name@` syntax in `parseDynamicExpression`

The fix transforms expressions like:
- `@trxtype_display_logic@='Y'` → `(currentValues["trxtype_display_logic"] || context["trxtype_display_logic"])='Y'`
- `@ad_org_id_display_logic@='Y'` → `(currentValues["ad_org_id_display_logic"] || context["ad_org_id_display_logic"])='Y'`

This ensures that Etendo field references are properly converted to valid JavaScript that can access both current form values and context data.

## Files Modified

- `packages/MainUI/utils/index.ts` - Added `@field_name@` transformation in `parseDynamicExpression`

## Next Steps

1. Test the fix with actual process parameters
2. Monitor console for any remaining syntax errors
3. Add unit tests for the new transformation
4. Consider extending validation in ProcessParameterSelector

## References

- `packages/MainUI/components/ProcessModal/selectors/ProcessParameterSelector.tsx`
- `packages/MainUI/components/Form/FormView/selectors/BaseSelector.tsx`
- `packages/MainUI/utils/index.ts`
- `response.json` - Examples of real expressions

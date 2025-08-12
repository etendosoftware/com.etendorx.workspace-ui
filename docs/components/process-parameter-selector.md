# Process Parameter Selector System

## Overview

The Process Parameter Selector system provides a unified interface for routing process parameters to appropriate form controls, bridging the gap between ProcessParameters and FormView selectors for consistent UI rendering.

## Core Component: `ProcessParameterSelector`

Location: `packages/MainUI/components/ProcessModal/selectors/ProcessParameterSelector.tsx`

### Purpose
Acts as a smart router that maps ProcessParameters to the most appropriate FormView selector component based on field type, reference, and configuration.

### Architecture

#### Component Selection Logic
```typescript
const fieldType = useMemo(() => {
  return ProcessParameterMapper.getFieldType(parameter);
}, [parameter]);

const renderSelector = () => {
  switch (fieldType) {
    case "password":
      return <PasswordSelector field={mappedField} disabled={isReadOnly} />;
    case "boolean":
      return <BooleanSelector field={mappedField} isReadOnly={isReadOnly} />;
    case "numeric":
      return <NumericSelector field={mappedField} disabled={isReadOnly} />;
    // ... additional cases
    default:
      return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
  }
};
```

#### Field Mapping Integration
```typescript
const mappedField = useMemo(() => {
  return ProcessParameterMapper.mapToField(parameter);
}, [parameter]);
```

### Display Logic Evaluation

#### Priority System
1. **Process Defaults Logic** (highest priority)
2. **Parameter Display Logic** (fallback)
3. **Default Visible State** (final fallback)

```typescript
const isDisplayed = useMemo(() => {
  // Check process defaults logic first (takes precedence)
  const defaultsDisplayLogic = logicFields?.[`${parameter.name}.display`];
  if (defaultsDisplayLogic !== undefined) {
    return defaultsDisplayLogic;
  }
  
  // Fallback to parameter's own display logic
  if (!parameter.displayLogic) return true;
  
  // Validate expression format
  if (parameter.displayLogic.includes('_logic') && !parameter.displayLogic.includes('@')) {
    logger.warn("Invalid display logic expression - looks like field name:", parameter.displayLogic);
    return true;
  }
  
  // Wait for form data availability
  const currentValues = getValues();
  if (!currentValues || Object.keys(currentValues).length === 0) {
    return true; // Default to visible while loading
  }
  
  // Compile and execute expression
  try {
    const compiledExpr = compileExpression(parameter.displayLogic);
    return compiledExpr(session, currentValues);
  } catch (error) {
    logger.warn("Error executing display logic expression:", parameter.displayLogic, error);
    return true; // Default to visible on error
  }
}, [parameter.displayLogic, parameter.name, logicFields, session, getValues]);
```

#### ReadOnly Logic Evaluation
Similar pattern for readonly state determination:

```typescript
const isReadOnly = useMemo(() => {
  const defaultsReadOnlyLogic = logicFields?.[`${parameter.name}.readonly`];
  if (defaultsReadOnlyLogic !== undefined) {
    return defaultsReadOnlyLogic;
  }
  
  if (!parameter.readOnlyLogicExpression) return false;
  
  try {
    const compiledExpr = compileExpression(parameter.readOnlyLogicExpression);
    return compiledExpr(session, getValues());
  } catch (error) {
    logger.warn("Error executing readonly logic expression:", parameter.readOnlyLogicExpression, error);
    return false; // Default to editable on error
  }
}, [parameter.readOnlyLogicExpression, parameter.name, logicFields, session, getValues]);
```

### Supported Selector Types

#### Text-based Selectors
- **PasswordSelector**: For password fields
- **NumericSelector**: For numeric input with validation
- **TextSelector**: Default text input (via GenericSelector)

#### Date/Time Selectors
- **DateSelector**: Date picker for date fields
- **DatetimeSelector**: Date and time picker

#### Selection Selectors
- **BooleanSelector**: Checkbox for yes/no fields
- **ListSelector**: Dropdown for predefined options
- **SelectSelector**: Advanced selection with search
- **TableDirSelector**: Reference to other entities

#### Special Selectors
- **QuantitySelector**: Numeric input with unit support
- **WindowReferenceGrid**: Embedded grid for complex selections

### Error Handling and Fallbacks

#### Validation Before Rendering
```typescript
if (!mappedField.hqlName) {
  logger.warn("Missing hqlName for parameter:", parameter.name);
  return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
}
```

#### Selector-specific Error Handling
```typescript
try {
  // Render specific selector
  return <SpecificSelector {...props} />;
} catch (error) {
  logger.error("Error rendering selector for parameter:", parameter.name, error);
  return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
}
```

#### List Field Validation
```typescript
if (fieldType === "list") {
  if (!mappedField.refList || mappedField.refList.length === 0) {
    logger.warn("List field without options, falling back to GenericSelector:", parameter.name);
    return <GenericSelector parameter={parameter} readOnly={isReadOnly} />;
  }
  return <ListSelector field={mappedField} isReadOnly={isReadOnly} />;
}
```

### Integration Points

#### ProcessDefinitionModal
```typescript
return Object.values(parameters).map((parameter) => {
  if (parameter.reference === WINDOW_REFERENCE_ID) {
    return <WindowReferenceGrid key={...} parameter={parameter} />;
  }
  
  return (
    <ProcessParameterSelector 
      key={`param-${parameter.id || parameter.name}-${parameter.reference || 'default'}`}
      parameter={parameter}
      logicFields={logicFields} // Pass logic fields from process defaults
    />
  );
});
```

#### Form Integration
```typescript
<FormProvider {...form}>
  {/* ProcessParameterSelector has access to form context */}
  <ProcessParameterSelector parameter={parameter} logicFields={logicFields} />
</FormProvider>
```

### Performance Optimizations

#### Memoized Field Mapping
```typescript
const mappedField = useMemo(() => {
  return ProcessParameterMapper.mapToField(parameter);
}, [parameter]);
```

#### Memoized Field Type Detection
```typescript
const fieldType = useMemo(() => {
  return ProcessParameterMapper.getFieldType(parameter);
}, [parameter]);
```

#### Conditional Rendering
```typescript
// Don't render if display logic evaluates to false
if (!isDisplayed) {
  return null;
}
```

### Testing Strategies

#### Unit Tests
```typescript
describe('ProcessParameterSelector', () => {
  it('should render correct selector for each field type', () => {
    const booleanParam = { ...mockParameter, reference: 'boolean' };
    render(<ProcessParameterSelector parameter={booleanParam} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should respect display logic', () => {
    const hiddenParam = { ...mockParameter, displayLogic: '@field@=\'N\'' };
    render(<ProcessParameterSelector parameter={hiddenParam} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
```

#### Integration Tests
- Test with real process parameter configurations
- Verify form integration and value persistence
- Test display and readonly logic evaluation

### Common Issues and Solutions

#### Issue: Selector Not Rendering
**Problem**: Parameter not displaying in modal
**Solution**: Check display logic evaluation and field mapping

#### Issue: Incorrect Selector Type
**Problem**: Wrong input type for parameter
**Solution**: Verify ProcessParameterMapper.getFieldType logic

#### Issue: Values Not Persisting
**Problem**: Form values not saving correctly
**Solution**: Ensure proper hqlName mapping and form integration

### Future Enhancements

1. **Dynamic Selector Loading**: Load selectors based on runtime configuration
2. **Custom Selector Registration**: Allow plugins to register custom selectors
3. **Advanced Validation**: Field-level validation with error display
4. **Accessibility Improvements**: Enhanced ARIA support and keyboard navigation

## Related Documentation

- [Process Parameter Mapper](./process-parameter-mapper.md)
- [Display Logic Expression Parsing](./display-logic-expression-parsing.md)
- [FormView Selector Integration](../../components/formview-selectors.md)

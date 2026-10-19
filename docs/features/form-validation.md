# Client-Side Form Validation

## Overview
The form validation system provides client-side validation for required fields before form submission, improving user experience and reducing server load.

## Architecture

### Components
1. **useFormValidation Hook**: Core validation logic
2. **ToolbarContext Integration**: Save button state management  
3. **FormView Integration**: Validation execution during save
4. **Error Display**: User-friendly error messages

## Required Fields Detection

### Field Criteria
A field is considered for required validation if:
```typescript
field.isMandatory && field.displayed && !field.readOnly
```

### Display Logic Integration
Hidden fields (via display logic) are automatically excluded:
```typescript
const isFieldDisplayed = (field: Field): boolean => {
  if (!field.displayLogicExpression) return field.displayed;
  
  try {
    const currentValues = getValues();
    const compiledExpression = compileExpression(field.displayLogicExpression);
    return compiledExpression(session, currentValues);
  } catch (error) {
    console.warn(`Error evaluating display logic for field ${field.hqlName}:`, error);
    return field.displayed; // Default to displayed on error
  }
};
```

## Validation Rules by Field Type

### String Fields (FIELD_REFERENCE_CODES.STRING, TEXT_LONG)
- **Constants**: `FIELD_REFERENCE_CODES.STRING` ("10"), `FIELD_REFERENCE_CODES.TEXT_LONG` ("14")
- **Rule**: `value.trim() !== ''`
- **Purpose**: Ensure non-empty strings with whitespace trimming

### Reference Fields (FIELD_REFERENCE_CODES.TABLE_DIR_18, TABLE_DIR_19)  
- **Constants**: `FIELD_REFERENCE_CODES.TABLE_DIR_18` ("18"), `FIELD_REFERENCE_CODES.TABLE_DIR_19` ("19")
- **Rule**: Both `value` and `${fieldName}$_identifier` must exist
- **Purpose**: Ensure complete reference field data for foreign key relationships

### Numeric Fields (FIELD_REFERENCE_CODES.INTEGER, NUMERIC, QUANTITY_22)
- **Constants**: `FIELD_REFERENCE_CODES.INTEGER` ("11"), `FIELD_REFERENCE_CODES.NUMERIC` ("12"), `FIELD_REFERENCE_CODES.QUANTITY_22` ("22")
- **Rule**: Any numeric value including 0, reject null/undefined/empty string
- **Purpose**: Allow zero as valid business value while ensuring field completion

### Boolean Fields (FIELD_REFERENCE_CODES.BOOLEAN)
- **Constants**: `FIELD_REFERENCE_CODES.BOOLEAN` ("20")
- **Rule**: Both true and false are valid, reject null/undefined
- **Purpose**: Both boolean states represent valid user selections

## Error Handling

### Error Message Format
```
"The following required fields are missing: Field 1, Field 2, Field 3"
```

### Error Display
- **Modal**: Uses existing `showErrorModal` function
- **User-Friendly**: Field labels instead of internal names
- **Actionable**: Clear indication of what needs to be filled
- **Revealed**: The missing fields are made visible and focused (see below)

### Revealing Missing Fields in Collapsed Sections
A required field can live in a section (AD_FieldGroup) that is collapsed, so the error
message alone is not enough to find it. When `FormActions.handleSave` blocks a save, it
shows the error and then calls the optional `onFieldErrors` prop with the `hqlName` of
every missing field. `FormView` wires it to `useRevealFieldErrors`, which:

1. Resolves the section of each field with `resolveFieldSectionId` (`field.fieldGroup`,
   or `MAIN_SECTION_ID` — the same rule `useFormFields` uses to build the sections).
2. Expands every collapsed section involved through `setExpandedSections` and
   `addSectionsToExpand`. Sections that are already expanded are left untouched, and
   when nothing has to be expanded the expansion state is not written at all.
3. Moves the focus to the first missing field **in form order** (not in the order the
   errors were reported) with `findFirstFieldFocusTarget`, and scrolls it to the
   center of the form. When a section had to be expanded, the focus waits
   `SECTION_TRANSITION_MS` (the `Collapsible` animation) because the fields of a
   collapsed section are not focusable until it opens.

A successful save never calls `onFieldErrors`, so it leaves the expansion state as it is.

**Decisions**
- Only the client-side required-field validation triggers it; server-side field errors
  keep their current handling in `useFormAction`.
- The focus moves even when every involved section was already expanded, matching
  Classic's `OBViewForm.setFocusInErrorField`.
- The sections are expanded with `setExpandedSections` instead of
  `handleAccordionChange`, which would also change `selectedTab` and scroll to the
  last expanded section instead of the field.
- Fields that are not rendered in the sections (e.g. status-bar fields) are skipped.

**Differences with Classic**
- Classic (`OBViewForm.handleFieldErrors`) focuses `getFirstErrorItem()` and keeps no
  per-tab section preference; here the expansion goes through the per-tab persisted preference
  (`useFormSectionsPersistenceTab`), so the section stays expanded on the next opening,
  as if the user had expanded it.
- The focused field is smoothly scrolled to the center of the form.

**Files**
- `hooks/useRevealFieldErrors.ts` — expansion and focus orchestration
- `utils/form/expandedSections.ts` — `resolveFieldSectionId`, `addSectionsToExpand`, `SECTION_TRANSITION_MS`
- `utils/form/focus.ts` — `findFirstFieldFocusTarget` (see the
  [form keyboard navigation](./form-keyboard-navigation/README.md) docs for the focus contract)
- `components/Form/FormView/FormActions.tsx` — `onFieldErrors` prop
- `components/Form/FormView/index.tsx` — wiring

## Usage Examples

### Basic Usage in FormView
```typescript
const { validateRequiredFields, getValidationSummary } = useFormValidation(tab);

const handleSave = async () => {
  const validation = validateRequiredFields();
  if (!validation.isValid) {
    showErrorModal(validation.errorMessage);
    return;
  }
  // Proceed with save...
};
```

### Testing Validation Logic
```typescript
test('should validate required fields', () => {
  const { result } = renderHook(() => useFormValidation(mockTab), {
    wrapper: TestWrapper
  });
  
  const validation = result.current.validateRequiredFields();
  expect(validation.missingFields).toContain('requiredFieldName');
});
```

## Performance Considerations

### Efficient Field Processing
- Fields filtered once during hook initialization
- Display logic evaluated only when needed
- Form values accessed via `getValues()` for performance

### Memory Management
- No memory leaks from validation logic
- Efficient cleanup of validation results
- Minimal impact on form rendering performance

## Integration with Save Button

The validation system integrates seamlessly with the enhanced Save button:

```typescript
// In ToolbarContext - validation state management
const [saveButtonState, setSaveButtonState] = useState<SaveButtonState>({
  isCalloutLoading: false,
  hasValidationErrors: false,
  isSaving: false,
  validationErrors: []
});

// In FormView - validation execution
const handleSave = useCallback(async (showModal: boolean) => {
  // 1. Check callout state
  if (globalCalloutManager.isCalloutRunning()) return;
  
  // 2. Validate required fields
  const validation = validateRequiredFields();
  if (!validation.isValid) {
    showErrorModal(validation.errorMessage);
    return;
  }
  
  // 3. Proceed with save
  await save(showModal);
}, [validateRequiredFields, save]);
```

## Field Reference Constants Integration

The validation system uses typed constants for field type identification:

```typescript
import { FIELD_REFERENCE_CODES } from '@/utils/form/constants';

// Type-safe field reference checking
if (field.column?.reference === FIELD_REFERENCE_CODES.STRING) {
  // String field validation
  return !!(value && typeof value === 'string' && value.trim() !== '');
}

if (field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_18 ||
    field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_19) {
  // Reference field validation
  const identifierValue = formValues[`${field.hqlName}$_identifier`];
  return !!(value && identifierValue);
}
```

## Troubleshooting

### Common Issues
1. **Field Not Validated**: Check if field meets criteria (mandatory + displayed + not readonly)
2. **Display Logic Errors**: Validation gracefully handles expression errors
3. **Reference Field Issues**: Ensure both value and identifier are populated

### Debugging
```typescript
// Add to validation logic for debugging
console.log('Required fields:', requiredFields.map(f => f.hqlName));
console.log('Form values:', getValues());
console.log('Validation result:', validateRequiredFields());
```

## Testing

The validation system includes comprehensive unit tests:

### Test Structure
- **Field Detection Tests**: Verify correct identification of required fields
- **Validation Logic Tests**: Test each field type's validation rules
- **Edge Case Tests**: Handle empty tabs, display logic errors, etc.
- **Integration Tests**: Complete validation flow testing

### Key Test Cases
```typescript
// String field validation
test('should handle string fields correctly', () => {
  const emptyResult = validateField(field, '', {});
  expect(emptyResult.isValid).toBe(false);
  
  const whitespaceResult = validateField(field, '   ', {});
  expect(whitespaceResult.isValid).toBe(false);
  
  const validResult = validateField(field, 'valid value', {});
  expect(validResult.isValid).toBe(true);
});

// Reference field validation
test('should handle reference fields correctly', () => {
  const validResult = validateField(field, 'ref-value', {
    referenceField: 'ref-value',
    referenceField$_identifier: 'ref-identifier'
  });
  expect(validResult.isValid).toBe(true);
});
```

## Future Enhancements

### Phase 2 Considerations
- **Real-time Validation**: Add validation during user input
- **Field-level Indicators**: Visual validation state per field
- **Custom Validation Rules**: Support for business-specific validation
- **Progressive Disclosure**: Show validation errors incrementally

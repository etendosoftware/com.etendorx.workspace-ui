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

### Link (URL) Fields (FIELD_REFERENCE_CODES.LINK)
- **Constants**: `FIELD_REFERENCE_CODES.LINK` ("800101")
- **Rule**: Format check, not a required check: every displayed, editable Link field with a value must be
  a valid URL, whether it is mandatory or not. Runs through `validateLinkFields()` after
  `validateRequiredFields()` passes, with its own message:
  `"The following fields do not contain a valid URL: URL"` (`form.link.invalidUrlFields`).
- **Details**: rules, Classic differences and the grid counterpart in
  [link-fields/README.md](./link-fields/README.md)

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
- Both the client-side required-field validation and the field errors the server returns on
  save (see [Server Field Errors](#server-field-errors)) trigger it.
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

## Server Field Errors

When the server rejects a save because of the value of one or more fields, it answers with a
map of property name to message:
`{response: {status: -4, errors: {referenceNo: "BusinessPartner.referenceNo: Value too long…"}}}`.
The keys are DAL property names, i.e. the `hqlName` of the fields. As Classic's
`OBViewForm.handleFieldErrors` does, the form now:

1. **Marks every rejected field**: a red border around the input and an error icon at its
   top-right corner. The tooltip of the icon holds the server message (the icon's
   `aria-label` holds it too). The border ignores pointer events and the icon is not
   focusable, so the field keeps its clicks and remains a single tab stop.
2. **Reveals the first one**: the field names go through `useRevealFieldErrors`, the same
   path as the missing required fields above, so collapsed sections are expanded and the
   first field in form order gets the focus.
3. **Keeps the general notification**: it lists the messages, separated by `; `.

**Messages**
- The property name inside a message is replaced by the field label, as Classic does
  (`BusinessPartner.referenceNo: …` → `BusinessPartner.Reference No.: …`). Properties
  without a field in the tab keep their name.
- In the general notification, a message that does not name its field (e.g. a conversion
  error such as `Invalid date`) is prefixed with the field label (`Accounting Date: Invalid date`),
  so the notification always says which field failed. The field itself shows the message
  as is.

**Lifetime of the marks**
- Changing the value of a marked field clears its mark. This covers typing, a callout
  setting the value and discarding the changes.
- A successful save clears all the marks.
- Showing another record, a new record, or closing the form clears all the marks too.
- A field that mounts after the rejected save keeps its mark: only a value change clears
  it, not the first render.

**Decisions**
- The errors live in their own store (`serverFieldErrorsStore`, one scope per tab form), not
  in react-hook-form's `setError`. An error set there on a key the form does not register
  (e.g. `id`) is never cleared by the next submit and silently blocks every later save.
  The store also keeps re-renders to the affected fields only, like the callout highlight.
- The mark is a border and an icon with a tooltip, not a text line under the input. Form rows
  have a fixed height, and a text line would overlap the next row.
- Only the response's `errors` map is read. Errors returned as a single `error.message`
  (process, trigger or database errors) keep the current single notification.

**Grid inline editing**

The same map is turned into cell errors when an inline row save fails: each property gets a
`server` validation error keyed by `field.name` (the key the grid uses for every cell error),
with the labelled message. The cell is marked and the row's actions column lists the
messages. The general notification is kept. The row stays in edit mode, so the focus is not moved.
A cell error is cleared by the grid's own real-time validation when the cell is edited or
left. See the [inline editing audit](./inline-editing/2026-10-21-audit.md) for how the map
reached the general message before this change.

**Differences with Classic**
- Classic shows the joined messages in the view's message bar; here they are shown in the
  error notification.
- Classic marks the field with an error icon only; here the input also gets a red border.
- Classic's grid moves the focus to the first wrong cell; the inline grid does not.

**Files**
- `utils/form/serverFieldErrors.ts` — reads the `errors` map, labels the messages and builds the general message
- `stores/serverFieldErrorsStore.ts` — field errors per form scope (`getFormHighlightScope(tab.id)`)
- `components/Form/FormView/ServerFieldErrorOverlay.tsx` — border and icon with the message
- `components/Form/FormView/selectors/BaseSelector.tsx` — renders the overlay and clears the error when the value changes
- `hooks/useFormAction.ts` — `onServerFieldErrors` callback on a rejected save
- `components/Form/FormView/index.tsx` — stores and reveals the errors and clears them on success or record change
- `components/Table/utils/saveOperations.ts` — cell errors for the grid inline save

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
- **Field-level Indicators**: Visual validation state per field (done for the field
  errors returned by the server, see [Server Field Errors](#server-field-errors))
- **Custom Validation Rules**: Support for business-specific validation
- **Progressive Disclosure**: Show validation errors incrementally

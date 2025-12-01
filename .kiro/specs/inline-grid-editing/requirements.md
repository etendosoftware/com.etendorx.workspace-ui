# Requirements Document

## Introduction

This feature introduces inline editing capabilities to the Material React Table grid component in the Etendo ERP system. Users will be able to edit and create records directly within the grid interface, providing a spreadsheet-like experience without leaving the grid context. This enhancement aims to improve user efficiency by reducing the need to navigate to separate form views for simple data modifications.

## Glossary

- **Grid**: The Material React Table component displaying tabular data
- **Inline Editing**: The ability to edit cell values directly within the grid without opening a separate form
- **Row State**: The current editing status of a table row (read-only, editing, error)
- **Actions Column**: A dedicated column containing row-level action buttons
- **Edit Mode**: The state when a row's cells become editable input fields
- **Form Mode**: The traditional full-form view for detailed record editing
- **Cell Editor**: Input component rendered within a cell during edit mode
- **Row Validation**: Client-side validation performed on row data before saving
- **Backend Validation**: Server-side validation that may return errors after save attempts

## Requirements

### Requirement 1

**User Story:** As a user, I want to edit existing records directly in the grid, so that I can make quick modifications without opening the full form view.

#### Acceptance Criteria

1. WHEN a user right-clicks on any row in the grid, THE Grid SHALL display a context menu with "Insert Row" and "Edit Row" options
2. WHEN a user selects "Edit Row" from the context menu OR clicks the pencil icon button in the Actions column, THE Grid SHALL render all cells in that row as editable input components
3. WHILE a row is in edit mode, THE Grid SHALL display "Save" and "Cancel" buttons in the Actions column
4. WHEN a user modifies cell values in edit mode, THE Grid SHALL update the row's editing state with the new values
5. WHEN a user clicks "Save" on a valid row, THE Grid SHALL send a PATCH request to update the record
6. IF the save operation succeeds, THEN THE Grid SHALL update the displayed data and return the row to read-only mode

### Requirement 2

**User Story:** As a user, I want to create new records directly in the grid through a context menu, so that I can add data efficiently without navigating to a separate form.

#### Acceptance Criteria

1. WHEN a user right-clicks on any row in the grid, THE Grid SHALL display a context menu with "Insert Row" and "Edit Row" options
2. WHEN a user selects "Insert Row" from the context menu, THE Grid SHALL add a new empty row at the top of the grid
3. THE Grid SHALL immediately set the new row to edit mode with all cells as editable inputs
4. WHEN a user fills required fields and clicks "Save", THE Grid SHALL send a POST request to create the record
5. IF the creation succeeds, THEN THE Grid SHALL convert the new row to a standard read-only row
6. WHEN a user clicks "Cancel" on a new row, THE Grid SHALL remove the row from the grid entirely

### Requirement 3

**User Story:** As a user, I want appropriate input components for different field types, so that I can enter data using familiar interface elements.

#### Acceptance Criteria

1. WHEN a cell enters edit mode, THE Grid SHALL render the appropriate input component based on the column's metadata type
2. WHERE the field type is Date/DateTime, THE Grid SHALL render the DateInput component
3. WHERE the field type is List/TableDir, THE Grid SHALL render the SelectSelector or search selector component
4. WHERE the field type is Numeric/Quantity, THE Grid SHALL render the NumericSelector component
5. WHERE the field type is Boolean, THE Grid SHALL render a checkbox or switch component
6. WHERE the field type is String, THE Grid SHALL render a standard TextInput component

### Requirement 4

**User Story:** As a user, I want validation feedback when editing rows, so that I can correct errors before saving data.

#### Acceptance Criteria

1. WHEN a user attempts to save a row with empty mandatory fields, THE Grid SHALL highlight the row and invalid cells in red
2. THE Grid SHALL prevent the save operation until all validation errors are resolved
3. WHEN a field loses focus with invalid data, THE Grid SHALL immediately highlight the validation error
4. IF backend validation fails during save, THEN THE Grid SHALL display an error icon in the Actions column
5. WHILE a row has validation errors, THE Grid SHALL maintain the row in edit mode until errors are resolved or cancelled

### Requirement 5

**User Story:** As a user, I want to manage multiple rows in edit mode simultaneously, so that I can work efficiently with batch data entry.

#### Acceptance Criteria

1. THE Grid SHALL support multiple rows in edit mode simultaneously
2. WHEN a user saves one row successfully, THE Grid SHALL maintain other rows in their current edit states
3. WHEN a user cancels editing on one row, THE Grid SHALL not affect the edit state of other rows
4. THE Grid SHALL track editing state independently for each row using unique row identifiers
5. WHEN a user refreshes or navigates away, THE Grid SHALL prompt to save or discard unsaved changes

### Requirement 6

**User Story:** As a user, I want clear visual feedback about row states, so that I can understand which rows are being edited and their current status.

#### Acceptance Criteria

1. WHILE a row is in edit mode, THE Grid SHALL visually distinguish it from read-only rows
2. WHEN a row has validation errors, THE Grid SHALL display a red border around the row
3. WHEN a row has backend save errors, THE Grid SHALL display an error icon in the Actions column
4. THE Grid SHALL provide hover tooltips explaining error states when applicable
5. WHEN a row is successfully saved, THE Grid SHALL provide brief visual confirmation before returning to read-only state

### Requirement 7

**User Story:** As a user, I want to access the full form view when needed, so that I can perform complex edits that require the complete interface.

#### Acceptance Criteria

1. THE Grid SHALL display two separate action buttons in the Actions column for each row: a pencil icon for inline editing and a form icon for full form view
2. WHEN a user clicks the form icon button, THE Grid SHALL navigate to the full form view for that record
3. THE Grid SHALL maintain both action buttons available even when other rows are in edit mode
4. WHEN returning from form view, THE Grid SHALL refresh the row data to reflect any changes made
5. THE Grid SHALL preserve any other rows' edit states when navigating to and from form view
# Custom JS Columns - API Reference

## Functions

### `evaluateCustomJs(jsCode: string, context: CustomJsContext): Promise<unknown>`

Evaluates custom JavaScript code with provided context.

**Parameters:**
- `jsCode` (string): JavaScript expression to evaluate
- `context` (CustomJsContext): Evaluation context containing record and column data

**Returns:** Promise resolving to evaluation result or error message

**Example:**
```typescript
const result = await evaluateCustomJs(
  "(record) => record.name.toUpperCase()",
  { record: { name: "John" }, column: columnMetadata }
);
// Result: "JOHN"
```

**Error Handling:**
- Returns `[Error: message]` format on evaluation failure
- Logs errors to console for debugging

---

### `transformColumnsWithCustomJs(originalColumns: Column[], fields: Field[]): Column[]`

Transforms column definitions to include custom JS cell components.

**Parameters:**
- `originalColumns` (Column[]): Original column definitions
- `fields` (Field[]): Field definitions containing etmetaCustomjs

**Returns:** Transformed columns with custom Cell components

**Example:**
```typescript
const transformedColumns = transformColumnsWithCustomJs(
  originalColumns,
  fieldsWithCustomJs
);
```

---

## Components

### `CustomJsCell`

React component for rendering custom JavaScript evaluated cells.

**Props:**
```typescript
interface CustomJsCellProps {
  cell: MRT_Cell<EntityData, unknown>;
  row: MRT_Row<EntityData>;
  customJsCode: string | null | undefined;
  column: Column;
}
```

**Properties:**
- `cell`: Material React Table cell instance
- `row`: Material React Table row instance  
- `customJsCode`: JavaScript expression to evaluate
- `column`: Column metadata

**Usage:**
```typescript
<CustomJsCell
  cell={cell}
  row={row}
  customJsCode="(record) => record.status"
  column={columnMetadata}
/>
```

**Behavior:**
- Evaluates JavaScript on component mount and dependency changes
- Shows loading state during evaluation (returns null)
- Falls back to original value on errors
- Supports various return types (string, number, JSX, colors)

---

## Types

### `CustomJsContext`

Context object passed to JavaScript evaluation.

```typescript
interface CustomJsContext {
  record: Record<string, unknown>;
  column: Column;
}
```

**Properties:**
- `record`: Current row data
- `column`: Column metadata and configuration

---

### `Field` (Extended)

Field interface extended with custom JavaScript support.

```typescript
interface Field {
  // ... existing properties
  etmetaCustomjs?: string | null;
}
```

**New Property:**
- `etmetaCustomjs`: JavaScript expression for custom cell rendering

---

## Hooks Integration

### `useColumns(tab: Tab)`

Enhanced hook that automatically processes custom JavaScript columns.

**Flow:**
1. Parses original columns from fields
2. Applies reference column transformations
3. Applies custom JavaScript transformations
4. Returns processed columns

**Example:**
```typescript
const columns = useColumns(tab);
// Columns automatically include custom JS cells where configured
```

---

## Color Utilities

### `isColorString(value: unknown): boolean`

Determines if a value represents a valid CSS color.

**Parameters:**
- `value`: Value to evaluate

**Returns:** Boolean indicating if value is a valid color

**Supported Formats:**
- Hexadecimal: `#fff`, `#ffffff`
- RGB/RGBA: `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)`
- HSL/HSLA: `hsl(120, 100%, 50%)`, `hsla(120, 100%, 50%, 0.3)`
- Named colors: `red`, `blue`, `transparent`, etc.

**Example:**
```typescript
isColorString("#FF0000"); // true
isColorString("rgb(255, 0, 0)"); // true
isColorString("invalid"); // false
```

---

### `ColorCell`

Component for rendering color-coded cells.

**Props:**
```typescript
interface ColorCellProps {
  color: string;
}
```

**Usage:**
```typescript
<ColorCell color="#FF0000" />
```

**Features:**
- Automatic background color application
- Contrast-based text color calculation
- Full cell coverage styling

---

## JavaScript Execution Context

### Available Objects

When executing custom JavaScript, the following objects are available:

#### `record`
Current row data with all field values.

```javascript
// Access field values
record.id
record.name
record.amount
record.status
```

#### `column`
Column metadata and configuration.

```javascript
// Access column properties
column.id
column.name
column.header
```

#### `Metadata`
Etendo metadata API (read-only access).

```javascript
// Access metadata (limited functionality)
Metadata.someReadOnlyMethod()
```

### Restricted Context

The following are NOT available for security:
- `window`, `document` (DOM access)
- `fetch`, `XMLHttpRequest` (network access)  
- `setTimeout`, `setInterval` (timers)
- `eval`, `Function` (dynamic evaluation)
- `import`, `require` (module loading)

---

## Error Types

### JavaScript Runtime Errors
```
[Error: Cannot read property 'property' of undefined]
```

### Syntax Errors
```
[Error: Unexpected token ']']
```

### Type Errors
```
[Error: record.amount.nonexistent is not a function]
```

### Reference Errors
```
[Error: undefinedVariable is not defined]
```

---

## Performance Characteristics

### Evaluation Timing
- **Initial Load**: Evaluates for all visible rows
- **Scroll**: Evaluates for newly visible rows
- **Data Change**: Re-evaluates affected rows
- **Dependency Change**: Re-evaluates when customJsCode changes

### Memory Usage
- Each cell maintains evaluation result in state
- Results cleared when component unmounts
- No persistent caching in current implementation

### Optimization Tips
- Keep expressions simple and fast
- Avoid complex computations in expressions
- Consider memoization for expensive operations
- Use simple conditionals over complex logic

---

## Testing Utilities

### Mock Functions

For testing, mock the evaluation function:

```typescript
jest.mock('@/utils/customJsEvaluator', () => ({
  evaluateCustomJs: jest.fn(),
}));

const mockEvaluateCustomJs = jest.mocked(
  require('@/utils/customJsEvaluator').evaluateCustomJs
);
```

### Test Helpers

```typescript
// Create test context
const createTestContext = (record: any, column: any): CustomJsContext => ({
  record,
  column,
});

// Create test cell props
const createTestCellProps = (customJsCode: string) => ({
  cell: mockCell,
  row: mockRow,
  customJsCode,
  column: mockColumn,
});
```

---

## Integration Examples

### Basic Integration
```typescript
// 1. Configure field with custom JS
const field: Field = {
  name: "displayName",
  etmetaCustomjs: "(record) => record.firstName + ' ' + record.lastName"
};

// 2. Use in table (automatic)
const columns = useColumns(tab);
```

### Advanced Integration
```typescript
// Custom transformer usage
const customColumns = transformColumnsWithCustomJs(
  originalColumns,
  fieldsArray
);

// Manual cell usage
const CustomCell = () => (
  <CustomJsCell
    cell={cell}
    row={row}
    customJsCode="(record) => record.amount * 1.21"
    column={column}
  />
);
```

---

## Version Compatibility

- **Material React Table**: v2.x+
- **React**: v18.x+
- **TypeScript**: v5.x+
- **Node.js**: v18.x+

## Migration Notes

### From v1.0 to v2.0
- No breaking changes in API
- Enhanced color support added
- Improved error handling

### Upgrading Dependencies
When upgrading Material React Table:
1. Verify MRT_Cell and MRT_Row type compatibility
2. Test custom JS evaluation with new MRT version
3. Update type imports if necessary

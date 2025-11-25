# Date Formatting in DynamicTable

This document describes how date parsing and formatting works in the DynamicTable, replicating the behavior of Etendo Classic.

## Overview

Dates coming from the Etendo Classic backend are displayed in the DynamicTable with the following behavior:

1. **Automatic detection**: All columns of type `date` or `datetime` are automatically detected
2. **Correct parsing**: Supports both simple dates (`yyyy-MM-dd`) and ISO datetime with timezone
3. **Browser formatting**: Uses `Intl.DateTimeFormat` to format according to browser locale
4. **Optional time**: Audit columns (`creationDate`, `updated`) also display time

## Data Structure

### Input format from backend

There are two main formats that come from the backend:

```json
{
  "invoiceDate": "2025-10-06",                          // Plain date
  "accountingDate": "2025-10-06",                       // Plain date
  "creationDate": "2025-10-06T10:20:00-03:00",         // ISO datetime with timezone
  "updated": "2025-10-06T15:03:15-03:00",              // ISO datetime with timezone
  "finalSettlementDate": null                           // Null values are handled
}
```

### Output format (according to browser locale)

**Note**: The separator is locale-specific (Intl.DateTimeFormat determines which to use):

```
Argentina (es-AR):     06-10-2025
Spain (es-ES):         06-10-2025
USA (en-US):           10/06/2025
Germany (de-DE):       06.10.2025
France (fr-FR):        06/10/2025
```

With time (for audit columns):
```
Argentina:             06-10-2025 10:20:00
Spain:                 06-10-2025 10:20:00
USA:                   10/06/2025 10:20:00 AM
Germany:               06.10.2025 10:20:00
```

## Main Functions

### `formatClassicDate(value, includeTime?)`

Primary function to use. Combines parsing and formatting in a single step:

```typescript
import { formatClassicDate } from "@/utils/dateFormatter";

// Without time (default)
formatClassicDate("2025-10-06") → "06-10-2025"
formatClassicDate("2025-10-06T10:20:00-03:00") → "06-10-2025"

// With time
formatClassicDate("2025-10-06T10:20:00-03:00", true) → "06-10-2025 10:20:00"

// Null values
formatClassicDate(null) → ""
formatClassicDate(undefined) → ""
```

### `parseOBDate(value)`

Parses a date from the backend:

```typescript
parseOBDate("2025-10-06")                    // Date(2025, 9, 6)
parseOBDate("2025-10-06T10:20:00-03:00")    // Date(2025, 9, 6, ...)
parseOBDate(null)                            // null
parseOBDate("invalid")                       // null
```

### `formatBrowserDate(date)`

Formats a date WITHOUT time (with locale-specific separator):

```typescript
formatBrowserDate(new Date(2025, 9, 6)) → "06-10-2025" (Argentina)
formatBrowserDate(new Date(2025, 9, 6)) → "06.10.2025" (Germany)
formatBrowserDate(new Date(2025, 9, 6)) → "10/06/2025" (USA)
formatBrowserDate(null) → ""
```

### `formatBrowserDateTime(date, includeTime)`

Formats a date WITH or WITHOUT time (with locale-specific separator):

```typescript
const date = new Date(2025, 9, 6, 10, 20, 0);
formatBrowserDateTime(date, false) → "06-10-2025" (Argentina)
formatBrowserDateTime(date, true)  → "06-10-2025 10:20:00" (Argentina)
formatBrowserDateTime(date, false) → "06.10.2025" (Germany)
formatBrowserDateTime(date, true)  → "06.10.2025 10:20:00" (Germany)
```

## Automatic Date Column Detection

In `useColumns.tsx`, detection is **strictly by DATA TYPE**:

```typescript
// In Etendo Classic there are 2 date/time types (FieldType enum):
// - DATE = "date"        (date only, no time)
// - DATETIME = "datetime" (date + time)

const isDateColumn =
  column.column?.reference === FIELD_REFERENCE_CODES.DATE ||      // Detected by reference code 15
  column.column?.reference === FIELD_REFERENCE_CODES.DATETIME;    // Or reference code 16
```

**This means:**
- ✅ Only formats if the type is really a date or datetime field
- ✅ Does not format numeric fields (documentNo, amount, etc.)
- ✅ Not fooled by column names
- ✅ Etendo metadata must be correct (types properly assigned)

## Audit Columns

There are special columns that always include time:

```typescript
const AUDIT_DATE_COLUMNS_WITH_TIME = ["creationDate", "updated"];
```

These columns display format with time:
- `creationDate`: 06-10-2025 10:20:00
- `updated`: 06-10-2025 15:03:15

All other date columns display only the date:
- `invoiceDate`: 06-10-2025
- `accountingDate`: 06-10-2025

## Implementation in DynamicTable

Automatic rendering is applied in the `useColumns.tsx` hook:

```typescript
// Detects date columns (by reference code for accuracy)
const isDateColumn =
  column.column?.reference === FIELD_REFERENCE_CODES.DATE ||
  column.column?.reference === FIELD_REFERENCE_CODES.DATETIME;

// Applies automatic formatting
if (isDateColumn) {
  // Includes time for creationDate, updated, or if datetime type
  const includeTime =
    AUDIT_DATE_COLUMNS_WITH_TIME.includes(column.columnName) ||
    column.column?.reference === FIELD_REFERENCE_CODES.DATETIME;
  columnConfig = {
    ...columnConfig,
    Cell: ({ cell }) => {
      const value = cell?.getValue();
      const formattedDate = formatClassicDate(value, includeTime);
      return <span>{formattedDate}</span>;
    },
  };
}
```

## Usage Examples

### In an invoice table

```json
{
  "documentNo": "10000018",
  "documentStatus": "DR",
  "invoiceDate": "2025-10-06",           // → 06-10-2025
  "accountingDate": "2025-10-06",        // → 06-10-2025
  "creationDate": "2025-10-06T10:20:00-03:00",  // → 06-10-2025 10:20:00
  "updated": "2025-10-06T15:03:15-03:00",       // → 06-10-2025 15:03:15
  "finalSettlementDate": null             // → (empty)
}
```

### Table output (Argentina)
```
| Document | Status | Invoice Date | Accounting Date | Creation Date         | Updated               | Settlement Date |
|----------|--------|--------------|-----------------|----------------------|----------------------|-----------------|
| 10000018 | DR     | 06-10-2025   | 06-10-2025      | 06-10-2025 10:20:00 | 06-10-2025 15:03:15 |                 |
```

### Table output (USA)
```
| Document | Status | Invoice Date | Accounting Date | Creation Date         | Updated               | Settlement Date |
|----------|--------|--------------|-----------------|----------------------|----------------------|-----------------|
| 10000018 | DR     | 10-06-2025   | 10-06-2025      | 10-06-2025 10:20:00 | 10-06-2025 15:03:15 |                 |
```

## Special Cases

### Null values
```typescript
formatClassicDate(null)         // → ""
formatClassicDate(undefined)    // → ""
formatClassicDate("")           // → ""
```

### Numeric timestamps
```typescript
const timestamp = new Date("2025-10-06").getTime();
formatClassicDate(timestamp)    // Works correctly
```

### Dates with different timezones
```typescript
formatClassicDate("2025-10-06T10:20:00-03:00") // Parsed correctly
formatClassicDate("2025-10-06T10:20:00+02:00") // Parsed correctly
formatClassicDate("2025-10-06T10:20:00Z")      // Parsed correctly
```

## Date Filtering in Tables

Date filtering uses the `DateSelector` component with an interactive `RangeDateModal`:

### Components
- **DateSelector**: Wrapper component for filtering by date
- **RangeDateModal**: Interactive modal for selecting date ranges

### Usage

```typescript
import { DateSelector } from "@/components/Table/DateSelector";

// In table filter configuration
{
  enableColumnFilter: true,
  Filter: () => (
    <DateSelector
      column={column}
      onFilterChange={(filterValue: string) => {
        onDateTextFilterChange?.(column.columnName, filterValue);
      }}
    />
  ),
}
```

### Filter Format

The filter supports both single dates and ranges:

```typescript
// Single date (From)
"2025-10-06 - "

// Date range (From - To)
"2025-10-06 - 2025-10-15"

// Single date (To)
" - 2025-10-15"
```

## Testing

All cases are covered in:
```
packages/MainUI/__tests__/utils/dateFormatter.test.ts
```

Includes tests for:
- Parsing different formats
- Formatting according to locale
- Null and invalid values
- Real Invoice data
- Different timezones
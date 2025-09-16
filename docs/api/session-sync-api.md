# Session Sync API Documentation

## Overview

This document describes the API functions and interfaces for the table selection session synchronization feature. The API reuses existing form initialization infrastructure with specialized session synchronization behavior.

## Core Functions

### syncSelectedRecordsToSession

Synchronizes selected table records with the backend session using the form initialization endpoint.

#### Signature

```typescript
async function syncSelectedRecordsToSession(params: {
  tab: Tab;
  selectedRecords: EntityData[];
  setSession: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  parentId?: string;
}): Promise<void>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tab` | `Tab` | ✅ | Tab metadata containing field definitions and entity information |
| `selectedRecords` | `EntityData[]` | ✅ | Array of selected record objects with ID fields |
| `setSession` | `Function` | ✅ | Function to update frontend session state (from useUserContext) |
| `parentId` | `string` | ❌ | Parent record identifier for hierarchical relationships |

#### Return Value

- **Type**: `Promise<void>`
- **Behavior**: Resolves on successful sync, does not reject on errors (logs instead)

#### Example Usage

```typescript
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';
import { useUserContext } from '@/hooks/useUserContext';

// In a React component or hook
const { setSession } = useUserContext();

await syncSelectedRecordsToSession({
  tab: currentTab,
  selectedRecords: [
    { id: '1', name: 'Record 1' },
    { id: '2', name: 'Record 2' }
  ],
  setSession,
  parentId: 'parent-123'
});
```

#### Behavior Details

1. **Empty Selection Handling**: Returns immediately if `selectedRecords` is empty
2. **Key Column Validation**: Validates that tab has required key column field
3. **API Request Construction**: Builds parameters and payload for SETSESSION mode
4. **Multiple Selection Support**: Adds `MULTIPLE_ROW_IDS` to payload when multiple records selected
5. **Response Processing**: Extracts session attributes from API response
6. **Session Update**: Merges new attributes with existing session state
7. **Error Handling**: Logs errors without throwing exceptions

#### Error Handling

The function implements comprehensive error handling:

```typescript
try {
  // Session sync logic
} catch (error) {
  logger.error('Failed to sync selected records to session:', error);
  // Does not throw - session sync should not break selection functionality
}
```

### buildSessionAttributes

Processes form initialization response data into session-compatible attribute format.

#### Signature

```typescript
function buildSessionAttributes(response: FormInitializationResponse): Record<string, string>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response` | `FormInitializationResponse` | ✅ | API response from form initialization endpoint |

#### Response Structure

The `FormInitializationResponse` typically contains:

```typescript
interface FormInitializationResponse {
  auxiliaryInputValues?: {
    [fieldName: string]: {
      value?: string;
      [key: string]: unknown;
    };
  };
  sessionAttributes?: {
    [attributeName: string]: string;
  };
  // ... other form initialization data
}
```

#### Return Value

**Type**: `Record<string, string>`

Combined session attributes from both `auxiliaryInputValues` and `sessionAttributes`:

```typescript
{
  // From auxiliaryInputValues (field values with .value property)
  field1: 'value1',
  field2: 'value2',
  
  // From sessionAttributes (direct key-value pairs)
  attr1: 'attrValue1',
  attr2: 'attrValue2'
}
```

#### Processing Rules

1. **auxiliaryInputValues**: Extracts `value` property from each field object
2. **sessionAttributes**: Includes direct key-value pairs
3. **Conflict Resolution**: `sessionAttributes` takes precedence over `auxiliaryInputValues`
4. **Missing Data**: Handles missing properties gracefully
5. **Type Safety**: Ensures string values for all attributes

#### Example Usage

```typescript
import { buildSessionAttributes } from '@/utils/hooks/useFormInitialization/utils';

const apiResponse = {
  auxiliaryInputValues: {
    field1: { value: 'value1' },
    field2: { value: 'value2' },
    fieldWithoutValue: {} // Ignored
  },
  sessionAttributes: {
    attr1: 'attrValue1',
    field1: 'overrideValue1' // Takes precedence
  }
};

const sessionAttrs = buildSessionAttributes(apiResponse);
// Result: { field1: 'overrideValue1', field2: 'value2', attr1: 'attrValue1' }
```

## Extended Utility Functions

### buildFormInitializationParams (Extended)

Enhanced to support SessionMode in addition to existing FormMode support.

#### New SessionMode Support

```typescript
import { SessionMode } from '@workspaceui/api-client/src/api/types';

const params = buildFormInitializationParams({
  tab: currentTab,
  mode: SessionMode.SETSESSION,
  recordId: 'selected-record-id',
  parentId: 'parent-id'
});
```

#### Generated URL Parameters

For SessionMode.SETSESSION:
- `MODE=SETSESSION`
- `TAB_ID=<tab-id>`
- `ROW_ID=<selected-record-id>`
- `PARENT_ID=<parent-id-or-null>`
- `_action=<form-initialization-action>`

### buildFormInitializationPayload (Extended)

Enhanced to support SessionMode with specialized payload structure.

#### SessionMode Payload

```typescript
const payload = buildFormInitializationPayload(
  tab,
  SessionMode.SETSESSION,
  {}, // No parent data for session sync
  entityKeyColumn
);
```

#### Generated Payload Structure

```typescript
{
  inpKeyName: string,      // Entity key column input name
  inpTabId: string,        // Tab identifier
  inpTableId: string,      // Table identifier
  inpkeyColumnId: string,  // Key column name
  keyColumnName: string,   // Key column name (duplicate)
  _entityName: string,     // Entity name
  inpwindowId: string,     // Window identifier
  
  // Additional for multiple selections:
  MULTIPLE_ROW_IDS?: string[] // Array of all selected record IDs
}
```

## API Request Structure

### Single Record Selection

#### Request URL
```
POST /org.openbravo.client.application.window.FormInitializationComponent
```

#### Query Parameters
```
?MODE=SETSESSION&TAB_ID=123&ROW_ID=456&PARENT_ID=null&_action=...
```

#### Payload
```json
{
  "inpKeyName": "columnName",
  "inpTabId": "123", 
  "inpTableId": "456",
  "inpkeyColumnId": "id_column",
  "keyColumnName": "id_column",
  "_entityName": "EntityName",
  "inpwindowId": "window-id"
}
```

### Multiple Record Selection

#### Request URL
```
POST /org.openbravo.client.application.window.FormInitializationComponent
```

#### Query Parameters
```
?MODE=SETSESSION&TAB_ID=123&ROW_ID=789&PARENT_ID=null&_action=...
```
*Note: ROW_ID uses the last selected record ID*

#### Payload
```json
{
  "inpKeyName": "columnName",
  "inpTabId": "123",
  "inpTableId": "456", 
  "inpkeyColumnId": "id_column",
  "keyColumnName": "id_column",
  "_entityName": "EntityName",
  "inpwindowId": "window-id",
  "MULTIPLE_ROW_IDS": ["456", "789", "101"]
}
```

### API Response

The response follows the standard form initialization response format:

```json
{
  "auxiliaryInputValues": {
    "field1": { "value": "value1" },
    "field2": { "value": "value2" }
  },
  "sessionAttributes": {
    "attr1": "attrValue1",
    "attr2": "attrValue2"
  },
  "recordValues": { /* ... */ },
  "metadata": { /* ... */ }
}
```

## Integration with useUserContext

### Session State Management

The session synchronization integrates with the existing user context session management:

```typescript
const { setSession } = useUserContext();

// Session is updated through functional update pattern
setSession(prev => ({
  ...prev,
  ...newSessionAttributes
}));
```

### Session State Structure

```typescript
interface UserSession {
  [key: string]: string;
}
```

Session attributes from table selection are merged with existing session state, preserving other session data while updating selection-related attributes.

## Error Handling Patterns

### Network Errors

```typescript
try {
  const responseData = await fetchFormInitialization(params, payload);
  // Process success case
} catch (error) {
  if (error instanceof NetworkError) {
    logger.error('Network error during session sync:', error);
  }
  // Continue without throwing
}
```

### Validation Errors

```typescript
if (!entityKeyColumn) {
  logger.warn(`No key column found for tab ${tab.id}`);
  return; // Exit gracefully
}
```

### Response Processing Errors

```typescript
try {
  const sessionAttributes = buildSessionAttributes(responseData);
  setSession(prev => ({ ...prev, ...sessionAttributes }));
} catch (error) {
  logger.error('Error processing session attributes:', error);
  // Session state remains unchanged
}
```

## Performance Characteristics

### Request Frequency
- **Single Selection**: 1 request per selection change
- **Multiple Selection**: 1 request regardless of number of records
- **Debounced**: Uses existing table selection debouncing (150ms)

### Payload Size
- **Base Payload**: ~200-400 bytes
- **Multiple Selection**: +50-100 bytes per additional record ID
- **Scalability**: Linear growth with selection size

### Response Processing
- **Time Complexity**: O(n) where n is number of session attributes
- **Memory Usage**: Minimal additional allocation
- **Session Merge**: O(m) where m is existing session size

## Type Definitions

### Core Types

```typescript
// Session sync options
interface SessionSyncOptions {
  tab: Tab;
  selectedRecords: EntityData[];
  parentId?: string;
  setSession: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

// SessionMode constant
export const SessionMode = {
  SETSESSION: "SETSESSION"
} as const;

export type SessionModeType = typeof SessionMode[keyof typeof SessionMode];

// Extended form initialization parameters
interface FormInitializationParams {
  tab: Tab;
  mode: FormMode | SessionModeType;
  recordId?: string | null;
  parentId?: string | null;
}
```

### API Response Types

```typescript
interface FormInitializationResponse {
  auxiliaryInputValues?: {
    [fieldName: string]: {
      value?: string;
      [key: string]: unknown;
    };
  };
  sessionAttributes?: {
    [attributeName: string]: string;
  };
  recordValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

## Usage Examples

### Basic Integration in Hook

```typescript
import { useEffect } from 'react';
import { syncSelectedRecordsToSession } from '@/utils/hooks/useTableSelection/sessionSync';
import { useUserContext } from '@/hooks/useUserContext';

function useTableSelection(tab, records, rowSelection) {
  const { setSession } = useUserContext();
  
  useEffect(() => {
    const selectedRecords = getSelectedRecords(records, rowSelection);
    
    if (selectedRecords.length > 0) {
      syncSelectedRecordsToSession({
        tab,
        selectedRecords,
        setSession,
        parentId: tab.parentTabId
      });
    }
  }, [tab, records, rowSelection, setSession]);
}
```

### Custom Session Attribute Processing

```typescript
import { buildSessionAttributes } from '@/utils/hooks/useFormInitialization/utils';

// Custom processing of API response
const processCustomSessionSync = async (apiResponse) => {
  const standardAttributes = buildSessionAttributes(apiResponse);
  
  // Add custom processing
  const customAttributes = {
    ...standardAttributes,
    lastSelectionTime: new Date().toISOString(),
    selectionSource: 'table-selection'
  };
  
  return customAttributes;
};
```

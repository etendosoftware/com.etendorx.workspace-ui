# Diseño Técnico: Callouts en Inline Editing

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        Table Component                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Editing Row State (editingRows)                       │    │
│  │  - rowId → { data, validationErrors, isSaving }       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  handleCellValueChange(rowId, fieldName, value)        │    │
│  │  1. Update cell value                                  │    │
│  │  2. Trigger validation (debounced)                     │    │
│  │  3. ► Execute callout (NEW)                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  executeInlineCallout(rowId, field, newValue)          │    │
│  │  - Check if field has callout                          │    │
│  │  - Build payload from current row data                 │    │
│  │  - Call globalCalloutManager.executeCallout()          │    │
│  │  - Apply returned values to editing row                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GlobalCalloutManager                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  executeCallout(fieldName, calloutFn)                  │    │
│  │  - Queue callout                                        │    │
│  │  - Process queue sequentially                           │    │
│  │  - Handle suppress/resume                               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Callout API                         │
│  POST /?_action=FormInitializationComponent&MODE=CHANGE         │
│  Returns: { columnValues, auxiliaryInputValues }                │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Componentes Clave

### 2.1. Hook: `useInlineCallout`

**Ubicación**: `packages/MainUI/components/Table/hooks/useInlineCallout.ts`

**Responsabilidad**: Encapsular la lógica de ejecución de callouts para un campo específico.

**Props**:
```typescript
interface UseInlineCalloutProps {
  field: Field;                    // Metadata del campo
  tab: Tab;                        // Metadata del tab
  rowId: string;                   // ID de la fila en edición
  parentId?: string;               // ID del registro padre (si hay)
  session: Record<string, unknown>; // Datos de sesión del usuario
  currentRowData: Record<string, unknown>; // Datos actuales de la fila
  onApplyCalloutValues: (columnValues) => void; // Callback para aplicar valores
}
```

**Retorna**:
```typescript
(newValue: unknown) => Promise<void>
```

**Lógica interna**:
1. Verificar si el campo tiene callout configurado
2. Verificar que el valor cambió (comparar con `lastValue.current`)
3. Verificar que no esté ejecutando callout (evitar duplicados)
4. Verificar que callouts no estén suprimidos (`globalCalloutManager.isSuppressed()`)
5. Construir payload con datos del row + session
6. Ejecutar a través de `globalCalloutManager.executeCallout()`
7. Aplicar valores retornados usando `onApplyCalloutValues`

### 2.2. Gestor de Callouts en Table

**Ubicación**: Dentro de `packages/MainUI/components/Table/index.tsx`

**Nueva función**: `executeInlineCallout`

```typescript
const executeInlineCallout = useCallback(
  async (rowId: string, field: Field, newValue: unknown) => {
    // Don't execute if field doesn't have callout
    if (!field.column.callout) return;

    // Get current editing row data
    const editingData = editingRowUtils.getEditingRowData(rowId);
    if (!editingData) return;

    // Build payload
    const fieldsByHqlName = tab?.fields || {};
    const fieldsByColumnName = getFieldsByColumnName(tab);
    const currentRowData = editingData.data;
    const payload = buildPayloadByInputName(currentRowData, fieldsByHqlName);

    const entityKeyColumn = tab.fields.id.columnName;
    const calloutData = {
      ...session,
      ...payload,
      inpKeyName: fieldsByColumnName[entityKeyColumn].inputName,
      inpTabId: tab.id,
      inpTableId: tab.table,
      inpkeyColumnId: entityKeyColumn,
      keyColumnName: entityKeyColumn,
      _entityName: tab.entityName,
      inpwindowId: tab.window,
    };

    // Execute through global manager
    await globalCalloutManager.executeCallout(field.hqlName, async () => {
      const params = new URLSearchParams({
        _action: "org.openbravo.client.application.window.FormInitializationComponent",
        MODE: "CHANGE",
        TAB_ID: tab.id,
        CHANGED_COLUMN: field.inputName,
        ROW_ID: rowId,
        PARENT_ID: parentRecord?.id || "null",
      });

      const response = await Metadata.kernelClient.post(`?${params}`, calloutData);

      if (response?.data?.columnValues) {
        // Suppress other callouts while applying values
        globalCalloutManager.suppress();

        try {
          applyCalloutValuesToRow(rowId, response.data.columnValues);
        } finally {
          setTimeout(() => globalCalloutManager.resume(), 0);
        }
      }
    });
  },
  [tab, session, parentRecord, editingRowUtils]
);
```

**Nueva función**: `applyCalloutValuesToRow`

```typescript
const applyCalloutValuesToRow = useCallback(
  (rowId: string, columnValues: FormInitializationResponse["columnValues"]) => {
    if (!columnValues) return;

    const editingData = editingRowUtils.getEditingRowData(rowId);
    if (!editingData) return;

    // Get field mappings
    const fieldsByColumnName = getFieldsByColumnName(tab);

    // Apply each column value
    for (const [columnName, { value, identifier }] of Object.entries(columnValues)) {
      const targetField = fieldsByColumnName[columnName];
      if (!targetField) continue;

      const fieldName = targetField.hqlName || columnName;

      // Update the field value in editing row
      editingRowUtils.updateCellValue(rowId, fieldName, value);

      // If field has identifier, update it too
      if (identifier && value && String(value) !== identifier) {
        editingRowUtils.updateCellValue(rowId, `${fieldName}$_identifier`, identifier);
      }

      // Handle restricted entries for selectors
      const withEntries = (columnValues as any)[columnName]?.entries;
      if (withEntries?.length) {
        editingRowUtils.updateCellValue(
          rowId,
          `${fieldName}$_entries`,
          withEntries.map((e: any) => ({ id: e.id, label: e._identifier }))
        );
      }
    }

    logger.info(`[InlineCallout] Applied ${Object.keys(columnValues).length} values to row ${rowId}`);
  },
  [tab, editingRowUtils]
);
```

### 2.3. Integración en `handleCellValueChange`

**Modificación necesaria**:

```typescript
const handleCellValueChange = useThrottledCallback(
  (rowId: string, fieldName: string, value: unknown) => {
    performanceMonitor.measure(`cell-value-change-${fieldName}`, () => {
      // 1. Update the cell value immediately
      editingRowUtils.updateCellValue(rowId, fieldName, value);
      logger.debug(`[InlineEditing] Updated cell ${fieldName} in row ${rowId}:`, value);

      // 2. Trigger debounced validation for real-time feedback
      debouncedValidateField(rowId, fieldName, value);

      // 3. Execute callout if field has one (NEW)
      const field = getFieldByName(fieldName); // Helper to get Field from baseColumns
      if (field?.column.callout) {
        executeInlineCallout(rowId, field, value).catch((error) => {
          logger.error(`[InlineCallout] Error executing callout for ${fieldName}:`, error);
        });
      }
    });
  },
  50
);
```

## 3. Flujo de Ejecución

### 3.1. Flujo Normal (Campo sin Callout)

```
Usuario cambia valor
    ↓
handleCellValueChange()
    ↓
updateCellValue() → Estado actualizado
    ↓
debouncedValidateField() → Validación
    ↓
FIN
```

### 3.2. Flujo con Callout

```
Usuario cambia valor en campo "Product"
    ↓
handleCellValueChange(rowId, "product", productId)
    ↓
updateCellValue() → Estado actualizado
    ↓
debouncedValidateField() → Validación
    ↓
executeInlineCallout(rowId, productField, productId)
    ↓
globalCalloutManager.executeCallout()
    ↓
Queue callout → Process sequentially
    ↓
POST callout API
    ↓
Response: {
  columnValues: {
    price: { value: 100, identifier: "100.00" },
    uom: { value: "uom123", identifier: "Unit" },
    taxRate: { value: "tax456", identifier: "VAT 21%" }
  }
}
    ↓
globalCalloutManager.suppress() → Evitar callouts en cascada
    ↓
applyCalloutValuesToRow(rowId, columnValues)
    ├→ updateCellValue(rowId, "price", 100)
    ├→ updateCellValue(rowId, "uom", "uom123")
    └→ updateCellValue(rowId, "taxRate", "tax456")
    ↓
setTimeout(() => globalCalloutManager.resume(), 0)
    ↓
FIN
```

### 3.3. Flujo con Múltiples Callouts en Cascada

```
Usuario cambia "Product"
    ↓
Callout Product ejecuta → Actualiza "price", "uom", "taxRate"
    ↓
globalCalloutManager suprime temporalmente callouts
    ↓
updateCellValue("price", 100) → NO ejecuta callout (suprimido)
updateCellValue("uom", "uom123") → NO ejecuta callout (suprimido)
updateCellValue("taxRate", "tax456") → NO ejecuta callout (suprimido)
    ↓
globalCalloutManager.resume()
    ↓
Si algún campo actualizado tiene callout propio, se ejecutará en próxima interacción
```

## 4. Consideraciones de Implementación

### 4.1. Prevención de Loops Infinitos

**Problema**: Callout A actualiza campo B, field B tiene callout que actualiza campo A.

**Solución**:
1. Usar `globalCalloutManager.suppress()` durante aplicación de valores
2. Trackear el origen del cambio (user vs callout)
3. Solo ejecutar callouts en cambios iniciados por usuario

```typescript
// En editingRowUtils, agregar flag
interface EditingRowData {
  // ... existing fields
  isApplyingCalloutValues: boolean; // NEW
}

// En executeInlineCallout, marcar flag
const executeInlineCallout = async (rowId, field, newValue) => {
  editingRowUtils.setCalloutApplying(rowId, true);
  try {
    // ... callout logic
  } finally {
    editingRowUtils.setCalloutApplying(rowId, false);
  }
};

// En handleCellValueChange, verificar flag
const handleCellValueChange = (rowId, fieldName, value) => {
  const editingData = editingRowUtils.getEditingRowData(rowId);

  // Don't execute callouts if we're applying callout values
  if (editingData?.isApplyingCalloutValues) {
    return;
  }

  // ... rest of logic
};
```

### 4.2. Performance

**Optimizaciones**:
1. **Debouncing**: Ya implementado en `handleCellValueChange` (throttle 50ms)
2. **Caching**: GlobalCalloutManager ya tiene queue para evitar duplicados
3. **Lazy field mapping**: Cachear `getFieldByName()` con Map
4. **Batching**: Si múltiples campos cambian, queue callouts sin ejecutar inmediatamente

```typescript
// Cache for field lookups
const fieldNameToFieldMap = useMemo(() => {
  const map = new Map<string, Field>();
  baseColumns.forEach(col => {
    const field = columnToFieldForEditor(col);
    map.set(field.name, field);
    map.set(field.hqlName, field);
  });
  return map;
}, [baseColumns]);

const getFieldByName = (name: string): Field | undefined => {
  return fieldNameToFieldMap.get(name);
};
```

### 4.3. Manejo de Errores

**Escenarios**:
1. Callout API falla (network error)
2. Callout retorna error de validación
3. Campo objetivo no existe en metadata

**Manejo**:
```typescript
const executeInlineCallout = async (rowId, field, newValue) => {
  try {
    await globalCalloutManager.executeCallout(field.hqlName, async () => {
      // ... callout logic
    });
  } catch (error) {
    // Log error but don't block UI
    logger.error(`[InlineCallout] Failed for ${field.hqlName}:`, error);

    // Optionally show error to user
    editingRowUtils.setRowValidationErrors(rowId, {
      [field.name]: `Callout error: ${error.message}`
    });
  }
};
```

### 4.4. Testing Strategy

**Unit Tests**:
```typescript
describe('executeInlineCallout', () => {
  it('should execute callout and apply values', async () => {
    const mockField = { hqlName: 'product', column: { callout: 'ProductCallout' } };
    const mockResponse = {
      columnValues: {
        price: { value: 100, identifier: '100.00' }
      }
    };

    // Mock API
    jest.spyOn(Metadata.kernelClient, 'post').mockResolvedValue({ data: mockResponse });

    await executeInlineCallout('row1', mockField, 'product123');

    expect(editingRowUtils.updateCellValue).toHaveBeenCalledWith('row1', 'price', 100);
  });

  it('should suppress callouts during value application', async () => {
    // ... test suppress/resume
  });

  it('should handle callout errors gracefully', async () => {
    // ... test error handling
  });
});
```

**Integration Tests**:
1. User changes product → price updates
2. Multiple cascading callouts execute in order
3. Callout during save operation doesn't interfere

## 5. Diferencias con FormView

| Aspecto | FormView | Inline Editing |
|---------|----------|----------------|
| **Context** | react-hook-form | Editing row state |
| **Value source** | `watch()` hooks | `editingRowUtils.getEditingRowData()` |
| **Value update** | `setValue()` | `editingRowUtils.updateCellValue()` |
| **Field access** | Direct field props | Field mapping from columns |
| **Payload build** | `getValues()` from form | Build from row data |
| **Suppression** | During `setValues()` batch | During `applyCalloutValues()` |
| **Parent record** | From URL/context | From `parentRecord` prop |

## 6. API del Callout

**Request**:
```
POST /openbravo/?_action=org.openbravo.client.application.window.FormInitializationComponent&MODE=CHANGE&TAB_ID=186&CHANGED_COLUMN=inpmProductId&ROW_ID=ED80AB&PARENT_ID=null

Body:
{
  ...session variables ($C_Currency_ID, etc),
  ...current row data (all fields),
  inpKeyName: "cOrderId",
  inpTabId: "186",
  inpTableId: "C_Order",
  inpkeyColumnId: "C_Order_ID",
  keyColumnName: "C_Order_ID",
  _entityName: "Order",
  inpwindowId: "143"
}
```

**Response**:
```json
{
  "columnValues": {
    "price": {
      "value": "100.00",
      "identifier": "100.00"
    },
    "uOM": {
      "value": "uom123",
      "identifier": "Unit",
      "entries": [
        { "id": "uom123", "_identifier": "Unit" },
        { "id": "uom456", "_identifier": "Kg" }
      ]
    }
  },
  "auxiliaryInputValues": {
    "taxRate": { "value": "0.21" }
  }
}
```

## 7. Plan de Implementación

### Fase 1: Infraestructura Base
- [ ] Crear helper `getFieldByName()` con cache
- [ ] Agregar flag `isApplyingCalloutValues` a editing row state
- [ ] Implementar `applyCalloutValuesToRow()`

### Fase 2: Ejecución de Callouts
- [ ] Implementar `executeInlineCallout()`
- [ ] Integrar en `handleCellValueChange()`
- [ ] Agregar manejo de errores

### Fase 3: Prevención de Loops
- [ ] Verificar flag `isApplyingCalloutValues` antes de ejecutar callout
- [ ] Implementar suppress/resume durante aplicación de valores
- [ ] Testing de callouts en cascada

### Fase 4: Optimización y Testing
- [ ] Agregar debouncing de callouts (opcional)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance profiling

### Fase 5: Features Adicionales (Opcional)
- [ ] Mostrar indicator visual durante ejecución de callout
- [ ] Progress bar si múltiples callouts en queue
- [ ] Retry automático en caso de error de red

## 8. Métricas de Éxito

1. **Funcionalidad**: Callouts ejecutan y actualizan campos correctamente
2. **No regresiones**: Validaciones y guardado siguen funcionando
3. **Performance**: No más de 100ms de delay perceptible
4. **Estabilidad**: No loops infinitos ni memory leaks
5. **UX**: Usuario ve updates de campos de forma fluida

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Loop infinito de callouts | Media | Alto | Suppress durante apply + flag de tracking |
| Performance degradation | Baja | Medio | Throttling + queue management |
| Callout API timeouts | Media | Bajo | Error handling + retry logic |
| Conflicts con validaciones | Baja | Medio | Ejecutar callout antes de validación |
| Memory leaks | Baja | Alto | Cleanup en unmount + GlobalCalloutManager cleanup |

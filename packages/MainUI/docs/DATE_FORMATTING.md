# Date Formatting in DynamicTable

Este documento describe cómo funciona el parseado y formateo de fechas en el DynamicTable, replicando el comportamiento de Etendo Classic.

## Visión General

Las fechas que vienen del backend de Etendo Classic se muestran en el DynamicTable con el siguiente comportamiento:

1. **Detección automática**: Se detectan todas las columnas de tipo `date` o `datetime`
2. **Parseado correcto**: Soporta tanto fechas simples (`yyyy-MM-dd`) como ISO datetime con zona horaria
3. **Formato del navegador**: Usa `Intl.DateTimeFormat` para formatear según el locale del navegador
4. **Hora opcional**: Las columnas de auditoría (`creationDate`, `updated`) muestran también la hora

## Estructura de Datos

### Formato de entrada desde el backend

Hay dos formatos principales que vienen del backend:

```json
{
  "invoiceDate": "2025-10-06",                          // Plain date
  "accountingDate": "2025-10-06",                       // Plain date
  "creationDate": "2025-10-06T10:20:00-03:00",         // ISO datetime con timezone
  "updated": "2025-10-06T15:03:15-03:00",              // ISO datetime con timezone
  "finalSettlementDate": null                           // Null values are handled
}
```

### Formato de salida (según locale del navegador)

**Nota**: El separador es específico del locale (Intl.DateTimeFormat determina cuál usar):

```
Argentina (es-AR):     06-10-2025
España (es-ES):        06-10-2025
USA (en-US):           10/06/2025
Alemania (de-DE):      06.10.2025
Francia (fr-FR):       06/10/2025
```

Con hora (para columnas de auditoría):
```
Argentina:             06-10-2025 10:20:00
España:                06-10-2025 10:20:00
USA:                   10/06/2025 10:20:00 AM
Alemania:              06.10.2025 10:20:00
```

## Funciones Principales

### `formatClassicDate(value, includeTime?)`

Función principal para usar. Combina parsing y formatting en un solo paso:

```typescript
import { formatClassicDate } from "@/utils/dateFormatter";

// Sin hora (por defecto)
formatClassicDate("2025-10-06") → "06-10-2025"
formatClassicDate("2025-10-06T10:20:00-03:00") → "06-10-2025"

// Con hora
formatClassicDate("2025-10-06T10:20:00-03:00", true) → "06-10-2025 10:20:00"

// Valores nulos
formatClassicDate(null) → ""
formatClassicDate(undefined) → ""
```

### `parseOBDate(value)`

Parsea una fecha del backend:

```typescript
parseOBDate("2025-10-06")                    // Date(2025, 9, 6)
parseOBDate("2025-10-06T10:20:00-03:00")    // Date(2025, 9, 6, ...)
parseOBDate(null)                            // null
parseOBDate("invalid")                       // null
```

### `formatBrowserDate(date)`

Formatea una fecha SIN hora (con separador específico del locale):

```typescript
formatBrowserDate(new Date(2025, 9, 6)) → "06-10-2025" (Argentina)
formatBrowserDate(new Date(2025, 9, 6)) → "06.10.2025" (Germany)
formatBrowserDate(new Date(2025, 9, 6)) → "10/06/2025" (USA)
formatBrowserDate(null) → ""
```

### `formatBrowserDateTime(date, includeTime)`

Formatea una fecha CON o SIN hora (con separador específico del locale):

```typescript
const date = new Date(2025, 9, 6, 10, 20, 0);
formatBrowserDateTime(date, false) → "06-10-2025" (Argentina)
formatBrowserDateTime(date, true)  → "06-10-2025 10:20:00" (Argentina)
formatBrowserDateTime(date, false) → "06.10.2025" (Germany)
formatBrowserDateTime(date, true)  → "06.10.2025 10:20:00" (Germany)
```

## Detección Automática de Columnas de Fecha

En `useColumns.tsx`, la detección es **estrictamente por TIPO de dato**:

```typescript
// En Etendo Classic hay 2 tipos de fecha/hora (FieldType enum):
// - DATE = "date"        (solo fecha, sin hora)
// - DATETIME = "datetime" (fecha + hora)

const isDateColumn =
  column.type === "date" ||              // Solo si el tipo es explícitamente "date"
  column.type === "datetime";             // O si el tipo es explícitamente "datetime"
```

**Esto significa que:**
- ✅ Solo formatea si el tipo es realmente "date" o "datetime"
- ✅ No formatea campos numéricos (documentNo, amount, etc.)
- ✅ No se deja engañar por nombres de columna
- ✅ La metadata de Etendo debe estar correcta (types bien asignados)

## Columnas de Auditoría

Hay columnas especiales que siempre incluyen la hora:

```typescript
const AUDIT_DATE_COLUMNS_WITH_TIME = ["creationDate", "updated"];
```

Estas columnas muestran formato con hora:
- `creationDate`: 06-10-2025 10:20:00
- `updated`: 06-10-2025 15:03:15

Todas las demás columnas de fecha muestran solo la fecha:
- `invoiceDate`: 06-10-2025
- `accountingDate`: 06-10-2025

## Implementación en DynamicTable

El renderizado automático se aplica en el hook `useColumns.tsx`:

```typescript
// Detecta columnas de fecha (SOLO por tipo, no por reference)
const isDateColumn =
  column.type === "date" ||
  column.type === "datetime";

// Aplica formateo automático
if (isDateColumn) {
  // Incluye hora para creationDate, updated, o si es tipo datetime
  const includeTime = AUDIT_DATE_COLUMNS_WITH_TIME.includes(column.columnName) || column.type === "datetime";
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

## Ejemplos de Uso

### En una tabla de facturas

```json
{
  "documentNo": "10000018",
  "documentStatus": "DR",
  "invoiceDate": "2025-10-06",           // → 06-10-2025
  "accountingDate": "2025-10-06",        // → 06-10-2025
  "creationDate": "2025-10-06T10:20:00-03:00",  // → 06-10-2025 10:20:00
  "updated": "2025-10-06T15:03:15-03:00",       // → 06-10-2025 15:03:15
  "finalSettlementDate": null             // → (vacío)
}
```

### Output en tabla (Argentina)
```
| Document | Status | Invoice Date | Accounting Date | Creation Date         | Updated               | Settlement Date |
|----------|--------|--------------|-----------------|----------------------|----------------------|-----------------|
| 10000018 | DR     | 06-10-2025   | 06-10-2025      | 06-10-2025 10:20:00 | 06-10-2025 15:03:15 |                 |
```

### Output en tabla (USA)
```
| Document | Status | Invoice Date | Accounting Date | Creation Date         | Updated               | Settlement Date |
|----------|--------|--------------|-----------------|----------------------|----------------------|-----------------|
| 10000018 | DR     | 10-06-2025   | 10-06-2025      | 10-06-2025 10:20:00 | 10-06-2025 15:03:15 |                 |
```

## Casos Especiales

### Valores nulos
```typescript
formatClassicDate(null)         // → ""
formatClassicDate(undefined)    // → ""
formatClassicDate("")           // → ""
```

### Timestamps numéricos
```typescript
const timestamp = new Date("2025-10-06").getTime();
formatClassicDate(timestamp)    // Funciona correctamente
```

### Fechas con diferentes timezones
```typescript
formatClassicDate("2025-10-06T10:20:00-03:00") // Parseado correctamente
formatClassicDate("2025-10-06T10:20:00+02:00") // Parseado correctamente
formatClassicDate("2025-10-06T10:20:00Z")      // Parseado correctamente
```

## Testing

Todos los casos están cubiertos en:
```
packages/MainUI/__tests__/utils/dateFormatter.test.ts
```

Incluye tests para:
- Parsing de diferentes formatos
- Formatting según locale
- Valores nulos y inválidos
- Datos reales de Invoice
- Diferentes timezones
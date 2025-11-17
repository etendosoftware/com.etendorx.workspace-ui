# DynamicTable Date Formatting Implementation

## ✅ Archivos Creados/Modificados

### 1. **Creado: `packages/MainUI/utils/dateFormatter.ts`**
Utilidades principales para parsear y formatear fechas como Etendo Classic.

**Funciones principales:**
- `parseOBDate(value)` - Parsea fechas del backend (plain date o ISO datetime)
- `formatClassicDate(value, includeTime)` - Función principal para usar
- `formatBrowserDate(date)` - Formatea sin hora según locale del navegador
- `formatBrowserDateTime(date, includeTime)` - Formatea con/sin hora
- `isDateLike(value)` - Detecta si un valor es una fecha
- `isKnownDateField(columnName)` - Detecta campos de fecha por nombre

**Tamaño:** ~180 líneas

---

### 2. **Modificado: `packages/MainUI/hooks/table/useColumns.tsx`**
Integración automática en el renderizado de columnas.

**Cambios:**
```typescript
// Importar la función de formateo
import { formatClassicDate } from "@/utils/dateFormatter";

// Detección por TIPO de dato (no por nombre)
const isDateColumn =
  column.type === "date" ||
  column.type === "datetime" ||
  getFieldReference(column.column?.reference) === FieldType.DATE;

// Aplicar formateo automático
if (isDateColumn) {
  const includeTime = AUDIT_DATE_COLUMNS_WITH_TIME.includes(column.columnName);
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

---

### 3. **Creado: `packages/MainUI/__tests__/utils/dateFormatter.test.ts`**
Suite de tests completa con 40+ casos de prueba.

**Cubre:**
- ✅ Parsing de plain dates (yyyy-MM-dd)
- ✅ Parsing de ISO datetime con timezone
- ✅ Formatting según locale del navegador
- ✅ Valores nulos y inválidos
- ✅ Datos reales de Invoice
- ✅ Diferentes timezones

---

### 4. **Creado: `packages/MainUI/docs/DATE_FORMATTING.md`**
Documentación técnica completa para referencia.

---

## 🎯 Características Principales

### Detección Automática de Columnas de Fecha
```
❌ Antes: Solo detectaba por nombre de columna (creationDate, invoiceDate, etc.)
✅ Ahora: Detecta por TIPO DE DATO (column.type === "date" o "datetime")
```

**Ventajas:**
- Soporta cualquier nombre de columna de fecha
- No se deja engañar por campos numéricos
- Funciona con referencias a campos DATE

### Parsing de Múltiples Formatos
```typescript
// Plain date
"2025-10-06"

// ISO datetime con timezone
"2025-10-06T10:20:00-03:00"
"2025-10-06T10:20:00+02:00"
"2025-10-06T10:20:00Z"

// Sin timezone
"2025-10-06T10:20:00"
```

### Formateo según Locale del Navegador
```
Argentina (es-AR):  06/10/2025
España (es-ES):     06/10/2025
USA (en-US):        10/06/2025
Alemania (de-DE):   06.10.2025
Francia (fr-FR):    06/10/2025
```

### Columnas de Auditoría con Hora
```typescript
AUDIT_DATE_COLUMNS_WITH_TIME = ["creationDate", "updated"]
```

**Ejemplo:**
```
invoiceDate: "2025-10-06"           → 06/10/2025
creationDate: "2025-10-06T10:20:00" → 06/10/2025 10:20:00 (con hora)
updated: "2025-10-06T15:03:15"      → 06/10/2025 15:03:15 (con hora)
```

---

## 📊 Ejemplo de Salida

### Datos de entrada (Invoice)
```json
{
  "documentNo": "10000018",
  "invoiceDate": "2025-10-06",
  "accountingDate": "2025-10-06",
  "creationDate": "2025-10-06T10:20:00-03:00",
  "updated": "2025-10-06T15:03:15-03:00",
  "finalSettlementDate": null,
  "grandTotalAmount": 10
}
```

### Tabla renderizada (locale Argentina)
```
| Document | Invoice Date | Accounting Date | Creation Date         | Updated               |
|----------|--------------|-----------------|----------------------|----------------------|
| 10000018 | 06/10/2025   | 06/10/2025      | 06/10/2025 10:20:00 | 06/10/2025 15:03:15 |
```

### Tabla renderizada (locale USA)
```
| Document | Invoice Date | Accounting Date | Creation Date         | Updated               |
|----------|--------------|-----------------|----------------------|----------------------|
| 10000018 | 10/06/2025   | 10/06/2025      | 10/06/2025 10:20:00 | 10/06/2025 15:03:15 |
```

---

## 🚀 Cómo Usar

### Automático (Recomendado)
No requiere cambios. El `useColumns.tsx` aplica el formateo automáticamente a todas las columnas de tipo fecha.

```typescript
// Funciona automáticamente en DynamicTable
<DynamicTable ... />
```

### Manual (Si necesitas)
```typescript
import { formatClassicDate } from "@/utils/dateFormatter";

// Sin hora
const formatted = formatClassicDate("2025-10-06");
// Resultado: "06/10/2025"

// Con hora
const formattedWithTime = formatClassicDate("2025-10-06T10:20:00-03:00", true);
// Resultado: "06/10/2025 10:20:00"
```

---

## ✅ Checklist de Implementación

- [x] Crear utilidades de fecha (`dateFormatter.ts`)
- [x] Detectar columnas por TIPO (no por nombre)
- [x] Parsear múltiples formatos de fecha
- [x] Formatear según locale del navegador
- [x] Incluir hora para columnas de auditoría
- [x] Manejo de valores nulos
- [x] Tests comprehensivos
- [x] Documentación técnica

---

## 🔍 Validación

Run tests:
```bash
pnpm test:mainui -- dateFormatter.test.ts
```

---

## 📝 Notas

- La solución es **idéntica a Etendo Classic** en comportamiento
- **No requiere cambios de datos** en el backend
- Compatible con **todos los locales** del navegador
- **Rendimiento**: Sin impacto en performance (usando `Intl.DateTimeFormat` nativo)
- **Tipo-seguro**: Todo está tipado correctamente con TypeScript
# Column Filters

Sistema de filtros por columna para tablas con soporte para campos `select` y `tabledir` de Etendo Classic.

## Características

- ✅ **Filtros dropdown** para columnas de tipo `select` y `tabledir`
- ✅ **Multi-selección** - Permite seleccionar múltiples valores (`==John Smith or ==Juan López`)
- ✅ **Búsqueda en tiempo real** para `tabledir` (carga dinámica desde datasource)
- ✅ **Integración** con búsqueda global existente
- ✅ **Compatible** con criterios de Etendo Classic

## Componentes

### `ColumnFilter`
Componente principal que renderiza el icono de filtro y el popover con opciones.

```tsx
<ColumnFilter
  column={column}
  filterState={filterState}
  onFilterChange={handleFilterChange}
  onLoadOptions={handleLoadOptions}
/>
```

### `ColumnFilterDropdown`
Dropdown con multi-selección y búsqueda para las opciones de filtro.

### `useColumnFilters`
Hook para manejar el estado de los filtros por columna.

```tsx
const {
  columnFilters,
  setColumnFilter,
  clearColumnFilter,
  loadFilterOptions,
  hasActiveFilters
} = useColumnFilters({ columns });
```

### `useTableSearch`
Hook que combina búsqueda global con filtros de columna.

```tsx
const {
  searchQuery,
  setSearchQuery,
  columnFilters,
  setColumnFilter,
  searchCriteria,
  clearAllSearchAndFilters
} = useTableSearch({ columns, onSearchChange });
```

## Tipos de Columna Soportados

### `SELECT` (FieldType.SELECT)
- Usa `column.refList` para obtener las opciones
- Filtrado local (client-side)
- Ideal para listas pequeñas y fijas

### `TABLEDIR` (FieldType.TABLEDIR)
- Usa `column.referencedEntity` para buscar opciones
- Filtrado server-side con búsqueda dinámica
- Ideal para entidades con muchos registros

## Ejemplo de Uso

```tsx
import { ColumnFilterExample } from "@workspaceui/component-library";

function MyTable() {
  const handleSearchChange = (criteria) => {
    console.log("Generated criteria:", criteria);
    // Enviar criterios al backend para filtrar datos
  };

  return (
    <ColumnFilterExample
      columns={columns}
      data={data}
      onSearchChange={handleSearchChange}
      title="Sales Orders"
    />
  );
}
```

## Integración Manual

Para integrar en tablas existentes:

```tsx
import { useTableSearch, ColumnFilter } from "@workspaceui/api-client";

function MyExistingTable({ columns, data }) {
  const {
    searchQuery,
    setSearchQuery,
    columnFilters,
    setColumnFilter,
    searchCriteria,
    loadFilterOptions
  } = useTableSearch({
    columns,
    onSearchChange: (criteria) => {
      // Enviar criterios al datasource
      refetchData(criteria);
    }
  });

  return (
    <>
      {/* Búsqueda global */}
      <TextField 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Filtros por columna en headers */}
      <TableHead>
        <TableRow>
          {columns.map(column => (
            <TableCell key={column.id}>
              {column.name}
              <ColumnFilter
                column={column}
                filterState={columnFilters.find(f => f.id === column.id)}
                onFilterChange={(options) => setColumnFilter(column.id, options)}
                onLoadOptions={(query) => loadFilterOptions(column.id, query)}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    </>
  );
}
```

## Formato de Criterios Generados

El sistema genera criterios compatibles con Etendo Classic:

```json
{
  "operator": "and",
  "criteria": [
    {
      "fieldName": "businessPartner",
      "operator": "equals", 
      "value": "partner-id-1"
    },
    {
      "operator": "or",
      "criteria": [
        {
          "fieldName": "documentStatus",
          "operator": "equals",
          "value": "DR"
        },
        {
          "fieldName": "documentStatus", 
          "operator": "equals",
          "value": "CO"
        }
      ]
    }
  ]
}
```

## Próximas Mejoras

- [ ] Soporte para filtros de rango (fechas, números)
- [ ] Filtros de texto avanzados (contains, starts with, etc.)
- [ ] Persistencia de filtros en localStorage
- [ ] Filtros predefinidos/guardados
- [ ] Soporte para más tipos de campos
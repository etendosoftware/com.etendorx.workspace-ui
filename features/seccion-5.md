# Sección 5 — Tab-Level Behaviors

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 5. Cubre los comportamientos a nivel de **tab**: visibilidad por display logic, tabs de solo lectura, los *UI Patterns* de tab (`STD`/`RO`/`ED`/`SR`), la jerarquía por niveles (`tablevel`) y la navegación padre→hijo.

> El backend (`/erp`, adapter `com.etendoerp.metadata`) serializa cada `AD_Tab` (`TabBuilder` + `WindowBuilder.createTabsJson`): envía `uIPattern`, `tabLevel`, `parentColumns`, `parentTabId`, `displayLogic`/`displayLogicExpression` (traducida con `DynamicExpressionParser`) y fuerza `uIPattern="RO"` + `readOnly=true` cuando la ventana o el acceso al tab es de solo lectura.
> En el cliente, `TabsContainer` agrupa los tabs por nivel (`groupTabsByLevel`), evalúa la display logic de cada tab (incluido el *cascade hide* del padre) y `Tab.tsx` aplica el patrón de UI. La restricción de escritura por patrón se centraliza en `utils/toolbar/utils.tsx` (toolbar) y en `components/Table/index.tsx` (edición inline).

**Estimación global de la sección: ~98% de cobertura efectiva.** Todos los comportamientos de tab están implementados (visibilidad, read-only, los 4 UI patterns, jerarquía, filtrado padre-hijo, herencia de FK, carga diferida y aviso de cambios sin guardar). Los dos huecos detectados tienen impacto bajo o casi nulo en la instancia representativa.

---

## Qué está completamente hecho

| Capacidad | Implementación en la nueva UI |
|-----------|-------------------------------|
| **5.1 Visibilidad de tab (display logic)** | `TabsContainer` evalúa `displayLogic`/`displayLogicExpression` de cada tab con `compileExpression` + `createSmartContext` contra el registro del padre. Incluye **cascade hide**: si el tab padre queda oculto por su propia lógica, sus hijos también. Mismo motor que la Sección 4 (operadores, conectores, paréntesis, vars de sesión). |
| **5.2 Tabs de solo lectura** | El backend emite `uIPattern="RO"` (por `uipattern='RO'` del AD o por acceso read-only de ventana/tab). El cliente oculta **New/Save/Delete/Copy** (`isVisibleButton`/`getDisableConfig`) y **bloquea la edición e inserción inline** en el grid (`handleEditRow`/`handleInsertRow`). Cubre los 29 tabs `RO`+`isreadonly=Y` y los 158 `RO` de la instancia. |
| **5.3 UI Pattern `STD`** | Tab estándar: alta, edición, borrado y vista grid/form completas (motor genérico de ventana, Sección 1). 776 tabs en la instancia. |
| **5.3 UI Pattern `RO`** | Solo lectura (ver 5.2). |
| **5.3 UI Pattern `ED`** | `EDIT_AND_DELETE_ONLY`: permite edición inline y borrado pero **oculta New** (`isNewForSrOrEd`, `handleInsertRow` bloquea insert). 12 tabs. |
| **5.3 UI Pattern `SR`** | `EDIT_ONLY` (Single Record): muestra **solo vista formulario** (sin grid), con apertura automática del form (`isSrTab`, `srAutoOpen`, manejo 1:1 de extensión por ID). Oculta New y deshabilita Delete. 57 tabs. |
| **5.4 Jerarquía de tabs (`tablevel`)** | `groupTabsByLevel` organiza los tabs por nivel (0/1/2…); `TabsContainer` renderiza la navegación por niveles + breadcrumb (`AppBreadcrumb`). El orden dentro de cada nivel respeta el `seqno` que envía el backend. |
| **Filtrado hijo por registro padre** | `buildImplicitFilterCriteria` / `criteriaUtils` filtran el grid hijo por el registro padre seleccionado (match por `referencedEntity`↔`entityName` del padre). |
| **Herencia de FK al crear hijo** | Al crear un registro en un tab hijo se pasa `parentId` a la inicialización de formulario (FIC), que precarga la columna de enlace al padre. |
| **Navegación preserva la selección del padre** | La selección por tab se mantiene en el store (`useWindowStore`/grafo); cambiar de tab **no re-fetchea** el registro padre (estado cacheado por tab). |
| **Carga independiente / diferida de grids** | Cada grupo de tabs hijo se monta solo cuando el padre tiene un registro seleccionado (`TabsContainer`: si no hay `parentSelectedId` → no monta), evitando N+1 fetches al abrir la ventana. |
| **Aviso de cambios sin guardar al cambiar de tab** | `useFocusRegion.onBlur`: si `hasFormChanges`, dispara `onSave({ showModal: true })` antes de ceder el foco a otro tab. |

---

## Qué está parcialmente hecho

- **Re-evaluación de la display logic de tab con cambios en vivo del header (sin guardar):** la visibilidad de los tabs se re-evalúa cuando cambia el **registro seleccionado** del padre (selección, guardado o refresco), porque `useSelectedRecord` lee el registro del grafo (persistido), **no** los valores que el usuario está editando en el formulario del header. En el clásico, al togglear en el header un campo que controla un tab hijo (p. ej. `@IsVendor@='Y' & @IsCustomer@='Y'`), el tab aparece/desaparece al instante; en la nueva UI lo hace tras guardar. **Impacto bajo:** los tabs hijo suelen requerir un padre guardado (la FK debe existir) para ser útiles. → **Tarea 1**.

---

## Qué no está hecho

- **`isreadonly='Y'` a nivel de tab cuando `uipattern` ≠ `'RO'`:** el cliente decide el modo solo-lectura a partir de `uIPattern`; no lee un flag `readOnly`/`isReadOnly` propio del tab. En la instancia solo existe **1 caso** (tab *Session* de la ventana *Session*, con `uipattern='SR'` + `isreadonly='Y'`): se renderizaría como formulario editable en vez de totalmente read-only. **Impacto casi nulo** (1 tab del sistema, no editado en la práctica). → **Tarea 2** (robustez, prioridad baja).
- **Badges de conteo por tab:** la nueva UI no muestra contadores de registros sobre los tabs. El spec lo marca como opcional ("if shown"), por lo que **no es un gap** y no se crea tarea.

---

## Resumen de lo que queda por hacer

El comportamiento a nivel de tab está prácticamente completo: visibilidad por display logic con cascade hide, tabs de solo lectura, los cuatro UI patterns (`STD`/`RO`/`ED`/`SR`), la jerarquía por niveles con breadcrumb, el filtrado hijo-por-padre, la herencia de FK al crear hijos, la carga diferida de grids y el aviso de cambios sin guardar. Quedan dos ajustes menores: hacer que la display logic de tab reaccione a los valores en vivo del header antes de guardar (**Tarea 1**, impacto bajo) y honrar `isreadonly='Y'` a nivel de tab con independencia del `uipattern` (**Tarea 2**, 1 solo caso, prioridad baja).

---

## Tareas

### Tarea 1 — Re-evaluar la display logic de tab con los valores en vivo del header

**Descripción:** la visibilidad de los tabs hijo se recalcula solo cuando cambia el registro padre seleccionado (selección/guardado), no mientras el usuario edita el formulario del header. Esto difiere del clásico, donde un cambio no guardado en un campo del header que controla un tab (p. ej. `@IsVendor@='Y' & @IsCustomer@='Y'`) muestra/oculta el tab al instante.

**Solución propuesta:** alimentar la evaluación de la display logic de tab con los valores actuales del formulario del padre (no solo con el registro persistido), de modo que al cambiar un campo que afecta la visibilidad de un tab este aparezca/desaparezca en tiempo real, reutilizando el motor de display logic existente y su normalización de valores. Mantener la suscripción reactiva solo a los campos que cada expresión referencia.

**Test cases:**
- Editar en el header un campo que controla un tab (sin guardar) muestra/oculta el tab inmediatamente.
- El cascade hide sigue funcionando (ocultar el padre oculta los hijos) con valores en vivo.
- Al descartar/recargar el registro, la visibilidad vuelve al estado del registro persistido.
- Sin regresiones en tabs sin display logic ni en el rendimiento (no re-render masivo).

**Resultado:** la visibilidad de tabs reacciona a los cambios en vivo del header, igualando el comportamiento del clásico.

### Tarea 2 — Honrar `isreadonly='Y'` a nivel de tab independientemente del `uipattern`

**Descripción:** el cliente determina el modo solo-lectura de un tab a partir de `uIPattern`; un tab marcado `isreadonly='Y'` pero con otro `uipattern` (p. ej. `SR`) se renderiza como editable. En la instancia hay un único caso (tab *Session*), por lo que es una mejora de robustez/paridad más que un defecto activo.

**Solución propuesta:** propagar el flag de solo-lectura propio del tab desde el backend y tratarlo como read-only efectivo en el cliente (ocultar New/Save/Delete/Copy y bloquear edición inline), combinándolo con la lógica de `uIPattern` ya existente sin alterar el resto de patrones.

**Test cases:**
- Un tab con `isreadonly='Y'` (cualquier `uipattern`) no permite crear/editar/borrar ni edición inline.
- Los tabs `SR`/`ED`/`STD` no read-only conservan su comportamiento actual.
- Sin regresiones en los tabs ya cubiertos por `uIPattern='RO'`.

**Resultado:** el modo solo-lectura del tab respeta tanto `uipattern` como `isreadonly`, cerrando la paridad con el clásico.

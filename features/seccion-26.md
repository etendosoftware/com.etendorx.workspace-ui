# Sección 26 — Tab Default Filters and Sort Order

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 26. Cubre los **filtros y el orden por defecto a nivel de pestaña**: las cláusulas que se aplican automáticamente al cargar el grid de una pestaña, configuradas en `ad_tab` mediante `filterclause` (SQL where), `hqlfilterclause` (HQL where), `orderbyclause` (SQL order) y `hqlorderbyclause` (HQL order), incluyendo la substitución de parámetros dinámicos `@param@` (campos del registro padre, contexto de sesión y preferencias).

> **Clave de arquitectura:** el trabajo se reparte igual que en el clásico entre **backend** (filtros) y **frontend** (orden inicial). (1) El adapter (`com.etendoerp.metadata`, `TabBuilder.java:80`) serializa la **entidad `Tab` completa** vía `DataToJsonConverter` en modo `FULL_TRANSLATABLE`, por lo que la metadata que recibe el cliente incluye **las cuatro cláusulas** (`hqlfilterclause`, `hqlwhereclause`, `sQLWhereClause`, `hqlorderbyclause`, `sQLOrderByClause`) además de una clave explícita `filter` (el `filterclause` SQL). (2) Los **filtros** NO los aplica el cliente: la nueva UI llama directamente al **datasource clásico** (`org.openbravo.service.datasource`, `OBViewDataSource`) enviando `tabId`/`windowId` + el flag `isImplicitFilterApplied`; el datasource lee del tab `hqlwhereclause` (siempre) y `hqlfilterclause` (si el filtro implícito está activo) en `BaseDataSourceService.getWhereAndFilterClause`, y resuelve la substitución `@param@`. (3) El **orden inicial** SÍ lo resuelve el cliente (igual que el frontend clásico): `useTableData.getDefaultSort` parsea `hqlorderbyclause`/`sQLOrderByClause` y lo envía como `_sortBy` al datasource. El cliente además provee las variables de contexto (`@Entity.id@`, `@ENTITY_ID@`, atributos de sesión) para la substitución del where.

**Estimación global de la sección: ~88% de cobertura efectiva.** El núcleo está **completo y es fiel**: el filtro por defecto (where + filter clause) se aplica al cargar la pestaña delegando en el datasource clásico, la substitución de contexto y de referencias al padre funciona, el usuario puede añadir filtros de columna sobre el filtro implícito, puede cambiar el orden (que sobrescribe el default) y puede quitar el filtro implícito. El **único hueco real** es el **parser del orden por defecto en el cliente**, que solo interpreta correctamente cláusulas de **una sola columna** (`lineNo`, `creationDate desc`); las cláusulas **multi-columna** (`dateAcct, lineNo`, `paymentDate, documentNo`), con **prefijo `-`** (`-accountingDate`), con **alias `e.`** (`e.documentNo desc`) o con **expresiones** (`abs(debit) desc`) no se traducen a un `_sortBy` correcto, por lo que el orden inicial de esas pestañas no coincide con el clásico.

---

## Qué está completamente hecho

| Comportamiento (checklist 26.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Filtro HQL por defecto aplicado al cargar la pestaña** | La nueva UI llama al datasource clásico con `tabId`/`windowId`; `BaseDataSourceService.getWhereAndFilterClause` lee `tab.getHqlwhereclause()` (siempre) y, con el filtro implícito activo, combina `tab.getHqlfilterclause()` (`(where) and (filter)`). El motor que aplica el filtro es el mismo que usa el clásico. DB: 40 pestañas con `hqlfilterclause`, 14 con `filterclause` SQL. |
| **El cliente detecta y señaliza el filtro implícito** | `useTableData` calcula `initialIsFilterApplied` a partir de `tab.hqlfilterclause`/`tab.sQLWhereClause` y envía `isImplicitFilterApplied` en el request; así el datasource sabe que debe aplicar el `hqlfilterclause`. |
| **Substitución de variables de contexto (`@#AD_Org_ID@`, etc.)** | La resuelve el datasource clásico contra la sesión/contexto (mismo mecanismo del clásico); el cliente no la reimplementa. |
| **Referencias al registro padre en el filtro (`@Order.id@`, `@FIN_Financial_Account.id@`)** | El cliente arma el contexto con `buildEtendoContext` (`@Entity.id@`, `@Entity.campoDeSesión@`) y añade el formato `@ENTITY_ID@`; el datasource substituye esos `@param@` con el valor del padre actual. DB: p. ej. `e.salesOrder.id = @Order.id@`, `e.account.id = @FIN_Financial_Account.id@`. |
| **El usuario puede añadir filtros sobre el filtro por defecto** | Los filtros de columna y los criterios avanzados se envían como `criteria` (`AdvancedCriteria`, operador `and`) **junto con** el flag de filtro implícito; el datasource los combina con el where/filter del tab (AND). |
| **El usuario puede cambiar el orden (sobrescribe el default)** | En `useTableData`, si hay orden de columna del usuario (`tableColumnSorting`) se aplica ese; solo si no hay, se aplica `getDefaultSort()`. El orden manual tiene precedencia. |
| **El filtro por defecto se puede quitar (no bloquea ver registros)** | `handleToggleImplicitFilters` permite desactivar el filtro implícito (envía `isImplicitFilterApplied=false`), equivalente al "quitar filtros" del clásico; el where estructural del tab lo aplica el mismo motor del clásico, con idéntica semántica de visibilidad. |
| **Parámetros dinámicos de contexto/padre resueltos en runtime** | Cubierto por la combinación cliente (provee el contexto) + datasource clásico (substituye los `@param@`), como arriba. |

---

## Qué está parcialmente hecho

- **Orden por defecto: solo cláusulas de una sola columna.** `useTableData.getDefaultSort` parsea la cláusula con `orderByClause.trim().split(/\s+/)`, toma **`parts[0]`** como nombre de campo y detecta descendente solo si **`parts[1]` es `DESC`**. Esto funciona bien para los casos simples (`lineNo`, `creationDate desc`, `documentNo desc`), pero **falla** para las formas habituales del clásico:
  - **Multi-columna** (`dateAcct, lineNo`, `paymentDate, documentNo`, `product.name, product.characteristicDescription`): toma solo el primer token **con la coma pegada** (`dateAcct,`) y descarta el resto → `_sortBy` malformado y columnas secundarias perdidas.
  - **Prefijo `-`** (`-accountingDate`, `-creationDate`): no se interpreta como descendente por nombre de campo (el `hqlName` no lleva el `-`), aunque en el caso de una sola columna el token se reenvía tal cual y el datasource lo entiende; el indicador visual de orden en la grilla, en cambio, no queda reflejado.
  - **Alias `e.`** (`e.documentNo desc`, `e.name`) y **expresiones** (`abs(debit) desc`, `fa.type DESC, Debit DESC, Credit DESC`): el token no coincide con ningún campo y produce un `_sortBy` que no corresponde al orden esperado.
  
  El resultado es que el **orden inicial** de esas pestañas no coincide con el clásico (aparecen en el orden natural del datasource en lugar del configurado). DB: 190 pestañas con `hqlorderbyclause`; buena parte usa formas multi-columna, con `-` o con alias. → **Tarea 1**.

---

## Qué no está hecho

- **No se identifican otros huecos funcionales.** Los filtros (where + filter clause), la substitución de contexto/padre, la adición de filtros del usuario, la sobrescritura del orden y el quitado del filtro implícito quedan cubiertos al delegar en el datasource clásico. El único frente pendiente es el parser del orden por defecto (Tarea 1).

---

## Resumen de lo que queda por hacer

La sección está **mayormente completa y es fiel** al clásico: los filtros por defecto se aplican reutilizando el datasource clásico (que lee `hqlwhereclause`/`hqlfilterclause` del tab y substituye los `@param@`), el cliente aporta el contexto necesario (registro padre y atributos de sesión), y el usuario conserva las capacidades de añadir filtros, cambiar el orden y quitar el filtro implícito. La metadata del tab que emite el adapter incluye las cuatro cláusulas (serialización completa de la entidad `Tab`).

Lo pendiente es acotado y de una sola pieza:

1. **(Tarea 1)** Robustecer el parser del **orden por defecto** en el cliente para que interprete correctamente las cláusulas multi-columna, con prefijo `-` (descendente), con alias de entidad (`e.`) y —en lo razonable— con expresiones, de modo que el orden inicial de cada pestaña coincida con el configurado en el clásico.

---

## Tareas

### Tarea 1 — Soportar cláusulas de orden por defecto multi-columna y con notación completa

**Descripción.** El orden inicial de un grid se toma de la cláusula de orden de la pestaña (`hqlorderbyclause`/`sQLOrderByClause`), pero el cliente solo interpreta correctamente cláusulas de una sola columna. Cuando la cláusula tiene **varias columnas separadas por coma** (p. ej. `dateAcct, lineNo`), un **prefijo `-`** para descendente (p. ej. `-accountingDate`), un **alias de entidad** (p. ej. `e.documentNo desc`) o una **expresión** (p. ej. `abs(debit) desc`), el orden inicial resultante no coincide con el del clásico: se pierden las columnas secundarias y/o el sentido ascendente/descendente. El usuario ve la pestaña ordenada de forma distinta a como está configurada, hasta que reordena manualmente.

**Solución propuesta.** Mejorar la interpretación de la cláusula de orden para que contemple: (a) **múltiples columnas** separadas por coma, preservando su prioridad; (b) la convención de **descendente por prefijo `-`** además de la palabra clave `DESC`; (c) la **normalización del alias de entidad** (quitar el `e.` inicial) antes de resolver el campo; y (d) una degradación segura para tokens que no mapean a un campo conocido (expresiones), sin romper la carga del grid. El orden resuelto debe enviarse al datasource de forma que produzca el mismo resultado que el clásico, y el indicador visual de orden de la grilla debe reflejar la(s) columna(s) efectivamente ordenada(s) cuando correspondan a campos visibles. Debe mantenerse la precedencia actual del orden elegido manualmente por el usuario sobre el default.

**Test cases.**
- Una pestaña con orden `lineNo` (una columna ascendente) mantiene el comportamiento actual.
- Una pestaña con orden `creationDate desc` (una columna descendente) mantiene el comportamiento actual.
- Una pestaña con orden multi-columna (p. ej. `dateAcct, lineNo`) carga ordenada por ambas columnas en la prioridad indicada.
- Una pestaña con orden `-accountingDate` carga en orden descendente por esa columna y el indicador visual lo refleja.
- Una pestaña con orden con alias (p. ej. `e.documentNo desc`) resuelve el campo correcto y aplica el sentido descendente.
- Una cláusula con una expresión no mapeable a un campo no rompe la carga del grid (degradación segura).
- Cambiar el orden manualmente sigue sobrescribiendo el orden por defecto.

**Resultado.** El orden inicial de cada pestaña coincide con la configuración del clásico también en los casos multi-columna, con prefijo `-`, con alias de entidad y con expresiones, sin afectar la capacidad del usuario de reordenar manualmente.

---

> **Nota sobre el reparto backend/frontend.** Al igual que en el clásico, los **filtros** (where + filter clause) los aplica el **datasource** en el servidor —la nueva UI los hereda por llamar al mismo endpoint clásico— mientras que el **orden por defecto** lo resuelve el **frontend** a partir de la metadata del tab (el datasource no aplica un orden por defecto propio si no recibe `_sortBy`). Por eso la única brecha de la sección está en el lado cliente (parser del orden) y no en el motor de filtrado.

> **Nota sobre el entorno representativo (`etendodev`).** Sobre 1.101 pestañas: 40 tienen `hqlfilterclause`, 14 `filterclause` (SQL), 190 `hqlorderbyclause` y 69 `orderbyclause` (SQL). Los filtros con substitución dinámica son reales y frecuentes (p. ej. `e.account.id = @FIN_Financial_Account.id@`, `e.priceList.id = @Order.priceList@`, `e.organization.id = ad_org_getperiodcontrolallow(@#AD_Org_ID@)`). Entre los órdenes hay numerosos casos multi-columna y con prefijo `-`/alias `e.` (`dateAcct, lineNo`, `-accountingDate`, `e.documentNo desc`, `product.name, product.characteristicDescription`, `fa.type DESC, Debit DESC, Credit DESC`), que son precisamente los que la Tarea 1 debe cubrir.

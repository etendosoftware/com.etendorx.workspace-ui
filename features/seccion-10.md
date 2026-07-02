# Sección 10 — Cross-Cutting Behaviors

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 10. Cubre comportamientos **transversales** que aplican a todas las ventanas: campos de auditoría (10.1), filtrado por organización/cliente (10.2), registros activos/inactivos (10.3), adjuntos (10.4), notas (10.5), copiar registro (10.6), zoom a registro relacionado (10.7), navegación por teclado (10.8), manejo de errores (10.9), navegación directa a tab (10.10), URL / deep linking (10.11), traducciones/localización (10.12), permisos y seguridad (10.13) y rendimiento (10.14).

> **Clave de arquitectura:** muchos de estos comportamientos **no son responsabilidad del cliente sino del backend clásico** vía el adapter `com.etendoerp.metadata`: el filtrado por cliente/organización y por acceso de rol (ventanas, tabs, campos) lo resuelve `OBContext` + el datasource clásico; los campos de auditoría los setea el core en cada guardado; copiar registro se delega en el proceso `com.smf.jobs.defaults.CloneRecords`; y la exclusión de FK inactivos la aplica el datasource. La nueva UI aporta la **capa de presentación e interacción**: secciones de adjuntos/notas/linked-items en el formulario, indicadores en la grilla, navegación (zoom vía `ReferencedLink`, deep-linking por URL con sistema de *recovery*), atajos de teclado, toasts de error y localización (labels de backend + formateo numérico/fecha por locale con `Intl`).

**Estimación global de la sección: ~85% de cobertura efectiva.** La mayoría de los comportamientos transversales están cubiertos: auditoría, aislamiento por cliente/organización, adjuntos con CRUD completo, notas, copiar registro (con hijos), zoom a registro relacionado, deep-linking por URL, localización (labels + números/fechas por locale), permisos por rol y distinción visual de inactivos. Los huecos son acotados y de UX/robustez: **atajos de teclado incompletos** (cross-ref Sección 28), **falta de error boundary global** (más matices de errores de red/conflicto), y detalles de **activos/inactivos e indicador de notas en grilla**.

---

## Qué está completamente hecho

| Comportamiento (checklist 10.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **10.1 Campos de auditoría (Created/CreatedBy/Updated/UpdatedBy)** | Vienen como campos de metadata (fieldGroup `audit`), se renderizan en el formulario en **solo lectura**; `CreatedBy`/`UpdatedBy` muestran el **identificador** (nombre) del usuario, no el UUID; fechas con formato por locale. Los valores los setea el core en cada guardado. |
| **10.2 Aislamiento por cliente / organización** | Enforcement **server-side** (`OBContext` + datasource clásico): sólo se ven registros de las organizaciones accesibles y registros a nivel cliente (Org=`*`). El `ProfileModal` permite cambiar rol/organización/almacén; el default de organización en nuevos registros lo aporta la FIC. |
| **10.3 Distinción visual de inactivos** | Filas inactivas se marcan con clase `table-row-inactive` (gris); `active` (YesNo) es una **columna filtrable**; los selectores FK excluyen inactivos (backend) pero un valor inactivo ya seleccionado sigue mostrándose; el registro inactivo es accesible por link directo. |
| **10.4 Adjuntos (CRUD completo)** | `AttachmentSection`: subir (`AddAttachmentModal`), listar, descargar (individual y todos), eliminar (individual y todos); **indicador con badge de cantidad** en la grilla (`AttachmentIndicator`). API en `api-client/attachments`. |
| **10.5 Notas** | `noteSection`: agregar nota, ver historial (autor + fecha), eliminar; muestra `createdBy` + `creationDate`. API en `api-client/notes`. |
| **10.6 Copiar registro** | `handleCopyRecord` → proceso `com.smf.jobs.defaults.CloneRecords`; opción **clonar con hijos** (`obuiappCloneChildren`); resuelve respuesta single/múltiple y navega al clon. El regenerado de claves únicas, reseteo de auditoría/estado y **no** copiar adjuntos/notas lo garantiza el proceso backend. |
| **10.7 Zoom a registro relacionado** | `useRedirect` + endpoint clásico `ReferencedLink` (desambiguación ventana Venta/Compra); usado en celdas FK de la grilla (`useColumns`/`tableColumns`) y en labels del formulario; abre el registro en su ventana en modo formulario. |
| **Linked Items (referencias cruzadas)** | `LinkedItemsSection` lista categorías e ítems vinculados y navega al registro (vía sistema de *recovery* por URL). |
| **10.9 Manejo de errores (base)** | Toasts con tipos success/error/warning/info (`Toaster`/`ToastContent`); validación de obligatorios con **mensaje agregado** (`useFormValidation`: "The following required fields are missing: …") respetando display logic; indicador de campo obligatorio (asterisco + color de error); `ProcessMessageBar` para procesos. |
| **10.10 Navegación directa a tab** | Sistema de *recovery* por URL (`useGlobalUrlStateRecovery` + `appendWindowToUrl`) y `useRedirect` reconstruyen ventana/tab/registro; activan la ventana existente sin duplicar. |
| **10.11 URL / Deep linking** | La URL codifica ventana + tab + registro; el router de Next.js + *recovery* permiten abrir un registro directo, actualizar la URL al navegar y usar back/forward y marcadores. |
| **10.12 Localización** | Labels vía backend (`useBackendLabels`) + shim `OB.I18N.getLabel` con substitución `%0/%1` y fallback a la clave; formateo numérico por locale (`Intl.NumberFormat`, símbolos de decimal/grupo, grouping size 3 en `ob/format.ts`); fechas por locale (`dateUtils`/`DatetimeSelector`). |
| **10.13 Permisos y seguridad** | Enforcement por metadata **server-side**: sólo llegan ventanas/tabs/campos accesibles para el rol; modo solo-lectura por acceso; el menú se arma desde metadata; acceso prohibido se maneja en el proxy/API (`sessionValidator`). |

---

## Qué está parcialmente hecho

- **10.8 Navegación por teclado:** implementados `Ctrl+S` (guardar), `Ctrl+N` (nuevo), `Escape` (cancelar/volver), `Enter` (abrir), `ArrowUp/Down` (filas) y `ArrowLeft/Right` (árbol). **Faltan** varios atajos del checklist: `Ctrl+D` (nuevo documento), `Ctrl+I` (nueva fila inline), `Ctrl+Shift+X` (guardar y cerrar), `Ctrl+Shift+Z` (deshacer cambios), `Ctrl+Delete` (eliminar) y `Ctrl+Shift+R` (refrescar). El detalle completo (43 atajos) es dominio de la **Sección 28**. → **Tarea 1** (impacto medio; cruza con Sección 28).
- **10.3 Activos/Inactivos — toggle dedicado:** hay distinción visual y la columna `active` es filtrable, pero **no** existe un botón/toggle de un clic "mostrar inactivos" como plantea el checklist; hoy se logra filtrando la columna Active. → **Tarea 3** (impacto bajo).
- **10.5 Notas — indicador en grilla:** los adjuntos muestran indicador con contador en la grilla, pero las **notas no** tienen indicador equivalente. → **Tarea 3** (impacto bajo).
- **10.9 Manejo de errores — robustez:** los errores de negocio, validación y proceso están cubiertos, pero (a) **no hay un error boundary global** de React (`app/error.tsx`/`global-error.tsx` ausentes), por lo que un error de JS en un componente podría afectar más de lo deseado; (b) el mensaje amigable ante errores de red/timeout y la **detección de conflicto de edición concurrente** no están claramente implementados. → **Tarea 2** (impacto medio).
- **10.12 Localización — grouping al tipear:** el input numérico formatea por locale pero desactiva el separador de miles mientras se escribe (`useGrouping:false`); es un detalle menor de UX de entrada. (Sin tarea dedicada; se documenta.)

---

## Qué no está hecho

- **Error boundary global de la aplicación** (`app/error.tsx` / `global-error.tsx`): no se encontró; sólo existe un boundary acotado a los defaults de proceso (`ProcessDefaultsErrorBoundary`). → **Tarea 2**.
- **Indicador de notas en la grilla** (equivalente al de adjuntos). → **Tarea 3**.

> **No son brechas / fuera del alcance del cliente:**
> - **10.14 Rendimiento:** está **abordado arquitectónicamente** (scroll infinito + virtualización de la grilla, carga diferida de datos por tab, callouts/FIC server-side, `_noCount`). Los ítems del checklist son criterios cualitativos ("tiempo aceptable"), no funcionalidades discretas; no representan una brecha de implementación concreta y su validación es de QA de performance, no de feature.
> - **10.2 / 10.13 reglas de visibilidad y acceso:** el aislamiento por cliente/organización y el control de acceso por rol se **resuelven server-side** (OBContext, datasource y metadata clásicos); el cliente sólo consume lo que el backend le entrega. No son código faltante en la nueva UI.
> - **10.1 seteo de valores de auditoría** y **10.6 regeneración de claves/reseteo de estado al copiar:** los ejecuta el core/proceso backend; el cliente sólo los presenta/dispara.

---

## Resumen de lo que queda por hacer

Los comportamientos transversales están mayormente cubiertos, en gran parte porque el aislamiento por cliente/organización, el control de acceso por rol, los valores de auditoría y la lógica de copiar registro se resuelven en el backend clásico vía el adapter, y la nueva UI aporta una capa de presentación e interacción completa: secciones de adjuntos (CRUD + indicador), notas y linked-items; zoom a registro relacionado vía `ReferencedLink`; deep-linking por URL con sistema de *recovery*; localización de labels y formateo numérico/fecha por locale; y toasts + validación de obligatorios. Quedan tres ajustes principales, todos de UX/robustez: **completar los atajos de teclado** (**Tarea 1**, cruza con Sección 28), **agregar un error boundary global y mejorar el manejo de errores de red/conflicto de edición** (**Tarea 2**), y **agregar el toggle "mostrar inactivos" y el indicador de notas en la grilla** (**Tarea 3**). El rendimiento (10.14) queda como criterio de QA, no como brecha de implementación.

---

## Tareas

### Tarea 1 — Completar los atajos de teclado transversales

**Descripción:** la nueva UI implementa `Ctrl+S`, `Ctrl+N`, `Escape`, `Enter` y las flechas, pero faltan varios atajos del checklist 10.8 (nuevo documento, nueva fila inline, guardar y cerrar, deshacer, eliminar, refrescar). El listado completo pertenece a la Sección 28.

**Solución propuesta:** ampliar el mapa de atajos existente para cubrir las acciones faltantes reutilizando las acciones ya registradas (guardar, nuevo, refrescar, eliminar, deshacer, cerrar formulario), respetando el contexto (formulario vs. grilla) y evitando conflictos con el navegador. Coordinar el conjunto y las combinaciones exactas con la Sección 28 para no duplicar definiciones.

**Test cases:**
- Cada atajo del checklist dispara su acción en el contexto correcto (formulario/grilla).
- Los atajos no se disparan dentro de inputs cuando no corresponde.
- `Ctrl+Delete` pide confirmación antes de eliminar.
- No hay regresión en los atajos ya existentes (`Ctrl+S`, `Ctrl+N`, `Escape`, `Enter`, flechas).

**Resultado:** el usuario cuenta con el conjunto completo de atajos de teclado transversales, alineado con el clásico y con la Sección 28.

### Tarea 2 — Error boundary global y manejo robusto de errores de red/conflicto

**Descripción:** el manejo de errores de negocio, validación y proceso está cubierto, pero no existe un error boundary global de la aplicación (un error de JS en un componente puede propagarse) ni un manejo explícito y amigable de errores de red/timeout y de conflictos de edición concurrente.

**Solución propuesta:** incorporar un límite de error global que capture fallos de renderizado y muestre una pantalla de recuperación en lugar de romper la aplicación; y estandarizar mensajes amigables para errores de red/timeout y para el caso de edición concurrente (cuando el servidor indica conflicto, avisar y ofrecer recargar). Reutilizar el sistema de toasts/mensajería existente.

**Test cases:**
- Un error de renderizado en un componente muestra la UI de recuperación y no una pantalla en blanco.
- Un timeout / pérdida de conexión muestra un mensaje accionable, no un error genérico.
- Ante un conflicto de edición reportado por el servidor, la UI avisa y permite recargar sin perder el contexto.
- Los errores de negocio/validación ya existentes siguen mostrándose con su tipo correcto.

**Resultado:** la aplicación es más robusta ante fallos inesperados y comunica los errores de infraestructura de forma clara.

### Tarea 3 — Toggle "mostrar inactivos" e indicador de notas en la grilla

**Descripción:** (a) para ver registros inactivos hoy hay que filtrar manualmente la columna Active; falta un toggle de un clic "mostrar inactivos". (b) La grilla muestra indicador de adjuntos pero no de notas.

**Solución propuesta:** (a) agregar en la grilla un control de "mostrar/ocultar inactivos" que ajuste el filtro de activos y recargue, manteniendo la distinción visual ya existente para filas inactivas; (b) agregar un indicador de notas en la grilla análogo al de adjuntos, reutilizando el patrón del indicador existente.

**Test cases:**
- Activar "mostrar inactivos" incluye las filas inactivas (con su estilo gris) y desactivarlo vuelve a ocultarlas.
- El estado del toggle es coherente con el filtrado de la columna Active.
- Los registros con notas muestran el indicador correspondiente en la grilla.
- Sin regresión en el indicador de adjuntos ni en la distinción visual de inactivos.

**Resultado:** el usuario puede alternar la visibilidad de inactivos con un clic y detectar de un vistazo qué registros tienen notas, igualando la paridad con el clásico.

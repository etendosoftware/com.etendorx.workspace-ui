# Sección 21 — Workspace / Dashboard (My Openbravo)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 21. Cubre el **Workspace/Dashboard**: la página de inicio configurable, compuesta por instancias de widgets que el usuario puede agregar, quitar, reordenar y configurar.

> **Clave de arquitectura:** en el clásico el Workspace ("My Openbravo") lo provee el módulo **OBKMO** con sus tablas (`obkmo_widget_class`, `obkmo_widget_instance`, `obkmo_widget_class_access`) y tipos abiertos (URL/Query/Reference/Custom JS). La nueva UI **no reutiliza OBKMO**: implementa un **framework de dashboard nativo y propio** en el adapter (`com.etendoerp.metadata`), con tablas nuevas **`etmeta_widget_class` / `etmeta_widget_param` / `etmeta_dashboard_widget`** y endpoints REST (`.../meta/dashboard/layout`, `/widget/classes`, `/widget/{id}/data`, `/dashboard/widget`). El frontend es completamente nativo (`screens/Home`, `DashboardGrid` sobre `react-grid-layout`, `dashboardStore`, `useDashboard`). Las instancias tienen **capas SYSTEM/CLIENT/USER**: los widgets base del sistema se muestran a todos y, al mover/ocultar/configurar, se genera un **override de capa USER** por usuario+rol (nunca se altera el registro base). El catálogo es un **conjunto curado** de 22 tipos (KPI, QUERY_LIST vía HQL, URL en iframe, HTML, PROCESS, CALENDAR, NOTIFICATION, STOCK_ALERT, FAVORITES, RECENT_DOCS, RECENTLY_VIEWED, COPILOT, PROXY). Es una **decisión de diseño** (rediseño nativo), no una delegación al render clásico.

**Estimación global de la sección: ~85% de cobertura efectiva.** El propósito central del Workspace está **completo y es nativo**: es la landing por defecto tras el login, carga las instancias del usuario con sus datos, permite **agregar, quitar, reordenar (drag & drop) y redimensionar** widgets con **persistencia server-side** por usuario+rol, ofrece **diálogo de configuración** de parámetros, soporta **widgets URL (iframe), Query (HQL), HTML, KPI, etc.**, aplica **auto-refresh periódico** por `refreshInterval` y las consultas respetan el **contexto de organización/rol** del usuario. Los huecos son secundarios: no hay **colapsar/expandir** widgets, el catálogo de "Agregar widget" **no se filtra por acceso de rol** (no existe la tabla de acceso equivalente a `obkmo_widget_class_access`), y el **refresco manual** no tiene botón en la tarjeta (solo auto-refresh y refresco programático).

---

## Qué está completamente hecho

| Comportamiento (checklist 21.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **El Workspace es la landing por defecto tras el login** | En `window/page.tsx`, cuando no hay ninguna ventana activa (`isHomeRoute = !activeWindow`) se renderiza `screens/Home` (el dashboard). Tras login no hay ventanas abiertas → se ve el dashboard. |
| **Cargan los widgets configurados del usuario con sus datos** | `useDashboard`/`dashboardStore.loadLayout` obtiene el layout (`/dashboard/layout`) y luego los datos de cada instancia (`/widget/{id}/data`); `DashboardLayoutResolver` combina las capas SYSTEM/CLIENT + overrides USER por usuario+rol. |
| **Agregar widget lista los tipos disponibles** | `AddWidgetDialog` lista los `etmeta_widget_class` activos (`/widget/classes`), marcando los ya agregados; `handleAddWidget` → `POST /dashboard/widget` inserta una instancia (capa USER, o CLIENT si es admin). *(Filtrado por rol: ver "parcialmente hecho".)* |
| **Quitar widget funciona** | `removeWidget` → `DELETE /dashboard/widget/{id}`. Si la instancia es de capa USER se borra; si es SYSTEM/CLIENT se inserta un **registro sombra USER con `isvisible=N`** para ocultarla solo a ese usuario+rol. Optimista en el store. |
| **Drag & drop de reordenamiento funciona y persiste** | `DashboardGrid` usa `react-grid-layout` (grilla de 4 columnas); `onDragStop`/`onResizeStop` → `updateLayout` → `PUT /dashboard/layout`, que persiste posición/tamaño (o crea override USER si el registro es de sistema). |
| **Redimensionar widgets** | Handle de resize (`se`) en `react-grid-layout`; el nuevo `width/height` se persiste igual que el reordenamiento. |
| **Diálogos de configuración de widget** | Widgets con parámetros no fijos (`params.some(p => !p.fixed)`) muestran ícono de settings → `EditWidgetParamsDialog` → `PUT /widget/{id}/params` (con validación de URLs `https://` en el backend). |
| **Widgets URL cargan contenido externo en iframe** | Tipo `URL` (`google-calendar`, etc.) → `UrlRenderer` embebe la URL en iframe con `sandbox`. |
| **Widgets Query muestran datos** | Tipo `QUERY_LIST` (11 widgets: invoices-to-pay, best-sellers, stock-by-warehouse, etc.) resuelto por `QueryListResolver` (HQL) → `QueryListRenderer` con columnas, filas y paginación (`fetchWidgetPage`). |
| **El layout persiste entre sesiones (server-side)** | Todo el layout vive en `etmeta_dashboard_widget` (posición, tamaño, visibilidad, parámetros) por usuario+rol; no depende de localStorage. |
| **Los widgets respetan el contexto de organización/rol** | Los resolvers corren bajo el `OBContext` de la sesión; `QueryListResolver` inyecta `organizationList` = organizaciones legibles del rol → los datos quedan acotados por org/rol. Enforcement server-side. |
| **Refresco periódico de datos** | `setupAutoRefresh` crea un `setInterval` por instancia según `refreshInterval` (p. ej. KPI 300s, notifications 60s), refrescando solo los datos de esa instancia. |

---

## Qué está parcialmente hecho

- **Filtrado del catálogo "Agregar widget" por acceso de rol.** El clásico controla con `obkmo_widget_class_access` qué roles pueden usar cada widget; el framework nuevo **no tiene tabla de acceso** (`etmeta_widget_class` no expone rol) y `WidgetClassesService` devuelve **todos** los tipos activos (en modo admin). El catálogo ofrecido es igual para todos los roles. **Atenúa el impacto:** el catálogo es curado y los **datos** de cada widget sí se acotan por org/rol al resolverse, por lo que no hay fuga de datos; lo que falta es la restricción de *qué tipos* puede agregar cada rol. → **Tarea 2**.
- **Refresco manual de datos.** Existe auto-refresh periódico y refresco programático (`refreshWidget`, usado al togglear favoritos), pero la tarjeta **no ofrece un botón de "refrescar"** para forzar la actualización a demanda. → **Tarea 3** (baja prioridad).
- **Carga de datos de todos los widgets al inicio (vs. "solo los visibles").** `loadLayout` dispara los datos de **todas** las instancias en paralelo. Como no hay colapsar/expandir, todas están visibles, por lo que el criterio "solo los visibles cargan datos inicialmente" se cumple de facto hoy; quedaría pendiente recién si se implementa el colapso (ver Tarea 1). No genera tarea propia.

---

## Qué no está hecho

- **Colapsar/expandir widgets.** El clásico permite colapsar una tarjeta para ahorrar espacio. `WidgetCard` solo tiene acciones de **configurar** y **quitar/ocultar**; no hay control de colapso ni se persiste ese estado. → **Tarea 1**.
- **Autoría de nuevos tipos de widget desde la aplicación.** El clásico OBKMO permite a un admin definir nuevas clases de widget (URL/Query/Reference/Custom JS) por diccionario. En el framework nuevo el catálogo (`etmeta_widget_class`) es **provisto por módulo/semilla**, no editable por el usuario final. Se documenta como **decisión de diseño** (catálogo curado); **no se genera tarea** salvo que el proyecto requiera authoring dinámico de widgets.

---

## Resumen de lo que queda por hacer

El Workspace está **reimplementado de forma nativa y es funcionalmente sólido**: landing por defecto, carga de widgets con datos, agregar/quitar/reordenar/redimensionar con persistencia server-side por usuario+rol, configuración de parámetros, widgets URL/Query/HTML/KPI, auto-refresh periódico y acotamiento de datos por org/rol. Lo pendiente es acotado:

1. **(Tarea 1)** Colapsar/expandir widgets y persistir ese estado.
2. **(Tarea 2)** Filtrar el catálogo de "Agregar widget" por acceso de rol.
3. **(Tarea 3)** Botón de refresco manual en la tarjeta del widget (baja prioridad).

El uso de un framework de dashboard propio (en vez de OBKMO) y el catálogo curado de tipos de widget se documentan como decisiones de diseño y no generan tarea.

---

## Tareas

### Tarea 1 — Colapsar/expandir widgets del dashboard

**Descripción.** Las tarjetas del dashboard no se pueden colapsar; siempre ocupan su alto completo. El Workspace clásico permite colapsar un widget para reducirlo a su encabezado y ahorrar espacio. Falta el control de colapso en la tarjeta y la persistencia de ese estado entre sesiones.

**Solución propuesta.** Agregar a la tarjeta del widget una acción de colapsar/expandir que oculte su contenido dejando visible el encabezado, y persistir ese estado por instancia junto con el resto del layout del usuario (misma vía de persistencia por usuario+rol que posición y tamaño). Al colapsar, el widget no debería necesitar recargar datos hasta expandirse de nuevo.

**Test cases.**
- Colapsar un widget oculta su contenido y deja visible el encabezado.
- Expandir lo vuelve a mostrar con sus datos.
- El estado colapsado/expandido persiste al recargar la página / reingresar (server-side).
- El colapso no rompe el reordenamiento ni el redimensionado de los demás widgets.
- Un widget colapsado no dispara peticiones de datos hasta expandirse.

**Resultado.** El usuario puede colapsar/expandir widgets y el estado se conserva entre sesiones, con paridad respecto del Workspace clásico.

---

### Tarea 2 — Filtrar el catálogo de "Agregar widget" por acceso de rol

**Descripción.** El diálogo de "Agregar widget" muestra el mismo catálogo de tipos a todos los roles, porque el framework nuevo no tiene un control de acceso por rol sobre las clases de widget (a diferencia del clásico, que lo define en su tabla de acceso). Los datos de cada widget ya se acotan por organización/rol, pero cualquier rol puede agregar cualquier tipo de widget del catálogo.

**Solución propuesta.** Introducir un control de acceso por rol sobre las clases de widget (equivalente conceptual a la tabla de acceso del clásico) y aplicarlo tanto al listar el catálogo de "Agregar widget" como al resolver el layout, de modo que cada rol solo vea/agregue los tipos permitidos. Debe contemplar un comportamiento por defecto seguro (p. ej. visibles salvo restricción explícita) para no romper los dashboards existentes.

**Test cases.**
- Un rol con acceso restringido a un tipo de widget no lo ve en el catálogo de "Agregar widget".
- Un rol con acceso sí puede agregarlo.
- El layout no muestra widgets de tipos no permitidos para el rol activo.
- El comportamiento por defecto no oculta widgets ya en uso tras introducir el control.

**Resultado.** El catálogo de widgets y el dashboard respetan el acceso por rol, completando el criterio del checklist.

---

### Tarea 3 — Refresco manual de datos del widget

> **⚠️ Baja prioridad.** Ya existe auto-refresh periódico por `refreshInterval` y refresco programático; falta solo la acción manual a demanda.

**Descripción.** El usuario no puede forzar la actualización de los datos de un widget: debe esperar al intervalo de auto-refresh (si el widget lo tiene) o recargar la página. Falta un control explícito de "refrescar" en la tarjeta.

**Solución propuesta.** Agregar a la tarjeta del widget una acción de refresco que vuelva a pedir los datos de esa instancia (reutilizando el refresco por instancia ya existente), con indicación visual de carga mientras se actualiza. No debe alterar el auto-refresh periódico.

**Test cases.**
- El botón de refrescar vuelve a solicitar los datos del widget y actualiza el contenido.
- Se muestra un estado de carga durante el refresco.
- El auto-refresh periódico sigue funcionando sin cambios.
- Un error de refresco muestra el mensaje de error sin romper la tarjeta.

**Resultado.** El usuario puede actualizar a demanda los datos de un widget, completando el criterio "refresco manual y periódico".

---

> **Nota sobre el framework.** La nueva UI **no usa el módulo OBKMO** del clásico sino un framework de dashboard propio (`etmeta_widget_*`) en `com.etendoerp.metadata`, con capas SYSTEM/CLIENT/USER y un catálogo curado de 22 tipos de widget verificado en `etendodev`. Los comportamientos del Workspace se evalúan sobre esta implementación nativa; la ausencia de tipos "Custom JS/Reference" abiertos al usuario final es una decisión de diseño, no un defecto.

# Sección 34 — Calendar Views

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 34. Cubre el **framework de vistas de calendario** del clásico: **OBCalendar** (calendario único con vistas día/semana/mes), **OBMultiCalendar** (varios calendarios en paralelo con leyenda y controles laterales) y **OBEventEditor** (`OBCalendar_EventDialogBridge`, diálogo de edición de eventos); con eventos como bloques de color, creación al hacer clic en un slot horario, edición al hacer clic en un evento, **drag & drop** para reprogramar, **resize** para cambiar duración, **swim lanes** para múltiples recursos/personas, **leyenda** por categorías, navegación anterior/siguiente y respeto de zona horaria y accesos por organización/rol.

> **Clave de arquitectura:** en el clásico, este calendario **NO es una ventana, ni un form, ni un tipo de referencia, ni una entrada de menú**. Es exclusivamente un **widget de dashboard / workspace** (My Openbravo: `OBKMO_WIDGET_CLASS` "Calendar Widget" → `org.openbravo.client.myob.CalendarWidgetProvider`, que instancia `ob-calendar.js` / `ob-multicalendar.js`). Es una funcionalidad **de nicho y marcada como *work-in-progress*** ("API will change" en su propia definición) que el usuario debe **añadir manualmente** a su workspace, y que **no trae datos por sí sola**: cada instancia necesita un **Action Handler configurado** (`calendarDataActionHandler`) que provea los eventos. En el entorno representativo (`etendodev`) hay **0 instancias desplegadas** de este widget. No existe una tabla estándar de "eventos" en el core. Por tanto, §34 se evalúa como *feature de widget de dashboard*, no como capacidad transversal de la interfaz.

> **Distinción crítica (namesake):** la nueva UI **sí tiene un dashboard con widgets** y **sí incluye un tipo de widget `CALENDAR`** ([WidgetRenderer.tsx](../client/packages/MainUI/screens/Home/widgets/WidgetRenderer.tsx) → [CalendarRenderer.tsx](../client/packages/MainUI/screens/Home/widgets/renderers/CalendarRenderer.tsx)), pero **resuelve un caso de uso distinto**: muestra el **calendario fiscal / períodos contables** (`C_Period` abiertos/cerrados + `C_NonBusinessDay`), vía el resolver del adapter [CalendarResolver.java](../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/widgets/resolvers/CalendarResolver.java). **No es** una vista de agenda con eventos día/semana/mes. El propio resolver documenta que el "modo eventos" del `OBCalendarWidget` clásico está **deliberadamente diferido** ("Deferred: no standard events table exists in the base install and the new web UI does not require it yet").

**Estimación global de la sección: ~10% de cobertura efectiva.** El calendario de **agenda/eventos** que describe §34 (grilla día/semana/mes, eventos como bloques, crear al clic, editar con diálogo, drag & drop, resize, lanes, leyenda) **no está implementado** en la nueva UI. Lo que sí existe es (a) la **infraestructura de dashboard/widgets** que haría factible construirlo y (b) un **widget `CALENDAR` homónimo** que cubre otra necesidad (períodos fiscales). No hay librería de calendario de agenda instalada (sin `fullcalendar`/`react-big-calendar`/etc.). Como es una funcionalidad de nicho, WIP y sin instancias en el entorno representativo, el hueco es **real pero de baja prioridad** → **Tarea 1**.

---

## Qué está completamente hecho

- **Nada del calendario de agenda/eventos de §34.** Ningún ítem del checklist 34.4 (vista día/semana/mes de eventos, mostrar eventos en su posición horaria, crear/editar evento, drag & drop, resize, lanes, leyenda) está cubierto.

*(Existe infraestructura reutilizable y un widget homónimo con otro propósito — ver "parcialmente hecho".)*

---

## Qué está parcialmente hecho

- **Infraestructura de dashboard y widgets (base habilitante).** La nueva UI tiene un dashboard completo con clases e instancias de widget, layout arrastrable y renderizadores por tipo ([useDashboard.ts](../client/packages/MainUI/hooks/useDashboard.ts), [DashboardGrid.tsx](../client/packages/MainUI/screens/Home/widgets/DashboardGrid.tsx), [WidgetRenderer.tsx](../client/packages/MainUI/screens/Home/widgets/WidgetRenderer.tsx)). Es el punto de anclaje natural donde viviría un widget de calendario de agenda, pero ese renderizador **no existe**. Base para la Tarea 1, no cobertura de §34.
- **Widget `CALENDAR` homónimo (calendario fiscal, no agenda).** Existe y funciona, pero muestra **períodos contables** (`currentPeriod` + entradas con estado Open/Closed) resueltos por el adapter — una funcionalidad **distinta** de la agenda de eventos de §34. Cubre un caso de uso propio; **no** aporta vistas día/semana/mes, eventos, drag & drop, resize, lanes ni leyenda.

---

## Qué no está hecho

Todos los ítems del checklist 34.4, en su acepción de **calendario de agenda/eventos**:

- **Vistas día / semana / mes** de una grilla temporal. No existen.
- **Eventos mostrados como bloques de color** en su posición horaria. No existe.
- **Navegación anterior/siguiente** entre días/semanas/meses. No aplica (no hay vista).
- **Crear evento** al hacer clic en un slot horario. No existe.
- **Editar evento** al hacer clic en un evento existente. No existe.
- **Diálogo editor de eventos** (`OBEventEditor` / `OBCalendar_EventDialogBridge`) con sus campos. No existe.
- **Drag & drop** para reprogramar eventos. No existe (el `@dnd-kit` presente sirve al grid del dashboard, no a un calendario).
- **Resize** de eventos para cambiar la duración. No existe.
- **Multi-calendario con swim lanes** (varios recursos/personas). No existe.
- **Leyenda con codificación de color** por categorías. No existe.
- **Zona horaria del usuario** y **accesos por organización/rol** para eventos. No aplica (no hay eventos ni vista).

---

## Fuera de alcance / consideraciones (no son huecos de cliente en sentido estricto)

- **Origen de datos de eventos.** En el clásico, el calendario no tiene una tabla estándar de eventos: cada instancia del widget depende de un **Action Handler a medida** (`calendarDataActionHandler`) que provea los eventos. El adapter documenta explícitamente que no existe una tabla de eventos estándar en el core y difiere el "modo eventos". Cualquier implementación en la nueva UI requiere **definir primero de dónde salen los eventos** (nueva fuente/entidad o proxy al action handler), lo cual es una decisión de producto/servidor previa, no solo de UI.
- **Widget de calendario fiscal.** El widget `CALENDAR` existente (períodos contables) **cubre su propósito** y **no debe confundirse** con la agenda de §34; no constituye hueco.

---

## Resumen de lo que queda por hacer

El **calendario de agenda/eventos** de §34 (OBCalendar / OBMultiCalendar / OBEventEditor) **no está implementado** en la nueva UI. Existe la **infraestructura de dashboard/widgets** que lo haría factible y un **widget `CALENDAR` homónimo** que resuelve otra necesidad (períodos fiscales), pero la vista de agenda —grilla día/semana/mes, eventos como bloques, crear/editar con diálogo, drag & drop, resize, lanes y leyenda— debe construirse por completo.

Es importante dimensionar el hueco con honestidad: en el clásico esta es una funcionalidad **de nicho, marcada como *work-in-progress***, disponible **solo** como widget que el usuario añade manualmente, que **depende de Action Handlers a medida** para traer eventos y que **no tiene instancias desplegadas** en el entorno representativo. Por eso el hueco, aunque real, es de **baja prioridad**, y su implementación está condicionada a definir antes la **fuente de datos de eventos**. Se encapsula en la **Tarea 1**.

---

## Tareas

### Tarea 1 — Vista de calendario de agenda/eventos (día/semana/mes) como widget de dashboard

**Descripción.** La nueva UI no ofrece una vista de calendario de agenda al estilo del clásico OBCalendar/OBMultiCalendar: no hay grilla temporal día/semana/mes, ni eventos como bloques de color, ni creación de evento al hacer clic en un slot, ni edición mediante un diálogo editor, ni drag & drop para reprogramar, ni resize para cambiar duración, ni multi-calendario con swim lanes y leyenda por categorías. El único widget "CALENDAR" existente muestra períodos fiscales, que es otra funcionalidad. Además, esta feature es de nicho y en el clásico depende de un Action Handler a medida para obtener los eventos (no hay tabla de eventos estándar), por lo que su alcance real debe acordarse con producto.

**Solución propuesta.** Construir un **nuevo renderizador de widget de agenda** dentro del sistema de dashboard ya existente (reutilizando su layout, ciclo de datos y registro de tipos), que presente los eventos en vistas día/semana/mes con navegación anterior/siguiente, permita crear un evento al seleccionar un slot y editarlo mediante un diálogo con sus campos, soporte drag & drop y resize para reprogramar y redimensionar, y ofrezca una variante multi-calendario con lanes y leyenda coloreada por categoría, respetando zona horaria y accesos por organización/rol. Como paso previo imprescindible, **definir la fuente de datos de eventos** (nueva entidad/fuente en el servidor o un proxy hacia el mecanismo de Action Handler del clásico), dado que el core no provee una tabla estándar de eventos. Dado el carácter de nicho y *work-in-progress* de la funcionalidad clásica, se recomienda **priorizarla por debajo** de las brechas de ventanas/procesos y validar con producto el alcance mínimo (por ejemplo, empezar por vista mensual de solo lectura).

**Test cases.**
- El calendario se renderiza en el modo de vista seleccionado (día/semana/mes) y los eventos aparecen en su posición temporal correcta.
- La navegación anterior/siguiente cambia el período mostrado y recarga los eventos correspondientes.
- Al hacer clic en un slot horario se abre el diálogo de creación de evento; al hacer clic en un evento existente se abre el editor con sus campos.
- El drag & drop reprograma un evento a un nuevo horario y el resize cambia su duración, persistiendo el cambio.
- La variante multi-calendario muestra correctamente varias lanes y una leyenda con codificación de color por categoría.
- Los eventos respetan la zona horaria del usuario y el acceso por organización/rol (no se muestran ni editan eventos fuera del alcance del usuario).

**Resultado.** El usuario dispone de una vista de calendario de agenda funcional (día/semana/mes) en el dashboard, con creación, edición, drag & drop, resize, multi-calendario con lanes y leyenda, con paridad respecto del OBCalendar clásico dentro del alcance acordado con producto, y apoyada en una fuente de datos de eventos definida explícitamente.

---

> **Nota sobre el entorno representativo (`etendodev`).** Se confirmó: el calendario clásico de agenda existe **solo** como widget de dashboard (`OBKMO_WIDGET_CLASS` "Calendar Widget" → `CalendarWidgetProvider`, sobre `ob-calendar.js`/`ob-multicalendar.js`), con **0 instancias desplegadas** y marcado como *work-in-progress*; **no** hay ventana, form, tipo de referencia ni menú de calendario de agenda (las únicas coincidencias son "Fiscal Calendar", una ventana AD estándar de períodos, y referencias no relacionadas). El widget `CALENDAR` de la nueva UI resuelve el **calendario fiscal** vía el adapter (`CalendarResolver.java`), que **difiere explícitamente** el modo eventos por no existir una tabla de eventos estándar en el core; en la DB hay **804 `c_period`**, **0 `c_nonbusinessday`** y **3 `c_calendar`** (datos fiscales reales), y ningún dato de eventos de agenda. En el cliente **no** hay librería de calendario de agenda instalada (`fullcalendar`, `react-big-calendar`, `@schedule-x`, etc.); `@dnd-kit` está presente pero al servicio del grid del dashboard. La infraestructura de dashboard/widgets existe y hace factible la Tarea 1, pero la vista de agenda debe construirse por completo.

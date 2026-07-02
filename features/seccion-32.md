# Sección 32 — Alert System (Real-Time Notifications)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 32. Cubre el **sistema de alertas / notificaciones en tiempo real**: reglas de alerta SQL (`ad_alertrule`) evaluadas por el proceso background *Alert Process*, las instancias de alerta (`ad_alert`), y sobre todo la **capa de cliente**: un **icono de alertas** en la barra de navegación con **badge** de conteo de no reconocidas, un **Alert Manager** que hace *polling* al servidor cada 50 s, y la **Alert Management View** (grilla filtrable/ordenable con detalle, acknowledge, y enlaces al registro origen).

> **Clave de arquitectura:** la sección tiene tres capas. (1) La **generación** de alertas (el *Alert Process* evalúa el SQL de las reglas y crea filas en `ad_alert`) es **100% servidor/background** — no es responsabilidad de la UI. (2) La **capa de cliente** (icono + badge, polling cada 50 s, vista de gestión) es una funcionalidad **genuinamente de cliente** del clásico: la *Alert Management View* es una vista especial SmartClient (`action=OBUIAPP_OpenView`) y el polling es JS del navegador (`ob-alert-manager.js`). **No hay endpoint clásico ni componente del adapter (`com.etendoerp.metadata`) específico de alertas que delegar limpiamente** (el form legacy `X` 800016 está **inactivo** en el entorno; la ruta activa es la vista SmartClient). (3) Existe además una ventana AD estándar **"Alert"** (`action=W`) sobre las reglas y `ad_alert`, que el motor genérico de ventanas **podría** renderizar como *fallback* de visualización de datos — pero es la ventana de **administración de reglas**, no el flujo de notificación al usuario final.

**Estimación global de la sección: ~10% de cobertura efectiva.** El corazón de §32 —el **indicador de notificaciones en tiempo real** (icono en la barra, badge de no reconocidas, polling de 50 s, clic → abrir gestión)— **no está implementado**: la barra de navegación real ([navigation.tsx](../client/packages/MainUI/components/navigation.tsx)) solo contiene Copilot, Configuración y Perfil; no hay icono de alertas, ni polling, ni ninguna lectura de `ad_alert`. Lo único preexistente es **infraestructura reutilizable no conectada**: los componentes `NotificationButton` / `NotificationsModal` / `NotificationItem` existen en la ComponentLibrary pero **no se usan en la aplicación**, vienen **deshabilitados** (`disabled={true}` hardcodeado) y reciben un prop `notifications` genérico **sin fuente de datos**. Se documenta como hueco funcional real → **Tarea 1** (icono + badge + polling) y **Tarea 2** (vista de gestión: grilla, detalle, acknowledge, enlaces).

---

## Qué está completamente hecho

- **Nada específico del sistema de alertas.** Ningún ítem del checklist 32.4 está cubierto en la aplicación.

*(Existe infraestructura de UI adyacente reutilizable —un botón de notificaciones con badge y un modal de lista— pero está sin usar, deshabilitada y sin datos; ver "parcialmente hecho".)*

---

## Qué está parcialmente hecho

- **Cascarón de UI de notificaciones (base para el icono + badge).** La ComponentLibrary incluye `NotificationButton` (icono con `Badge` de Material UI que muestra el conteo), `NotificationsModal` (lista con estado vacío y ítems) y `NotificationItem`. Es una base visual adecuada para el icono de alertas, **pero**: (a) **no se monta en la barra de navegación** de la app (`navigation.tsx` no lo referencia; solo aparece en Storybook), (b) el `IconButton` interno viene **`disabled={true}` fijo**, y (c) se alimenta de un prop `notifications` genérico que **nadie puebla** desde `ad_alert`. Es infraestructura de presentación, no cobertura funcional → base para la **Tarea 1**.
- **Fallback de visualización vía ventana estándar "Alert".** En el entorno existe la ventana AD **"Alert"** (`action=W`, activa) con tabs *Alert Rule* / *Translation* / *Alert Recipient* / *Alert* (sobre `ad_alert`). El motor genérico de ventanas de la nueva UI **podría** renderizarla, dando una grilla filtrable/ordenable de reglas y de instancias de alerta con su detalle (descripción, regla, fecha, `record_id`, `status`, `isfixed`), respetando cliente/organización. Sin embargo es la ventana de **administración de reglas**, no el **flujo de notificación** (icono/badge/polling/clic) que pide la sección; cubre parcialmente "ver alertas en grilla con detalle", no la experiencia de notificación en tiempo real → no sustituye a las tareas.

---

## Qué no está hecho

- **Icono de alertas en la barra de navegación.** No existe en la app (la nav solo tiene Copilot, Configuración y Perfil). → **Tarea 1**.
- **Badge con el conteo de alertas no reconocidas.** El componente soporta badge, pero no hay dato conectado ni cálculo de "no reconocidas" (`isfixed='N'`). → **Tarea 1**.
- **Actualización en tiempo real (ciclo de polling de 50 s).** No hay ningún *Alert Manager* ni polling equivalente a `ob-alert-manager.js` en el cliente (sin referencias a `ad_alert` ni a `ignoreForSessionTimeout`). → **Tarea 1**.
- **Abrir la Alert Management View al hacer clic en el icono.** No existe la vista ni el enganche. → **Tarea 2**.
- **Grilla de alertas filtrable/ordenable con detalle** (regla, descripción, fecha, referencia al registro). No disponible como vista de notificación (solo el *fallback* genérico de la ventana "Alert", no enganchado al icono). → **Tarea 2**.
- **Acknowledge (marcar como leída, decrementar el badge).** No implementado como acción de la vista (en `ad_alert` equivale a fijar `isfixed`; en el clásico es una acción de la vista, no un `ad_process`). → **Tarea 2**.
- **Enlaces de la alerta que navegan al registro/ventana origen** (`record_id` / `referencekey_id`). No implementado. → **Tarea 2**.

---

## Fuera de alcance / responsabilidad del servidor (no son huecos de cliente)

- **Evaluación de reglas y generación de alertas (*Alert Process*).** 100% servidor/background: ejecuta el SQL de `ad_alertrule` e inserta filas en `ad_alert`. La UI nunca genera alertas.
- **Filtrado por rol/organización.** El acceso a los datos por rol/organización es transversal a toda la nueva UI (lo aplica el servidor/datasource), no una lógica específica de alertas.
- **No extender el timeout de sesión al hacer polling (`ignoreForSessionTimeout`).** Es una **restricción de diseño** a respetar cuando se implemente el polling (Tarea 1), no una funcionalidad separada: las peticiones de sondeo no deben renovar la sesión del usuario.

---

## Resumen de lo que queda por hacer

La capa de **generación** de alertas es servidor/background y está fuera del alcance de la interfaz. La capa de **cliente** —que es el objeto de la sección— **está esencialmente sin implementar** en la nueva UI: falta el indicador de notificaciones en tiempo real (icono + badge + polling) y la vista de gestión (grilla + detalle + acknowledge + enlaces al origen). Lo preexistente se reduce a un **cascarón visual reutilizable** (botón de notificaciones con badge y modal de lista) que hoy está sin montar, deshabilitado y sin fuente de datos, más un **fallback** de solo-datos que ofrecería el motor genérico al renderizar la ventana estándar "Alert" (que es de administración, no de notificación).

Quedan dos frentes: (1) **el indicador de notificaciones en tiempo real** —montar y habilitar el icono en la barra, calcular y mostrar el conteo de alertas no reconocidas del usuario, y sondear periódicamente al servidor sin extender la sesión—; y (2) **la vista de gestión de alertas** —grilla filtrable/ordenable con detalle, acción de acknowledge (fijar la alerta y decrementar el badge) y enlaces de navegación al registro origen—, reutilizando en lo posible el cascarón existente y el motor genérico de ventanas.

---

## Tareas

### Tarea 1 — Icono de alertas con badge y sondeo en tiempo real

**Descripción.** La barra de navegación no tiene indicador de alertas. Falta mostrar un icono de notificaciones con un badge que refleje el número de alertas **no reconocidas** del usuario, y actualizarlo periódicamente (paridad con el ciclo de ~50 s del clásico) para que el usuario se entere de nuevas alertas sin recargar. Existe un componente de botón de notificaciones con badge en la biblioteca, pero está sin montar en la app, deshabilitado y sin datos.

**Solución propuesta.** Montar el icono de notificaciones en la barra de navegación, habilitarlo, y conectarlo a una fuente de datos que provea el conteo de alertas no reconocidas del usuario actual (según su rol/organización). Añadir un sondeo periódico que refresque ese conteo en un intervalo equivalente al del clásico, respetando de forma explícita que **esas peticiones no deben renovar/extender la sesión** del usuario (equivalente al comportamiento de exclusión del timeout). Reutilizar el componente de badge existente para el conteo. No requiere lógica de negocio en el cliente ni, en principio, cambios en el adapter (el conteo puede obtenerse de la infraestructura de datos ya usada por la nueva UI).

**Test cases.**
- Con el usuario autenticado, aparece el icono de alertas en la barra de navegación, habilitado.
- Si el usuario tiene alertas no reconocidas, el badge muestra el conteo correcto; si no tiene, no muestra badge (o muestra cero según el diseño).
- Al generarse nuevas alertas en el servidor, el badge se actualiza dentro del intervalo de sondeo, sin recargar la página.
- El conteo refleja solo las alertas del rol/organización del usuario (no las de otros).
- El sondeo periódico **no** prolonga la sesión: con el usuario inactivo, la sesión expira en el plazo esperado pese al polling.

**Resultado.** El usuario ve en la barra de navegación un icono con el número de alertas pendientes que se mantiene actualizado casi en tiempo real, con paridad respecto del clásico y sin afectar el vencimiento de la sesión.

### Tarea 2 — Vista de gestión de alertas (grilla, detalle, acknowledge y enlaces)

**Descripción.** Al hacer clic en el icono de alertas debe abrirse una vista de gestión con la lista de alertas del usuario: una grilla filtrable y ordenable que muestre el detalle de cada alerta (regla, descripción, fecha de generación y referencia al registro), permita **reconocer** una alerta (marcarla como leída, lo que debe decrementar el badge) y ofrezca **enlaces de navegación** al registro/ventana origen cuando la alerta lo referencia. Hoy nada de esto existe.

**Solución propuesta.** Proveer una vista de gestión de alertas accesible desde el icono, mostrando las alertas del usuario en una grilla con filtro y orden y con el detalle relevante. Incorporar una acción de **acknowledge** que marque la alerta como reconocida en el servidor y actualice el conteo del badge, y **enlaces** que abran el registro/ventana de origen cuando la alerta tenga referencia. Como el sistema expone una ventana estándar sobre las alertas, la vía preferente es **reutilizar el motor genérico de ventanas / la infraestructura de grilla existente** para el listado y el detalle, añadiendo encima la acción de acknowledge y la navegación al origen; la reimplementación totalmente nativa es la alternativa de mayor esfuerzo. Debe respetar el filtrado por rol/organización que ya aplica el servidor.

**Test cases.**
- Al hacer clic en el icono de alertas se abre la vista de gestión con la lista de alertas del usuario.
- La grilla permite filtrar y ordenar; cada alerta muestra regla, descripción, fecha y (si aplica) referencia al registro.
- Reconocer una alerta la marca como leída y el badge del icono decrementa en consecuencia.
- Una alerta con referencia a un registro ofrece un enlace que abre la ventana/registro origen correcto.
- La vista solo muestra alertas del rol/organización del usuario.

**Resultado.** El usuario puede abrir la gestión de alertas desde el icono, revisarlas y filtrarlas, reconocerlas (con el badge reflejando el cambio) y saltar al registro origen, con paridad funcional respecto de la Alert Management View del clásico.

---

> **Nota sobre el entorno representativo (`etendodev`).** Se confirmó que el sistema de alertas es **real y está en uso** en este entorno: **27 reglas** de alerta (9 activas) en `ad_alertrule` y **75 alertas activas** en `ad_alert`, más el proceso background **Alert Process**. En el menú existen tres entradas: **"Alert Management"** (`action=OBUIAPP_OpenView`, activa — la vista de gestión moderna client-side), **"Alert"** (`action=W`, ventana AD estándar activa sobre reglas y `ad_alert`) y una **"Alert Management" legacy** (`action=X`, `ad_form` 800016, **inactiva**). La tabla `ad_alert` incluye `description`, `ad_alertrule_id`, `ad_role_id`, `ad_user_id`, `isfixed` (base del acknowledge), `record_id` / `referencekey_id` (base de los enlaces al origen) y `status`. En la nueva UI **no hay** icono de alertas montado, ni polling, ni ninguna lectura de `ad_alert`, ni uso de `ignoreForSessionTimeout`; los componentes `NotificationButton` / `NotificationsModal` / `NotificationItem` existen en la ComponentLibrary pero están **sin usar en la app, deshabilitados y sin fuente de datos**. **No hay componente del adapter (`com.etendoerp.metadata`) específico de alertas**: la generación es servidor/background y la capa de cliente (icono, badge, polling, gestión) está por construir.

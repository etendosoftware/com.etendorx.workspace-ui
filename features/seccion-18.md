# Sección 18 — Application Forms (ad_form)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 18. Cubre los **Application Forms** (`AD_Form`): pantallas standalone con layout totalmente custom (servlets/JS clásicos), que NO siguen el patrón ventana/pestaña/campo y aparecen en el menú con acción `X` (External) o se abren programáticamente. La instalación `etendodev` tiene **22 forms activos** (la fuente de verdad cuenta 21; ver nota al final).

> **Clave de arquitectura:** la nueva UI **no reimplementa ningún `ad_form` de forma nativa**; los resuelve por **delegación a Etendo Classic**, con dos mecanismos:
> 1. **Forms accesibles desde el menú:** el `MenuBuilder` del adapter (`com.etendoerp.metadata`) detecta `menu.getSpecialForm()` y emite `formId` + `formUrl` (`/ad_forms/<SimpleClassName>.html`). En el cliente, `resolveMenuClickIntent` devuelve `NONE` para los Form (no son procesos), y el `handleClick` del `Sidebar` cae en `getManualProcessConfig`, que construye la URL clásica vía `buildFormUrl` (`{host}/meta/legacy/security/Menu.html?url=/ad_forms/<Class>.html&noprefs=true&hideMenu=true&Command=DEFAULT&token=…`) y la abre en un **popup del navegador** (`window.open`, tamaño *large* 950×700). El forward `/meta/legacy` propaga la autenticación por token/cookie.
> 2. **Forms integrados nativamente en el shell:** algunos casos puntuales tienen su propio disparador en la nueva UI: **About** se abre desde el header como **modal con iframe** al clásico (`/api/erp/ad_forms/about.html`, proxy de Next.js); **Logout** y **Menu** están **reemplazados por implementaciones nativas** (logout propio en `contexts/user.tsx`, menú propio en el `Sidebar`), por lo que sus forms clásicos no se usan.
>
> Es el mismo criterio de diseño que la Sección 14 (reportes clásicos): la fuente de verdad admite el render "classic HTML", por lo que estos forms se consideran **hechos por delegación**, no como render nativo.

**Estimación global de la sección: ~85% de cobertura efectiva.** La gran mayoría de los forms de negocio y administración están **accesibles y funcionales** desde el menú (delegando al servlet clásico), el acceso por rol lo garantiza el backend (el menú solo lista lo que el rol puede ver) y About/Logout/Menu están cubiertos (nativo o integrado). Los huecos son acotados: (a) el **Audit Trail** no es accesible desde la nueva UI (form popup no cableado — se solapa con la Sección 17), y (b) la apertura de forms por popup **carece del fallback de "popup bloqueado"** que sí tienen los reportes, por lo que puede fallar de forma silenciosa.

---

## Qué está completamente hecho

| Comportamiento (checklist 18.5) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Cada form es accesible desde su entrada de menú** | `MenuBuilder.addFormInfo` emite `formId`/`formUrl` por cada entrada con `specialForm`; el `Sidebar` la abre en popup vía `buildFormUrl`. Verificado en DB: 14 forms activos con entrada de menú activa (Create Shipments, Enterprise module management, GL Posting by DB Tables, Import/Export Translations, Initial Client Setup, Initial organization setup, Pending Goods Receipts, Requisition To Order, Session Preferences, Session Variables, Settle/Protest Remittances, SQL Query, etc.). |
| **El form renderiza su layout custom** | Lo renderiza el **servlet clásico** dentro del popup autenticado (`/meta/legacy/security/Menu.html?url=/ad_forms/…`); la fuente de verdad admite explícitamente el render "classic". |
| **Parámetros/filtros y acciones del form (proceso/import/export)** | Resueltos por el framework clásico al que se delega (los forms 18.3 de negocio —Create Invoices/Shipments, Pending Goods Receipts, Requisition To Order, GL Posting, Settle/Protest— ejecutan su lógica en el servlet). |
| **Resultados del form se muestran** | El popup clásico muestra su propio resultado (mensajes, grillas, descargas). |
| **Respeta acceso por rol (visibilidad por menú)** | El `MenuManager` clásico (consumido por `MenuBuilder`) solo entrega las entradas accesibles al rol activo; además el servlet reautentica por token. Enforcement server-side. |
| **Forms tipo wizard (Initial Client/Org Setup) navegan pasos** | Se abren en el popup clásico, que conserva el wizard multi-paso original. |
| **SQL Query ejecuta y muestra resultados** | Delegado al `SQLExecutor` clásico en el popup (misma lógica de seguridad del servlet). |
| **Import/Export Translations maneja subida/descarga de archivos** | Delegado al form `Translation` clásico en el popup. |
| **About muestra versión/módulos correctos** | Botón nativo en el header → `AboutModal` (iframe al clásico `about.html` vía proxy `/api/erp`), integrado en el shell de la nueva UI. |
| **Logout / Menu** | **Reemplazados por implementación nativa** (logout propio de la nueva UI y menú lateral propio); los forms clásicos `Logout`/`Menu` no se necesitan. |

---

## Qué está parcialmente hecho

- **Apertura de forms sin fallback de "popup bloqueado".** Los forms del menú se abren con `window.open(url, "Test", "width=950,height=700")` **sin** verificar si el navegador bloqueó el popup, a diferencia de los reportes/procesos clásicos (Sección 14), que usan `tryOpenReportPopup` + `notifyReportPopupBlocked` para ofrecer una apertura manual. Si el bloqueador de popups del navegador interviene, el form no abre y **el usuario no recibe ningún aviso**. → **Tarea 1**.
- **Forms fuera del shell (en popup del navegador).** El form clásico se abre en una ventana de navegador aparte (`hideMenu=true`), no embebido en la nueva UI. Es coherente con la delegación (mismo patrón que reportes), pero no ofrece una experiencia integrada (foco, tamaño, cierre) como sí la tiene About (modal iframe). Se documenta como decisión de diseño; solo se convertiría en tarea si el proyecto decide integrarlos como modales.

---

## Qué no está hecho

- **Audit Trail no es accesible desde la nueva UI.** El `AuditTrailPopup` clásico (historial de cambios a nivel de campo) no tiene entrada de menú (se invoca como popup contextual desde un registro) y la nueva UI **no cablea** ese disparador. Coincide con el hueco ya identificado en la **Sección 17** (botón/visor de Audit Trail). → **Tarea 2** (con cruce a Sección 17 para evitar duplicar el trabajo).
- **Forms sin entrada de menú y no integrados** (`Heartbeat`, `Multi Business Partner Selector`/`ExampleSelectorUsage`, `OBTL_SE_TaxLauncher`): no tienen disparador en la nueva UI. Son casos secundarios: `Heartbeat` es un popup de configuración de sistema que el clásico dispara automáticamente; `ExampleSelectorUsage` es un form de ejemplo/utilidad; `OBTL_SE_TaxLauncher` es un launcher/callout. **No se genera tarea** salvo que el proyecto los considere necesarios en la nueva UI.
- No hay **render nativo** del layout/lógica de ningún form: todo se resuelve por delegación al clásico. Se documenta como decisión de diseño (igual que 14.1), no como defecto.

---

## Resumen de lo que queda por hacer

La sección está **funcionalmente cubierta**: los forms de negocio y administración son accesibles desde el menú por delegación al clásico, el acceso por rol lo garantiza el backend, y About/Logout/Menu están resueltos (integrado o nativo). Lo pendiente es acotado:

1. **(Tarea 1)** Añadir el fallback de "popup bloqueado" al abrir forms desde el menú, reutilizando el mecanismo ya existente para reportes, para que el usuario nunca quede sin feedback.
2. **(Tarea 2)** Habilitar el acceso al **Audit Trail** desde la nueva UI (se solapa con la Sección 17): verificar si ya se está abordando ahí antes de tomarla.

No se identifican huecos en la presencia de los forms en el menú, la ejecución de su lógica (delegada) ni el enforcement de acceso por rol.

---

## Tareas

### Tarea 1 — Fallback de "popup bloqueado" al abrir Application Forms desde el menú

**Descripción.** Al hacer clic en una entrada de menú de tipo Form, la nueva UI abre el form clásico en un popup del navegador (`window.open`). Si el navegador bloquea el popup, la acción falla en silencio: el form no se abre y el usuario no recibe ningún mensaje ni una alternativa para abrirlo manualmente. Los reportes/procesos clásicos ya resuelven este caso con un aviso y una acción de apertura manual; los forms no.

**Solución propuesta.** Reutilizar el mismo patrón de manejo de popup bloqueado que ya usan los reportes: al intentar abrir el form, detectar si la apertura fue bloqueada y, en ese caso, mostrar un aviso con una acción para abrir el form manualmente. La solución debe ser consistente con el comportamiento existente para reportes y no alterar el flujo cuando el popup se abre correctamente.

**Test cases.**
- Con popups permitidos, al hacer clic en un form del menú, el form clásico se abre normalmente en su ventana.
- Con el bloqueador de popups activo, al hacer clic se muestra el aviso de "popup bloqueado" con una acción para abrir el form manualmente.
- La acción de apertura manual abre el mismo form (misma URL autenticada) correctamente.
- El comportamiento de reportes/procesos clásicos permanece sin cambios.

**Resultado.** La apertura de forms desde el menú ofrece feedback y una alternativa manual cuando el navegador bloquea el popup, con paridad respecto del manejo de reportes.

---

### Tarea 2 — Acceso al Audit Trail desde la nueva UI

> **⚠️ Verificar antes de tomar la tarea.** Este hueco también está registrado en la **Sección 17** (botón/visor de Audit Trail). Antes de iniciar, confirmar si ya se está abordando en la tarea de la Sección 17 (o en una rama/PR abierto) para no duplicar el trabajo; si ya está cubierto, esta tarea se cierra como referencia cruzada.

**Descripción.** El `AuditTrailPopup` clásico muestra el historial de cambios a nivel de campo de un registro (quién, cuándo y qué valor). En el clásico se invoca como popup contextual desde un registro, no como entrada de menú. La nueva UI no ofrece hoy ninguna forma de acceder a ese historial.

**Solución propuesta.** Exponer el acceso al historial de auditoría de un registro desde la nueva UI (por ejemplo, un disparador contextual a nivel de registro/ventana), delegando la presentación al mecanismo de auditoría existente en el backend. La decisión de render nativo vs. delegación al popup clásico debe alinearse con lo que se defina en la Sección 17. El acceso debe respetar que la auditoría esté habilitada para la tabla/ventana y el permiso del rol.

**Test cases.**
- Un registro en una tabla con auditoría habilitada permite abrir su historial de cambios desde la nueva UI.
- El historial muestra los cambios con su marca de tiempo y el usuario que los realizó.
- Una tabla sin auditoría habilitada no ofrece el acceso (o lo indica claramente).
- El acceso respeta los permisos del rol.

**Resultado.** El usuario puede consultar el historial de auditoría de un registro desde la nueva UI, cerrando el hueco compartido con la Sección 17.

---

> **Nota sobre el conteo de forms.** La fuente de verdad cuenta **21 forms activos** (indicando que 1 de los 22 originales quedó inactivo). En `etendodev` se observan **22 forms activos** (`ad_form.isactive='Y'`), diferencia atribuible a los bundles instalados en este entorno (p. ej. `OBTL_SE_TaxLauncher` del módulo de tax report launcher). La diferencia no afecta el análisis de completitud: el patrón de delegación aplica por igual a todos.

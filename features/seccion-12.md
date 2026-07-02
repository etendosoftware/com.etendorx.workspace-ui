# Sección 12 — Navigation and Application Structure

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 12. Cubre la estructura de navegación de la aplicación: sistema de menú (12.1), ítems recientes (12.2) y comportamiento de navegación (12.3).

> **Clave de arquitectura:** el **árbol de menú** lo construye el backend clásico (`GlobalMenu` / `MenuManager`) y lo expone el adapter `com.etendoerp.metadata` en `MenuBuilder.toJSON()` (endpoint `meta/menu`, por rol): emite cada entrada con `id`, `type` (Window, Process, ProcessManual, Report, Form, View, ProcessDefinition, Summary, External), nombre/descripción/ícono **traducidos por idioma**, `windowId`/`windowType`, `processId`/`processUrl`, `processDefinitionId`, `viewId`, `formUrl` y `children`. El cliente cachea el menú por rol (`Metadata.getMenu`), lo renderiza en el `Drawer`/`Sidebar` y **enruta cada tipo de entrada** al destino correcto. El **comportamiento de navegación (12.3)** reutiliza en gran parte lo ya cubierto en la Sección 10.10 (navegación directa a tab) y 10.11 (URL / deep-linking con sistema de *recovery*). Por ende, las brechas reales de esta sección se concentran en **12.2 (ítems recientes)**, que en la nueva UI es una implementación de cliente reducida frente al modelo del clásico.

**Estimación global de la sección: ~80% de cobertura efectiva.** El sistema de menú está prácticamente completo (carga por rol, jerarquía con carpetas, enrutamiento por tipo, búsqueda parcial e insensible a mayúsculas, traducciones, actualización tras cambio de rol) y el comportamiento de navegación está cubierto (breadcrumb, back/forward, deep-links, URL, marcadores, sin pérdida de cambios al conmutar ventanas). El hueco principal es **12.2 Recent Items**: la nueva UI mantiene una única lista de entradas de menú recientes en `localStorage` (no server-side), con tamaño fijo y sin la lista de **documentos recientes** (registros individuales). Un detalle menor: el tipo de entrada **External** (abrir URL) no está cableado, aunque no existen entradas de ese tipo en la instancia representativa.

---

## Qué está completamente hecho

| Comportamiento (checklist 12.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **12.1 Carga del árbol de menú por rol** | `Metadata.getMenu()` → `meta/menu` (POST con rol) construido por `MenuBuilder` sobre `GlobalMenu`/`MenuManager`; cacheado por rol y refrescado en login y al cambiar de rol. Sólo llegan las entradas accesibles para el rol. |
| **12.1 Jerarquía de carpetas / sub-carpetas / entradas** | El backend emite `children` recursivos; el `Drawer` renderiza carpetas (tipo `Summary`) con expandir/colapsar y estado de expansión persistido por rol (`useExpandedMenuItems`). |
| **12.1 Enrutamiento por tipo de entrada** | `Sidebar.handleClick` + `resolveMenuClickIntent`: **Window** abre/activa ventana (sistema multi-ventana); **ProcessDefinition / Process (Report&Process)** abren `ProcessDefinitionModal`; **Pick and Execute** abre el modal de proceso; **Form** abre popup del clásico; **ProcessManual / Report** abren el clásico en popup/nueva pestaña; **View** abre la vista OpenUI del clásico. |
| **12.1 Búsqueda por coincidencia parcial** | `filterItems` + `createSearchIndex` (`searchUtils`): índice de rutas completas; coincidencia por `includes` sobre el término y soporte multi-palabra (`every`). |
| **12.1 Búsqueda insensible a mayúsculas** | Todo el matching normaliza con `toLowerCase()` (término e índice). |
| **12.1 Traducciones por idioma del usuario** | El backend emite `name`/`description` traducidos según `OBContext.getLanguage()`; el cliente además aplica `translateMenuItem`. La búsqueda se resetea al cambiar idioma. |
| **12.1 Clic abre la ventana/proceso/reporte correspondiente** | Cubierto por el dispatch de tipos anterior. |
| **12.1 El menú se actualiza tras cambio de rol** | `getMenu` compara `currentRoleId` y recarga; el `Drawer` está *keyed* por `currentRoleId`; la búsqueda y el estado de expansión se reinician por rol. |
| **12.2 Lista de recientes se actualiza al abrir una ventana** | `Drawer.handleItemClick` → `handleWindowAccess` → `addRecentItem`; la entrada se mueve al frente si ya existía. |
| **12.2 Clic en un reciente navega al destino correcto** | `handleRecentItemClick` resuelve la entrada de menú por identificador (validando el tipo) y ejecuta el mismo `onClick` del menú. |
| **12.2 Recientes son por usuario (no compartidos)** | Almacenados en `localStorage` (por navegador) y **segmentados por `roleId`**. |
| **12.2 Recientes se actualizan tras cambio de rol** | La lista está indexada por `roleId`; cada rol ve su propia lista. |
| **12.2 Los más antiguos se descartan al superar el máximo** | `addRecentItem` recorta con `.slice(0, 5)`. |
| **12.3 Breadcrumb / navegación contextual (posición actual)** | `AppBreadcrumb` muestra Ventana > Registro por nivel (hasta 5), con botón Home, botón atrás y toggle de favorito de la ventana. |
| **12.3 Back/forward del navegador y deep-links** | Cubierto por la Sección 10.11: la URL codifica ventana + tab + registro; router de Next.js + sistema de *recovery* (`useGlobalUrlStateRecovery`, `appendWindowToUrl`, `useRedirect`) reconstruyen el contexto; back/forward, marcadores y URL directa a registro funcionan. |
| **12.3 URL se actualiza al navegar entre ventanas/tabs/registros** | El estado de ventana/tab/registro se sincroniza a la URL (Sección 10.11). |
| **12.3 Cambio de tab no recarga datos de otros tabs** | El modelo multi-ventana/multi-tab preserva el estado por tab en `windowStore`; conmutar de tab no dispara *fetch* de los demás. |
| **12.3 Conmutar de ventana no pierde cambios sin aviso** | En el modelo multi-ventana, cambiar de ventana **preserva** el estado de la otra (no se pierde nada); **cerrar** una ventana con cambios sin guardar pide confirmación (`WindowTabs` `handleCloseWindow` → diálogo "unsaved changes"). |

---

## Qué está parcialmente hecho

- **12.2 Persistencia server-side de los recientes:** el clásico persiste las listas en `AD_Preference` (server-side), por lo que sobreviven entre navegadores/dispositivos. La nueva UI las guarda **sólo en `localStorage`**: persisten entre recargas del mismo navegador, pero **no** se sincronizan entre equipos/sesiones ni con el clásico. → **Tarea 1**.
- **12.2 Tamaño de la lista según preferencia:** el clásico controla el máximo con la preferencia `UINAVBA_RecentListSize` (default 3). La nueva UI usa un **tope fijo de 5** en código, sin leer la preferencia. → **Tarea 1**.
- **12.3 URL compartida a un recurso sin acceso → "acceso denegado":** el enforcement es server-side (la metadata no entrega ventanas sin acceso), pero **no se verificó una pantalla explícita de "acceso denegado"** ante una URL directa a un recurso no concedido; hoy el resultado probable es una vista vacía en lugar de un mensaje claro. Es el mismo punto observado en 11.6 / 10.13. → **Tarea 4** (verificación + mensaje; comportamiento ya seguro por backend).

---

## Qué no está hecho

- **12.2 Lista de documentos recientes (registros individuales):** el clásico mantiene **tres listas** (`UINAVBA_MenuRecentList`, `UBUIAPP_RecentDocumentsList`, `OBUIAPP_RecentViewList`). La nueva UI sólo implementa la de **entradas de menú abiertas** (ventanas/procesos): **no** registra los **documentos/registros vistos individualmente** ni una lista separada de vistas. → **Tarea 2**.
- **12.1 Entrada de menú tipo External (abrir URL):** el dispatch del `Sidebar` no tiene rama para el tipo `External`; una entrada de ese tipo caería en el `return` final sin abrir su URL. En la instancia representativa (`etendodev`) **no existen entradas con URL** (0 filas), por lo que hoy es una brecha teórica. → **Tarea 3** (impacto bajo).

> **No son brechas / fuera del alcance del cliente:**
> - **12.1 Construcción y filtrado del árbol de menú por acceso de rol:** lo resuelve el backend (`GlobalMenu`/`MenuManager` + `OBContext`); el cliente sólo consume y renderiza lo entregado. Compartido con 10.13.
> - **12.3 Deep-linking / back-forward / marcadores:** ya cubierto y evaluado en la Sección 10.11; no es trabajo nuevo de esta sección.

---

## Resumen de lo que queda por hacer

El sistema de menú (12.1) está prácticamente completo: carga por rol vía el adapter, jerarquía con carpetas, enrutamiento de todos los tipos de entrada usados (Window, Process, ProcessDefinition, Pick&Execute, Form, ProcessManual, Report, View), búsqueda parcial e insensible a mayúsculas con soporte multi-palabra, traducciones por idioma y actualización tras cambio de rol. El comportamiento de navegación (12.3) también está cubierto —breadcrumb, back/forward, deep-links, actualización de URL, marcadores, y preservación de cambios al conmutar ventanas con confirmación al cerrar— apoyándose en lo ya validado en la Sección 10. El hueco principal está en los **ítems recientes (12.2)**: es una implementación de cliente reducida frente al clásico. Quedan cuatro ajustes: **persistir los recientes server-side y respetar `RecentListSize`** (**Tarea 1**), **agregar la lista de documentos recientes a nivel de registro** (**Tarea 2**), **cablear el tipo de entrada External para abrir su URL** (**Tarea 3**, impacto bajo) y **mostrar una pantalla de "acceso denegado" ante deep-links a recursos sin acceso** (**Tarea 4**, cruza con 11.6 / 10.13).

---

## Tareas

### Tarea 1 — Persistir ítems recientes server-side y respetar el tamaño configurable

**Descripción:** los ítems recientes se guardan sólo en `localStorage` con un tope fijo de 5 entradas, mientras que el clásico los persiste en `AD_Preference` (server-side) y limita su tamaño con la preferencia `UINAVBA_RecentListSize` (default 3). Como consecuencia, los recientes de la nueva UI no se comparten entre navegadores/dispositivos ni respetan la configuración del usuario.

**Solución propuesta:** persistir la lista de recientes como preferencia del usuario en el backend (a través del adapter) de modo que se recupere al iniciar sesión desde cualquier equipo, y usar el valor de la preferencia de tamaño para el recorte en lugar de un número fijo. Mantener el caché local como respaldo/optimización para evitar dependencia de red en cada apertura.

**Test cases:**
- Abrir ventanas en un navegador y luego iniciar sesión en otro muestra los mismos recientes.
- Con `RecentListSize = 3`, la lista nunca supera 3 entradas; al cambiarla, el tope se ajusta.
- Los más antiguos se descartan al superar el tamaño configurado.
- La lista sigue siendo por usuario y por rol.

**Resultado:** los recientes se comportan como en el clásico: persistentes entre sesiones/dispositivos y con tamaño configurable por el usuario.

### Tarea 2 — Lista de documentos recientes (registros individuales)

**Descripción:** el clásico mantiene, además de la lista de entradas de menú, una lista de **documentos recientes** (registros vistos individualmente). La nueva UI sólo registra las ventanas/procesos abiertos desde el menú, no los registros concretos que el usuario visita.

**Solución propuesta:** registrar el acceso a registros individuales (al abrir un registro en vista de formulario) en una lista de documentos recientes separada, y ofrecer navegación directa desde esa lista al registro correspondiente (reutilizando el sistema de *recovery* por URL). Aplicar los mismos criterios de tamaño, orden por reciente y segmentación por usuario/rol que la lista de menú.

**Test cases:**
- Abrir un registro en formulario lo agrega a la lista de documentos recientes.
- Clic en un documento reciente abre ese registro específico en vista de formulario.
- La lista respeta el tamaño configurado y descarta los más antiguos.
- Documentos de recursos sin acceso tras un cambio de rol no se muestran.

**Resultado:** el usuario puede volver rápidamente a los últimos registros consultados, con paridad frente al clásico.

### Tarea 3 — Cablear entradas de menú de tipo External (abrir URL)

**Descripción:** el dispatch de clics del menú no maneja el tipo de entrada `External`; una entrada con URL configurada no se abriría. Aunque la instancia representativa no tiene entradas de este tipo, es un tipo válido del checklist y puede aparecer si un administrador lo configura.

**Solución propuesta:** agregar una rama en el enrutamiento de clics que, para entradas de tipo External, abra la URL de la entrada (en nueva pestaña o según convención de la entrada), consumiendo el campo de URL que ya emite el backend.

**Test cases:**
- Una entrada de menú External abre su URL al hacer clic.
- Las demás entradas conservan su comportamiento actual.
- Una entrada External sin URL no rompe la navegación.

**Resultado:** todos los tipos de entrada del menú del clásico quedan soportados, incluyendo enlaces externos.

### Tarea 4 — Pantalla de "acceso denegado" en deep-links a recursos sin acceso

**Descripción:** al compartir/abrir una URL directa a una ventana o registro para el cual el rol actual no tiene acceso, el enforcement server-side impide la entrega de datos, pero el cliente no muestra un mensaje claro de "acceso denegado" (probablemente una vista vacía). Es el mismo comportamiento observado en 11.6 / 10.13.

**Solución propuesta:** detectar en la capa de navegación el caso de recurso no accesible (por ausencia de metadata/datos autorizados) y mostrar una pantalla o mensaje explícito de "acceso denegado", en lugar de una vista vacía o un error genérico. No cambia el enforcement (sigue en backend), sólo la presentación del caso.

**Test cases:**
- Abrir una URL a una ventana sin acceso muestra "acceso denegado", no una vista vacía ni un error genérico.
- Un usuario con acceso abre la misma URL normalmente.
- Tras cambiar a un rol con acceso, la URL vuelve a abrir el recurso.

**Resultado:** los deep-links a recursos no autorizados dan retroalimentación clara al usuario, cerrando la brecha de UX señalada en las Secciones 10, 11 y 12.

# Sección 33 — View Personalization (Saved Views)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 33. Cubre la **personalización de vistas**: guardar y restaurar configuraciones de ventana con nombre (**Saved Views**), qué se puede personalizar (estado de grilla, de formulario y de ventana), las operaciones de gestión (Save / Save as Default / Apply / Delete / Reset to System Default), la **Form Personalization** (drag-and-drop de layout de campos, admin) y la **jerarquía de preferencias** (`ad_preference`: User+Window → User → Role+Window → Role → Org → Client → System).

> **Clave de arquitectura:** a diferencia de otras secciones, aquí la nueva UI **sí tiene una implementación propia y funcional** de Saved Views, con **backend específico en el adapter** (`com.etendoerp.metadata`): el `SavedViewService` expone `/saved-views` (GET/POST/PUT/DELETE) sobre una **tabla nueva `ETMETA_SavedView`** (columnas `name`, `ad_tab_id`, `ad_user_id`, `isdefault`, `filterclause`, `gridconfiguration`). Es una **decisión de diseño/paradigma deliberada**: el nuevo backend NO reutiliza la tabla clásica `OBUIAPP_UIPersonalization` ni el `PersonalizationActionHandler`, sino un modelo propio y más simple, por usuario y por pestaña (además parsea el formato clásico `OBUIAPP_SavedSearch` para retro-compatibilidad). Por tanto **no es un hueco** que no use la tabla clásica; lo que importa es qué capacidades cubre. Por su parte, la **jerarquía de preferencias (§33.5)** es **responsabilidad del servidor** (motor clásico `Preferences.java`), y el adapter la delega vía `PreferencesService` (`/preferences`); el cliente **consume el mapa resuelto** al iniciar sesión ([user.tsx](../client/packages/MainUI/contexts/user.tsx#L115) → [getPreferences.ts](../client/packages/api-client/src/api/getPreferences.ts)), replicando el `OB.PropertyStore` clásico — no hay reimplementación de jerarquía en cliente ni hace falta.

**Estimación global de la sección: ~60% de cobertura efectiva.** El núcleo de Saved Views (crear, aplicar, borrar, marcar por defecto con auto-aplicación al abrir, y resetear) **está hecho y funcional** de punta a punta (UI + adapter + tabla), con persistencia server-side entre sesiones; y la jerarquía de preferencias está cubierta por el servidor y consumida por el cliente. Los huecos se concentran en **qué se persiste dentro de una vista**: el estado de grilla guardado captura visibilidad, orden, ordenamiento y filtros, pero **no anchos de columna ni columnas congeladas**; y quedan **sin implementar** la personalización de **formulario** (layout de campos, primer campo enfocado, drag-and-drop admin §33.4), el estado de **ventana** (split padre/hijo, maximizado/minimizado) y las **vistas compartidas a nivel de rol/organización** (el backend nuevo es solo por usuario).

---

## Qué está completamente hecho

Implementación real y montada en la UI (menú **Save View** en la toolbar, [SaveViewMenu.tsx](../client/packages/MainUI/components/Toolbar/Menus/SaveViewMenu.tsx), hooks [useSavedViews.ts](../client/packages/MainUI/hooks/useSavedViews.ts) y [useAutoApplyDefaultView.ts](../client/packages/MainUI/hooks/useAutoApplyDefaultView.ts)):

| Ítem del checklist 33.6 | Cómo queda cubierto |
|--------------------------|---------------------|
| **Save View** con nombre | Guarda la vista actual (POST `/saved-views`) con `name`, por pestaña y usuario. |
| **Apply View** restaura la configuración | Al seleccionar una vista guardada se restauran visibilidad, orden, ordenamiento y filtros. |
| **Delete View** | Elimina la vista guardada (DELETE `/saved-views`). |
| **Save as Default** | Marca una vista como `isdefault` para el usuario en esa pestaña. |
| **Default view auto-aplicada al abrir la ventana** | `useAutoApplyDefaultView` obtiene la vista `isdefault=true` y la aplica una vez por apertura. |
| **Reset to System Default** | La opción de restaurar vista estándar limpia el defecto y vuelve al layout base. |
| **Vistas persisten entre sesiones (server-side)** | Persistencia en `ETMETA_SavedView` vía el adapter; sobreviven a recarga y re-login. |
| **Múltiples vistas por ventana / por pestaña independiente** | El modelo es por `ad_tab_id`; cada pestaña tiene su propio conjunto de vistas. |
| **Grid: columnas visibles/ocultas, orden de columnas, ordenamiento, filtros activos** | Capturados en `gridconfiguration` (esquema `MRTViewConfig`: `visibility`, `order`, `sorting`, `filters`). |
| **Jerarquía de preferencias (§33.5)** | Resolución server-side (`Preferences.java`), delegada por el adapter (`PreferencesService`) y consumida por el cliente al login para display logic. |

---

## Qué está parcialmente hecho

- **Captura completa del estado de grilla en la vista.** El checklist pide que Save View capture visibilidad, orden **y ancho** de columnas, además de columnas congeladas. El esquema persistido ([savedViews/types.ts](../client/packages/MainUI/utils/savedViews/types.ts)) guarda `visibility`, `order`, `sorting`, `filters`, pero **no incluye anchos de columna** (`columnSizing`) ni **columnas congeladas** (el "pinning" de la grilla está fijo/hardcodeado, no es configurable por el usuario ni se persiste). → **Tarea 1**.
- **Estado de grilla en sesión vs. persistido.** Fuera de las vistas guardadas, el estado de columnas (visibilidad, orden, orden y filtros) vive **en memoria** (store Zustand [windowStore.ts](../client/packages/MainUI/stores/windowStore.ts) / [useTableStatePersistenceTab.tsx](../client/packages/MainUI/hooks/useTableStatePersistenceTab.tsx)) y solo se conserva entre sesiones si el usuario **guarda explícitamente** una vista; no hay un "recordar mi último layout" implícito. Es un comportamiento aceptable (la persistencia real existe vía Save View), se documenta como matiz, no como tarea independiente.

---

## Qué no está hecho

- **Personalización del formulario (§33.2 Form State + §33.4 Form Personalization).** No existe personalización de **layout de campos** (posición/visibilidad), **primer campo enfocado**, arreglo personalizado de campos, ni la herramienta de **drag-and-drop** para admins (reordenar campos, ocultarlos, cambiar grupos, número de columnas del formulario). No hay endpoint del adapter ni columnas para ello (`ETMETA_SavedView` solo cubre grilla y filtros). → **Tarea 2**.
- **Estado de ventana (§33.2 Window State).** No se persiste el **split padre/hijo** de pestañas ni el estado **maximizado/minimizado** de la ventana. Existe un toggle de pantalla completa de la grilla, pero es efímero (no se guarda en la vista). → **Tarea 3**.
- **Anchos de columna y columnas congeladas** dentro de la vista guardada (ver "parcialmente hecho" → **Tarea 1**).
- **Vistas compartidas a nivel de rol/organización (§33.6: "user-level overrides role-level / role-level overrides system-level" para vistas).** El backend nuevo `ETMETA_SavedView` es **solo por usuario** (`ad_user_id`), sin columnas de visibilidad por rol/organización/cliente (la tabla clásica `OBUIAPP_UIPersonalization` sí las tiene: `visibleat_role/org/client_id`). Por tanto no hay vistas por defecto definidas por un admin para todo un rol ni la precedencia usuario→rol→sistema **de vistas**. (Ojo: esto es distinto de la jerarquía de **preferencias** `ad_preference`, que sí está cubierta por el servidor.) → **Tarea 4**.

---

## Fuera de alcance / responsabilidad del servidor (no son huecos de cliente)

- **Motor de resolución de la jerarquía de preferencias (§33.5).** La prioridad User+Window → User → Role+Window → Role → Org → Client → System la resuelve el **servidor** (`Preferences.java`), expuesta por el adapter (`PreferencesService` / `/preferences`) y consumida por el cliente. No es una reimplementación de cliente; queda cubierta por delegación.

---

## Resumen de lo que queda por hacer

La personalización de vistas **está funcional en su núcleo**: guardar, aplicar, borrar, marcar por defecto (con auto-aplicación al abrir) y resetear, todo persistido server-side por pestaña y usuario mediante un backend propio del adapter (`ETMETA_SavedView`), y con la jerarquía de preferencias resuelta por el servidor y consumida por el cliente. Los frentes pendientes son cuatro y bien acotados: (1) **completar el estado de grilla** que se guarda en la vista (anchos de columna y columnas congeladas); (2) **personalización del formulario** (layout, ocultar/reordenar campos, primer foco y la herramienta drag-and-drop de admin), hoy inexistente; (3) **persistir el estado de ventana** (split padre/hijo y maximizado/minimizado); y (4) **vistas compartidas a nivel de rol/organización** con su precedencia, ya que el backend actual es solo por usuario. Nada de esto requiere reimplementar la jerarquía de preferencias, que es responsabilidad del servidor.

---

## Tareas

### Tarea 1 — Completar el estado de grilla en las vistas guardadas (anchos y columnas congeladas)

**Descripción.** Al guardar una vista, hoy se conservan la visibilidad, el orden de columnas, el ordenamiento y los filtros, pero **no los anchos de columna ni las columnas congeladas** (el "pinning" está fijo y no es configurable por el usuario). El checklist pide que una vista capture toda la configuración de columnas, incluidos ancho y congelamiento.

**Solución propuesta.** Extender el modelo de configuración de vista para incluir el ancho de cada columna y qué columnas quedan congeladas, y permitir que el usuario ajuste ambos desde la grilla (redimensionar columnas y fijarlas). Guardar y restaurar esos valores junto con el resto del estado de la vista, manteniendo compatibilidad con las vistas ya existentes (que simplemente no traerán esos datos y usarán los valores por defecto). No requiere cambios de negocio en el servidor más allá de almacenar el JSON extendido.

**Test cases.**
- El usuario redimensiona columnas y congela una; guarda la vista; al reabrir o reaplicarla, anchos y congelamiento se restauran.
- Una vista guardada antes del cambio se sigue aplicando sin error (usa anchos por defecto).
- Cambiar el ancho o el congelamiento y volver a guardar actualiza la vista correctamente.
- El resto del estado (visibilidad, orden, ordenamiento, filtros) sigue restaurándose junto con lo nuevo.

**Resultado.** Las vistas guardadas capturan y restauran la configuración completa de columnas —visibilidad, orden, ancho y congelamiento— con paridad respecto del clásico y sin romper vistas previas.

### Tarea 2 — Personalización del formulario (layout de campos y drag-and-drop de admin)

**Descripción.** La nueva UI no permite personalizar el formulario: ni el layout de campos (posición/visibilidad), ni el primer campo enfocado, ni la herramienta de arrastrar-y-soltar para administradores que en el clásico permite reordenar campos, ocultarlos, cambiar su grupo y ajustar el número de columnas del formulario.

**Solución propuesta.** Incorporar una capacidad de personalización de formulario análoga a la del clásico: una interfaz (para el rol autorizado) que permita reorganizar y ocultar campos, asignar grupos y definir columnas, y persistir ese layout de forma que se aplique al abrir la ventana. Aprovechar el backend de personalización del adapter, extendiéndolo para almacenar también el estado de formulario por pestaña (hoy solo cubre grilla y filtros). Definir el alcance de precedencia (por usuario y, si aplica, por rol) de forma coherente con la Tarea 4.

**Test cases.**
- Un usuario autorizado reordena/oculta campos y ajusta el número de columnas; al reabrir la ventana el layout personalizado se aplica.
- El primer campo enfocado configurado recibe el foco al abrir el formulario.
- Un usuario sin permiso de personalización de formulario no ve la herramienta pero recibe el layout aplicable.
- Restablecer al layout definido en AD descarta la personalización de formulario.

**Resultado.** Los usuarios (según permisos) pueden personalizar el layout del formulario y la personalización persiste y se aplica al abrir la ventana, con paridad funcional respecto del clásico.

### Tarea 3 — Persistencia del estado de ventana (split padre/hijo y maximizado)

**Descripción.** El estado de ventana no se conserva: la división entre pestaña padre e hija (split) y el estado maximizado/minimizado de la grilla/formulario no forman parte de la vista guardada, por lo que se pierden al cerrar o cambiar de ventana.

**Solución propuesta.** Incluir el estado de disposición de la ventana (proporción/estado del split padre-hijo y maximizado/minimizado) dentro de la configuración de vista, de modo que se guarde y restaure junto con el resto. Aplicarlo al abrir la ventana o al aplicar una vista, respetando los valores por defecto cuando la vista no lo especifique.

**Test cases.**
- El usuario ajusta el split padre/hijo y maximiza la grilla; guarda la vista; al reaplicarla se restaura esa disposición.
- Una vista sin estado de ventana se aplica con la disposición por defecto sin error.
- El estado de ventana restaurado convive correctamente con el estado de grilla de la misma vista.

**Resultado.** El estado de disposición de la ventana se persiste y restaura como parte de la vista, con paridad respecto del clásico.

### Tarea 4 — Vistas compartidas a nivel de rol/organización y su precedencia

**Descripción.** El backend actual de vistas (`ETMETA_SavedView`) es exclusivamente **por usuario**, sin visibilidad por rol/organización/cliente. Esto impide que un administrador defina vistas (o una vista por defecto) compartidas para todo un rol u organización, y no existe la precedencia "la personalización de usuario prevalece sobre la de rol, y la de rol sobre la de sistema" para las vistas, tal como contempla el checklist.

**Solución propuesta.** Ampliar el modelo de vistas para soportar el ámbito de visibilidad (usuario, rol, organización, cliente, sistema) y resolver la vista efectiva aplicando la precedencia esperada (lo más específico gana), de forma consistente con cómo el clásico maneja la personalización compartida. Permitir a los administradores crear vistas y vistas por defecto a nivel de rol/organización, y que el usuario pueda sobrescribirlas con las suyas. Reutilizar el backend del adapter, extendiendo el almacenamiento y la consulta con el criterio de ámbito.

**Test cases.**
- Un admin define una vista por defecto para un rol; un usuario de ese rol sin vista propia la recibe al abrir la ventana.
- Si el usuario tiene su propia vista por defecto, esta prevalece sobre la del rol.
- La vista de rol prevalece sobre una eventual de sistema cuando el usuario no tiene la suya.
- Borrar la vista propia del usuario hace que vuelva a aplicarse la del rol/sistema.

**Resultado.** Existen vistas compartidas por rol/organización con precedencia usuario→rol→sistema, permitiendo estandarizar configuraciones sin impedir la personalización individual.

---

> **Nota sobre el entorno representativo (`etendodev`).** Se confirmó: el adapter (`com.etendoerp.metadata`) expone `SavedViewService` (`/saved-views`, CRUD) sobre la **tabla nueva `ETMETA_SavedView`** (columnas `name`, `ad_tab_id`, `ad_user_id`, `isdefault`, `filterclause`, `gridconfiguration`; 0 filas en este entorno recién provisto, dado que las vistas las crea cada usuario) y `PreferencesService` (`/preferences`, resolución delegada al motor clásico `Preferences.java`). La UI monta el menú **Save View** en la toolbar y consume el mapa de preferencias al login. Existe además la tabla clásica `OBUIAPP_UIPersonalization` (con `visibleat_role/org/client_id`) y su ventana estándar **"Window Personalization"** (`action=W`, windowType=M, activa), **no usada** por el nuevo flujo de Saved Views (decisión de diseño: el nuevo backend es propio y por usuario). La jerarquía de `ad_preference` es real y está poblada (145 preferencias, con columnas `ad_user_id`, `ad_window_id`, `visibleat_role/org/client_id`). Los huecos (anchos/congelado de columnas, personalización de formulario, estado de ventana y vistas compartidas por rol) son huecos de cliente/adapter efectivos; la jerarquía de preferencias es responsabilidad del servidor y queda cubierta por delegación.

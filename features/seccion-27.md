# Sección 27 — Multi-Window Tab Interface (MDI)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 27. Cubre la **interfaz multi-ventana (MDI)**: cada ventana abierta vive como una pestaña independiente en una barra superior (equivalente al `OBTabSetMain` del clásico), con pestaña "Workspace" siempre presente, indicador de activa, cierre por pestaña, preservación del estado al cambiar de pestaña, manejo de overflow y atajos de teclado de navegación entre pestañas.

> **Clave de arquitectura:** esta sección es **100% frontend, sin adapter ni backend clásico**. La nueva UI **reimplementa el MDI de forma nativa** sobre un store propio (`stores/windowStore.ts`, Zustand+immer) y la barra `NavigationTabs/WindowTabs`. El clásico `OBTabSetMain` es SmartClient puro y no tiene contraparte de servidor, por lo que no hay nada que delegar ni metadata que consultar. El store mantiene, **por cada ventana abierta**, su navegación de tabs padre/hijo, el estado de tabla (filtros, orden, visibilidad, criterios), el estado de formulario, el registro seleccionado y el flag de "sucio" (`dirtyWindows`). El identificador de ventana se genera como `windowId_timestamp` (`getNewWindowIdentifier`), lo que permite **múltiples instancias de la misma ventana** de forma deliberada. La página `app/(main)/window/page.tsx` **mantiene montadas todas las ventanas visitadas** y solo alterna visibilidad/opacidad CSS al cambiar de pestaña — de ahí que el estado (incluido el scroll) se conserve sin recargar.

**Estimación global de la sección: ~80% de cobertura efectiva.** El núcleo del MDI está **completo, nativo y robusto**: abrir agrega pestaña, la pestaña Workspace (Home) siempre está a la izquierda, indicador de activa, cierre por pestaña con **aviso ante cambios sin guardar**, preservación total del estado al cambiar de pestaña (las ventanas no se desmontan), overflow con botones de scroll + menú desplegable, y "cerrar todo vuelve a Workspace". Los huecos son dos: (1) **no existen los atajos de teclado** de navegación de pestañas (Alt+Shift+W cerrar, Alt+Shift+←/→ mover, Alt+Shift+1 ir a Workspace) → Tarea 1; y (2) una **divergencia de paradigma deliberada**: reabrir la misma ventana **abre una nueva instancia** en vez de activar la existente (el clásico deduplica) — se documenta como decisión de diseño.

---

## Qué está completamente hecho

| Comportamiento (checklist 27.3) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Abrir una ventana desde el menú agrega una pestaña** | Al hacer clic en un ítem de tipo Window en el `Sidebar`, se genera un `windowIdentifier` nuevo y se llama a `setWindowActive` → aparece la pestaña en `WindowTabs` con el título de la ventana. |
| **Pestaña Workspace siempre presente y a la izquierda** | El botón Home (icono casa) es el primer elemento de `WindowTabs`; `setAllWindowsInactive` vuelve al dashboard (`Home`). Cuando no hay ventana activa, `isHomeRoute` muestra el Workspace. |
| **Indicador de pestaña activa** | Cada `WindowTab` recibe `isActive`; `setWindowActive` desactiva todas y activa una sola. El resaltado visual refleja la activa (y el botón Home cuando se está en Workspace). |
| **Cerrar pestaña (botón ×) libera la ventana** | `handleCloseWindow` → `cleanupWindow` elimina la ventana del store y su entrada en `dirtyWindows`; la ventana deja de renderizarse. |
| **Cerrar con cambios sin guardar avisa antes** | `handleCloseWindow` consulta `dirtyWindows[windowIdentifier]`; si hay cambios abre un `ConfirmModal` ("cambios sin guardar se perderán") y solo cierra al confirmar. El flag de sucio lo alimentan form y tabla vía `setWindowDirtySource`. |
| **Cambiar de pestaña preserva el estado (scroll, registro seleccionado, filtros)** | Doble garantía: (a) el `windowStore` guarda por ventana+tab los filtros, orden, visibilidad, criterios, formulario y `selectedRecord`; (b) `window/page.tsx` **mantiene montadas** todas las ventanas visitadas y solo cambia visibilidad CSS al conmutar → no hay desmontaje, por lo que scroll y estado en memoria del grid persisten intactos. |
| **La barra maneja overflow con muchas ventanas** | `TabsProvider` calcula overflow con `ResizeObserver`+scroll y expone botones de scroll izq./der. (`showLeftScrollButton`/`showRightScrollButton`) y un **menú desplegable** (`MenuTabs`) que lista todas las ventanas abiertas para saltar a cualquiera. Auto-scroll a la pestaña activa. |
| **Cerrar todas las pestañas vuelve a Workspace** | Al cerrar la última ventana, `cleanupWindow` no reactiva ninguna → `activeWindow` queda `null` → `isHomeRoute` → se muestra el `Home` (Workspace). |
| **Liberación de recursos al cerrar** | `cleanupWindow` borra el estado de la ventana del store; al no estar en la lista de `windows`, su árbol de componentes se desmonta. Al cerrar la activa, reactiva una vecina. |

---

## Qué está parcialmente hecho

- **Reapertura de la misma ventana → nueva instancia (no deduplica).** El checklist pide que reabrir una ventana ya abierta **active la pestaña existente** (sin duplicados). La nueva UI hace lo contrario **a propósito**: `getNewWindowIdentifier` añade un timestamp para permitir **varias instancias simultáneas** de la misma ventana (documentado en el código). Es una **decisión de diseño** (capacidad superior al clásico: p. ej. comparar dos registros del mismo tipo en paralelo), no un defecto funcional. Diverge del comportamiento clásico de deduplicación → se documenta, **sin tarea** (ver nota final; si se quisiera paridad estricta, sería una preferencia de producto, no un bug).

---

## Qué no está hecho

- **Atajos de teclado de navegación de pestañas.** No existen: **Alt+Shift+W** (cerrar pestaña activa), **Alt+Shift+←/→** (o `Ctrl+Space+←/→`, pestaña anterior/siguiente) ni **Alt+Shift+1** (saltar a Workspace). El hook genérico `useKeyboardShortcuts` **solo interpreta combinaciones `Ctrl/Cmd+tecla` y teclas simples** (su `normalizeKey` no contempla `Alt`+`Shift`), y ningún componente registra estos atajos para el MDI. Toda la navegación entre ventanas es solo con mouse (clic en pestaña, botones de scroll, menú de overflow, botón Home). → **Tarea 1**.

> Nota: los atajos de la barra de pestañas forman parte también del inventario mayor de atajos de la **Sección 28** (referencia completa de shortcuts). Aquí se acota el alcance a los atajos propios del MDI (cerrar/mover/ir-a-Workspace).

---

## Resumen de lo que queda por hacer

El MDI está **implementado de forma nativa y su núcleo es fiel y sólido**: apertura como pestañas, Workspace fijo a la izquierda, indicador de activa, cierre con aviso de cambios sin guardar, **preservación total del estado al conmutar** (las ventanas no se desmontan), overflow con scroll + menú, y regreso a Workspace al cerrar todo. Incluso ofrece una capacidad que el clásico no tiene (múltiples instancias de una misma ventana).

Lo pendiente es acotado y de un solo frente: **los atajos de teclado de navegación de pestañas** (cerrar, anterior/siguiente, ir a Workspace), hoy inexistentes porque el hook de atajos no soporta combinaciones `Alt+Shift`. Se documenta como **decisión de diseño** (sin tarea) la no-deduplicación al reabrir, que es intencional.

---

## Tareas

### Tarea 1 — Atajos de teclado para la barra de pestañas (MDI)

**Descripción.** La navegación entre ventanas abiertas solo puede hacerse con el mouse. Faltan los atajos que el clásico ofrece en la barra de pestañas: cerrar la pestaña activa (Alt+Shift+W), moverse a la pestaña anterior/siguiente (Alt+Shift+←/→, con su alternativa Ctrl+Space+←/→) y saltar a la pestaña Workspace (Alt+Shift+1). Además, el mecanismo de atajos actual no reconoce combinaciones con Alt+Shift, por lo que estos atajos no pueden registrarse tal cual hoy.

**Solución propuesta.** Ampliar el soporte de atajos para reconocer combinaciones con Alt+Shift (y la variante Ctrl+Space) y registrar, a nivel de la barra de pestañas del MDI, las acciones ya existentes: cerrar la ventana activa (respetando el aviso de cambios sin guardar), activar la ventana anterior/siguiente y volver a Workspace. Deben respetar la desactivación cuando el foco está en un campo de texto (salvo las excepciones habituales) y no colisionar con atajos del navegador ni con los ya presentes en grilla/formulario.

**Test cases.**
- Con varias ventanas abiertas, el atajo "siguiente" activa la pestaña siguiente y "anterior" la previa; en los extremos, se comporta de forma predecible (sin error).
- El atajo de cerrar cierra la pestaña activa; si tiene cambios sin guardar, primero muestra el aviso de confirmación.
- El atajo de Workspace vuelve al dashboard (ninguna ventana activa) desde cualquier pestaña.
- La variante alternativa (Ctrl+Space+←/→) produce el mismo resultado que la primaria.
- Con el foco dentro de un campo de texto, los atajos de navegación de pestañas no se disparan; los atajos de grilla/formulario existentes siguen funcionando sin regresiones.

**Resultado.** El usuario puede abrir, recorrer y cerrar ventanas y volver al Workspace íntegramente con el teclado, con paridad de eficiencia respecto del clásico y respetando el guardado seguro.

---

> **Nota sobre alcance y entorno.** Esta sección **no tiene componente de backend ni de adapter** (`com.etendoerp.metadata`): el MDI clásico (`OBTabSetMain`) es UI pura de SmartClient sin estado de servidor, por lo que no hay metadata que consultar en `etendodev` ni endpoints que delegar. Todo el comportamiento vive en el cliente. Como refuerzo del diseño, la nueva UI **persiste y recupera el estado de ventanas desde la URL** (`useGlobalUrlStateRecovery` + bridge en el store), de modo que un refresco del navegador no pierde las pestañas abiertas — comportamiento superior al del MDI clásico, que no sobrevive a un reload.

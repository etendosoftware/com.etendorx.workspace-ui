# Sección 28 — Complete Keyboard Shortcuts Reference

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 28. Cubre el **inventario completo de atajos de teclado** del clásico: los **43 atajos** de la preferencia `OBUIAPP_KeyboardShortcuts` (navegación de pestañas, acciones de toolbar, status bar, operaciones de grilla, edición en grilla y atajos a nivel de campo) más los atajos configurables de la nav bar (`UINAVBA_KeyboardShortcuts`).

> **Clave de arquitectura:** esta sección es **100% frontend**. El clásico define los 43 atajos como datos en la preferencia `OBUIAPP_KeyboardShortcuts` (verificado en `etendodev`: la preferencia existe con **exactamente 43 entradas**) y los registra en runtime vía `ob-keyboard-manager.js`. La nueva UI **NO lee esa preferencia** (ni el adapter `com.etendoerp.metadata` la expone): en su lugar **hardcodea un puñado de atajos** repartidos en dos hooks/componentes (`FormActions` para el formulario y `Table/index.tsx` + `utils/keyboardNavigation.ts` para la grilla) sobre un hook genérico `useKeyboardShortcuts`. El punto crítico es que la función `normalizeKey` de ese hook **solo sabe expresar `Ctrl/Cmd+tecla` y teclas simples**: no contempla combinaciones `Alt+Shift`, `Ctrl+Shift`, `Ctrl+Delete`, `Alt+Delete`, los acordes `Ctrl+Space+…`, `Ctrl+Alt+Enter` ni teclas de función (`F2`, `PageUp/Down`). Esa gramática limitada es la **raíz común** por la que ~38 de los 43 atajos no pueden siquiera registrarse hoy.

**Estimación global de la sección: ~15% de cobertura efectiva.** Del inventario de 43 atajos, la nueva UI cubre de forma fiel solo **3** (`Ctrl+S` guardar, `Escape` cerrar formulario, `Escape` cancelar edición en celda) y ofrece una **variante divergente** para "nuevo" (`Ctrl+N` en vez del `Ctrl+D`/`Ctrl+I` del clásico), más navegación nativa de grilla por flechas/Enter que no forma parte del set clásico. **Importante:** casi todas las **acciones** subyacentes SÍ existen y son accesibles con mouse (guardar y cerrar, refrescar, exportar, adjuntar, clonar, imprimir, eliminar, etc. — ver Sección 22 Toolbar); lo que falta es el **binding de teclado**, por lo que este es un hueco de **eficiencia/accesibilidad y paridad**, no de funcionalidad ausente. Además, ninguno de los checks de robustez de 28.7 se cumple del todo (no hay variantes `Ctrl+Space`, no hay hints de atajo en tooltips, no hay personalización vía preferencia, y `Escape` no dispara dentro de campos de texto pese a que el checklist lo exige).

---

## Qué está completamente hecho

| Atajo (clásico) | Estado en la nueva UI |
|-----------------|------------------------|
| **`Ctrl+S` — Guardar** (`ToolBar_Save`) | Implementado en `FormActions` (`ctrl+s`, `allowInInputs`), respeta estado de guardado/callout en curso. Fiel. |
| **`Escape` — Cerrar formulario** (`StatusBar_Close`) | Implementado en `FormActions`: si hay cambios guarda y luego vuelve a la grilla. |
| **`Escape` — Cancelar edición en celda** (`ViewGrid_CancelEditing`) | Implementado en la edición inline de grilla (`keyboardNavigation.ts`): cancela la fila en edición. |

> La grilla además ofrece navegación nativa (Enter para abrir/editar fila, ↑/↓ entre filas, ←/→ en modo árbol, Tab/Shift+Tab entre celdas en edición). Es funcional y útil, pero **no forma parte del set de 43 atajos del clásico** (que usa `F2`/`Ctrl+F2` para editar), por lo que no suma a la cobertura del inventario.

---

## Qué está parcialmente hecho

- **"Nuevo" con binding divergente.** La nueva UI registra `Ctrl+N` para crear (tanto en formulario como en grilla). El clásico usa **`Ctrl+D`** (New Document / cabecera) y **`Ctrl+I`** (New Row / grilla) — `Ctrl+N` no existe en la referencia. La acción funciona, pero el atajo **no coincide** con el clásico ni distingue documento vs. fila. → **Tarea 2** (realinear como parte del registro de atajos de toolbar).
- **Deshabilitación en campos de texto (check 28.7).** El hook soporta el flag `allowInInputs` y por defecto ignora los atajos cuando el foco está en `input/textarea/select/contenteditable`. Pero el checklist exige que **`Escape` (y `Ctrl+S`) sí funcionen dentro de campos de texto**: `Ctrl+S` lo cumple (`allowInInputs`), pero **`Escape` NO** (no lleva el flag), de modo que no cierra/cancela mientras el foco está en un campo. Divergencia menor respecto del comportamiento esperado. → se corrige junto con **Tarea 1/2**.

---

## Qué no está hecho

Del inventario de 43 atajos, **faltan ~38**, agrupados por familia:

- **28.1 Navegación de pestañas (10 atajos).** Ninguno: `Alt+Shift+W` (cerrar), `Alt+Shift+↑/↓/←/→` y sus variantes `Ctrl+Space+…` (padre/hijo/hermano previo-siguiente), `Alt+Shift+1` (ir a Workspace). *(Coincide con el hueco ya reportado en la **Sección 27**.)*
- **28.2 Acciones de toolbar (13 de 14).** Solo `Ctrl+S` está. Faltan: `Ctrl+D` NewDoc, `Ctrl+I` NewRow, `Ctrl+Shift+X` Save&Close, `Ctrl+Shift+Z` Undo, `Ctrl+Delete` Delete, `Ctrl+Shift+R` Refresh, `Ctrl+Shift+E` Export, `Ctrl+Shift+A` Attachments, `Ctrl+Shift+K` Clone, `Ctrl+Shift+P` Print, `Ctrl+Shift+M` Email, `Ctrl+Shift+Y` Audit Trail, `Ctrl+Shift+U` Direct Link. **Las acciones existen como botones**; falta el binding.
- **28.3 Status bar (3 de 4).** Faltan `Alt+Shift+PageUp/PageDown` (registro anterior/siguiente) y `Alt+Shift+Enter` (maximizar/restaurar). *(Coincide con la **Sección 23**; maximizar/restaurar no aplica al paradigma actual, ver §23.)* `Escape` (cerrar) sí está.
- **28.4 Operaciones de grilla (5).** Faltan `Ctrl+Shift+F` (foco al filtro), `Escape` (volver de filtro a grilla), `Alt+Delete` (limpiar filtros), `Alt+Shift+A` (seleccionar todo), `Alt+Shift+N` (deseleccionar todo).
- **28.4 Edición en grilla (3 de 4).** Faltan `F2` (editar inline), `Ctrl+F2` (editar en formulario), `Delete` (eliminar seleccionados desde grilla). `Escape` (cancelar) sí está.
- **28.6 Atajos a nivel de campo (6).** Ninguno: `Ctrl+Enter` (abrir popup de selector / SelectorAsLink / TreeItem), `Alt+↓` (desplegar árbol), `↓` (mover al árbol), `Ctrl+Alt+Enter` (link-out / zoom al registro referenciado).
- **28.5 Nav bar y 28.7 (robustez/personalización).** No se leen las preferencias `OBUIAPP_KeyboardShortcuts` ni `UINAVBA_KeyboardShortcuts`, por lo que **no hay personalización vía preferencia**, no existen las variantes `Ctrl+Space`, y los **tooltips de los botones no muestran el hint del atajo**.

---

## Resumen de lo que queda por hacer

La nueva UI hoy cubre un subconjunto mínimo del inventario de atajos (guardar, cerrar, cancelar edición) sobre una infraestructura que **estructuralmente no puede expresar** la mayoría de las combinaciones del clásico. Como casi todas las acciones subyacentes ya existen y son accesibles con mouse, lo pendiente es **paridad de teclado** (eficiencia y accesibilidad para usuarios de teclado), en dos frentes:

1. **Habilitador (Tarea 1):** ampliar la infraestructura de atajos para soportar la gramática completa de modificadores (`Alt+Shift`, `Ctrl+Shift`, `Ctrl+Alt`, `Ctrl+Delete`, `Alt+Delete`, acordes `Ctrl+Space+…`, teclas de función y de página) y, deseablemente, alimentarla desde la preferencia como fuente de verdad. Sin esto, ningún otro atajo puede registrarse tal cual.
2. **Registro de atajos (Tareas 2–4):** una vez habilitada la gramática, cablear los atajos sobre acciones **ya existentes** de toolbar, grilla y campo, y exponer los hints en los tooltips.

Se documenta como **decisión de diseño** (sin tarea, ya tratada en §23): la ausencia de `Alt+Shift+Enter` (maximizar/restaurar), coherente con que la vista dividida grid+form no forma parte del paradigma de la nueva UI. Los atajos de **pestañas** (§27) y **anterior/siguiente registro** (§23) ya tienen tarea en sus secciones; aquí quedan cubiertos como parte del habilitador y del registro masivo, sin duplicar el trabajo.

---

## Tareas

### Tarea 1 — Ampliar la infraestructura de atajos de teclado (gramática de modificadores + fuente de verdad)

**Descripción.** El mecanismo actual de atajos solo reconoce `Ctrl/Cmd+tecla` y teclas simples, por lo que no puede representar la mayoría de los 43 atajos del clásico (combinaciones con `Alt+Shift`, `Ctrl+Shift`, `Ctrl+Alt`, `Ctrl+Delete`, `Alt+Delete`, los acordes `Ctrl+Space+…`, y teclas como `F2`, `PageUp/PageDown`). Además, el clásico define esos atajos como datos en la preferencia `OBUIAPP_KeyboardShortcuts` (43 entradas, confirmadas en la base) y la nueva UI no la consume, por lo que tampoco hay personalización ni variantes alternativas.

**Solución propuesta.** Extender el reconocimiento de atajos para soportar cualquier combinación de modificadores y las teclas especiales/acordes requeridos, de forma que un mismo atajo pueda tener una combinación primaria y una alternativa equivalente. De manera deseable, permitir que el conjunto de atajos se alimente desde la preferencia del sistema (fuente de verdad y personalización), con un mapeo por defecto que reproduzca el inventario del clásico. Mantener la regla de deshabilitar atajos cuando el foco está en un campo de texto, con las excepciones correctas (guardar y cerrar/cancelar deben seguir funcionando dentro de campos).

**Test cases.**
- Un atajo con `Alt+Shift+<tecla>` y otro con `Ctrl+Shift+<tecla>` se disparan correctamente; su variante alternativa (`Ctrl+Space+<tecla>`) produce el mismo resultado.
- Teclas especiales (`F2`, `PageUp/PageDown`, `Delete`) se reconocen como atajos.
- Con el foco en un campo de texto, los atajos de navegación no se disparan, pero guardar y cerrar/cancelar sí.
- Ninguna combinación registrada colisiona con un atajo por defecto del navegador (no produce la acción nativa del navegador).
- Si se alimenta desde la preferencia, cambiar la preferencia cambia el atajo efectivo sin tocar código.

**Resultado.** Existe una base capaz de expresar todos los atajos del clásico (primarios y alternativos), habilitando el registro del resto de las familias y, opcionalmente, la personalización por preferencia.

---

### Tarea 2 — Registrar los atajos de acciones de toolbar y status bar sobre acciones existentes

**Descripción.** Las acciones de toolbar (nuevo documento, nueva fila, guardar y cerrar, deshacer, eliminar, refrescar, exportar, adjuntos, clonar, imprimir, email, audit trail, direct link) y de status bar (registro anterior/siguiente) existen y son accesibles con mouse, pero no tienen atajo de teclado; además "nuevo" usa hoy `Ctrl+N` en lugar de los `Ctrl+D`/`Ctrl+I` del clásico. Falta también mostrar el hint del atajo en el tooltip de cada botón.

**Solución propuesta.** Sobre la infraestructura de la Tarea 1, asociar cada atajo del clásico a la acción ya implementada correspondiente, respetando su disponibilidad (habilitado/deshabilitado según contexto y permisos) y las confirmaciones existentes (p. ej. eliminar y clonar piden confirmación; anterior/siguiente hacen autosave). Realinear "nuevo documento" y "nueva fila" a los atajos del clásico. Incorporar el hint del atajo en el tooltip de los botones correspondientes. Los atajos de status bar (anterior/siguiente) coordinan con la Tarea 1 de la Sección 23.

**Test cases.**
- Cada acción de toolbar disponible se dispara con su atajo del clásico y respeta su estado deshabilitado cuando no aplica.
- El atajo de eliminar/clonar muestra la confirmación antes de ejecutar; el de guardar y cerrar guarda y vuelve a la grilla.
- "Nuevo documento" y "nueva fila" responden a los atajos del clásico y crean el tipo de registro correcto según el contexto (cabecera vs. grilla).
- Anterior/siguiente registro navegan con el mismo comportamiento seguro de autosave que las flechas de la status bar.
- El tooltip de cada botón muestra el atajo asociado.

**Resultado.** El usuario puede operar el toolbar y navegar entre registros íntegramente con el teclado, con paridad de bindings respecto del clásico y descubribilidad vía tooltips.

---

### Tarea 3 — Registrar los atajos de operaciones de grilla y edición en grilla

**Descripción.** Faltan los atajos de grilla del clásico: enfocar la fila de filtros, volver el foco a la grilla desde el filtro, limpiar todos los filtros, seleccionar/deseleccionar todos los registros, editar la fila seleccionada inline y en formulario, y eliminar los registros seleccionados desde la grilla. Estas capacidades existen mayormente por mouse/UI, pero no por teclado.

**Solución propuesta.** Sobre la Tarea 1, registrar en la vista de grilla los atajos correspondientes enlazándolos a las acciones ya existentes (filtro, selección múltiple, edición inline/formulario, borrado), activos solo cuando la grilla tiene el foco y sin interferir con la navegación por flechas/Enter ya presente ni con la edición de celdas en curso.

**Test cases.**
- El atajo de foco al filtro coloca el cursor en la fila de filtros; el de volver a grilla devuelve el foco a las filas.
- El atajo de limpiar filtros elimina todos los filtros activos y recarga la lista.
- Seleccionar todos / deseleccionar todos actualiza la selección de la grilla.
- Los atajos de editar inline y editar en formulario abren el modo correcto sobre la fila seleccionada; el de eliminar pide confirmación y borra los seleccionados.
- Los atajos no se disparan mientras se edita una celda (salvo los propios de la edición) ni rompen la navegación por flechas existente.

**Resultado.** La operación de la grilla (filtrar, seleccionar, editar y borrar) queda disponible por teclado con paridad respecto del clásico.

---

### Tarea 4 — Atajos a nivel de campo (selector, zoom/link-out y árbol)

> **⚠️ Prioridad media-baja.** Complementa la paridad de teclado en el formulario; su ausencia no bloquea ninguna funcionalidad (todo es accesible con mouse).

**Descripción.** En el formulario faltan los atajos a nivel de campo del clásico: abrir el popup del selector (para Selector, SelectorAsLink y TreeItem), abrir el link-out / zoom al registro referenciado, y los atajos de campos de tipo árbol (desplegar y moverse al árbol).

**Solución propuesta.** Sobre la Tarea 1, registrar estos atajos en el campo enfocado enlazándolos a las acciones ya existentes de apertura de selector, navegación al registro referenciado y despliegue de árbol, activos solo cuando el foco está en un campo del tipo correspondiente.

**Test cases.**
- Con el foco en un campo selector/SelectorAsLink/TreeItem, el atajo abre su popup de selección.
- Con el foco en un campo con referencia navegable, el atajo de zoom/link-out abre el registro referenciado.
- En campos de tipo árbol, los atajos despliegan el árbol y permiten moverse a él.
- Los atajos solo actúan sobre el tipo de campo correcto y no interfieren con la escritura normal en el campo.

**Resultado.** La interacción con selectores, referencias y árboles desde el formulario queda disponible por teclado, completando la paridad del inventario de atajos.

---

> **Nota sobre alcance y entorno.** Esta sección **no tiene componente de backend funcional**: el comportamiento vive en el cliente. La preferencia `OBUIAPP_KeyboardShortcuts` existe en `etendodev` con **43 entradas** (10 de pestañas, 14 de toolbar, 4 de status bar, 5+4 de grilla/edición, 6 de campo) y `UINAVBA_KeyboardShortcuts` para la nav bar; hoy **ninguna de las dos es leída** por la nueva UI ni expuesta por el adapter `com.etendoerp.metadata`. Si se quisiera personalización por preferencia (check 28.7), el adapter debería emitir esa preferencia; alternativamente, la nueva UI puede mantener un mapeo por defecto equivalente. La mayoría de las **acciones** referidas por estos atajos ya existen (ver Secciones 22 Toolbar, 23 Status Bar y 27 MDI); esta sección trata específicamente el **acceso por teclado** a ellas.

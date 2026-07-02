# Sección 22 — Field Groups (Form Sections)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 22. Cubre los **Field Groups** (`ad_fieldgroup`): las secciones colapsables que agrupan campos dentro de un formulario bajo un encabezado, con estado inicial expandido/colapsado según la configuración `iscollapsed`.

> **Clave de arquitectura:** la nueva UI **reimplementa los field groups de forma nativa** (no delega al render clásico). El adapter (`com.etendoerp.metadata`, `FieldBuilder.java`) enriquece cada campo con `fieldGroup` + `fieldGroup$_identifier` (base, vía `DataToJsonConverter`) y agrega **`fieldGroupCollapsed`** (refleja `AD_FieldGroup.IsCollapsed`) y **`fieldGroupName`** (nombre **traducido** al idioma del usuario, con fallback al nombre base). El cliente arma las secciones en `useFormFields` (agrupa por `fieldGroup`, ordena por `seqno`), calcula el estado inicial en `computeInitialExpandedSections` (`FormView/index.tsx`) y las renderiza con el componente genérico `Collapsible`. Los campos sin grupo caen en una sección por defecto (`_main`). El mismo patrón está replicado en los **diálogos de parámetros de proceso** (`ParameterBuilder.addFieldGroupCollapsed` + `groupProcessParametersByFieldGroup` + `CollapsibleSection`), por lo que la agrupación es consistente en formularios y procesos.

**Estimación global de la sección: ~90% de cobertura efectiva.** El comportamiento central está **completo y es fiel** al clásico: las secciones se renderizan como colapsables con encabezado traducido, respetan el estado inicial de `iscollapsed` (incluyendo el caso NULL → expandido), se pueden expandir/colapsar por clic, ocultan/muestran los campos, ubican los campos sin grupo en la sección por defecto y ordenan por `seqno`. El hueco principal es un detalle de UX de validación: cuando un campo obligatorio dentro de una sección colapsada falla la validación al guardar, la sección **no se auto-expande**. Un hueco menor es la **persistencia del estado de colapso** ante desmontaje del formulario (grid↔form).

---

## Qué está completamente hecho

| Comportamiento (checklist 22.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Los field groups se renderizan como secciones colapsables con encabezado** | `FormFieldsContent` mapea cada grupo a un `Collapsible` con título, ícono (`getIconForGroup`/`iconMap`) y flecha de expandir/colapsar. |
| **El encabezado muestra el nombre traducido del field group** | El adapter emite `fieldGroupName` traducido (`getTranslatedFieldGroupName` recorre `ADFieldGroupTrlList` por idioma, fallback al nombre base); `useFormFields` lo usa con precedencia sobre `fieldGroup$_identifier`. |
| **Las secciones con `iscollapsed='Y'` inician colapsadas** | `computeInitialExpandedSections` solo expande `_main` y los grupos con `fieldGroupCollapsed === false`; un grupo con `IsCollapsed='Y'` no entra en la lista inicial → arranca colapsado. |
| **Las secciones con `iscollapsed='N'` o NULL inician expandidas** | El adapter usa `Boolean.TRUE.equals(fg.isCollapsed())`: para `N` y para NULL devuelve `false` → `fieldGroupCollapsed=false` → sección expandida. Verificado en DB: 74 grupos con `iscollapsed` NULL (p. ej. Dimensions) se tratan como expandidos, igual que el clásico. |
| **Clic en el encabezado alterna expandir/colapsar** | `Collapsible.handleToggle` → `onToggle` → `handleAccordionChange`, que agrega/quita el `sectionId` de `expandedSections`. Además soporta teclado (Enter/Espacio). |
| **Las secciones colapsadas ocultan sus campos** | El contenido se anima a `height: 0` con `overflow-hidden`, `aria-hidden=true` y los focusables reciben `tabindex=-1` (no navegables por teclado). |
| **Expandir muestra todos los campos del grupo** | Al expandir, la altura se restaura al `scrollHeight` real y se rehabilitan los `tabindex`. |
| **Los campos sin grupo aparecen en la sección por defecto** | Los campos sin `fieldGroup` se agrupan en `_main` (identificador "Main Section"), que se expande siempre por defecto. |
| **Múltiples field groups en la misma pestaña se renderizan en secuencia** | `useFormFields` construye un grupo por `fieldGroup` y los ordena; cada uno se renderiza como un `Collapsible` independiente. |
| **El orden de los field groups sigue el `seqno` de los campos** | Cada grupo toma como `sequenceNumber` el menor `seqno` de sus campos y `groups` se ordena por ese valor; los campos dentro del grupo siguen el orden de `tab.fields`. |

---

## Qué está parcialmente hecho

- **Persistencia del estado de colapso "dentro de la sesión".** `expandedSections` es estado del componente `FormView`. Persiste correctamente al **navegar entre registros** de la misma pestaña (previous/next) porque el formulario sigue montado, y se **reinicia intencionalmente al cambiar de pestaña** para aplicar el `fieldGroupCollapsed` de cada una. Sin embargo, si el `FormView` se desmonta (p. ej. volver a la vista de grilla y reabrir el formulario), el estado vuelve al default por metadata en lugar de recordar lo que el usuario había colapsado/expandido. El clásico conserva esa preferencia durante toda la sesión. Es un detalle de UX, no de funcionalidad. → **Tarea 2** (baja prioridad).

---

## Qué no está hecho

- **Auto-expansión de una sección colapsada ante error de validación de un campo obligatorio.** En la nueva UI la validación de campos obligatorios se resuelve **server-side**: el datasource devuelve errores a nivel de campo (`{ errors: { fieldName: … } }`) que `useFormAction` concatena y muestra en un **modal de error**. Si el campo obligatorio faltante está dentro de una sección colapsada, **la sección no se expande ni se hace scroll/foco al campo**, a diferencia del clásico que auto-expande el grupo y resalta el campo. El usuario recibe el mensaje pero puede no ver dónde está el campo afectado. → **Tarea 1**.

---

## Resumen de lo que queda por hacer

La sección está **implementada de forma nativa y es fiel** al clásico: agrupación por `fieldGroup`, encabezado traducido, estado inicial según `iscollapsed` (incluyendo NULL→expandido), toggle por clic/teclado, ocultamiento real de campos, sección por defecto para campos sin grupo y orden por `seqno`. Lo pendiente es acotado y de UX:

1. **(Tarea 1)** Auto-expandir la(s) sección(es) colapsada(s) que contengan campos obligatorios que fallan la validación al guardar, y llevar el foco/scroll al primero, para no dejar al usuario "a ciegas" cuando el campo faltante está oculto.
2. **(Tarea 2, baja prioridad)** Conservar la preferencia de colapso/expansión del usuario a lo largo de la sesión, también cuando el formulario se desmonta y se vuelve a abrir.

No se identifican huecos en el renderizado de secciones, la traducción del encabezado, el respeto del estado inicial `iscollapsed`, el toggle, el ocultamiento de campos, la sección por defecto ni el orden por `seqno`.

---

## Tareas

### Tarea 1 — Auto-expandir secciones colapsadas ante error de validación de campo obligatorio

**Descripción.** Cuando el usuario guarda un formulario y falta un valor en un campo obligatorio que pertenece a una sección (field group) colapsada, la nueva UI muestra el error en un modal pero no expande la sección ni indica visualmente qué campo es el problema. Como el campo está oculto dentro de la sección colapsada, el usuario no puede localizarlo fácilmente, a diferencia del clásico que auto-expande el grupo y resalta el campo con error.

**Solución propuesta.** Al recibir errores de validación a nivel de campo tras un intento de guardado, determinar a qué sección(es) pertenecen los campos afectados y expandir automáticamente esas secciones, llevando el foco (y el scroll) al primer campo con error. La lógica debe reutilizar el mecanismo de expansión de secciones ya existente y el mapeo campo→grupo que arma el formulario, sin alterar el flujo cuando no hay errores.

**Test cases.**
- Guardar con un campo obligatorio vacío dentro de una sección colapsada expande esa sección automáticamente.
- Tras expandirse, el foco/scroll queda en el primer campo obligatorio faltante.
- Si hay varios campos faltantes en distintas secciones colapsadas, todas las secciones involucradas se expanden.
- Un campo obligatorio faltante en una sección ya expandida sigue mostrando el error sin cambios de comportamiento.
- Un guardado exitoso no altera el estado de expansión de las secciones.

**Resultado.** Ante un error de validación, el usuario siempre ve el campo obligatorio afectado porque su sección se expande automáticamente, con paridad de comportamiento respecto del clásico.

---

### Tarea 2 — Persistir la preferencia de colapso/expansión durante la sesión

> **⚠️ Baja prioridad.** Es una mejora de conveniencia. El estado inicial por metadata (`iscollapsed`) y la persistencia durante la navegación entre registros ya funcionan; lo que falta es recordar los cambios manuales del usuario cuando el formulario se desmonta.

**Descripción.** El estado de colapso/expansión de las secciones se mantiene mientras el formulario está montado (incluida la navegación entre registros de la misma pestaña), pero se pierde al desmontar el `FormView` (por ejemplo, al volver a la grilla y reabrir el formulario), volviendo al estado inicial definido por metadata. En el clásico, la preferencia del usuario sobre qué secciones tiene abiertas/cerradas se conserva durante la sesión.

**Solución propuesta.** Persistir la preferencia de expansión por sección (asociada a la pestaña/ventana y al usuario) de modo que sobreviva al desmontaje y reapertura del formulario dentro de la misma sesión, usando el mismo estado inicial de metadata solo la primera vez que se abre una pestaña. Debe seguir respetándose el `fieldGroupCollapsed` como valor por defecto cuando no hay preferencia previa.

**Test cases.**
- Colapsar una sección expandida por defecto, cerrar el formulario y reabrirlo mantiene la sección colapsada.
- Expandir una sección colapsada por defecto y reabrir el formulario mantiene la sección expandida.
- La primera vez que se abre una pestaña (sin preferencia previa) se aplica el estado por metadata (`iscollapsed`).
- El cambio de estado de una pestaña no afecta las preferencias de otras pestañas.

**Resultado.** La interfaz recuerda las secciones que el usuario dejó abiertas o cerradas durante la sesión, mejorando la continuidad de trabajo respecto del comportamiento actual.

---

> **Nota sobre `iscollapsed` en el entorno representativo.** En `etendodev` el campo `ad_fieldgroup.iscollapsed` es nullable sin default: 15 grupos en `Y`, 68 en `N` y 74 en NULL. El adapter mapea correctamente `N` y NULL a "expandido" y `Y` a "colapsado". La tabla 22.3 de la fuente de verdad marca "Availability" como colapsado, pero en la DB figura `N` (expandido); la nueva UI sigue fielmente el metadato real, por lo que la diferencia es del documento fuente, no de la implementación.

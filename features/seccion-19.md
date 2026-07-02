# Sección 19 — Linked Items (Cross-References)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 19. Cubre los **Linked Items**: la sección colapsable al pie de la vista de formulario que muestra los registros de otras tablas que referencian (por FK) al registro actual, agrupados por tipo de entidad, y que permite navegar (zoom) a esos registros relacionados.

> **Clave de arquitectura:** a diferencia de los `ad_form` (Sección 18) y los reportes clásicos (Sección 14), aquí la nueva UI **sí reimplementa la funcionalidad de forma nativa** (componente React `LinkedItems` + `LinkedItemsSection`), pero **delega el origen de datos al servidor**: los llamados se hacen al servlet clásico `UsedByLink.html` a través del forward del adapter (`meta/legacy/utility/UsedByLink.html`), usando **exactamente los mismos comandos** que el widget clásico real (`Command=JSONCategory` para las categorías y `Command=JSONLinkedItem` para los ítems de una categoría). Es decir, replica el widget clásico `ob-view-form-linked-items.js` fielmente: la lógica de descubrimiento de relaciones FK y el enforcement de acceso se resuelven server-side en el mismo servlet que usa el clásico.
>
> **Nota:** la fuente de verdad menciona `LinkedItemsActionHandler.java` como handler server-side; en la instalación real ese handler no es el mecanismo activo — tanto el clásico como la nueva UI usan el servlet `UsedByLink.html` (`org.openbravo.erpCommon.utility.UsedByLink`). El comportamiento observable es equivalente y el análisis no cambia.

**Estimación global de la sección: ~90% de cobertura efectiva.** La funcionalidad está **implementada nativamente y es fiel** al clásico: la sección aparece al pie del formulario, colapsada por defecto, oculta para registros nuevos, agrupa por entidad, muestra el identificador de cada ítem, permite navegar al registro en su ventana y respeta el acceso por organización (enforcement server-side). El hueco principal es de **rendimiento/fidelidad de carga**: el clásico carga las categorías **solo al expandir la sección por primera vez** (lazy), mientras que la nueva UI las consulta **al abrir cada registro existente** (eager), porque el contenedor colapsable monta siempre el componente. Un hueco menor está en el mensaje de estado vacío del panel de ítems.

---

## Qué está completamente hecho

| Comportamiento (checklist 19.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **La sección aparece al pie de la vista de formulario** | `FormFieldsContent` renderiza la sección `linked-items` después de los grupos de campos, Notas y Adjuntos, dentro de un `Collapsible` con ícono de enlace. |
| **Colapsada por defecto** | `computeInitialExpandedSections` no incluye `linked-items` (solo expande el `_main` y los grupos con `fieldGroupCollapsed === false`); verificado por test unitario. |
| **NO se muestra para registros nuevos/no guardados** | Doble guarda: `FormFieldsContent` solo renderiza la sección si `mode !== FormMode.NEW`, y el componente `LinkedItems` corta el fetch si `!recordId || recordId === "new"`. |
| **Carga los registros vinculados desde el servidor** | `fetchLinkedItemCategories` / `fetchLinkedItems` (`api-client/linkedItems.ts`) postean a `meta/legacy/utility/UsedByLink.html` con `JSONCategory` / `JSONLinkedItem`; el adapter propaga la autenticación por token/cookie. |
| **Agrupados por tipo de entidad** | Patrón maestro-detalle: panel izquierdo lista las categorías (`fullElementName` por entidad referenciante); al hacer clic, el panel derecho lista los ítems de esa categoría. Equivale a la grilla de categorías + grilla de ítems del clásico. |
| **Cada ítem muestra su identificador** | Cada ítem se renderiza con `item.name` (identificador del registro) como enlace. |
| **Clic en un ítem navega al registro en su ventana** | `handleItemClick` genera un nuevo identificador de ventana y usa `appendWindowToUrl` + recovery (`triggerRecovery`) para abrir el registro (`adWindowId`/`adTabId`/`id`) en su propia ventana (paradigma MDI). |
| **Volver al registro original** | Al usar `appendWindowToUrl` (multi-ventana) la ventana original permanece abierta; el usuario regresa cambiando de ventana/pestaña (coherente con la interfaz MDI de la Sección 27). |
| **Estado vacío cuando no hay referencias** | Si no hay categorías, el panel izquierdo muestra el mensaje "No Categories Available" (`forms.sections.noCategories`). |
| **Respeta acceso por organización** | El servlet clásico `UsedByLink` (al que se delega) filtra por cliente/organización y permisos del rol activo. Enforcement server-side. |

---

## Qué está parcialmente hecho

- **Carga eager en lugar de lazy (rendimiento y fidelidad).** El clásico documenta e implementa la carga diferida: `setExpanded` en `ob-view-form-linked-items.js` solo llama a `loadCategories()` en el **primer expand** ("*the linked items should not be loaded before the section actually expands*"). En la nueva UI, el `Collapsible` **siempre monta sus hijos** (solo los oculta con `height:0` por CSS), por lo que el `useEffect` de `LinkedItems` dispara la consulta de categorías (`UsedByLink JSONCategory`) **al abrir cada registro existente**, aunque el usuario nunca expanda la sección. Esto genera una petición extra por cada registro visitado y no cumple el criterio "lazy-loaded on expand, not on form load". → **Tarea 1**.
- **Mensaje de estado vacío del panel de ítems poco específico.** Cuando una categoría seleccionada no tiene ítems, el panel derecho reutiliza el texto "No Categories Available" (`noCategories`), que es engañoso (habla de categorías, no de ítems). Falta un mensaje propio del tipo "No hay artículos asociados". Es un detalle de UX/textos, no de funcionalidad. → **Tarea 2**.

---

## Qué no está hecho

- No se identifican comportamientos del checklist **sin ninguna** cobertura. Todos los ítems (presencia al pie, colapsado por defecto, oculto en nuevos, carga desde servidor, agrupación por entidad, identificador visible, navegación por clic, estado vacío y acceso por organización) están implementados; lo pendiente son los dos ajustes parciales anteriores (carga lazy y texto de vacío).

---

## Resumen de lo que queda por hacer

La sección está **funcionalmente implementada de forma nativa y fiel** al clásico, con los datos y el control de acceso resueltos server-side por el mismo servlet que usa la interfaz clásica. Lo pendiente es acotado:

1. **(Tarea 1)** Diferir la consulta de Linked Items hasta que la sección se expanda por primera vez, para alinear el rendimiento con el clásico y evitar peticiones innecesarias al abrir registros.
2. **(Tarea 2)** Mostrar un mensaje de estado vacío específico ("No hay artículos asociados") cuando la categoría seleccionada no tiene ítems, en lugar de reutilizar el texto de "sin categorías".

No se identifican huecos en la presencia de la sección, el agrupamiento por entidad, la navegación al registro vinculado ni el enforcement de acceso por organización.

---

## Tareas

### Tarea 1 — Carga diferida (lazy) de Linked Items al expandir la sección

**Descripción.** La sección de Linked Items consulta sus categorías al abrir cualquier registro existente, incluso si el usuario nunca la expande, porque el contenedor colapsable monta siempre su contenido. El clásico, en cambio, carga las categorías únicamente la primera vez que la sección se expande. El resultado es una petición adicional al servidor por cada registro visitado, que degrada el rendimiento en formularios muy navegados y se aparta del comportamiento de referencia.

**Solución propuesta.** Hacer que la consulta de categorías (y en consecuencia la de ítems) se dispare solo cuando la sección se expande por primera vez, y no al montar el formulario. La idea general es condicionar el inicio de la carga al estado "expandida" de la sección (o montar el contenido de la sección recién al expandir), conservando la caché una vez cargada para no repetir la consulta al colapsar/expandir de nuevo dentro del mismo registro.

**Test cases.**
- Al abrir un registro existente sin expandir la sección, no se realiza ninguna petición a Linked Items.
- Al expandir la sección por primera vez, se cargan las categorías desde el servidor.
- Colapsar y volver a expandir la misma sección no vuelve a disparar la consulta de categorías (usa la caché).
- Cambiar a otro registro y expandir la sección consulta las categorías del nuevo registro.
- La sección sigue oculta para registros nuevos/no guardados y no dispara ninguna petición.

**Resultado.** Linked Items se carga de forma diferida al expandir, con paridad de rendimiento respecto del clásico y sin peticiones innecesarias durante la navegación de registros.

---

### Tarea 2 — Mensaje de estado vacío propio para ítems sin resultados

**Descripción.** Cuando el usuario selecciona una categoría de Linked Items que no tiene registros asociados, el panel de ítems muestra el mensaje "No hay categorías disponibles", que corresponde al caso de ausencia de categorías y resulta confuso en este contexto. Falta un mensaje específico que indique que la categoría seleccionada no tiene artículos vinculados.

**Solución propuesta.** Introducir un texto de estado vacío dedicado para el panel de ítems (por ejemplo, "No hay artículos asociados") y usarlo cuando una categoría seleccionada devuelve cero ítems, diferenciándolo del mensaje de "sin categorías". Debe estar traducido en los idiomas soportados.

**Test cases.**
- Seleccionar una categoría con ítems muestra la lista de ítems.
- Seleccionar una categoría sin ítems muestra el mensaje específico de "sin artículos asociados", no el de "sin categorías".
- El caso de un registro sin ninguna categoría sigue mostrando el mensaje de "sin categorías".
- Los mensajes aparecen correctamente traducidos según el idioma activo.

**Resultado.** El estado vacío del panel de ítems es claro y no se confunde con la ausencia de categorías, mejorando la comprensión de la sección.

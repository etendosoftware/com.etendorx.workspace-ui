# Sección 23 — Status Bar (Bottom Bar)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 23. Cubre la **Status Bar** de la vista de ventana: la barra que ofrece navegación entre registros (anterior/siguiente), contador de posición ("Record N of M"), controles de maximizar/restaurar y cerrar, y los **campos "Show in Status Bar"** (`ad_field.isshowninstatusbar='Y'`) que resumen el registro actual con su etiqueta y valor.

> **Clave de arquitectura:** la nueva UI **reimplementa la status bar de forma nativa** (no delega al clásico). Vive en el componente `StatusBar` (`FormView/StatusBar.tsx`), que se renderiza **dentro del `FormHeader`, en la parte superior del formulario** (encima de las pestañas de secciones), no al pie como en el clásico. Agrupa tres cosas: (1) los **campos de status bar** (`StatusBarField`), (2) los **controles de navegación de registros** (`RecordNavigationControls` + hook `useRecordNavigation`) con el contador de posición, y (3) el botón **cerrar** (X). El adapter (`com.etendoerp.metadata`) emite por cada campo la propiedad base **`shownInStatusBar`** (vía `DataToJsonConverter` en modo `FULL_TRANSLATABLE`); el cliente la usa en `useFormFields` para separar los campos en un bucket `statusBarFields`. Cada `StatusBarField` lee su valor **en vivo** del formulario (`useFieldValue`/react-hook-form) y, para campos de estado con `refList`, lo muestra como **Tag** con color e ícono (`statusConfig`).

**Estimación global de la sección: ~85% de cobertura efectiva.** El núcleo está **completo y es nativo**: navegación anterior/siguiente (con autosave previo), contador de posición preciso, cierre (por botón y por teclado con Escape), y los campos "Show in Status Bar" con su etiqueta y valor, que se actualizan tanto al navegar entre registros como al editar antes de guardar (incluidos los badges de estado con color). Las diferencias son de **paradigma/UX**: la barra se ubica **arriba** (no al pie), no existe el **toggle maximizar/restaurar a vista dividida grid+form** (la nueva UI muestra grilla **o** formulario, con el formulario siempre a pantalla completa) y **faltan los atajos de teclado** de navegación (Alt+Shift+PageUp/PageDown) y de maximizar/restaurar (Alt+Shift+Enter).

---

## Qué está completamente hecho

| Comportamiento (checklist 23.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Navegación anterior/siguiente entre registros** | `RecordNavigationControls` (flechas izq./der.) sobre `useRecordNavigation`; navega dentro de la lista de registros de la pestaña sin volver a la grilla, con **autosave previo** si el formulario está sucio y bloqueo si el guardado falla. Soporta cargar más páginas (`fetchMore`) al llegar al final. |
| **Contador de posición del registro** | El indicador muestra la posición real `N / M` (p. ej. `5 / 47`) calculada por `navigationState` (índice + total); muestra `- / -` cuando no hay registro/es nuevo. La posición es exacta. |
| **Cerrar vuelve a la vista de grilla** | Botón X en la status bar (`handleCloseRecord`): guarda si hay cambios (`skipFormStateUpdate`) y ejecuta `onBack`, que limpia el form state y devuelve a la grilla (`Tab.handleBack`). |
| **Los campos "Show in Status Bar" muestran etiqueta y valor** | El adapter emite `shownInStatusBar`; `useFormFields` los aísla en `statusBarFields`; `StatusBarField` renderiza `label: valor`. Verificado en DB: 231 campos con `isshowninstatusbar='Y'` (p. ej. Sales Invoice Header 14, Purchase Invoice 11, Sales Order 9). |
| **Campos de estado con color/badge** | Para campos con `refList`, `StatusBarField` los muestra como `Tag` con color (del `refList`/`colorValue`) e ícono de estado (`statusConfig`), y traduce Y/N y valores de lista. |
| **Los campos de status bar se actualizan al navegar entre registros** | Al navegar, el formulario recarga el registro y los `StatusBarField` reflejan el nuevo valor (leen del contexto del formulario). |
| **Los campos de status bar se actualizan al editar (antes de guardar)** | `StatusBarField` usa `useFieldValue`/`watch` de react-hook-form, por lo que el valor mostrado cambia en vivo mientras el usuario edita, sin necesidad de guardar. |
| **Atajo de teclado para Cerrar (Escape)** | `FormActions` registra `Escape` vía `useKeyboardShortcuts`: si hay cambios guarda y luego ejecuta `handleBack` (cierra el formulario y vuelve a la grilla). Coincide con el ítem del checklist. |

---

## Qué está parcialmente hecho

- **Ubicación de la barra (arriba, no al pie).** El checklist describe la status bar como *bottom bar* al pie de la ventana. La nueva UI la renderiza en la **parte superior** del formulario (dentro de `FormHeader`, sobre las pestañas de secciones). La funcionalidad es la misma; cambia la posición. Es una **decisión de diseño**, no un defecto → se documenta, sin tarea.
- **Formato del contador "Record N of M".** El clásico rotula "Record 5 of 47"; la nueva UI muestra `5 / 47` (posición y total correctos, sin las palabras "Record"/"of"). Es un detalle cosmético; la información es equivalente y precisa. → **Tarea 2** (baja prioridad).
- **Maximizar/Restaurar (toggle grid+form ↔ solo formulario).** En el clásico la status bar tiene botones para **maximizar** (ver solo el formulario) y **restaurar** (volver a la vista dividida grilla+formulario). La nueva UI adopta otro paradigma: muestra **grilla o formulario** (al abrir un registro el formulario ocupa todo y la grilla se oculta), por lo que el formulario está **siempre "maximizado"** y **no existe una vista dividida grid+form** a la que "restaurar" (salvo el modo árbol lado-a-lado, que es otra función). El objetivo de "maximizar" está cubierto por defecto; lo que no existe es el modo dividido ni su toggle. Es una **decisión de diseño** → se documenta, sin tarea.

---

## Qué no está hecho

- **Atajos de teclado de navegación de registros.** No existen los atajos **Alt+Shift+PageUp** (registro anterior) ni **Alt+Shift+PageDown** (registro siguiente). El hook de atajos del formulario (`useKeyboardShortcuts` en `FormActions`) solo registra `Ctrl+S` (guardar), `Ctrl+N` (nuevo) y `Escape` (cerrar); la navegación entre registros solo se puede hacer con el mouse (flechas de la status bar). → **Tarea 1**.
- **Atajo de teclado Maximizar/Restaurar (Alt+Shift+Enter).** No existe. Es coherente con que la vista dividida grid+form no forme parte del paradigma de la nueva UI (ver "parcialmente hecho"): sin función de maximizar/restaurar, el atajo no aplica. → No genera tarea (dependería de introducir la vista dividida, que es una decisión de diseño).

---

## Resumen de lo que queda por hacer

La status bar está **implementada de forma nativa y su núcleo es fiel** al clásico: navegación anterior/siguiente con autosave, contador de posición preciso, cierre por botón y por Escape, y campos "Show in Status Bar" con etiqueta, valor y badge de estado, que se actualizan al navegar y al editar. Lo pendiente es acotado:

1. **(Tarea 1)** Añadir los atajos de teclado de navegación de registros (Alt+Shift+PageUp / Alt+Shift+PageDown), para paridad de eficiencia con el clásico.
2. **(Tarea 2, baja prioridad)** Ajustar el rótulo del contador a un formato tipo "Record N of M" para mayor familiaridad con el clásico.

Se documentan como **decisiones de diseño** (sin tarea): la ubicación de la barra en la parte superior en lugar del pie, y la ausencia del toggle maximizar/restaurar a vista dividida grilla+formulario (la nueva UI muestra grilla o formulario, con el formulario siempre a pantalla completa). El atajo Alt+Shift+Enter no aplica mientras no exista esa vista dividida.

---

## Tareas

### Tarea 1 — Atajos de teclado para navegar entre registros en la status bar

**Descripción.** La navegación al registro anterior/siguiente desde el formulario solo está disponible mediante las flechas de la status bar (mouse). No existen los atajos de teclado que el clásico ofrece para moverse entre registros sin salir del formulario (anterior y siguiente), lo que reduce la eficiencia para usuarios de teclado.

**Solución propuesta.** Registrar dos atajos de teclado en la vista de formulario que disparen las acciones de navegación ya existentes (anterior/siguiente), respetando el mismo comportamiento actual: autosave previo si hay cambios, bloqueo si el guardado falla y deshabilitación cuando no hay registro anterior/siguiente. Deben convivir con los atajos ya presentes (guardar, nuevo, cerrar) y estar activos solo cuando el formulario tiene el foco.

**Test cases.**
- Con un registro abierto y existiendo uno siguiente, el atajo "siguiente" navega al próximo registro.
- Con un registro abierto y existiendo uno anterior, el atajo "anterior" navega al registro previo.
- Si el formulario tiene cambios sin guardar, el atajo dispara el autosave antes de navegar; si el guardado falla, no navega.
- En el primer/último registro, el atajo correspondiente no hace nada (sin error).
- Los atajos existentes (guardar, nuevo, cerrar) siguen funcionando sin regresiones.

**Resultado.** El usuario puede recorrer los registros del formulario íntegramente con el teclado, con el mismo comportamiento seguro de guardado que la navegación por mouse.

---

### Tarea 2 — Formato del contador de posición al estilo "Record N of M"

> **⚠️ Baja prioridad.** Es un ajuste cosmético/de textos. La posición y el total ya se muestran de forma correcta como `N / M`; solo cambia el rótulo.

**Descripción.** El contador de posición de la status bar muestra la posición actual y el total como `N / M` (p. ej. `5 / 47`). El clásico usa el rótulo "Record 5 of 47". La información es equivalente y correcta; la diferencia es únicamente de presentación textual.

**Solución propuesta.** Presentar el contador con un rótulo traducible al estilo "Record N of M" (y su equivalente en cada idioma), conservando el cálculo de posición/total actual y el estado vacío cuando no hay registro seleccionado. Debe estar traducido en los idiomas soportados.

**Test cases.**
- Con registros disponibles, el contador muestra la posición y el total con el rótulo esperado.
- El estado sin registro seleccionado (nuevo o vacío) sigue indicándose claramente.
- El rótulo aparece correctamente traducido según el idioma activo.

**Resultado.** El contador de posición resulta más familiar respecto del clásico, sin cambiar la exactitud de la información ya mostrada.

---

> **Nota sobre el alcance de la status bar.** En la nueva UI la status bar es parte de la **vista de formulario** (registro actual): allí tienen sentido la navegación entre registros y los campos "Show in Status Bar". En la vista de grilla el recuento y la posición los aporta la propia tabla. Esto es coherente con el clásico, donde la navegación y los campos resumen dependen de haber un registro actual.

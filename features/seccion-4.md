# Sección 4 — Display Logic

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 4. La *display logic* controla la visibilidad (y, por extensión, el read-only) de campos, tabs y secciones según el estado del registro, evaluándose en el cliente.

> El backend (`/erp`, módulo adapter `com.etendoerp.metadata`) traduce cada expresión clásica a JavaScript con `DynamicExpressionParser` y la envía al cliente como `displayLogicExpression` / `readOnlyLogicExpression` / `gridDisplayLogicExpression` (`FieldBuilder`, `ParameterBuilder`, `TabBuilder`). La display logic **server-side** (`displaylogic_server`) la evalúa el propio adapter y filtra el campo antes de enviarlo (`Utils.evaluateDisplayLogicAtServerLevel`).
> En el cliente, el parser (`utils/index.ts:parseDynamicExpression`) reescribe la expresión a JS y `compileExpression` (`BaseSelector.tsx`) la compila/cachea; `createSmartContext` (`utils/expressions.ts`) construye el contexto de evaluación (valores del registro, padre, sesión y preferencias).

**Estimación global de la sección: ~99% de cobertura efectiva.** El motor de display logic está implementado en todas sus dimensiones (campo, tab, grid, read-only, parámetros de proceso y server-side). Los únicos huecos detectados tienen **0 ocurrencias** en la instancia representativa (core + todos los bundles), por lo que su impacto real es nulo.

---

## Qué está completamente hecho

| Capacidad | Implementación en la nueva UI |
|-----------|-------------------------------|
| **Parser de expresiones** | `parseDynamicExpression` + `compileExpression` traducen la sintaxis clásica a JS: variables `@Columna@`, `@$Sesion@`, `@#Usuario@`, FK `@Col_ID@`; operadores `=` (→`==`), `!` (→`!=`), `<`, `>`, `<=`, `>=`; conectores `&` (→`&&`), `|` (→`||`). Compilación cacheada por expresión. |
| **Paréntesis / precedencia** | Las expresiones con `(...)` (incl. anidadas y mezcla AND/OR, p. ej. Ejemplo 9 del spec) se evalúan con la precedencia nativa de JS. 142 expresiones de la instancia usan paréntesis. |
| **Variables de sesión y preferencias** | `@$Element_BP@`, `@$HasAlias@`, etc. y `OB.PropertyStore.get('...')` se resuelven desde el contexto de sesión y el store de preferencias (`createSmartContext` + shim de `OB` en `compileExpression`). |
| **Checks de vacío / null / FK** | `@Campo@!''`, `@Campo@=''`, `@Campo@!null` y FK limpiadas (identificador vacío → `''`) se manejan en el proxy de `createSmartContext` y el parser. Comparaciones numéricas (`@HasLines@>0`) funcionan por coerción JS. |
| **Display logic de campo (form)** | `useDisplayLogic` evalúa `displayLogicExpression` por campo y oculta/muestra en el formulario. |
| **Display logic de tab** | `TabsContainer` evalúa la expresión del tab (padre e hijos) para mostrar/ocultar el tab completo. |
| **Read-only logic** | `BaseSelector` compila y evalúa `readOnlyLogicExpression` (incluye el caso "Amount readonly" del Ejemplo 9). Misma mecánica para parámetros de proceso. |
| **Display logic de parámetros de proceso** | `ParameterBuilder` envía `displayLogicExpression`/`readOnlyLogicExpression`; `ProcessParameterSelector` los evalúa en el modal de proceso. |
| **Grid display logic (P&E)** | `WindowReferenceGrid` consume `gridDisplayLogicExpression` para mostrar/ocultar columnas según `displaylogicgrid`. **Las 15 columnas con `displaylogicgrid` de la instancia están en ventanas P&E**, todas cubiertas. |
| **Display logic server-side** | `displaylogic_server` (45 campos) se evalúa en el adapter y el campo se filtra antes de enviarse (`TabProcessor` + `Utils.evaluateDisplayLogicAtServerLevel`). |
| **Re-evaluación reactiva** | `useExpressionDependencies` extrae las dependencias de la expresión y se suscribe solo a esos campos vía `useWatch`; al cambiar cualquier campo dependiente se re-evalúa. Soporta cascada (A controla B que controla C). |
| **Obligatorios ocultos / no enviados** | `useFormValidation.isFieldDisplayed` evalúa la display logic: los campos obligatorios ocultos **no bloquean el save**; los campos no visibles no participan de la validación. |
| **Normalización booleana** | `true/false` ⇄ `'Y'/'N'` en contexto y en comparaciones (`=== true → === 'Y'`, etc.). |

---

## Qué está parcialmente hecho

- **Operador `^` (starts-with):** documentado en el spec (`@Name@^'INV'`) pero **no implementado** en `parseDynamicExpression` (en JS `^` es XOR, por lo que la expresión no se evaluaría como "empieza con"). **Impacto actual nulo: 0 expresiones lo usan** en toda la instancia (campos, tabs, columnas read-only, grid). Se documenta como límite conocido y se propone una tarea menor de robustez → **Tarea 1**.

---

## Qué no está hecho

- Nada con impacto real. La display logic de grid en **ventanas regulares** (no P&E) no se aplica dinámicamente columna a columna, pero **no existe ninguna ventana regular que use `displaylogicgrid`** en la instancia (las 15 ocurrencias son todas P&E, ya cubiertas). No se crea tarea.

---

## Resumen de lo que queda por hacer

El motor de display logic está completo y cubre todas las dimensiones que pide el spec: sintaxis (operadores, conectores, paréntesis), variables de registro/sesión/preferencias/FK, evaluación en campo, tab, read-only, parámetros de proceso, grid P&E y server-side, además de reactividad en cada cambio y manejo correcto de obligatorios ocultos. El único pendiente es **añadir el operador `^` (starts-with)** por completitud (**Tarea 1**), hoy sin uso en la instalación. No hay otros huecos con impacto real.

---

## Tareas

### Tarea 1 — Soportar el operador `^` (starts-with) en el parser de display logic

**Descripción:** la gramática de display logic del spec incluye el operador `^` ("empieza con", p. ej. `@Name@^'INV'`). El parser actual de la nueva UI no lo traduce, por lo que en JavaScript se interpretaría como XOR y la condición no funcionaría como en el clásico. Actualmente ninguna expresión de la instancia (core + bundles) lo utiliza, por lo que es una mejora de robustez/paridad, no un defecto activo.

**Solución propuesta:** extender la traducción de expresiones para que `@Campo@^'valor'` se evalúe como una comprobación de prefijo sobre el valor del campo (equivalente a "el valor comienza con el literal"), respetando la normalización de valores existente y la resolución de contexto. Mantener el comportamiento de todos los demás operadores intacto.

**Test cases:**
- `@Name@^'INV'` muestra el campo/tab solo cuando el valor empieza con `INV`; lo oculta en caso contrario.
- Funciona combinado con `&` y `|` y dentro de paréntesis, respetando la precedencia.
- No altera el resto de operadores (`=`, `!`, `<`, `>`, `<=`, `>=`) ni las expresiones existentes (regresión nula).
- Valor vacío / nulo en el campo evaluado no produce error y resuelve a "no visible".

**Resultado:** el parser cubre el 100% de los operadores documentados, garantizando paridad total con la sintaxis clásica aunque hoy no haya expresiones que usen `^`.

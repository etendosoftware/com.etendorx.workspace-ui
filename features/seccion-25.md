# Sección 25 — Default Value Expressions

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 25. Cubre los **valores por defecto** que se aplican al crear un registro nuevo: literales (`Y`/`N`/`0`/`DR`), variables de contexto (`@AD_ORG_ID@`, `@AD_CLIENT_ID@`, `@#Date@`, `SYSDATE`), defaults SQL (`@SQL=SELECT ...`) con substitución de contexto (`@Parent_ID@`, `@AD_Table_ID@`, …) y referencias entre campos (`@ColumnName@`).

> **Clave de arquitectura:** la nueva UI **NO reimplementa el motor de defaults**: lo **delega íntegramente al `FormInitializationComponent` (FIC)** del clásico. Al crear un registro nuevo, el cliente llama directamente al endpoint kernel `_action=org.openbravo.client.application.window.FormInitializationComponent` con `MODE=NEW`, `ROW_ID=null`, `TAB_ID`, `PARENT_ID` y `_gridVisibleProperties` (hook `useFormInitialization` + `utils/hooks/useFormInitialization/utils.ts`). El FIC es el mismo motor del clásico: resuelve `@#Date@` (`setNOWDefault`), las variables de contexto vía `Utility.getDefault`/`getContext` (sesión + `AD_Preference`), los literales, y ejecuta los `@SQL=` con substitución de `@Parent_ID@`/columnas (`UIDefinition.getDefaultValueFromSQLExpression`). El **adapter (`com.etendoerp.metadata`) no computa defaults**: en la metadata de la pestaña emite el string crudo `defaultValue` (serialización de la `Column`), pero la evaluación real se obtiene del FIC clásico. El cliente **toma los `columnValues` que devuelve el FIC y los escribe en el formulario** (`useFormInitialState` → react-hook-form), con callouts suprimidos durante la inicialización para respetar el orden defaults→callouts.

**Estimación global de la sección: ~95% de cobertura efectiva.** Al delegar en el FIC clásico —el motor autoritativo y fiel—, **los nueve ítems del checklist 25.4 se cumplen**: literales, variables de contexto, fecha, `@SQL=` (con y sin substitución de contexto), no-sobrescritura de valores explícitos, no-aplicación al cargar registros existentes, "Copy Record" sin recomputar defaults, y orden defaults-antes-de-callouts. No se detectan huecos funcionales materiales. Los únicos matices son de implementación (un camino de respaldo *client-side* para literales simples y para referencias `@ColumnName@`) y de robustez (el payload del FIC es históricamente frágil), que se documentan sin bloquear la sección.

---

## Qué está completamente hecho

| Comportamiento (checklist 25.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Literales (`Y`, `N`, `0`, `DR`) aplicados en registro nuevo** | El FIC los computa y los devuelve en `columnValues`; `useFormInitialState` los escribe en el form (convirtiendo `"Y"`/`""`→boolean). Además hay un respaldo *client-side* que aplica el `defaultValue` literal para campos que el FIC no devolvió (solo si no empieza con `@`). Verificado en DB: 1.637 columnas `Y`/`N`, 200 con `0`, más códigos de estado. |
| **Variables de contexto (`@AD_ORG_ID@`, `@AD_CLIENT_ID@`) desde la sesión** | Resueltas por el FIC vía `Utility.getDefault`/`getContext` (lectura de sesión y `AD_Preference`). El cliente no las interpreta; recibe el valor ya resuelto. DB: 814 `@AD_CLIENT_ID@`, 624 `@AD_ORG_ID@`. |
| **Fecha `@#Date@` resuelve a hoy** | El FIC la resuelve con `setNOWDefault()`; el cliente muestra el valor devuelto. DB: 864 columnas `@#Date@` (+277 `SYSDATE`). |
| **Defaults SQL (`@SQL=...`) se ejecutan** | El FIC ejecuta el query con `getDefaultValueFromSQLExpression` (PreparedStatement) y devuelve el resultado. DB: 203 columnas `@SQL=`. |
| **`@SQL=` con substitución de contexto (`@Parent_ID@`, columnas)** | El cliente envía `PARENT_ID` y el contexto de la sesión/padre; el FIC substituye los `@…@` dentro del SQL (p. ej. `@SQL=SELECT COALESCE(MAX(SeqNo),0)+10 FROM AD_Field WHERE AD_Tab_ID=@AD_Tab_ID@`). Además, antes del `MODE=NEW` el cliente **limpia el contexto de registro de la sesión** (`clearRecordContextFromSession`) para que valores obsoletos no contaminen los defaults SQL. |
| **Los defaults NO sobrescriben valores explícitos durante la creación** | Los defaults se aplican una sola vez en la inicialización; las ediciones del usuario marcan el campo "dirty" y la propagación reactiva de `@ColumnName@` (`useDefaultValueReaction`) **solo actualiza campos no-dirty**, respetando lo que el usuario ya cargó. |
| **Los defaults NO se aplican al cargar registros existentes** | En `MODE=EDIT` (`ROW_ID=recordId`) el FIC devuelve los **valores almacenados**, no defaults; el cliente los usa tal cual. |
| **"Copy Record" no usa defaults (preserva valores de origen)** | El clonado usa el proceso backend `com.smf.jobs.defaults.CloneRecords` (con `copyChildren`), que crea el registro con los valores del origen; luego el form se abre en **`MODE=EDIT`**, por lo que **no se recomputan defaults** (unicidad resuelta server-side por el proceso de clonado). |
| **Orden correcto: defaults antes de callouts** | El FIC computa defaults y luego callouts server-side en orden; en el cliente, durante el `reset` de inicialización se **suprimen los callouts** (`globalCalloutManager.suppress`) y se reanudan al asentar los valores, evitando cascadas prematuras. |

---

## Qué está parcialmente hecho

- **Camino de respaldo *client-side* para literales y referencias `@ColumnName@`.** Además de aplicar lo que devuelve el FIC, el cliente resuelve por su cuenta: (1) el `defaultValue` **literal** para campos que el FIC no devolvió (solo si no empieza con `@`), y (2) las referencias **cruzadas `@ColumnName@`** copiando el valor de campos ya poblados (`useFormInitialState` + `useDefaultValueReaction`). Es un complemento razonable y fiel al comportamiento clásico (propagación entre campos), pero implica una **lógica de defaults duplicada** fuera del FIC que podría divergir si el motor clásico cambia. No es un defecto funcional observable → se documenta como matiz de diseño, **sin tarea**.
- **`@#Date@` y zona horaria.** El checklist pide la fecha "en la zona horaria del usuario". El valor lo fija el FIC (fecha de sesión/servidor), igual que el clásico; la nueva UI mantiene **paridad** con el clásico. No hay divergencia respecto del comportamiento de referencia → se documenta, **sin tarea**.

---

## Qué no está hecho

- **No se identifican huecos funcionales materiales.** Al delegar la evaluación en el FIC clásico y respetar `MODE=NEW`/`EDIT`, la substitución de `PARENT_ID`, la limpieza de contexto de sesión y la supresión de callouts, los nueve ítems del checklist 25.4 quedan cubiertos. El único frente identificado es de **robustez/regresión** (ver Tarea 1), no de funcionalidad ausente.

---

## Resumen de lo que queda por hacer

La sección está **efectivamente completa** porque la nueva UI **reutiliza el motor de defaults del clásico** (FIC) en lugar de reimplementarlo: literales, variables de contexto, fecha, `SYSDATE`, defaults SQL con substitución de `@Parent_ID@`/columnas, no-sobrescritura de valores del usuario, no-aplicación en registros existentes, "Copy Record" sin recomputar y orden defaults→callouts. Es una **decisión de diseño acertada** (máxima fidelidad) y no genera tareas de funcionalidad.

Lo único recomendable es **blindar con pruebas** la construcción del payload del FIC, porque es un punto históricamente frágil: el correcto envío de `MODE`, `PARENT_ID`, el contexto de padre y, sobre todo, `_gridVisibleProperties` (que debe usar el **nombre de propiedad DAL / `hqlName`**, no el nombre de columna) condiciona que el FIC devuelva los defaults correctos. Un error silencioso ahí hace que los defaults SQL o dependientes del contexto "desaparezcan" sin mensaje.

---

## Tareas

### Tarea 1 — Cobertura de regresión para la resolución de defaults vía FIC (payload y contexto)

> **⚠️ Prioridad media-baja.** No corrige un defecto abierto: protege una capacidad ya funcional que depende de un contrato frágil (el payload del FIC). Su objetivo es **prevenir regresiones**, no agregar comportamiento.

**Descripción.** La aplicación de valores por defecto en registros nuevos depende por completo de que el cliente construya correctamente la petición al `FormInitializationComponent`: modo `NEW`, `PARENT_ID`, contexto del registro padre, limpieza previa del contexto de sesión y, en particular, la lista de campos visibles con el **nombre de propiedad correcto**. Un error en ese armado no produce un error visible: los defaults (especialmente los SQL y los dependientes de contexto/padre) simplemente no aparecen. Hoy esta zona no tiene una red de pruebas que garantice que cada pieza del payload se mantiene correcta ante cambios.

**Solución propuesta.** Añadir pruebas automatizadas que verifiquen, para escenarios representativos (pestaña raíz y pestaña hija), que la petición al FIC incluye el modo, el `PARENT_ID`, el contexto del padre y la lista de campos con la nomenclatura esperada; y que, dada una respuesta del FIC, los valores por defecto (literales, de contexto, de fecha y SQL) se apliquen a los campos correctos del formulario sin sobrescribir lo que el usuario ya editó. Debe cubrir también el caso de "Copy Record" (que abre en modo edición y no recomputa defaults) y la limpieza de contexto de sesión antes de un nuevo registro.

**Test cases.**
- Al crear un registro nuevo en una pestaña hija, la petición al FIC lleva `MODE=NEW` y el `PARENT_ID` del padre actual.
- Un default SQL dependiente del padre (p. ej. próximo número de secuencia) devuelve el valor esperado al abrir el nuevo registro.
- Un default de contexto (`@AD_ORG_ID@`/`@AD_CLIENT_ID@`) y uno de fecha (`@#Date@`) se aplican al campo correcto en un registro nuevo.
- Editar un campo y luego crear/propagar defaults no sobrescribe el valor editado por el usuario.
- Abrir un registro existente (o uno clonado vía "Copy Record") no aplica defaults: se muestran los valores almacenados.
- La lista de campos enviada al FIC usa la nomenclatura de propiedad esperada (no nombres de columna) para las propiedades que lo requieren.

**Resultado.** La resolución de valores por defecto queda protegida frente a regresiones en el contrato con el FIC, evitando fallos silenciosos donde los defaults dejan de aplicarse sin mensaje de error.

---

> **Nota sobre el entorno representativo (`etendodev`).** 5.245 columnas tienen `defaultvalue` no vacío. Distribución: 1.637 literales `Y`/`N`, 864 `@#Date@`, 814 `@AD_CLIENT_ID@`, 624 `@AD_ORG_ID@`, 319 otros literales, 307 otras variables de contexto `@…@`, 277 `SYSDATE`, 203 `@SQL=` y 200 literales `0`. Los `@SQL=` con substitución de contexto son reales y frecuentes (p. ej. `@SQL=SELECT COALESCE(MAX(SeqNo),0)+10 FROM AD_Field WHERE AD_Tab_ID=@AD_Tab_ID@`, `@SQL=SELECT C_CURRENCY_ID FROM AD_CLIENT WHERE AD_CLIENT_ID=@AD_CLIENT_ID@`), lo que confirma que el camino delegado al FIC (que substituye esos parámetros y ejecuta el query) es el mecanismo correcto y en uso.

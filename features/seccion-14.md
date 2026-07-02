# Sección 14 — Reports (Standalone Menu Access)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 14. Cubre los reportes accesibles **desde el menú de la aplicación** (no como botón de proceso dentro de una ventana), en sus dos categorías: **14.1** reportes `ad_process` (`isreport = Y` y/o `isjasper = Y`, framework clásico de servlet HTML) y **14.2** reportes `obuiapp_process` con `uipattern = 'OBUIAPP_Report'` (popup moderno + motor Jasper).

> **Clave de arquitectura:** el `MenuBuilder` del adapter (`com.etendoerp.metadata`) emite por cada entrada de menú su `type` (MenuEntryType clásico), más `processId` / `processDefinitionId`, `isReport`, `isModalProcess` y `processUrl`. El tipo lo asigna el `GlobalMenu` clásico: un `ad_process` con UIPattern *Standard* → `Process`; con `isreport`/`isjasper` → **`Report`**; manual → `ProcessManual`; un `obuiapp_process` → `ProcessDefinition`. En el cliente, `resolveMenuClickIntent` (`menuItemDispatch.ts`) + el `handleClick` del `Sidebar` despachan: `ProcessDefinition` y `Process` abren el **`ProcessDefinitionModal` nativo**; `Report` y `ProcessManual` **abren Etendo Classic en un popup (si es modal) o pestaña nueva** vía `buildEtendoClassicBookmarkUrl` (kiosk mode, token propagado). Es decir, **14.1 se resuelve por delegación al clásico** y **14.2 se resuelve nativamente** en la nueva UI.

**Estimación global de la sección: ~85% de cobertura efectiva.** Ambas categorías de reporte son **accesibles y funcionales** desde el menú. Los reportes clásicos (14.1, 52 entradas en el menú de `etendodev`) se abren delegando al servlet clásico —lo cual la propia fuente de verdad admite ("*classic HTML or modern depending on `uipattern`*")— por lo que se consideran **hechos por delegación**, no como render nativo. Los reportes Process Definition (14.2, 11 entradas) se renderizan nativamente con todos sus parámetros, defaults, lógica de display y validación de obligatorios, y su salida (PDF/Excel) se entrega mediante las acciones `OBUIAPP_browseReport` / `OBUIAPP_downloadReport`. El hueco principal está en **14.2: la selección del formato de salida** (PDF vs Excel vs HTML) que el popup clásico ofrece en su pie, y que el modal nativo hoy no reproduce.

---

## Qué está completamente hecho

| Comportamiento (checklist 14.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **14.1/14.2 El reporte aparece en el menú bajo su carpeta** | `MenuBuilder.toJSON` construye el árbol completo (jerarquía `children`), con `processId`/`processDefinitionId`, `isReport`, `isModalProcess` y `processUrl` por entrada. |
| **14.1 Click en la entrada de reporte lo abre** | `handleClick` del `Sidebar`: para `type = Report`/`ProcessManual` construye la URL clásica (`buildEtendoClassicBookmarkUrl`, kiosk + token) y abre popup (reportes siempre `isModalProcess = true`) o pestaña. |
| **14.1 Formulario de parámetros + salida (HTML/PDF/Excel) + acceso por organización + mensaje de resultado vacío** | Resueltos por el **framework de servlet clásico** al que se delega; la fuente de verdad admite explícitamente el render "classic HTML" para esta categoría. |
| **14.1 Popup bloqueado por el navegador** | `notifyReportPopupBlocked` ofrece una acción de apertura manual como fallback. |
| **14.2 Click en la entrada abre el popup de parámetros moderno** | `resolveMenuClickIntent` → `PROCESS_DEFINITION` → `openProcessModal` (`ProcessDefinitionModal`), hidratando la metadata vía `meta/process`. |
| **14.2 El popup renderiza todos los parámetros definidos en el AD** | El modal renderiza los parámetros desde la metadata (todas las referencias vía la maquinaria de la Sección 2), con selectores, listas y referencias de ventana. |
| **14.2 Formularios complejos (20–35 params) con scroll** | El contenido del modal usa `overflow-auto` con alto máximo (`max-h-[90vh]`); ej. verificados en DB: General Ledger Advanced (23), Journal Entries (28), Balance Sheet & P&L (35). |
| **14.2 Valores por defecto poblados (org/período actual, etc.)** | Provienen del FIC / handler del reporte en el backend; el cliente los aplica al formulario. |
| **14.2 El reporte genera salida tras enviar los parámetros** | `handleExecute` → `handleDirectJavaProcessExecute` → `executeJavaProcess` postea al kernel del handler del reporte (p.ej. `BaseReportActionHandler`, handlers financieros); las `responseActions` devueltas se despachan. |
| **14.2 Descarga / apertura del archivo del reporte** | Acciones `OBUIAPP_browseReport` / `OBUIAPP_downloadReport` → `reportActions.ts` obtiene el blob con Bearer token y lo abre en pestaña nueva (`browseReport`) o lo descarga (`downloadReport`, con `Content-Disposition`). |
| **14.2 Acceso por organización / cliente y formato de números y fechas en la salida** | Enforced/format­eados por el backend (handler del reporte + motor Jasper), respetando el locale del usuario. |

---

## Qué está parcialmente hecho

- **14.2 Selección del formato de salida (PDF / Excel / HTML).** El popup clásico de un `OBUIAPP_Report` ofrece la elección de formato en su pie (no como parámetro: se verificó en DB que estos reportes **no** tienen parámetro de formato). El modal nativo muestra un único botón *Execute* y entrega el formato que el handler devuelva por defecto (típicamente PDF vía la acción browse/download). No hay control para elegir otro formato en el momento de ejecutar. → **Tarea 1**.
- **14.2 Reportes muy grandes sin timeout.** La ruta de ejecución del reporte Process Definition (`executeJavaProcess`) es un único `fetch` sin límite/poll explícito, a diferencia de la ruta de *report-and-process* (que sí tiene poll con deadline de 10 min). Para reportes con muchas filas conviene confirmar que no se corta por timeout de la petición. → **Tarea 2** (verificación + endurecimiento).

---

## Qué no está hecho

- No hay render **nativo** del formulario/salida para los reportes clásicos `ad_process` (14.1): se resuelve por **delegación** al clásico. Se documenta como decisión de diseño, no como defecto, dado que la fuente de verdad admite el render "classic HTML" y es el mismo patrón usado para `ProcessManual`. **No se genera tarea** salvo que el proyecto decida que estos reportes deben migrarse a render nativo.

---

## Resumen de lo que queda por hacer

La sección está **funcionalmente completa** para acceder y ejecutar ambas categorías de reporte desde el menú. Lo pendiente es acotado y se concentra en 14.2:

1. **(Tarea 1)** Permitir elegir el formato de salida (PDF/Excel/HTML) al ejecutar un reporte Process Definition, replicando la elección que el popup clásico ofrece.
2. **(Tarea 2)** Verificar y endurecer la ejecución de reportes muy grandes para que no se corten por timeout de la petición HTTP.

No se identifican huecos en la presencia de los reportes en el menú, el render de parámetros, los defaults, ni la entrega del archivo de salida.

---

## Tareas

### Tarea 1 — Selección de formato de salida en reportes Process Definition

> **⚠️ Verificar antes de tomar la tarea.** Es posible que esta funcionalidad ya esté resuelta en una tarea/PR **aún no mergeada** a la rama analizada. Antes de iniciar el trabajo, confirmar el estado real: revisar ramas/PRs abiertos relacionados con el formato de salida de reportes y comprobar sobre la base ya integrada si el modal nativo de `OBUIAPP_Report` ofrece la elección de formato (PDF/Excel/HTML). Si ya está mergeada, esta tarea se cierra sin cambios; si no, proceder según lo descrito abajo.

**Descripción.** Los reportes `OBUIAPP_Report` (14.2) se ejecutan hoy con un único botón *Execute* y devuelven un único formato (por defecto, típicamente PDF). El popup clásico permite al usuario elegir el formato de salida (p.ej. PDF, Excel, HTML) en el pie del reporte. Falta esa capacidad de elección en el modal nativo.

**Solución propuesta.** Ofrecer en el pie del modal de reporte las opciones de formato soportadas y propagar la elección del usuario a la ejecución del handler del reporte, de modo que la acción de descarga/visualización entregue el archivo en el formato pedido. La elección debe presentarse solo para procesos de tipo reporte y respetar los formatos que el backend efectivamente soporta.

**Test cases.**
- Ejecutar un reporte 14.2 eligiendo PDF genera y entrega un PDF.
- Ejecutar el mismo reporte eligiendo Excel entrega un archivo Excel descargable.
- Un reporte que solo soporta un formato no muestra opciones redundantes y funciona como hoy.
- El formato elegido se envía correctamente al handler del backend (verificable en la petición).

**Resultado.** El usuario puede elegir el formato de salida de un reporte Process Definition desde la nueva UI, con paridad respecto del popup clásico.

---

### Tarea 2 — Robustez de reportes grandes (evitar timeout de ejecución)

**Descripción.** La ejecución de un reporte Process Definition se realiza con una única petición al handler; para reportes con muchas filas existe el riesgo de que la petición supere el tiempo máximo y falle sin un mensaje claro, a diferencia de la ruta *report-and-process* que ya usa sondeo con deadline.

**Solución propuesta.** Verificar el comportamiento real con reportes voluminosos y, de confirmarse el riesgo, alinear la ejecución de reportes con un mecanismo tolerante a ejecuciones largas (indicador de progreso y espera controlada), con un mensaje explícito de timeout si se alcanza el límite.

**Test cases.**
- Un reporte con un conjunto de datos grande completa y entrega su salida sin error de red.
- Durante una ejecución larga se muestra un indicador de progreso y el modal no queda en un estado ambiguo.
- Si se alcanza el límite de tiempo, se muestra un mensaje de timeout comprensible en lugar de un fallo silencioso.

**Resultado.** Los reportes grandes se ejecutan de forma confiable o, en su defecto, informan claramente el timeout, sin degradar la experiencia de los reportes rápidos.

# Sección 3 — Process Types

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 3. Etendo tiene **dos entidades de proceso**: **Report and Process** (`ad_process`, legacy) y **Process Definition** (`obuiapp_process`, moderno), cada una con varios *UI Patterns*.

> El ruteo de procesos en el cliente está centralizado:
> - **Desde menú** (`Sidebar.handleClick` + `resolveMenuClickIntent`): Process Definition y Report and Process → `ProcessDefinitionModal`; Pick and Execute → mismo modal en modo P&E; ProcessManual/Report clásicos → popup de Etendo Classic (kiosk).
> - **Desde un botón de ventana** (`hooks/Toolbar/useProcessExecution`): si es Process Definition (`em_obuiapp_process_id`) → `ProcessDefinitionModal`; si es columna botón legacy → pipeline de iframe (`resolveLegacyProcessData`, ver Sección 1).
> - **Ejecución**: P&E/Window-Reference → `handleWindowReferenceExecute`; Java handler directo (`javaClassName`, sin onProcess) → `handleDirectJavaProcessExecute`; JS migrado → `em_etmeta_onprocess`; R&P Standard → endpoint `process-execution` con polling de `pInstance`.

**Estimación global de la sección: ~95% de cobertura efectiva.** Lo único pendiente con impacto real es completar la migración de los Process Definition *Manual* (JavaScript clásico): el mecanismo existe y 8/24 ya están migrados; quedan 16.

---

## Qué está completamente hecho

| Tipo | UI Pattern | Implementación en la nueva UI |
|------|-----------|-------------------------------|
| **3.A.1 R&P Standard** | `S` | Popup de parámetros (`ProcessDefinitionModal`, modo `report-and-process`) + ejecución vía endpoint `com.etendoerp.metadata.meta/process-execution` (crea `pInstance` y hace polling del estado, con mensaje success/warning/error). Validación de obligatorios al hacer clic (paridad clásica). |
| **3.A.2.a/c R&P Manual (Report / Action)** | `M` | Delegados a Etendo Classic: desde menú abren popup clásico (kiosk mode); desde botón de ventana se renderizan en iframe (`LegacyProcessResolver` + pipeline documentado en Sección 1 y `docs/process/legacy/manual-processes.md`). |
| **3.A.4 R&P Jasper** | `S`+`isjasper` | Print Requisition / Customer Statement se imprimen vía el flujo de report/print clásico (popup). Solo 2 procesos en la instancia. |
| **3.B.1 PD Action** | `A` | `handleDirectJavaProcessExecute` invoca el `ActionHandler` Java con el contexto del registro; procesa `responseActions` (mensaje, refreshGrid, openDirectTab, etc.). Soporta sin parámetros (ejecución directa) y con popup de parámetros. |
| **3.B.3 PD Standard / Params in Dictionary** | `OBUIAPP_PickAndExecute` | Tipo más común. Popup de parámetros desde metadata AD + ejecución por `ActionHandler`. Incluye grilla(s) Window Reference, edición inline, selección y validación (ver Sección 1.4 y `docs/process/pickAndExecute/README.md`). |
| **3.B.4 PD Report (JR Templates)** | `OBUIAPP_Report` | Popup moderno de parámetros + salida Jasper mediante las response actions `OBUIAPP_browseReport` / `OBUIAPP_downloadReport` (`fetchAndBrowseReport` / `fetchAndDownloadReport`), que abren o descargan el PDF/Excel generado. |
| **3.B.5 PD RX Action** | `ETRX_RxAction` | Comparte el camino de ejecución Java directa (`javaClassName` → `handleDirectJavaProcessExecute`); la delegación a EtendoRX ocurre server-side. 1 solo proceso (ExampleProcess). |
| **3.A.2.b R&P Background** | `M`+`isbackground` | Configuración y monitoreo se hacen a través de ventanas AD estándar: **Process Scheduling** (`ADProcessScheduling`), **Process Monitor** (`ProcessExecution`), **Process Request** (`ProcessRequest`) y **Async Process Log**, todas de tipo Maintain/Query. La nueva UI las renderiza con el motor genérico de ventanas (Sección 1). El clásico tampoco tiene un monitor *push* en tiempo real: son las mismas ventanas que se refrescan manualmente. Sin gap. |
| **3.C.1 Document Action Processes** | — | Acciones de documento (Complete/Void/Close/Post…) cubiertas en la Sección 1 (Transaction): combo de acciones + procesos legacy/PD según el caso. |

**Mecanismo de PD Manual:** la nueva UI ya soporta ejecutar la lógica cliente migrada vía `em_etmeta_onprocess` (`executeStringFunction`). **8 de 24** procesos `M` ya están migrados (Picking List y Packing).

---

## Qué está parcialmente hecho

- **3.B.2 Process Definition — Manual (`uipattern = M`):** el `classname` apunta a una función JavaScript clásica de SmartClient (p. ej. `OB.OBWPL.Process.assign`, `OB.AEATSII.send`) que no existe en la nueva UI. El **mecanismo de migración existe** (`em_etmeta_onprocess`), pero solo **8/24** están migrados. Los **16 restantes** no se ejecutan nativamente → **Tarea 1**. Distribución por impacto:
  - *Core:* Open Close Periods (2 botones), UpdateInvariants (1), Recalculate Role Permissions.
  - *Spain SII* (localización fiscal española): 8 procesos (SII Invoice/Cash Receipt/Payment Sender, Modification, etc.).
  - *Etendo RX / OpenAPI / Picking List:* GetMiddlewareToken, Get Token, ApproveGoogleDoc, Open Swagger, Picking List Movement Line Reject/Complete.

---

## Qué no está hecho

- **3.A.3 R&P Pick and Execute (`uipattern = OBUIAPP_PickAndExecute`):** **intencionalmente no implementado**. No hay ningún `ad_process` que use este patrón en la instancia (0 registros). Al abrir uno, el modal muestra un toast de advertencia (`process.pickAndExecuteNotImplemented`) y se cierra, para evitar un render roto. La forma soportada es la moderna (`obuiapp_process`). **Impacto nulo** — no se crea tarea.

---

## Resumen de lo que queda por hacer

Prácticamente toda la sección está cubierta. Los dos patrones de proceso y la mayoría de sus *UI Patterns* funcionan (Standard, Manual clásico vía iframe/popup, P&E, Action, PD Report con salida Jasper, RX Action y acciones de documento). El **único trabajo pendiente con impacto real** es completar la migración de los **16 Process Definition Manual** que aún apuntan a JavaScript clásico (**Tarea 1**), priorizando los de Core. El patrón R&P Pick and Execute no aplica (sin uso) y la configuración/monitoreo de background se cubre con las ventanas estándar (renderizadas genéricamente).

---

## Tareas

### Tarea 1 — Migrar los Process Definition Manual (JS clásico) restantes

**Descripción:** 16 de 24 procesos `Process Definition` con `uipattern = M` aún referencian funciones JavaScript de SmartClient clásico (`classname`, p. ej. `OB.AEATSII.send`) que no existen en la nueva UI; al ejecutarlos el modal no realiza la acción esperada. El mecanismo para correr la lógica cliente migrada ya existe (`em_etmeta_onprocess`) y 8 procesos ya lo usan.

**Solución propuesta:** trasladar la lógica de cada función JS clásica al hook de proceso migrado de la nueva UI (mismo enfoque ya aplicado a Picking List/Packing), respetando el comportamiento original (popups, llamadas AJAX, mensajes, refresco). Priorizar los de Core (Open Close Periods, UpdateInvariants, Recalculate Role Permissions) y luego los módulos según necesidad de negocio (Spain SII, Etendo RX, OpenAPI). Para procesos que solo abren una página externa (Open Swagger, Get Token) basta una acción de apertura/redirección equivalente.

**Test cases:**
- Cada proceso migrado, invocado desde su botón, ejecuta su lógica y muestra el mismo feedback que el clásico.
- Los procesos que abren popups/diálogos los muestran correctamente; sin errores de consola.
- Las llamadas al servidor (cuando existan) tienen éxito y manejan errores con mensaje amigable.
- Tras la ejecución, la grilla/formulario padre se refresca cuando corresponde.
- Funciona tanto en vista grid como en formulario, con el contexto correcto (registro, tab, ventana).

**Resultado:** los 24 Process Definition Manual se ejecutan nativamente en la nueva UI, eliminando la dependencia del JavaScript clásico y cerrando la sección al 100%.

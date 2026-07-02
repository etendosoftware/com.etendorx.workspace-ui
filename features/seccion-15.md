# Sección 15 — Loading Indicators and Feedback

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 15. Cubre dos checklists: los **indicadores de carga** que deben aparecer durante operaciones asíncronas (14 escenarios) y los **mensajes de feedback** (éxito/error/warning/info y su comportamiento de presentación).

> **Clave de arquitectura:** el clásico usa el manejo de estado de carga de SmartClient (`fetchingData` con `fetchDelay` de 500 ms) más el `OBMessageBar`. La nueva UI reemplaza esto por: (1) un **spinner global** (`GlobalLoading` + `loadingStore` de Zustand, montado en `layout.tsx`), (2) **indicadores locales** por componente (spinner en el botón de login, overlay de formulario, barra de progreso de la grilla vía Material React Table, spinners en dropdowns de selector, overlay del modal de proceso, spinner de `Window`), y (3) un sistema de **feedback por toasts** (`sonner`, montado globalmente en `layout.tsx`) con variantes success/error/warning/info, más el **`ProcessMessageBar`** in-modal para mensajes de proceso. El `useStatusModal` (antes modal) hoy es un wrapper delgado sobre `toast`.

**Estimación global de la sección: ~90% de cobertura efectiva.** Los mensajes de feedback están **completos** (las 4 severidades, auto-dismiss + botón de cierre, posición fija, sin apilamiento descontrolado). Los indicadores de carga cubren **la gran mayoría** de los escenarios del checklist. Los huecos son acotados: la **exportación a CSV/Excel** no muestra indicador mientras el servidor prepara el archivo, y el **logout** no muestra indicador mientras se invalida la sesión.

---

## Qué está completamente hecho

### Indicadores de carga

| Escenario (checklist) | Implementación en la nueva UI |
|-----------------------|-------------------------------|
| **Login / autenticación** | `Login.tsx` muestra un `Spinner` dentro del botón y lo deshabilita mientras `isLoading` (validación de credenciales). |
| **Carga del shell de la aplicación** | `useMenu.fetchMenu` invoca `showLoading()/hideLoading()` del `loadingStore` → `GlobalLoading` muestra el overlay a pantalla completa mientras se obtiene el menú; además `app/loading.tsx` (Suspense de Next). |
| **Apertura de ventana** | `Window.tsx` renderiza `<Loading />` mientras `isWindowLoading(windowId)`, no hay metadata, hay transición o `isRecoveryLoading`. |
| **Carga de datos de grilla (paginación/filtro/orden)** | La grilla (Material React Table) recibe `state.isLoading` y `state.showProgressBars` ligados a `loading`; además la grilla baja su opacidad (`opacity-60 cursor-progress`). |
| **Cambio de pestaña (datos de tab hijo)** | Al cambiar a un tab hijo, su grilla se re-consulta y muestra el mismo indicador de carga de grilla (barra de progreso + opacidad). |
| **Carga de vista de formulario** | `FormFieldsContent` muestra un `Spinner` en la primera carga (`loading && !hasLoadedOnce`); refrescos posteriores actualizan campos en silencio. El `<form>` baja opacidad y pone `cursor-progress` mientras `loading`. |
| **Guardado de registro** | `FormActions.handleSave` marca `saveButtonState.isSaving` (deshabilita el botón Guardar) + overlay del formulario (`useFormAction.loading`) + toast de éxito al finalizar. |
| **Dropdown de selector (typeahead)** | Los selectores TableDir / Select / MultiSelect propagan `loading` al desplegable y muestran indicador mientras se obtienen resultados (incluye debounce). |
| **Ejecución de proceso** | `ProcessDefinitionModal` muestra un overlay `<Loading />` sobre el contenido mientras `loading`/`initializationLoading`, aplica `animate-pulse cursor-progress` durante `isPending`, y el botón de acción refleja su estado. |
| **Generación de reporte (PDF/Excel)** | Reportes 14.2 nativos: el overlay del modal de proceso cubre la ejecución; la ruta *report-and-process* sondea el estado con deadline. Reportes 14.1 clásicos: el indicador lo aporta el servlet clásico al que se delega (ver Sección 14). |
| **Callout (indicador sutil)** | El `globalCalloutManager` emite `calloutStart/calloutEnd`; `ToolbarContext` los traduce a `saveButtonState.isCalloutLoading`, que actúa como indicador sutil (el guardado espera a que terminen los callouts vía `waitForIdle`). Los errores de callout muestran `toast.error`. |
| **Borrado de registro** | `useDeleteRecord` maneja estado `loading`; al completar, la grilla se re-consulta (indicador de grilla) y se emite toast de éxito/error. |

### Mensajes de feedback

| Requisito (checklist) | Implementación |
|-----------------------|----------------|
| **Éxito en guardar / borrar / completar proceso** | `useStatusModal.showSuccessModal` → `toast.success`; procesos vía `useToolbarConfig` (`process.completedSuccessfully`) y el dispatcher de acciones de proceso. |
| **Error en validación / servidor / red** | `toast.error` ampliamente usado (callouts, toolbar, procesos, subida de imágenes, login, etc.); `useStatusModal.showErrorModal`. |
| **Warning en incidencias no bloqueantes** | `toast.warning` (p. ej. resultado de proceso no-éxito, warnings de callout, popup bloqueado). |
| **Info en resultados informativos** | `toast.info`; el dispatcher elige la severidad según `msgType` del backend. |
| **Auto-dismiss o botón de cierre** | `sonner` auto-cierra (~4 s por defecto; los resultados de proceso se hacen persistentes con `duration: Infinity`) **y** expone `closeButton`. |
| **Sin solapamiento / apilamiento descontrolado** | `sonner` colapsa/limita los toasts visibles por defecto; posición única `bottom-right`. |
| **Visibles sin importar el scroll (fijo/sticky)** | El `Toaster` de `sonner` se posiciona de forma fija (`bottom-right`), independiente del scroll. |
| **Barra de mensajes in-modal (equivalente OBMessageBar) para procesos** | `ProcessMessageBar` soporta las 4 severidades (info/success/warning/error) con ícono, color y botón de cierre, alimentado por `messageBarStore` (`view.messageBar`). |

---

## Qué está parcialmente hecho

- **Exportación a CSV/Excel sin indicador de carga.** `handleExportCSV` (`Tab.tsx`) hace `await` de la petición al datasource y descarga el archivo, pero **no muestra ningún indicador** mientras el servidor prepara los datos; solo emite un toast/error si falla. Para exportaciones grandes el usuario no tiene feedback de que la operación está en curso. → **Tarea 1**.
- **Logout sin indicador de carga.** `handleSignOff` (`UserProfile.tsx`) hace `await logout()` (que limpia sesión, invalida token y redirige) **sin** spinner ni deshabilitar el botón durante el proceso. El clásico muestra un indicador mientras se invalida la sesión y se cierran las pestañas. → **Tarea 2**.

---

## Qué no está hecho

- No se identifican escenarios del checklist **sin ninguna** cobertura: todos los indicadores y mensajes existen salvo los dos casos parciales anteriores (exportación y logout), que sí tienen la funcionalidad pero **carecen del indicador de carga**.

---

## Resumen de lo que queda por hacer

La sección está **funcionalmente completa** en feedback (toasts + message bar) e indicadores de carga para los flujos principales (login, shell, ventana, grilla, formulario, guardado, borrado, selectores, callout, proceso, reporte). Lo pendiente es acotado:

1. **(Tarea 1)** Mostrar un indicador de carga durante la exportación a CSV/Excel mientras el servidor prepara el archivo.
2. **(Tarea 2)** Mostrar un indicador de carga durante el logout mientras se invalida la sesión y se redirige.

---

## Tareas

### Tarea 1 — Indicador de carga durante la exportación a CSV/Excel

**Descripción.** La acción de exportar la grilla a CSV/Excel realiza una petición asíncrona al servidor y descarga el archivo, pero no ofrece retroalimentación visual mientras la operación está en curso. En exportaciones con muchos registros el usuario no percibe que el sistema está trabajando y puede reintentar o creer que la acción falló.

**Solución propuesta.** Reflejar el estado "en progreso" de la exportación en la UI mientras dura la petición: por ejemplo, deshabilitar/animar el disparador de exportación y/o mostrar el indicador de carga existente, y ocultarlo al completar o al fallar. La solución debe reutilizar los mecanismos de indicador ya presentes en la aplicación para mantener consistencia visual.

**Test cases.**
- Al iniciar una exportación se muestra un indicador de carga y el disparador queda en estado ocupado.
- Al completar la descarga el indicador desaparece y el archivo se entrega.
- Si la exportación falla, el indicador desaparece y se muestra el mensaje de error correspondiente.
- Una exportación pequeña y rápida no deja el indicador "colgado".

**Resultado.** El usuario recibe feedback claro mientras se prepara y descarga el archivo exportado, alineado con el resto de indicadores de carga de la aplicación.

---

### Tarea 2 — Indicador de carga durante el cierre de sesión (logout)

**Descripción.** El logout invalida la sesión, limpia el token y redirige, pero no muestra indicador ni bloquea el control disparador mientras el proceso ocurre. En redes lentas el usuario podría pulsar varias veces o no percibir que la sesión se está cerrando.

**Solución propuesta.** Presentar un indicador de carga (global o local al control de logout) mientras se ejecuta el cierre de sesión, evitando múltiples disparos, hasta que se complete la invalidación y la redirección. Debe reutilizar el indicador global existente o el patrón de estado ocupado ya usado en otros controles.

**Test cases.**
- Al pulsar cerrar sesión se muestra un indicador y el control no admite nuevos clics.
- Tras invalidar la sesión, la aplicación redirige al login sin estados ambiguos.
- Si el cierre de sesión falla, se informa el error y la UI vuelve a un estado consistente.

**Resultado.** El cierre de sesión ofrece feedback visual durante la invalidación de la sesión, con paridad respecto del comportamiento del clásico.

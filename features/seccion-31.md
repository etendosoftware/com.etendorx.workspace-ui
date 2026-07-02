# Sección 31 — Data Import System

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 31. Cubre el **sistema de importación de datos**: el buffer `c_import_entry`, la ventana **Data Import Entries** (para ver/gestionar entradas de importación, con filtro por defecto `importStatus='Initial' or 'Error'`), el **Import Format** (mapeo de campos), el form **Import/Export Translations** (importación de traducciones .xml/.csv), los estados Initial/Error/Processed y la validación (tipos de dato, obligatorios, FK) y el procesamiento por lotes.

> **Clave de arquitectura:** el grueso de esta sección es **backend puro** y **no es responsabilidad de la UI**. La recepción, validación (tipos de dato, campos obligatorios, referencias FK), transformación e inserción/actualización, así como el **procesamiento por lotes sin timeout**, los ejecuta el servidor (`ImportEntryManager`, proceso background) — la UI nunca los realiza, ni en el clásico ni en la nueva. Del lado de la interfaz, el sistema se compone de: (1) **Data Import Entries** y **Data Import Entry Archive**, que son **ventanas estándar de AD** (`action=W`, windowType=M, activas, en el menú) sobre `c_import_entry` — es decir, **no requieren código específico de importación**: las renderiza el **motor genérico de ventanas** de la nueva UI igual que cualquier otra ventana de mantenimiento; y (2) **Import/Export Translations**, que es un **form legacy especial** (`action=X`, `ad_form` 800014, servlet Java HTML `org.openbravo.erpCommon.ad_forms.Translation`), sin contraparte metadata-driven. **No hay componente del adapter (`com.etendoerp.metadata`) específico de importación.** Por tanto, la completitud de §31 en la UI se reduce a: ¿se abre la ventana estándar Data Import Entries?, ¿aplica su filtro por defecto?, ¿existe acceso al form de traducciones?

**Estimación global de la sección: ~65% de cobertura efectiva.** La gestión visual de entradas de importación (ver estados, errores, tipo de dato, contexto cliente/organización, filtrar y ordenar) queda cubierta **de forma gratuita por el motor genérico de ventanas** — no hay nada específico de importación que construir para ello. Los huecos son dos y acotados: (1) el **filtro por defecto Initial/Error** al abrir la ventana no está en metadata (es inyección client-side del clásico) → probablemente la nueva UI muestre todos los estados por defecto → **Tarea 1**; y (2) el **form Import/Export Translations** (legacy `X`) no tiene ruta de render en la nueva UI → **Tarea 2**. El resto (validación de datos, batch, reprocesamiento) es servidor/background y no constituye hueco de cliente. **Import Format** no existe en el entorno representativo, por lo que queda fuera de alcance.

---

## Qué está completamente hecho

Cubierto por el **motor genérico de ventanas** (no por código específico de importación), asumiendo la ventana accesible por rol:

| Ítem del checklist 31.4 | Cómo queda cubierto |
|--------------------------|---------------------|
| **Entradas de importación visibles en Data Import Entries** | Es una ventana estándar de AD (tab "Import Entries" sobre `c_import_entry`); el motor genérico la lista como cualquier ventana de mantenimiento, con sus columnas (Import Status, Type of Data, Imported, Creation Date, etc.). |
| **Detalle de error accesible para importaciones fallidas** | Los campos `Error Info`, `Response Info` y `JSON Info` son columnas/campos estándar del tab; se ven en grilla y formulario sin tratamiento especial. |
| **Respeta contexto de organización y cliente** | El filtrado por cliente/organización es transversal a todas las ventanas de la nueva UI (no específico de importación). Los campos Organization, Client y Role del tab se muestran normalmente. |
| **Ordenar/filtrar entradas** (soporte general) | Filtro y orden genéricos de la grilla aplican a todas las columnas (incluida Import Status), como en cualquier ventana. |

> Nota: estos ítems NO requieren desarrollo específico de §31; se satisfacen porque Data Import Entries es una ventana estándar y la nueva UI ya sabe renderizar ventanas estándar.

---

## Qué está parcialmente hecho

- **Filtro por defecto Initial/Error al abrir la ventana.** El checklist pide que Data Import Entries muestre por defecto solo entradas en estado `Initial` y `Error` (ocultando `Processed`). Este filtro **no está definido en metadata** (el tab no tiene `whereclause` ni `filterclause`, ni hay configuración de grilla asociada): en el clásico es un **filtro por defecto inyectado client-side**. Por tanto, la nueva UI abre la ventana **sin ese criterio** y muestra todos los estados. La ventana funciona, pero no replica el filtro por defecto → **Tarea 1**.

---

## Qué no está hecho

- **Form Import/Export Translations.** Es un **form legacy especial** (`action=X`, `ad_form` 800014, servlet Java que genera HTML), no una ventana metadata-driven. La nueva UI **no tiene ruta de render para forms legacy `X`**, por lo que la carga/descarga de archivos de traducción (.xml/.csv) desde este form **no está disponible**. → **Tarea 2**.
- **Reprocesar entradas fallidas como acción de un clic en la UI.** La ventana Data Import Entries **no tiene botón de proceso** en el core (el tab no define ningún `ad_process`). El reprocesamiento lo realiza el **proceso background** (`ImportEntryManager`) y/o el proceso de menú "Direct Process Import Entries". No es una acción de UI de esta ventana ni en el clásico → no es un hueco de cliente propiamente dicho (ver resumen).

---

## Fuera de alcance / responsabilidad del servidor (no son huecos de cliente)

- **Validación de tipos de dato, campos obligatorios y referencias FK antes de insertar.** 100% servidor (`ImportEntryManager` / procesador de entidades). La UI no valida importaciones.
- **Procesamiento por lotes sin timeout.** 100% servidor/background.
- **Import Format (mapeo de campos).** **No existe** en el entorno representativo (`etendodev`): no hay tabla ni ventana "Import Format". Queda fuera de alcance para este entorno; no puede evaluarse como hueco.

---

## Resumen de lo que queda por hacer

La parte de UI del sistema de importación se apoya casi por completo en el **motor genérico de ventanas**: como **Data Import Entries** es una ventana estándar de AD, ver y gestionar entradas (estados, errores, tipo de dato, filtrar/ordenar, contexto cliente/organización) queda cubierto sin desarrollo específico. Todo lo pesado (validación de datos, transformación, inserción, batch, reprocesamiento) es **servidor/background** y no compete a la interfaz.

Quedan dos frentes acotados: (1) **replicar el filtro por defecto Initial/Error** al abrir la ventana, hoy ausente porque en el clásico es client-side y no vive en metadata; y (2) **dar acceso al form Import/Export Translations**, un form legacy `X` sin ruta de render en la nueva UI (a resolver por delegación al clásico o reimplementación). **Import Format** no está presente en el entorno representativo, por lo que no genera tarea.

---

## Tareas

### Tarea 1 — Filtro por defecto Initial/Error en Data Import Entries

**Descripción.** Al abrir la ventana Data Import Entries, el clásico aplica un filtro por defecto que muestra solo las entradas en estado `Initial` y `Error` (ocultando las `Processed`), para que el usuario vea de inmediato lo pendiente y lo fallido. Ese filtro no está definido en la metadata de la ventana (no hay whereclause/filterclause ni configuración de grilla), sino que en el clásico se inyecta del lado del cliente. La nueva UI, al no disponer de él, abre la ventana mostrando todos los estados.

**Solución propuesta.** Proveer, para esta ventana, un criterio de filtro inicial por defecto sobre la columna Import Status equivalente a "Initial o Error", aplicado al abrir y editable/removible por el usuario como cualquier filtro. La idea general es contar con un mecanismo por el que ciertas ventanas puedan declarar un filtro por defecto (por configuración/metadata o registro específico), de modo que Data Import Entries lo use sin hardcodear lógica de negocio en la interfaz. No involucra al servidor ni al adapter.

**Test cases.**
- Al abrir Data Import Entries por primera vez, la grilla muestra solo entradas en estado Initial o Error.
- Las entradas en estado Processed no aparecen bajo el filtro por defecto.
- El usuario puede quitar o modificar el filtro por defecto y ver todos los estados; al reabrir la ventana, el filtro por defecto vuelve a aplicarse (comportamiento consistente con el clásico).
- El resto de filtros y el orden siguen funcionando en combinación con el filtro por defecto.

**Resultado.** Data Import Entries se abre mostrando por defecto únicamente las entradas pendientes y fallidas, con paridad respecto del clásico, y el usuario puede ampliar el criterio cuando lo necesite.

### Tarea 2 — Acceso al form Import/Export Translations

**Descripción.** La importación/exportación de traducciones (archivos .xml/.csv de idiomas) se realiza en el clásico mediante un form especial (legacy, tipo `X`), que no es una ventana metadata-driven. La nueva UI no tiene forma de mostrar forms legacy de este tipo, por lo que esta funcionalidad de administración de traducciones no está disponible desde la nueva interfaz.

**Solución propuesta.** Habilitar el acceso al form de traducciones desde la nueva UI. La vía de menor riesgo y esfuerzo es **delegar en el form clásico** embebiéndolo (por ejemplo, en un contenedor/iframe con la sesión propagada), de forma análoga a como ya se delega otra funcionalidad legacy hacia el clásico; así se reutiliza la implementación existente sin reescribir la lógica de importación de traducciones. Alternativamente, y con mucho mayor esfuerzo, reimplementarlo nativamente; se recomienda la delegación salvo que producto pida lo contrario.

**Test cases.**
- Existe una entrada accesible (menú/acción) que abre Import/Export Translations desde la nueva UI.
- El usuario puede subir un archivo de traducción (.xml/.csv) y ejecutar la importación con el mismo resultado que en el clásico.
- La exportación de traducciones genera el archivo esperado.
- La operación respeta la sesión, el idioma y el contexto de cliente/organización del usuario.

**Resultado.** El usuario puede importar y exportar traducciones desde la nueva UI, con paridad funcional respecto del form clásico, reutilizando la implementación existente del servidor.

---

> **Nota sobre el entorno representativo (`etendodev`).** Se confirmó: **Data Import Entries** (`ad_window` 17F3B5BC…, `action=W`, windowType=M, activa, en menú) y **Data Import Entry Archive** son ventanas estándar sobre `c_import_entry`; el tab de importación **no tiene** whereclause/filterclause ni configuración de grilla (el filtro Initial/Error no está en metadata → es client-side en el clásico); la tabla `c_import_entry` (columnas `importstatus`, `typeofdata`, `errorinfo`, `responseinfo`, `jsoninfo`, etc.) existe y su default de estado es `Initial`; **Import/Export Translations** es un form legacy (`action=X`, `ad_form` 800014); y **no existe** ninguna tabla ni ventana "Import Format" en este entorno. **No hay componente del adapter (`com.etendoerp.metadata`) específico de importación**: la parte de UI se resuelve con el motor genérico de ventanas, y la lógica de importación (validación, batch, reprocesamiento) es servidor/background, ajena a la interfaz.

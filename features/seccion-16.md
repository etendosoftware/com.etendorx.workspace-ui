# Sección 16 — Final Consistency Validation (Classic vs New UI)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 16. A diferencia del resto de secciones, **esta no describe una funcionalidad a implementar**, sino los **criterios de aceptación** para confirmar que la nueva UI es funcionalmente equivalente a la clásica. Es una **pasada de validación (actividad de QA)** que se ejecuta al final, agrupada en tres bloques: **16.1 Paridad de datos**, **16.2 Paridad de comportamiento** y **16.3 Paridad de seguridad**.

> **Clave de interpretación.** Esta sección no se "implementa": se *ejecuta* como verificación. Por eso el análisis distingue dos planos: (a) **mecanismos de paridad por construcción** — hasta qué punto la arquitectura de la nueva UI garantiza estructuralmente la equivalencia (porque reutiliza el mismo backend, el mismo modelo de metadata y el mismo modelo de acceso AD a través del adapter `com.etendoerp.metadata`); y (b) **ejecución de la validación** — si existe la herramienta/proceso que efectivamente compara Classic vs New y produce el veredicto de paridad. Además, la completitud "real" de esta sección **está acotada por la de todas las demás**: un criterio de paridad solo puede pasar si la feature subyacente (Secciones 1–15, 17–35) está completa.

> **Nota metodológica.** Muchos criterios (acceso a ventana/tab/campo, filtrado por organización, records/valores, resultados de proceso, callouts) están **garantizados por el backend**: la nueva UI consume los mismos datasources, el mismo FIC/callouts y la misma metadata filtrada por rol que la UI clásica. Según la metodología acordada, lo *backend-enforced* **no es un gap de cliente**. El verdadero pendiente de esta sección es la **ejecución sistemática de la validación**, no reimplementar la paridad.

**Estimación global de la sección:** como *feature* no aplica un porcentaje; en términos de **preparación para la paridad**, los mecanismos están **~altamente cubiertos** (mismo backend + mismo modelo de acceso AD + render dirigido por metadata). En términos de **ejecución de la validación**, la cobertura es **parcial**: existe una suite E2E funcional (22 pruebas Cypress smoke) que valida que la nueva UI funciona, pero **no existe un harness de comparación Classic-vs-New** que verifique los criterios de esta sección de forma sistemática.

---

## Qué está completamente hecho

### Mecanismos que garantizan la paridad por construcción

| Bloque | Criterio(s) del checklist | Mecanismo verificado en la nueva UI / adapter |
|--------|---------------------------|-----------------------------------------------|
| **16.1 Datos** | Mismo menú por usuario/rol | `MenuBuilder` (adapter) construye el árbol de menú a partir del `GlobalMenu` clásico, filtrado por el rol del `OBContext` → mismas entradas que el clásico. |
| **16.1 Datos** | Mismos records / mismo default query / filtros | La nueva UI consume el **mismo datasource** (`org.openbravo.service.datasource`) vía el adapter; la consulta por defecto, filtros y valores provienen del mismo backend. |
| **16.1 Datos** | Mismos valores de campo | Los valores los entrega el datasource/FIC clásico; el cliente solo los presenta (mismas referencias de campo, Sección 2). |
| **16.1 Datos** | Estructura de tabs (mismos tabs, mismo orden/nivel) | `WindowBuilder.createTabsJson` + `TabBuilder` emiten la jerarquía de tabs desde el AD, respetando el orden y los niveles definidos. |
| **16.3 Seguridad** | Acceso a ventana (solo-lectura no edita) | `WindowBuilder.getWindowAccess` resuelve el `WindowAccess` del rol; `isReadOnly = !windowAccess.isEditableField()` → se propaga `readOnly` a la ventana/tabs/campos. |
| **16.3 Seguridad** | Acceso a tab (mostrar/ocultar + solo-lectura) | `WindowBuilder` filtra por `tabAccess.isActive() && isAllowRead()`; `TabBuilder` marca `readOnly` cuando la ventana es read-only o `!tabAccess.isEditableField()`. |
| **16.3 Seguridad** | Acceso a nivel de campo | `TabBuilder`/`FieldBuilder` usan `FieldAccess` (`getADFieldAccessList`) del rol para incluir/marcar `isReadOnly`/`readOnly` por campo. |
| **16.3 Seguridad** | Restricción por organización | El filtrado por organización lo aplica el datasource/DAL clásico (mismo `OBContext`) → mismos records visibles. |
| **16.3 Seguridad** | Acceso a proceso | La metadata de proceso y su ejecución pasan por el kernel clásico, que valida el acceso del rol al proceso. |
| **16.3 Seguridad** | System Administrator con acceso elevado | Al reutilizar el modelo de acceso AD y el `OBContext`, el rol System Administrator obtiene el mismo alcance elevado que en el clásico. |
| **16.2 Comportamiento** | Callouts con los mismos efectos | Los callouts se ejecutan contra el servlet clásico (misma lógica), por lo que producen los mismos autocompletados. |
| **16.2 Comportamiento** | Resultados de proceso / transiciones de estado | Los procesos se ejecutan en el kernel clásico → mismos records creados/modificados y mismas transiciones documentales. |
| **16.2 Comportamiento** | Selectores con las mismas opciones filtradas | Los selectores consultan los mismos datasources/selectores con el mismo contexto. |

### Validación funcional existente

- **Suite E2E funcional (Cypress).** `cypress-tests/e2e/smoke` incluye 22 pruebas de flujos reales (Login, Sales, Procurement, Financial, Masterdata, Filters, Linked Items, display logic, performance) que verifican que la nueva UI **funciona** end-to-end. Aportan evidencia parcial de paridad de comportamiento, aunque **no comparan** contra la UI clásica.

---

## Qué está parcialmente hecho

- **Ejecución de la validación de paridad.** Existe la suite E2E funcional (arriba), pero cubre un subconjunto de flujos y **no está formulada como comparación Classic-vs-New** (no verifica conteo de campos por tab, columnas por defecto, orden de campos, ni diffs de records/valores/lógica entre ambas UIs). Es validación de "la nueva UI funciona", no de "la nueva UI coincide con la clásica". → **Tareas 1–3**.
- **Criterios cuya paridad depende de features aún parciales.** Varios checkboxes (p. ej. "no faltan campos en ningún formulario", "el orden de campos coincide", "las columnas de grilla coinciden", "la lógica de display/read-only oculta lo mismo") **solo pasarán donde la feature subyacente esté completa**. Como algunas secciones previas quedaron parciales, esta validación heredará esos gaps; la Sección 16 no puede declararse superada mientras existan pendientes en las secciones que valida.

---

## Qué no está hecho

- **No existe un harness/proceso sistemático de validación de consistencia Classic-vs-New.** No hay herramienta ni checklist ejecutable que, para un rol dado, compare de forma reproducible: (a) menús y ventanas disponibles, (b) estructura de tabs y conteo/orden de campos por tab, (c) columnas de grilla por defecto, (d) records y valores para el mismo registro, (e) efectos de callouts, (f) comportamiento de display/read-only logic, (g) resultados de proceso, y (h) elementos ocultados por seguridad (ventana/tab/campo/organización). Esta pasada final de validación —que es *el objeto* de la Sección 16— aún debe definirse y ejecutarse.

---

## Resumen de lo que queda por hacer

La equivalencia **por construcción** está bien fundada: la nueva UI reutiliza el mismo backend, los mismos datasources/callouts/procesos y el **mismo modelo de acceso AD** (filtrado server-side en el adapter), lo que cubre estructuralmente la mayor parte de los criterios de datos, comportamiento y seguridad. Lo que falta es la **actividad de validación en sí**:

1. **(Tarea 1)** Definir y ejecutar la validación de **paridad de datos** (menú, ventanas, tabs, conteo/orden de campos, columnas de grilla, records/valores) por rol.
2. **(Tarea 2)** Definir y ejecutar la validación de **paridad de comportamiento** (callouts, display/read-only logic, transiciones de estado, procesos, selectores, validaciones).
3. **(Tarea 3)** Definir y ejecutar la validación de **paridad de seguridad** (read-only por ventana, acceso a proceso, filtrado por organización, ocultamiento a nivel campo/tab, rol System Administrator).

Estas tareas son transversales y **dependen** del cierre de los pendientes documentados en las secciones que validan.

---

## Tareas

### Tarea 1 — Validación de paridad de datos (Classic vs New UI)

**Descripción.** No existe una verificación sistemática de que cada ventana, menú, estructura de tabs, conjunto de campos y columnas de grilla de la nueva UI coincida con la clásica para un mismo usuario/rol. Sin ella no puede afirmarse la equivalencia de datos exigida por 16.1.

**Solución propuesta.** Establecer una pasada de validación reproducible que, para un conjunto representativo de roles y ventanas, compare la nueva UI contra la clásica en: entradas de menú visibles, ventanas equivalentes, estructura/orden de tabs, conteo y orden de campos por tab, columnas de grilla por defecto, y valores del mismo registro. Puede apoyarse en la metadata que ya expone el adapter y en la instancia de referencia (`etendodev`), documentando discrepancias como hallazgos accionables.

**Test cases.**
- Para un rol dado, el conjunto de entradas de menú coincide entre ambas UIs.
- Para una ventana representativa, el número y orden de campos por tab coincide (o la diferencia es una mejora intencional documentada).
- Las columnas visibles por defecto en la grilla coinciden.
- El mismo registro muestra los mismos valores en ambas UIs.
- Toda discrepancia queda registrada como hallazgo con ventana/tab/campo afectado.

**Resultado.** Un veredicto claro de paridad de datos por rol, con la lista de discrepancias pendientes de resolver.

---

### Tarea 2 — Validación de paridad de comportamiento (Classic vs New UI)

**Descripción.** Falta confirmar de forma sistemática que callouts, lógica de display/read-only, transiciones de estado documental, ejecución de procesos, selectores y reglas de validación produzcan los mismos resultados que en la UI clásica (criterios 16.2).

**Solución propuesta.** Ampliar/estructurar la validación de comportamiento sobre flujos representativos comparando efectos observables contra el clásico: campos autocompletados por callouts, campos mostrados/ocultados y de solo-lectura bajo las mismas condiciones, resultados de proceso (records creados/modificados), opciones filtradas en selectores y aceptación/rechazo de validaciones. Puede reutilizar y extender la suite E2E existente añadiendo aserciones de equivalencia, sin rediseñar los flujos.

**Test cases.**
- Un callout produce los mismos campos autocompletados con los mismos valores en ambas UIs.
- La display logic muestra/oculta los mismos campos bajo las mismas condiciones.
- La read-only logic marca los mismos campos como no editables.
- Un proceso ejecutado deja el mismo estado de datos que en el clásico.
- Un selector devuelve el mismo conjunto filtrado para el mismo contexto.

**Resultado.** Evidencia de que el comportamiento dinámico de la nueva UI es equivalente al clásico, con las divergencias documentadas.

---

### Tarea 3 — Validación de paridad de seguridad (Classic vs New UI)

**Descripción.** Aunque el adapter reutiliza el modelo de acceso AD (WindowAccess/TabAccess/FieldAccess) y el filtrado por organización es backend, no existe una verificación explícita de que los criterios de seguridad de 16.3 se cumplan de extremo a extremo en la nueva UI para distintos roles.

**Solución propuesta.** Ejecutar una validación de seguridad por rol que confirme que: una ventana de solo-lectura no permite editar, un rol sin acceso a un proceso no puede invocarlo, las restricciones de organización filtran los mismos records, y el ocultamiento a nivel de campo/tab coincide; incluyendo el rol System Administrator con su acceso elevado. Debe apoyarse en el modelo de acceso ya aplicado por el adapter y contrastar el resultado visible en la nueva UI.

**Test cases.**
- Un usuario con acceso de solo-lectura a una ventana no puede editar en la nueva UI.
- Un usuario sin acceso a un proceso no puede invocarlo desde la nueva UI.
- Las restricciones por organización filtran el mismo conjunto de records que en el clásico.
- Los campos/tabs sin acceso quedan ocultos igual que en el clásico.
- El rol System Administrator conserva su acceso elevado en ambas UIs.

**Resultado.** Confirmación de que la nueva UI respeta el mismo modelo de seguridad que la clásica, con cualquier desviación documentada como hallazgo prioritario.

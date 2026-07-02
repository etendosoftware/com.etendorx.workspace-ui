# Sección 11 — Authentication, Session, and Authorization

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 11. Cubre autenticación y sesión: login/logout (11.1), expiración de sesión y renovación de token (11.2), Help & About (11.3), cambio de contraseña (11.4), cambio de rol/organización (11.5) y control de acceso (11.6).

> **Clave de arquitectura:** el modelo de autenticación de la nueva UI es **JWT stateless** vía Secure Web Services (`/sws/login` → `SecureLoginServlet`, token firmado con expiración `withExpiresAt`), a diferencia del clásico que persiste un `AD_Session` en servidor. El login pasa por un route de Next.js (`/api/auth/login`) que actúa de proxy: reenvía credenciales al clásico y guarda el mapeo token→`JSESSIONID`/CSRF en un store del servidor Next (`sessionStore`). El **control de acceso (11.6) es idéntico al de la Sección 10.13**: lo resuelve el backend (metadata + `OBContext`); el cliente sólo consume lo que se le entrega. Por ende, las brechas reales de esta sección están en la **capa de cliente** de los flujos de sesión (expiración de contraseña, aviso al salir, Help contextual), no en el enforcement.

**Estimación global de la sección: ~80% de cobertura efectiva.** Login, cambio de contraseña, cambio de rol/organización/almacén/idioma (con "set as default"), About y el control de acceso están cubiertos. Los huecos se concentran en 11.1 (flujo de contraseña expirada, aviso de cambios sin guardar al salir, invalidación server-side del token) y en 11.3 (link de Help contextual). La renovación de token (11.2) no está implementada, pero el propio checklist la marca como opcional ("if implemented").

---

## Qué está completamente hecho

| Comportamiento (checklist 11.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **11.1 Login con credenciales válidas** | `login()` (contexto de usuario) → `/api/auth/login` (proxy Next) → clásico `/sws/login`; devuelve JWT que se guarda en `localStorage` y se inyecta en `Metadata`/`datasource`/`CopilotClient`. El proxy asocia el token con el `JSESSIONID`/CSRF del clásico. |
| **11.1 Error descriptivo en credenciales inválidas** | El clásico devuelve `{status:"error", message}`; el proxy lo propaga como 401 con `message`, y la pantalla de login muestra ese texto (`loginErrorDescription`), no un error genérico. |
| **11.1 Logout limpia el estado de cliente** | `logout()` ejecuta `clearUserData()` (resetea store de usuario, preferencias e idioma) + `/api/auth/logout` (limpia el mapeo token→sesión en el store de Next) + limpia los tokens de los clients. Sin token, `UserProvider` renderiza la pantalla de login → el botón "atrás" no muestra contenido autenticado. |
| **11.2 Expiración de token enforced** | La expiración la fija el backend en el JWT (`SecureWebServicesUtils`, `config.getExpirationTime()`); un token vencido devuelve 401. |
| **11.2 Sesión expirada redirige a login con mensaje** | Interceptor global (registrado sobre `Metadata`/`datasource`/`Copilot`) captura 401/500 no ignorables → ejecuta `logout()` y setea `loginErrorText/Description` (`login.errors.defaultLogout`) que se muestran en la pantalla de login. |
| **11.2 Múltiples pestañas comparten sesión** | El token vive en `localStorage`, compartido por todas las pestañas del mismo origen; la expiración las afecta a todas. |
| **11.2 Guardado pendiente tras expirar muestra error** | Una operación con token vencido devuelve 401 → interceptor → logout + mensaje (no hay pérdida silenciosa de datos). |
| **11.3 About** | `ConfigurationSection` abre `AboutModal` con la vista clásica `about.html` a través del proxy `/api/erp` (versión, módulos, licencia, info de sistema). |
| **11.4 Cambio de contraseña (completo)** | Sección "password" del `ProfileModal`: campos actual/nueva/confirmar; valida requeridos y coincidencia en cliente; llama `UserInfoWidgetActionHandler` (`command=changePwd`); mapea códigos de error del backend a mensajes (`UINAVBA_CurrentPwdIncorrect`, `CPDifferentPassword`, `CPPasswordNotStrongEnough`, etc.); éxito cierra el modal. La política de contraseña se valida server-side. |
| **11.5 Cambio de rol / organización / almacén / idioma** | `ProfileModal` presenta dropdowns de rol, organización (filtrada por rol vía `roles[].organizations`), almacén (filtrado por org) e idioma; `changeProfile()` obtiene nuevo token + `getSession()` y refresca el contexto; al cambiar de rol se navega a `/` y se ejecuta `cleanWindowState()`; el cambio de idioma fuerza `window.location.reload()`. |
| **11.5 "Set as default" + rol/org visibles en navbar** | Checkbox "guardar como default" → `setDefaultConfiguration` persiste rol/org/almacén/idioma/cliente; el rol/organización/almacén actuales se muestran en la barra de navegación (`Profile`/`ProfileModal`). |
| **11.6 Control de acceso (enforcement)** | Idéntico a 10.13: sólo llegan menú, ventanas, tabs y campos accesibles para el rol (metadata server-side); modo solo-lectura por acceso; acceso a datos filtrado por organización (`OBContext`/datasource). El cliente consume lo entregado; URL a ventana prohibida no devuelve datos. |

---

## Qué está parcialmente hecho

- **11.1 Logout — invalidación server-side del token:** al ser JWT **stateless**, `logout` limpia el estado del cliente y el mapeo en el store de Next, pero **no revoca el token en el servidor** (no hay lista de revocación ni servlet de logout en SWS; el clásico `/sws/login` no persiste `AD_Session`). El token sigue siendo válido hasta su expiración natural. Es una característica del modelo, pero el checklist pide "token no longer valid". → **Tarea 2** (impacto medio; requiere apoyo de backend).
- **11.1 Logout con cambios sin guardar:** existe detección de cambios sin guardar para navegación de formularios/tabs, pero el `logout()` de `UserProfile` se ejecuta directo, **sin advertir** si hay cambios pendientes. → **Tarea 1** (impacto medio).
- **11.2 Renovación de token / reset del temporizador por actividad:** con JWT stateless de expiración fija, **la actividad del usuario no reinicia el temporizador** y **no hay refresh** proactivo antes de vencer; el usuario es expulsado al vencer el token aunque esté trabajando. El checklist marca el refresh como opcional, pero el reset por actividad sí es un comportamiento esperado del clásico. → **Tarea 3** (impacto medio).
- **11.6 URL directa a ventana prohibida:** el enforcement es server-side (la metadata no entrega ventanas sin acceso), pero **no se verificó una pantalla de "acceso denegado" explícita** en el cliente ante una URL manipulada a un recurso no concedido; hoy el resultado probable es una vista vacía/sin datos en lugar de un mensaje claro. (Sin tarea dedicada; se documenta como verificación de QA sobre comportamiento ya seguro por backend.)

---

## Qué no está hecho

- **11.1 Prompt de cambio de contraseña por contraseña expirada:** el tipo de usuario incluye `isPasswordExpired`, pero **no se usa en ningún flujo**; el login no detecta ni fuerza el cambio de contraseña cuando está vencida. → **Tarea 4**.
- **11.3 Help contextual:** existe el About, pero **no hay link de Help** context-sensitive por ventana (no se encontró `helpView`/`helpUrl` en el cliente). → **Tarea 5** (impacto bajo).

> **No son brechas / fuera del alcance del cliente:**
> - **11.1 Restricciones de licencia** (máx. usuarios concurrentes, propósito de instancia): las aplica el backend en `/sws/login`; el cliente sólo muestra el mensaje de error devuelto.
> - **11.5 Filtrado por árbol de organización** (padre incluye hijas): lo resuelve el backend según configuración; el cliente consume la lista entregada.
> - **11.6 Enforcement de acceso** (ventanas/tabs/campos/procesos/organización): server-side vía metadata y `OBContext`; ya cubierto y compartido con 10.13. No es código faltante en la nueva UI.

---

## Resumen de lo que queda por hacer

Los flujos centrales de autenticación y sesión están cubiertos: login con JWT y error descriptivo, logout que limpia el estado de cliente, expiración de token con redirección a login, About, cambio de contraseña completo (con mapeo de errores del backend) y cambio de rol/organización/almacén/idioma con opción de default. El control de acceso (11.6) se resuelve en el backend, igual que en la Sección 10.13, por lo que no representa trabajo de cliente. Quedan cinco ajustes: **avisar de cambios sin guardar antes de salir** (**Tarea 1**), **invalidar el token del lado servidor al hacer logout** (**Tarea 2**, requiere backend), **reiniciar la vigencia de sesión por actividad y/o renovar el token** (**Tarea 3**), **detectar y forzar el cambio de contraseña expirada en el login** (**Tarea 4**) y **agregar el link de Help contextual por ventana** (**Tarea 5**). La renovación de token es opcional según el checklist; el resto son mejoras de robustez y paridad con el clásico.

---

## Tareas

### Tarea 1 — Advertir cambios sin guardar antes de cerrar sesión

**Descripción:** el logout desde el widget de perfil se ejecuta de inmediato; si el usuario tiene un registro en edición con cambios sin guardar, éstos se pierden sin aviso. La detección de cambios sin guardar ya existe para navegación entre formularios/tabs.

**Solución propuesta:** reutilizar el mecanismo existente de detección de cambios sin guardar para interceptar el logout: si hay cambios pendientes, mostrar una confirmación (continuar y descartar / cancelar) antes de proceder. Extender esa misma guarda al cierre/recarga de la pestaña cuando haya edición activa.

**Test cases:**
- Con cambios sin guardar, el logout pide confirmación y al cancelar no cierra sesión.
- Al confirmar, se descartan los cambios y se cierra sesión normalmente.
- Sin cambios pendientes, el logout procede sin fricción.
- La guarda no interfiere con el logout automático por expiración de sesión.

**Resultado:** el usuario no pierde trabajo por cerrar sesión de forma inadvertida, alineado con el comportamiento del clásico.

### Tarea 2 — Invalidar el token en el servidor al cerrar sesión

**Descripción:** al ser JWT stateless, el logout limpia el estado del cliente pero el token permanece válido hasta su expiración; un token filtrado sigue siendo utilizable tras el logout. El checklist 11.1 exige que el token deje de ser válido.

**Solución propuesta:** introducir un mecanismo de revocación del lado servidor (por ejemplo, una lista de revocación/blacklist de tokens hasta su expiración, o un endpoint de logout en SWS que invalide la sesión asociada) y que el logout del cliente lo invoque. Requiere coordinación con el backend (`com.smf.securewebservices` / adapter). El cliente ya centraliza el logout, por lo que sólo debe llamar al nuevo endpoint.

**Test cases:**
- Tras logout, reusar el token anterior devuelve 401.
- El logout sigue limpiando el estado de cliente aunque la revocación falle (degradación controlada).
- Un token no revocado sigue funcionando hasta su expiración normal.

**Resultado:** el cierre de sesión invalida efectivamente el token, cerrando la ventana de reuso.

### Tarea 3 — Renovación de token y/o reinicio de vigencia por actividad

**Descripción:** con expiración fija del JWT, la actividad del usuario no extiende la sesión y no hay refresh; un usuario activo puede ser expulsado al vencer el token. El checklist pide que la interacción reinicie el temporizador (y opcionalmente que exista refresh).

**Solución propuesta:** implementar una renovación transparente del token (endpoint de refresh en backend + lógica de cliente que lo solicite antes de la expiración mientras haya actividad reciente), de modo que la sesión se prolongue con el uso y sólo expire tras inactividad real. Mantener el comportamiento actual de expulsión por 401 como red de seguridad.

**Test cases:**
- Con actividad continua, la sesión no expira al llegar al tiempo original del token.
- Tras un período de inactividad, la sesión expira y redirige a login con mensaje.
- El refresh ocurre de forma transparente, sin interrumpir la operación en curso.
- El polling/heartbeat de fondo no mantiene viva la sesión indefinidamente.

**Resultado:** la vigencia de la sesión refleja la actividad real del usuario, evitando expulsiones durante el trabajo.

### Tarea 4 — Detectar y forzar cambio de contraseña expirada en el login

**Descripción:** el modelo de usuario ya expone `isPasswordExpired`, pero el flujo de login no lo consulta ni actúa sobre él; un usuario con contraseña vencida no es dirigido a cambiarla.

**Solución propuesta:** al iniciar sesión, detectar la condición de contraseña expirada (por respuesta del backend) y encaminar al usuario a un flujo de cambio de contraseña obligatorio antes de permitir el acceso, reutilizando la funcionalidad de cambio de contraseña ya existente.

**Test cases:**
- Login con contraseña expirada muestra el flujo de cambio obligatorio y no ingresa a la app.
- Tras cambiar la contraseña correctamente, el usuario accede normalmente.
- Login con contraseña vigente no muestra el flujo y accede directo.
- Un cambio fallido (política no cumplida) muestra el error y mantiene el flujo abierto.

**Resultado:** los usuarios con contraseña vencida son forzados a actualizarla, cumpliendo la política de seguridad.

### Tarea 5 — Link de Help contextual por ventana

**Descripción:** el widget de ayuda del clásico ofrece, además de About (ya implementado), un link de Help que aparece sólo cuando la ventana actual tiene ayuda configurada y abre el contenido de ayuda contextual. En la nueva UI no existe este link.

**Solución propuesta:** mostrar condicionalmente un acceso a "Help" cuando la metadata de la ventana activa indique que tiene ayuda configurada, y abrir el contenido de ayuda correspondiente (por ejemplo, la vista de ayuda del clásico vía el proxy, análogo a como se abre About).

**Test cases:**
- El link de Help aparece sólo en ventanas con ayuda configurada.
- Al abrirlo, se muestra el contenido de ayuda de la ventana correcta.
- En ventanas sin ayuda, el link no se muestra.
- Escape/cerrar cierra el contenido de ayuda.

**Resultado:** el usuario accede a la ayuda contextual de cada ventana, completando la paridad del widget Help & About con el clásico.

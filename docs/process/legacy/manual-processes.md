# Legacy (Manual) Processes

This document is the authoritative reference for the **legacy process** subsystem
introduced under task ETP-3747 (epic ETP-3595). Everything required to operate,
extend or debug the feature lives here — the backend module
`com.etendoerp.metadata` ships no separate API documentation, so treat this file
as a contract.

> **Audience:** developers and AI agents that need to understand, modify or
> extend the iframe-based process flow without re-reading the entire codebase.
>
> **Scope:** the iframe pipeline that renders Etendo Classic HTML templates
> inside the new WorkspaceUI. Modern Process Definition (`OBUIAPP_Process`,
> `uipattern = 'A'`, `'OBUIAPP_PickAndExecute'`, etc.) is **out of scope**.

---

## 1. What is a "legacy process"?

In Etendo Classic, certain Button-typed columns (`AD_Reference_ID = 28`) bypass
the Process Definition framework entirely. Instead of returning JSON, they
return an HTML document built from a hand-written template (and sometimes a
dedicated Java servlet). The new WorkspaceUI cannot render that HTML natively,
so it embeds it inside an iframe modal and relays the legacy pop-up's
success/error message back to the React shell via `window.postMessage`.

The implementation handles three flavours of button column, all detected on the
server by [`LegacyProcessResolver.isLegacy(Field)`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/LegacyProcessResolver.java):

| Flavour | Detection rule | Source spec |
|---|---|---|
| **Special column** (DocAction, Posted, CreateFrom, ChangeProjectStatus, PaymentRule) | `AD_Column.ColumnName ∈ {DocAction, Posted, CreateFrom, ChangeProjectStatus, PaymentRule}` | Section 2.B.1–2.B.5 of `all-feature-section-2.md` |
| **Manual process** | `AD_Column.AD_Process_ID` set AND `AD_Process.UIPattern = 'M'` | Section 2.B.6 |
| **Standard button process** | `AD_Column.AD_Process_ID` set AND `AD_Process.UIPattern = 'S'` | Routed through the tab Edition servlet |

Together, the three flavours cover the **270 buttons** catalogued in
`legacy-process-testing.md` (66 special columns + 52 manual processes + 152
standard buttons). All are launched through a single, unified pipeline; no
runtime branching exists in the consumer code.

> **Out of scope:** when `AD_Column.em_obuiapp_process_id` is set, the column
> goes through Process Definition (modern API) regardless of the rules above.
> See [features/process-execution/](features/process-execution/) for that path.

---

## 2. End-to-end request flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as WorkspaceUI (React)
    participant API as Next.js API proxy
    participant ERP as Etendo ERP (Tomcat)
    participant Iframe as Legacy Iframe (Classic HTML)

    Note over UI: User opens a window — metadata fetch
    UI->>API: GET /api/erp/meta/window/<id>
    API->>ERP: GET /meta/window/<id>
    ERP-->>API: Window JSON with field.processAction.{url,command,keyColumnName,inpkeyColumnId,additionalParameters}
    API-->>UI: Window JSON

    Note over UI: User clicks a legacy button on a record
    UI->>UI: useProcessExecution.executeProcessAction(button)
    UI->>UI: resolveLegacyProcessData() — backend → data.json → columnName
    UI->>UI: getParams() — merge static keys + $record.* placeholders
    UI->>UI: setIframeUrl + setIframeFormParams
    UI->>UI: ProcessIframeModal opens; CustomModal auto-submits hidden form

    Note over UI,ERP: First navigation hits the LegacyProcessServlet
    UI->>API: POST <publicHost>/meta/legacy/<servletPath>.html (form-encoded)
    API->>ERP: same request
    ERP->>ERP: MetadataFilter detects .html → LegacyProcessServlet.service
    ERP->>ERP: prepareSessionAttributes (LEGACY_TOKEN, LEGACY_SERVLET_DIR)
    ERP->>ERP: authenticateWithToken (JWT → OBContext + AD_Session)
    ERP->>ERP: RequestDispatcher.include(target) — Classic page renders
    ERP->>ERP: rollbackDalSessionIfErrorPopup (if MessageBoxERROR present)
    ERP->>ERP: getInjectedContent — frameMenu shim, postMessage scripts
    ERP-->>Iframe: HTML with injected scripts

    Note over Iframe,UI: User submits the form inside the iframe
    Iframe->>API: POST /meta/legacy/... (Command=BUTTON…, follow-up)
    API->>ERP: same
    ERP->>ERP: isLegacyFollowupRequest → processLegacyFollowupRequest
    ERP->>ERP: extractTargetPath (LEGACY_SERVLET_DIR or Referer)
    ERP->>ERP: RequestDispatcher.forward(target)
    ERP-->>Iframe: Updated HTML or popup-message page

    Iframe->>UI: postMessage({type:"fromForm", action:"processOrder"})
    UI->>ERP: POST /sws/com.smf.securewebservices.kernel/...GetTabMessageActionHandler
    ERP-->>UI: { type, title, text } (if any) or empty
    UI->>UI: ProcessIframeModal renders the message overlay
```

The remainder of this document explains every numbered step in detail.

---

## 3. Backend reference (`com.etendoerp.metadata`)

### 3.1 Servlet entry point and routing

All legacy traffic enters the ERP container through the
[`MetadataFilter`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/http/MetadataFilter.java)
which is mapped to `/meta` and `/meta/*` (`@WebFilter(urlPatterns = { "/meta", "/meta/*" })`).
Path-based dispatch:

| Path suffix | Handler | Purpose |
|---|---|---|
| `*.html` | [`LegacyProcessServlet.service`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/http/LegacyProcessServlet.java#L268) | Iframe HTML pages and follow-up form submits |
| `/forward/*` | `ForwarderServlet.process` | Generic JSON proxy (out of scope here) |
| anything else | `chain.doFilter` | Falls through to other servlets / filters |

The frontend always points the iframe at `<publicHost>/meta/legacy<targetPath>`
(see `API_IFRAME_FORWARD_PATH = "/meta/legacy"` in
`packages/api-client/src/api/constants.ts`). Inside the servlet, the
`/meta/legacy` prefix is preserved in the session under `LEGACY_SERVLET_DIR` so
follow-up requests can reconstruct the absolute Classic path even when the
referer is missing.

`LegacyProcessServlet.service` selects one of four code paths based on the
incoming path and parameters:

| Branch | Predicate | Method |
|---|---|---|
| **Legacy HTML page** | `path` ends with `.html` | `processLegacyRequest` |
| **JavaScript proxy** | `path` ends with `.js` | `processJavaScriptRequest` |
| **Follow-up submit** | request parameter `Command` starts with `BUTTON` | `processLegacyFollowupRequest` |
| **JWT redirect** | `path` ends with `/redirect` | `processRedirectRequest` |

Anything else falls back to the parent `HttpSecureAppServlet.service` (default
Openbravo behaviour).

### 3.2 Authentication and session priming (`prepareSessionAttributes` + `authenticateWithToken`)

When the first iframe request arrives:

1. **JWT decoding** — `SecureWebServicesUtils.decodeToken(token)` extracts
   `user`, `role`, `client`, `organization`, `warehouse` claims.
2. **`OBContext`** — `OBContext.setOBContext(...)` and
   `OBContext.setOBContextInSession(req, ctx)` install the security context.
3. **`AD_Session`** — `createDBSession(req, username, userId)` inserts an
   `AD_Session` row with status `'S'` (a duplicate of
   `AuthenticationManager.createDBSession` because the original is
   `protected`).
4. **`VariablesSecureApp`** — populates the Classic session keys
   `#AD_User_ID`, `#AD_SESSION_ID`, `#LogginIn`, `#AD_Role_ID`, `#AD_Client_ID`,
   `#AD_Org_ID`. These keys are read by every Classic XSQL/HTML template, so
   without them the render is blank.
5. **`SecureWebServicesUtils.fillSessionVariables`** — fills auxiliary keys
   (locale, format masks, accounting flags). Wrapped in `setAdminMode(true)` /
   `restorePreviousMode()`.
6. **JSESSIONID cookie** (`setSessionCookie`) — emitted with `Path=/`,
   `Domain=<CLASSIC_URL host>`, `HttpOnly`, `SameSite=None`, and `Secure` when
   running outside `localhost` / `127.*`. The same cookie is reused by every
   follow-up request inside the iframe so the Classic submit lands on the same
   `HttpSession`.
7. **Session attributes** — `LEGACY_TOKEN` (the raw JWT) and
   `LEGACY_SERVLET_DIR` (the directory portion of the first hit) are stored on
   the `HttpSession` for follow-up routing.

`handleTokenConsistency` also stores the JWT under `#JWT_TOKEN` on the session
so the wrapper can re-emit it as `Authorization: Bearer …` for any
sub-resource request that flows through the same servlet.

### 3.3 Request and response wrappers

The servlet wraps both ends of the request to make Classic templates believe
they are running on their original mount point.

#### `HttpServletRequestWrapper` (`buildWrappedRequest`)

Anonymous subclass that overrides:

- `getPathInfo()` — returns the Classic-style path (e.g. `/SalesOrder/Header_Edition.html`).
- `getParameter("token")` — returns the JWT even when callers strip it.
- `getHeader("Authorization")` / `getHeaders("Authorization")` — re-emits
  `Bearer <token>`.
- `getSession()` / `getSession(boolean)` — always returns the original session
  (Classic templates read attributes from the parent session, not the wrapped
  one).

#### `HttpServletResponseLegacyWrapper`

Captures every byte produced by the included resource into a
`ByteArrayOutputStream` so the servlet can post-process the body before
sending it to the browser. Notable behaviours:

- `sendRedirect(location)` is **absorbed**, not propagated — the location is
  stored and used later by `writeRedirect` to emit a meta-refresh page that
  rewrites the URL into the `/meta/legacy/...` namespace.
- `setContentLength(len)` / `setContentLengthLong` are **no-ops** because
  script injection changes the byte count; the container recomputes the
  correct length from the rewritten body.
- The captured encoding is resolved on the first read/write and frozen, so a
  late `setCharacterEncoding` call cannot corrupt the captured bytes
  (commit `fd6ac7016f` ships this fix and prevents the "extraños caracteres"
  regression).

### 3.4 HTML injection (`getInjectedContent`)

After `RequestDispatcher.include(...)` completes, the servlet rewrites the
captured body before flushing it. Five injections happen, in order:

1. **Path rewriting** — every reference to `META_LEGACY_PATH` is rewritten so
   the iframe's relative URLs (`../utility/DynamicJS.js`,
   `../org.openbravo.client.kernel/`, `../web/`, `href="../web/"`) resolve to
   the real Tomcat context path.
2. **`frameMenu` shim** (`injectFrameMenuShim` + `buildFrameMenuShim`) —
   Classic templates expect a top-level `frameMenu` frame to expose locale
   formatting, autosave flags and a `getFrame` lookup function. The shim
   creates a synthetic `window.frameMenu` populated from the current
   `VariablesSecureApp` (decimal/group separators, numeric mask) and overrides
   `window.getFrame` so the rest of the Classic JS keeps working inside an
   iframe with no parent frame. A patch script is appended before `</HEAD>` to
   re-wrap any later redefinition by `messages.js` (commit
   `0789f270b0` introduced this fix).
3. **`postMessage` listeners** — depending on the page shape:
   - Pages with `</FRAMESET>` (compound legacy windows, only in the parent
     view): inject `RECEIVE_AND_POST_MESSAGE_SCRIPT` before `</HEAD>`. This
     forwards any `postMessage` from a nested frame up to the new UI parent
     window unchanged.
   - Pages with `</FORM>` (action-button forms): inject `POST_MESSAGE_SCRIPT`
     after `</FORM>`. The script exposes `window.sendMessage(action)` and
     guarantees a final `iframeUnloaded` notification on `pagehide` /
     `beforeunload` if no terminal action was emitted.
   - Pop-up message pages (template marker `id="messageBoxIDMessage"`):
     inject `SHOW_PROCESS_MESSAGE_SCRIPT` before `</HEAD>` to forward the
     parsed `{type, title, text}` payload to the parent and close the modal
     150 ms later (the delay is critical — closing earlier discards the React
     state update of the parent).
4. **Classic JS hook injection** — for action-button forms, the captured body
   is rewritten so that:
   - Every call to `submitThisPage(...)` is preceded by
     `sendMessage('processOrder')` (fires before the page can unload).
   - Every call to `closePage()` / `closeThisPage()` is followed by
     `sendMessage('closeModal')`.
   This is what lets the React shell know that the user actually clicked OK,
   even when Classic immediately navigates away.
5. **`Command=PROCESS` short-circuit** (`isProcessCommandPopup` +
   `writeProcessCommandForwarder`) — when the captured body is a popup-message
   page **and** the original request was a `Command` whose value starts with
   `PROCESS`, the servlet throws away the captured HTML and writes a tiny
   ~500 B `MINIMAL_FORWARDER_HTML` page that posts the message and closes the
   modal in one go. The size is intentional: a small body bypasses Tomcat's
   chunked encoding which used to race with the browser and produce
   `ERR_INCOMPLETE_CHUNKED_ENCODING` (commits `a5592b81de` / `77101101f0`).

### 3.5 Error handling and DAL rollback

Two failure modes are covered:

- **WAD popup with `MessageBoxERROR`** — `rollbackDalSessionIfErrorPopup`
  scans the captured body for the marker `MessageBoxERROR`. If present, it
  calls `OBDal.getInstance().rollbackAndClose()`. Without this, the
  Hibernate session left dirty by the WAD action-button servlet causes a
  `StaleStateException` in the post-request commit, aborting the connection
  mid-stream.
- **Unexpected exception** — any throwable inside `processLegacyRequest` /
  `processLegacyFollowupRequest` / `extractTargetPath` is caught and converted
  into a `requestFailed` forwarder by `writeRequestFailedForwarder`. The HTTP
  status stays at `200` because the forwarder body itself must run JavaScript
  to message the parent — a real `5xx` would replace the iframe with the
  Tomcat error page and the React shell would never learn that the request
  failed. The new UI handles `requestFailed` by displaying
  `process.requestFailed.{title,text}`.

### 3.6 Follow-up routing (`processLegacyFollowupRequest` + `extractTargetPath`)

Classic action-button forms post to relative URLs (e.g. `Header_Edition.html`)
without a leading slash. Inside the iframe these resolve against the iframe's
current URL, which is `/meta/legacy/<window>/<page>.html`. The servlet must
translate the second hit into the correct dispatcher target:

```java
String targetPath = extractTargetPath(req, servletDir);
wrappedRequest.getRequestDispatcher(targetPath).forward(wrappedRequest, res);
```

Resolution order in `extractTargetPath`:

1. If `pathInfo` ends in `.html` and `LEGACY_SERVLET_DIR` is set in the
   session, return `LEGACY_SERVLET_DIR + pathInfo`. This is the common path.
2. If `pathInfo` ends in `.html` but the session was lost, fall back to
   `extractTargetPathFromReferer(req.getHeader("Referer"))`. The referer
   parser looks for the `/meta/legacy/` prefix first, then `/meta/`, and
   returns whatever follows up to the query string.
3. If neither yields a usable path, return `null`. The caller then writes a
   `requestFailed` forwarder.

The referer fallback is best-effort and intentionally permissive — there is
no longer a hardcoded window-specific default (commit removing the
`/SalesOrder` literal under ETP-3747). Returning `null` is the correct
behaviour when the path cannot be inferred; the user-visible error overlay is
generic enough.

### 3.7 Constants and protocol contracts

| Constant | Defined in | Consumer |
|---|---|---|
| `Constants.LEGACY_URL`, `LEGACY_COMMAND`, `LEGACY_KEY_COLUMN_NAME`, `LEGACY_INP_KEY_COLUMN_ID`, `LEGACY_ADDITIONAL_PARAMETERS` | `com.etendoerp.metadata.utils.Constants` | `LegacyProcessParams.toJson` writes them; the client reads them in `tryResolveFromApi` (`utils/processes/manual/utils.ts`). |
| `LegacyMessageProtocol.MESSAGE_TYPE = "fromForm"` | `com.etendoerp.metadata.http.LegacyMessageProtocol` | Outer envelope of every `postMessage` call. Mirrored by `LEGACY_MESSAGE_TYPE` in `client/.../ProcessModal/legacyMessageProtocol.ts`. |
| `LegacyMessageProtocol.ACTION_*` | same | Action names: `closeModal`, `processOrder`, `showProcessMessage`, `iframeUnloaded`, `requestFailed`. Mirrored by `LEGACY_ACTIONS.*`. |
| `LEGACY_PATHS` and `MUTABLE_SESSION_ATTRIBUTES` | `com.etendoerp.metadata.utils.LegacyUtils` | Used by other module code to whitelist a tiny set of "safe to mutate" session keys for compatibility with Classic flows that race the new UI. |

> **Single source of truth:** the postMessage protocol lives in two mirrored
> files — `LegacyMessageProtocol.java` and `legacyMessageProtocol.ts`. Adding
> a new action requires updating both files and updating Section 4.4 below.

---

## 4. Backend — building the iframe parameters

The backend has a single source of truth for *every* parameter the iframe
needs. It runs at metadata-build time (during the window JSON response) so
that, by the time the frontend renders the toolbar, the button JSON already
carries everything required to launch the process.

### 4.1 `LegacyProcessResolver` — the resolver

Stateless utility class. Two public entry points:

```java
public static boolean isLegacy(Field field);                      // detection
public static Optional<LegacyProcessParams> resolve(Field field); // resolution
```

`resolve(field)` is called from
[`ProcessActionBuilder.getFieldProcess`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ProcessActionBuilder.java#L75)
and merges its output into the `processAction` JSON. If the field is not
legacy or any sub-resolution fails, the optional is empty and the JSON falls
back to whatever Process Definition information was already there.

### 4.2 URL resolution (`resolveUrl` → `resolveTabUrl` / `resolveManualProcessUrl`)

| Input | Output | Notes |
|---|---|---|
| Special column or Standard-button (`uipattern = 'S'`) | `Utility.getTabURL(field.getTab(), null, false)` | The Classic framework stashes intermediate state in session vars during the first request and re-reads them on the FRAMESET-driven second hit; both must share the tab Edition URL. |
| Manual process (`uipattern = 'M'`) — primary | First non-blank `MappingName` from `AD_MODEL_OBJECT → AD_MODEL_OBJECT_MAPPING` filtered to `Action ∈ {P, R}`, default-first | Canonical registry consulted by the Classic dispatcher at runtime. |
| Manual process (`uipattern = 'M'`) — fallback | `javaClassToUrl(resolveJavaClassName(process))` → `/<package>/<ClassName>.html` | Used when a process was registered only inline via `AD_Process.Classname` without filling the model-implementation rows. |

The `javaClassToUrl` algorithm is "replace the last `.` with `/` and append
`.html`" — e.g.
`org.openbravo.advpaymentmngt.ad_actionbutton.ProcessInvoice` →
`/org.openbravo.advpaymentmngt.ad_actionbutton/ProcessInvoice.html`.

### 4.3 Command resolution (`resolveCommand`)

| Case | Output | Reason |
|---|---|---|
| Special column without `AD_Process` (Posted, CreateFrom) | `BUTTON<columnName>` | Classic dispatches by command name alone for these. |
| Manual process | `DEFAULT` | Manual processes use a fixed command and are dispatched by URL. |
| Special column or Standard-button with `AD_Process` | `BUTTON<columnName><processId>` | Disambiguates buttons that share the same column name across different windows/processes. |

### 4.4 Key column resolution (`resolveKeyColumnName`)

Returns the DB column name of the first `Column.isKeyColumn()` row in the
tab's table. This single value is used for **both** `keyColumnName` and
`inpkeyColumnId` query parameters because Classic expects them to be equal.
They are kept as separate fields in `LegacyProcessParams` so consumers cannot
silently set one without the other.

### 4.5 Additional parameters (`resolveAdditionalParameters`)

The Classic `*_Edition.html` form submits a snapshot of every column on the
tab as a hidden input pre-formatted by an XSQL template. Reproducing this
without an extra round-trip requires sending a *placeholder* per column from
the backend and resolving it against the SmartClient record JSON at click
time on the client.

The resolver iterates `field.getTab().getTable().getADColumnList()`, filters
through `shouldIncludeColumn`, looks up the JPA `Property` via
`ModelProvider.getInstance().getEntityByTableName(...)` and emits one entry:

```text
inp<camelCase(DBColumnName)>  →  $record.<jpaPropertyName>[!coercion]
```

`shouldIncludeColumn` rules:

- The column must be active and have a non-blank DB name.
- Its `AD_Reference` must not be `Password (24)` or `Image (32)`. These
  contain sensitive or non-URL-safe data and have no Classic counterpart.
- Every other reference — including `Button (28)` — is included so that, e.g.
  `EM_Aprm_Processed=P` (a Button column whose stored value the WAD servlet
  reads from the form) is forwarded correctly.

Coercion grammar (`buildPlaceholder`):

| Domain type | Output | Client-side coercion (`coerceRecordValue` in `utils.ts`) |
|---|---|---|
| `Property.isId() == true` | `$record.id` | The SmartClient datasource always exposes the PK under the JSON key `"id"`, regardless of column name. Pass-through. |
| `PrimitiveDomainType` of `Boolean` / `boolean` | `$record.<prop>!yn` | `true → "Y"`, `false → "N"`, strings `"Y"`/`"N"` pass through. |
| `DateDomainType` (pure date) | `$record.<prop>!date` | ISO `YYYY-MM-DD…` is converted to Classic's `dd-mm-yyyy`. |
| Anything else (numeric, string, FK, datetime) | `$record.<prop>` | `String(value)`; `null`/`undefined`/`""` returns `null` and the client preserves any pre-set hardcoded value. |

The DB column → `inp*` algorithm (`toInpKey`) is intentionally identical on
both ends to guarantee key parity:

```
"Fin_Finacc_Transaction_ID" → "inpfinFinaccTransactionId"
"C_Order_ID"                → "inpcOrderId"
"AD_Org_ID"                 → "inpadOrgId"
"Processed"                 → "inpprocessed"
```

The mirrored client implementation is `columnNameToInpKey` in
`packages/MainUI/utils/processes/manual/utils.ts`.

### 4.6 Serialization (`LegacyProcessParams.toJson`)

`LegacyProcessParams` is an immutable value object. `toJson()` writes the four
required keys verbatim and adds `additionalParameters` only when the inner
map is non-empty (so consumers that pre-date this feature continue receiving
the same shape):

```json
{
  "url": "/FinancialAccount/Transaction_Edition.html",
  "command": "BUTTONEM_Aprm_ProcessedF68F2890E96D4D85A1DEF0274D105BCE",
  "keyColumnName": "Fin_Finacc_Transaction_ID",
  "inpkeyColumnId": "Fin_Finacc_Transaction_ID",
  "additionalParameters": {
    "inpadClientId":         "$record.client",
    "inpadOrgId":            "$record.organization",
    "inpemAprmProcessed":    "$record.emAprmProcessed",
    "inpprocessed":          "$record.processed!yn",
    "inpdateacct":           "$record.accountingDate!date"
  }
}
```

The block is shallow-merged into the field's `processAction` JSON by
[`ProcessActionBuilder.getFieldProcess`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/ProcessActionBuilder.java#L75)
alongside `fieldId`, `columnId`, `displayLogic`, `buttonText`, `fieldName`,
`reference`, and `manualURL`.

### 4.7 Stub processes for buttons without `AD_Process`

`Posted` and `CreateFrom` columns have no `AD_Process_ID`, but the metadata
schema requires every button to advertise some process metadata. The
[`addProcessInfo` method in `FieldBuilderWithColumn`](../../erp/modules/com.etendoerp.metadata/src/com/etendoerp/metadata/builders/FieldBuilderWithColumn.java#L395)
asks `LegacyUtils.getLegacyProcess(fieldId)` for a transient Process whose
`id`, `name="Legacy Process Placeholder"`, and `active=true` are sufficient
for the JSON serializer. The stub never enters the database — it exists only
so that `ProcessActionBuilder.toJSON()` can run without nulls.

---

## 5. Frontend reference (`packages/MainUI`)

### 5.1 Resolution chain — `resolveLegacyProcessData`

[`utils/processes/manual/utils.ts:60`](../packages/MainUI/utils/processes/manual/utils.ts#L60)
implements the chain that picks where the iframe parameters come from. It is
called once per click from `useProcessExecution.executeProcessAction`:

```ts
function resolveLegacyProcessData(
  button: ProcessActionButton,
  fallbackData: Record<string, ProcessActionData>
): ProcessActionData | null {
  const fromApi = tryResolveFromApi(button.processAction);
  if (fromApi) return fromApi;

  const fromJson = fallbackData[button.id];
  if (fromJson) return fromJson;

  const columnNameMatch = tryFallbackByColumnName(button, fallbackData);
  if (columnNameMatch) return columnNameMatch;

  return null;
}
```

The order is **deliberate** and not configurable:

1. **Backend (`tryResolveFromApi`)** — succeeds when all four required keys
   (`url`, `command`, `keyColumnName`, `inpkeyColumnId`) are present. This is
   the only path that ships `additionalParameters`. Today it covers 100 % of
   the catalogued buttons.
2. **`data.json` lookup by `button.id`** — historic fallback retained as a
   safety net for processes the backend cannot detect (e.g. modules added
   after this resolver was written, hot-fixed mappings during emergencies).
3. **`data.json` lookup by column name** — last-resort heuristic that scans
   for an entry whose `command` contains the button's column name. Helps when
   the same process exists on Header and Lines tabs and only one of them is
   pinned in `data.json`.
4. **Unresolvable** — returns `null`. The caller in
   `useProcessExecution.executeProcessAction` throws
   `LegacyProcessUnresolvedError`, which the toolbar handles by raising a
   toast (`process.legacyProcessUnresolved.{title,description}`) and
   surfacing the offending `buttonId` and `columnName` in the error.

### 5.2 `data.json` — the safety-net fallback

`packages/MainUI/utils/processes/manual/data.json` currently contains `{}`.
The file is intentionally checked in **empty** because the backend resolver
covers all known cases, but the runtime lookup is preserved as a deliberate
escape hatch:

- A regression in the backend resolver that breaks one button can be patched
  client-side in minutes by adding a `data.json` entry without redeploying
  the ERP module.
- New legacy processes appearing in custom modules can be onboarded
  immediately while the backend gets updated to recognise them.

To register a manual override:

```json
{
  "<buttonId>": {
    "url": "/path/to/Classic_Edition.html",
    "command": "BUTTONColumnNameProcessId",
    "keyColumnName": "Table_ID",
    "inpkeyColumnId": "Table_ID",
    "inpKeyName": "inpcOrderId",            // optional; defaults to columnNameToInpKey(inpkeyColumnId)
    "additionalParameters": {                // optional; same grammar as backend
      "inpfinFinancialAccountId": "$record.financialAccount",
      "inpprocessed": "$record.processed!yn"
    }
  }
}
```

Always file a follow-up to fix the backend resolver and remove the entry —
`data.json` is for tactical patches, not strategic configuration.

### 5.3 Param building — `getParams`

[`getParams`](../packages/MainUI/utils/processes/manual/utils.ts#L190)
combines static keys (record id, window id, etc.) with the resolved
`additionalParameters` to produce the final form body. Static keys are
appended first; `additionalParameters` is then walked and `params.set` (note:
**set**, not `append`) overrides any matching key. Critically, when a
placeholder cannot be resolved (record property missing, value is `null`,
coercion impossible) the override is **skipped** — that preserves the
hardcoded value previously set, which is the correct behaviour for required
keys like `inpadClientId`.

Static keys (always present):

| Param | Source |
|---|---|
| `IsPopUpCall` | always `"1"` |
| `Command` | `processAction.command` |
| `inpKey`, `inp<keyColumn>` | current `recordId` |
| `inpwindowId`, `inpWindowId`, `inpTabId`, `inpTableId` | tab/window context |
| `inpcBpartnerId`, `inpadClientId`, `inpadOrgId` | extracted from the record via `extractValue` and the per-key candidate lists in `constants.ts` |
| `inpkeyColumnId`, `keyColumnName` | from the resolved data |
| `inpdocstatus`, `inpprocessing`, `inpposted` | extracted from the record (defaults `"DR"`, `"N"`, `"N"`) |
| `inpdocaction` | `"P"` for Posted buttons, `"CO"` for everything else |
| `token` | current JWT (when present) |

Placeholder grammar (mirrors Section 4.5):

| Placeholder | Resolution |
|---|---|
| `$recordId`, `$windowId`, `$tabId`, `$tableId` | literal ID injection (skips `$record.` parsing) |
| `$record.<prop>` | `String(record[prop])` |
| `$record.<prop>!yn` | `true → "Y"`, `false → "N"`, `"Y"/"N"` pass-through, otherwise null (skip) |
| `$record.<prop>!date` | `YYYY-MM-DD…` → `DD-MM-YYYY`; everything else pass-through |
| Any string not starting with `$record.` | used verbatim as the URL value |

`KEY_MAP` and `mapKeysWithDefaults` further down the file belong to the
modern Process Definition payload pipeline (`useProcessPayload.ts`) and are
**not** used by the legacy iframe path. Do not re-route legacy params through
them — they apply transformations that do not match the Classic WAD contract.

### 5.4 Hook orchestration — `useProcessExecution`

[`useProcessExecution`](../packages/MainUI/hooks/Toolbar/useProcessExecution.ts)
exposes two top-level entry points:

- `executeProcess(button, recordId, params)` — generic dispatcher that
  delegates to `executeProcessDefinition` (modern API) or
  `executeProcessAction` (legacy iframe), based on the `ProcessButtonType`
  marker on the button.
- `executeProcessAction(button)` — orchestrates the legacy path:
  1. Snapshot the tab/window/record/table identifiers; throw `Required data
     not found` if any is missing.
  2. `resolveLegacyProcessData(button, data)`.
  3. If `null`, throw `LegacyProcessUnresolvedError(buttonId, columnName)`.
  4. Compute `baseUrl = ${publicHost}${API_IFRAME_FORWARD_PATH}${url}` —
     `publicHost` comes from `RuntimeConfigContext` (`ETENDO_CLASSIC_HOST`,
     defaults to `http://localhost:8080/etendo` in dev). The iframe must hit
     Tomcat directly because the same JSESSIONID has to be reused on the
     follow-up; if it went through the Next.js proxy the sticky-session
     guarantee would break.
  5. `getParams(...)` to obtain the URL-encoded form body, converted to
     `Record<string, string>` for the hidden form.
  6. Set state (`iframeUrl`, `iframeFormParams`) and resolve the promise with
     `{ showInIframe: true, iframeUrl, iframeFormParams }`.
- `iframeUrl` / `iframeFormParams` are read by the toolbar component and
  passed straight into `<ProcessIframeModal>`. There is no global state — the
  hook is consumed by exactly one toolbar instance per tab.

### 5.5 Form submission — `CustomModal` + `ProcessIframeModal`

[`CustomModal`](../packages/ComponentLibrary/src/components/Modal/CustomModal.tsx)
renders the iframe and the surrounding chrome. When `formParams` is non-null
it switches to a hidden POST form that targets the iframe by name:

```tsx
<form ref={formRef} action={url} method="POST" target={iframeName} className="hidden">
  {Object.entries(formParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
</form>
<iframe ref={iframeRef} name={iframeName} onLoad={handleIframeLoad} />
```

`useEffect` then calls `formRef.current.submit()`. POST is mandatory: Classic
processes routinely produce parameter strings well past the 8 KB GET limit
imposed by some intermediaries, and we observed the truncation in production
under heavy `additionalParameters` payloads (commit `5634abeb4b`).

[`ProcessIframeModal`](../packages/MainUI/components/ProcessModal/Iframe.tsx)
wraps `CustomModal` with the legacy-specific behaviour:

- Auto-success: when a `success`-typed message arrives, render the message,
  start a 3 s progress bar, then `handleClose()` — and trigger
  `onProcessSuccess()` which the toolbar uses to refresh the datasource.
- Suppress auto-close on `error` / `warning` so the user can read the
  message before dismissing.
- Inject a popup-position fix script (`injectPopupPositionFix`) into the
  iframe when the `load` event fires, so secondary `window.open` calls (e.g.
  the Attribute selector) re-centre against the screen instead of the
  iframe's local viewport.

### 5.6 postMessage protocol (4.4 + 5.6 — single contract)

The iframe and the parent communicate exclusively through
`window.postMessage` with the canonical envelope `{ type: "fromForm", action,
... }`. The five actions are:

| Action | Emitted by | Handled by | Effect |
|---|---|---|---|
| `processOrder` | `POST_MESSAGE_SCRIPT` after `submitThisPage(...)` | `Iframe.tsx` → `handleProcessMessage` | Triggers `useProcessMessage.fetchProcessMessage` polling. |
| `showProcessMessage` | `SHOW_PROCESS_MESSAGE_SCRIPT` (popup pages) and `MINIMAL_FORWARDER_HTML` | `Iframe.tsx` → `handleReceivedMessage` | Renders the message overlay using `payload = {type, title, text}`. |
| `closeModal` | `POST_MESSAGE_SCRIPT` after `closePage()` / 150 ms after `showProcessMessage` | `Iframe.tsx` → `handleClose` (skipped if current message is error/warning) | Closes the modal and triggers `onProcessSuccess` if a success was previously seen. |
| `iframeUnloaded` | `POST_MESSAGE_SCRIPT` on `pagehide` / `beforeunload` if no terminal action was emitted yet | `Iframe.tsx` → `startFallbackCountdown` | Starts the 5 s fallback timer that shows the "no message captured" warning. |
| `requestFailed` | `REQUEST_FAILED_FORWARDER_HTML` (servlet error path) | `Iframe.tsx` → `handleRequestFailed` | Shows the error overlay with `process.requestFailed.{title,text}`. |

> **Origin policy.** The listener intentionally does **not** validate
> `event.origin`. The protocol is restricted to UI-only actions with no
> backend side-effects, so a spoofed cross-origin message can at worst close
> the modal or render a fake banner. **If a new action with backend impact
> is ever added (e.g. `forceRefresh`, `triggerSave`), the listener must
> start filtering by origin against `config.etendoClassicHost`.** This is
> the exact wording in the source comment above `handleMessage` and is
> auditable as part of ETP-3747.

### 5.7 Message polling — `useProcessMessage`

Etendo Classic stores the response message of the last process invocation in
the user's `HttpSession` under the key `<tabId>|MESSAGE`. The new UI cannot
read session state directly, so it goes through
`GetTabMessageActionHandler` (located in
`org.openbravo.client.application.window`) which atomically reads and
removes the entry.

[`useProcessMessage`](../packages/MainUI/hooks/useProcessMessage.ts) wraps
that handler. Two relevant policies:

- **Retry policy.** `fetchProcessMessage` calls
  `fetchProcessMessageOnce` up to `PROCESS_MESSAGE_FETCH_ATTEMPTS = 3` times
  with a `PROCESS_MESSAGE_RETRY_DELAY_MS = 500` ms gap between tries. This
  mitigates the race between `sendMessage('processOrder')` (fired *before*
  `submitThisPage`) and the WAD servlet writing the OBError to the session.
  Worst-case latency is ~1 s before the iframe-side fallback timer (5 s)
  takes over.
- **Language.** The handler URL accepts a `language` query parameter that
  controls the rendered message. The hook reads `language` from
  `useLanguage()` (defaulting to `"en_US"` when the language context is
  uninitialised, e.g. during the first render before login). This guarantees
  the message wording matches the rest of the UI (commits `61635802dc`,
  `c0b379917b`, `72ba25754c`, and the ETP-3747 hardening pass).

The hook also exposes `fetchMetadataMessage` which reads from the module's
own `/api/erp/meta/message` endpoint; that path is reserved for non-iframe
flows and is not used by the legacy pipeline today.

### 5.8 Error surfacing

| Failure | Where it originates | UX |
|---|---|---|
| Resolution fails (no backend, no `data.json`) | `executeProcessAction` throws `LegacyProcessUnresolvedError` | Toolbar (`Toolbar.tsx`) shows a `toast.error` with `process.legacyProcessUnresolved.{title,description}` and logs the offending button id and column name. |
| Servlet error / unresolvable target path | `writeRequestFailedForwarder` returns the `requestFailed` page | `Iframe.tsx` → `handleRequestFailed` shows `process.requestFailed.{title,text}`. |
| Iframe unloads without emitting a terminal action within 5 s | `iframeUnloaded` triggers `startFallbackCountdown` → `MESSAGE_FALLBACK_TIMEOUT_MS` (5 s) | Modal stays open; `process.fallbackMessage.{title,text}` is rendered as a warning. |
| Process succeeded but server reports an `ERROR` substring in title/text | `Iframe.handleReceivedMessage` upgrades the message type to `error` | Auto-close is suppressed (`shouldSuppressAutoClose`). |

---

## 6. End-to-end testing

E2E coverage lives under
[`client/playwright-tests/e2e/smoke/`](../playwright-tests/e2e/smoke/).
Representative tests that exercise the legacy pipeline:

| Test | Buttons under test |
|---|---|
| `01_Sales/SALdCloseSalesOrderTest.spec.ts` | DocAction (`Close`) on Sales Order |
| `03_Procurement/PROaOrderToInvoiceTest.spec.ts` | DocAction (`Complete`) on Purchase Order, CreateFrom on Sales Invoice |
| `05_Financial/FINdPaymentProposalTest.spec.ts` | Process Payment Proposal, Execute Payment (uipattern=M) |
| `03_Procurement/PROd_CreateRequisitionAndOrder.spec.ts` | Post Requisition, Process Order |
| `07_LinkedItems/LNKaLinkedItemsNavigationTest.spec.ts` | Posted button + linked-item navigation |

The companion document `legacy-process-testing.md` (project root) lists the
full 270-button matrix and the 38 representative cases QA exercises before
release.

---

## 7. Configuration

| Knob | Default | Where it lives | Effect |
|---|---|---|---|
| `etendoClassicHost` runtime config | `"http://localhost:8080/etendo"` | `RuntimeConfigContext` | Base URL the iframe POSTs to. **Must** point at Tomcat directly so the JSESSIONID cookie is accepted on the follow-up; routing through the Next.js proxy breaks the session. |
| `MetadataFilter` `forwardPath` init param | `"/forward/"` | `web.xml` of the deployed module | Path prefix that the filter routes to `ForwarderServlet` instead of `LegacyProcessServlet`. Unused by the legacy iframe path; documented for completeness. |
| `MESSAGE_FALLBACK_TIMEOUT_MS` | `5000` (ms) | `Iframe.tsx` | Maximum time the modal waits for any postMessage before showing the fallback warning. |
| `PROCESS_MESSAGE_FETCH_ATTEMPTS` / `PROCESS_MESSAGE_RETRY_DELAY_MS` | `3` / `500` | `useProcessMessage.ts` | Retry policy for the polling fallback. |
| `NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES` env var or `localStorage.DEBUG_MANUAL_PROCESSES = 'true'` | unset | reader: `logger` calls in `utils.ts` and the hook | Enables verbose `[MANUAL_PROCESS]` logs (resolution source, full URL, params map). |

---

## 8. Adding a new legacy process

Most new processes will be picked up automatically by `LegacyProcessResolver`;
the typical workflow only involves verifying it works.

**Happy path:**
1. Create the Classic process in the Application Dictionary as usual.
2. Open the window in the new UI and click the button.
3. If it opens correctly, you are done. The backend resolver detected it via
   `isLegacy` and `LegacyProcessParams` were returned in the metadata.

**If the button does not open** (`LegacyProcessUnresolvedError` toast):

1. Toggle the `[MANUAL_PROCESS]` debug logs and inspect what the resolver
   returned. Common causes:
   - The process has neither `Classname` nor a `AD_MODEL_OBJECT_MAPPING` row
     with `action ∈ {P, R}`. Add one.
   - The tab has no key column flagged in `AD_Column.IsKey`. Add one.
   - The window has `em_obuiapp_process_id` set on the column — that goes
     through Process Definition, not the legacy iframe; this doc does not
     apply.
2. As a tactical patch, add a `data.json` entry (Section 5.2) so users are
   unblocked immediately. Open a follow-up to fix the resolver afterwards.

**Adding a new postMessage action** (rare):
1. Update `LegacyMessageProtocol.java` (backend) and
   `legacyMessageProtocol.ts` (frontend) in lockstep.
2. Update Section 5.6 above.
3. If the new action mutates backend state, **also add origin filtering** in
   `Iframe.tsx` — see the comment block above `handleMessage`.

---

## 9. File reference

### Backend (`erp/modules/com.etendoerp.metadata`)

| File | Role |
|---|---|
| `src/com/etendoerp/metadata/builders/LegacyProcessResolver.java` | `isLegacy(field)` + `resolve(field)` and the URL/command/key/additional-params helpers. |
| `src/com/etendoerp/metadata/builders/LegacyProcessParams.java` | Immutable value object; `toJson()` writes the four required keys + optional `additionalParameters`. |
| `src/com/etendoerp/metadata/builders/ProcessActionBuilder.java` | Calls `LegacyProcessResolver.resolve` and merges the JSON into the field's `processAction`. |
| `src/com/etendoerp/metadata/builders/FieldBuilderWithColumn.java` | Calls `LegacyProcessResolver.isLegacy` to decide whether to populate `processAction`. |
| `src/com/etendoerp/metadata/utils/Constants.java` | `LEGACY_*` JSON keys consumed by `LegacyProcessParams.toJson`. |
| `src/com/etendoerp/metadata/utils/LegacyUtils.java` | `getLegacyProcess(fieldId)` stub; `isLegacyPath`; `isMutableSessionAttribute`. |
| `src/com/etendoerp/metadata/http/MetadataFilter.java` | `/meta/*` filter; routes `*.html` → `LegacyProcessServlet`. |
| `src/com/etendoerp/metadata/http/LegacyProcessServlet.java` | Iframe HTML pipeline: auth, dispatcher include/forward, capture, inject, popup short-circuit, error forwarder. |
| `src/com/etendoerp/metadata/http/HttpServletRequestWrapper.java` | Anonymous-subclass helper used for path/header/parameter overrides. |
| `src/com/etendoerp/metadata/http/HttpServletResponseLegacyWrapper.java` | Captures the response body, absorbs redirects, no-ops `setContentLength`. |
| `src/com/etendoerp/metadata/http/LegacyMessageProtocol.java` | Centralized postMessage envelope and action constants. |

### Frontend (`client/packages/MainUI`)

| File | Role |
|---|---|
| `hooks/Toolbar/useProcessExecution.ts` | Orchestrates `executeProcessAction` (legacy) and `executeProcessDefinition` (modern). |
| `hooks/useProcessMessage.ts` | Polling client for `GetTabMessageActionHandler`. |
| `contexts/language.tsx` | Source of the `language` value used by `useProcessMessage`. |
| `contexts/RuntimeConfigContext.tsx` | Source of `etendoClassicHost`. |
| `utils/processes/manual/utils.ts` | `resolveLegacyProcessData`, `getParams`, `columnNameToInpKey`, placeholder parser. |
| `utils/processes/manual/types.ts` | `ProcessActionData`, `GetParamsProps`. |
| `utils/processes/manual/constants.ts` | Static keys and default fallbacks. |
| `utils/processes/manual/data.json` | Empty by default; tactical fallback mapping. |
| `utils/processes/manual/errors.ts` | `LegacyProcessUnresolvedError`. |
| `components/ProcessModal/Iframe.tsx` | Modal wiring, fallback timer, postMessage listener, message-type styling. |
| `components/ProcessModal/legacyMessageProtocol.ts` | Mirrors `LegacyMessageProtocol.java`. |
| `components/Toolbar/Toolbar.tsx` | Surfaces legacy errors as toasts and feeds the `iframeUrl`/`iframeFormParams` into the modal. |

### Shared component library

| File | Role |
|---|---|
| `packages/ComponentLibrary/src/components/Modal/CustomModal.tsx` | Hidden POST form + named-target iframe used by `ProcessIframeModal`. |

### Reference specs (project root)

| File | Role |
|---|---|
| `all-feature-section-2.md` | Source spec — taxonomy of legacy buttons (Sections 2.B.1–2.B.9). |
| `legacy-process-testing.md` | QA matrix: all 270 legacy buttons + the 38 representative cases. |

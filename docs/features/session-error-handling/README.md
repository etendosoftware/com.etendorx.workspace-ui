# Session and server errors

Jira: ETP-6311 (follows ETP-2303, which introduced the response interceptor).

A server error no longer closes the session. Only an explicit authentication failure (HTTP 401) sends
the user back to the login; any other server error is shown in a toast and the user keeps working on the
same screen with their data.

## Behavior

Every response of the API clients (metadata, datasource, Copilot) and of the requests made through
`sessionAwareFetch` goes through one rule, `classifySessionResponse`:

| Response | Action |
|---|---|
| `X-Etendo-Error-Code: PasswordExpired` | Close the session with the expired-password message ([Expired password](../expired-password/README.md)) |
| `401` | Close the session. The message is "session expired" when the token had expired, the generic one otherwise |
| `5xx` | Show the `errors.internalServerError` toast. The session stays open |
| Anything else (`403`, `404`, `409`…) | Nothing: the screen that made the request handles it |

- **No duplicated messages.** A request marked `handlesOwnError` never shows the toast, because its
  screen already shows the failure (grid error, form save, process result…). An authentication failure
  still closes the session.
- **One notice.** The toast has a fixed id (`server-error`): a burst of failures replaces one notice.
- **One logout.** `logout()` clears the token synchronously, so the rest of a burst of rejected requests
  finds no session left to close.
- While the password is expired, nothing is applied: the backend rejects the data plane with 401 on
  purpose ([Expired password](../expired-password/README.md)).

### Which requests handle their own error

| Requests | Why |
|---|---|
| Every call of `Metadata.kernelClient`, `Metadata.datasourceServletClient` and `datasource.client` (client setting) | Grid load, form save, delete, inline save, callouts, form and process initialization show their own error |
| Window metadata | Not-found / access-denied screen |
| Dashboard layout, widget classes, widget data | Each widget and the layout show their own error; the layout is also refreshed silently |
| Process monitor, instance purpose, form personalization | Background polling, or modals with their own error state, or a silent fallback |
| Processes, reports and saved views (`sessionAwareFetch`) | The modal, report or saved-views menu shows the failure |
| Email configuration and sending, RX services initialization, SSO account link | Their own error toast (and the page text, for the SSO link) |
| Tab message after a legacy process | The process modal shows its fallback message; the request is retried up to eight times |
| Image upload and its cleanup | The image selector's own toast; the cleanup of a rejected upload is silent by design |
| Record images (`ShowImage`) | The field shows the image as missing, as Classic shows a broken image |
| Warehouse process scan and process actions | Shown inline by the process (`createCallAction(..., { handlesOwnError: true })`) |
| Opening a tab from a warehouse process result | Falls back to opening the tab directly |

Every other request shows the toast on a server error. That includes requests that failed silently
before (menu, labels, preferences, notes, attachments, dashboard mutations, the record attachments of the
email, the print of a document, the warehouse `onLoad` lookups).

## How the server answers

Verified on a local installation with real requests, sending no token and an invalid one:

| Service | No token | Invalid / expired token, before | After |
|---|---|---|---|
| `/sws/*` (metadata, datasource forward, Secure Web Services kernel, Copilot) | 401, empty | 401, empty | unchanged |
| `/attachments`, `/notes` | 302 to the login | 500, empty | 401 JSON |
| Direct `org.openbravo.service.datasource`, `org.openbravo.client.kernel` | 200, JavaScript redirect to the login | 200, empty | 401 JSON |
| Revoked token on `/attachments`, `/notes`, direct datasource and kernel | — | accepted | 401 JSON |
| Expired password on `/sws/…meta/*` and `/sws/…forward/*` | — | 500, XML | 401 JSON `PasswordExpired` |
| `/utility/*` (`ShowImage`, `ImageInfoBLOB`, `ReferencedLink`) | 302 to the login | 500, empty | 401 JSON |
| `meta/legacy/*` (Classic pages in iframes) | 200 HTML | 200 HTML `requestFailed` | unchanged (see Decisions) |

Access problems no longer answer 401, so a 401 always means "authentication":

| Case | Before | After |
|---|---|---|
| Role without access to a window (`WindowBuilder`) | 401 | 403 |
| Role not allowed to create or modify a shared saved view | 401 | 403 |

## Decisions

- **Classic as the reference.** In Classic an invalid session is an explicit signal to go to the login
  (`BaseKernelServlet` answers `window.location.href = …`), a missing permission is a message in the
  view (`AccessTableNoView`, status 200 / `-4`), and a server error is a popup. None of the last two ever
  closes the session. The new UI uses the 401 as that explicit signal, which is why the authorization
  answers moved to 403.
- **The 401 is produced in the metadata module, not in core.** `/sws/*` already answers 401 through the
  Secure Web Services servlet. The Classic servlets the new UI calls with its Bearer token are covered
  by a new filter (`BearerTokenGuardFilter`) that only acts when a request carries a Bearer token: Classic
  uses the session cookie and is not affected. The filter uses the same token decoder as the Classic
  authentication manager, so the only tokens it rejects that worked before are revoked ones.
- **`meta/legacy` keeps its answer.** Those are Classic pages loaded in iframes; on a failure they post
  `requestFailed` to the parent window and the process modal shows its own message. A JSON 401 inside the
  iframe would be worse, and the next request of the application closes the session anyway.
- **Expired password writes its 401.** Throwing from the guard reached the Secure Web Services servlet,
  which turned it into a 500, so the client could not recognize it.
- **Opt-out, not opt-in, for the toast.** Requests that do not show their own error now show the toast.
  Screens that do are marked explicitly, so the decision is visible at each call.
- **`/api/datasource` keeps the 401** of a token the ERP rejects even after the session recovery
  ([Session recovery](../session-recovery/README.md)); before, it became a 500 and was never acted on.
  A non-session ERP error on that route is still answered with a 200 and its error body, which the grid
  shows.
- **Copilot keeps the 401.** Its other errors are still answered with 404 ("not installed").
- **Printing goes through the ERP proxy** (`/api/erp/sws/com.etendoerp.etendorx.print`) instead of calling the
  ERP host from the browser, as every other request does (Client → Next API → ERP). The print service only
  needs the token, and the proxy forwards the PDF as a binary file with its file name. A server that cannot
  generate the PDF answers a text message with a 200: before it was downloaded as a broken `document.pdf`, now
  it is a server error with its toast.
- **The tab message stays a direct call.** `GetTabMessageActionHandler` reads the message the legacy process
  left in the Classic HTTP session of its iframe, which is loaded directly from the ERP host; the proxy uses
  another session and would never find it. The ERP answers its 401 with the CORS headers, so the browser still
  sees the status and the rule applies.

## Differences with Classic

- Classic shows server errors in a modal popup; the new UI uses a toast.
- A role without access to a window gets an access-denied screen instead of the Classic message bar.

## Not covered on purpose

- Requests made before there is a session: the SSO configuration and callback of the login (`useSSO`), the
  forced login URL and the runtime configuration (`/api/config`, which does not reach the ERP).
- Infrastructure checks (`utils/health-check.ts`).
- Unused code: the `executeProcess` server action (`app/actions/process.ts`, only imported as a type) and
  `fetchMetadataMessage` (`useProcessMessage.ts`, only used by its tests). A server action runs on the Next
  server, where the rule does not apply; its caller would have to apply it to the status it returns.

## Tests

- Unit tests: `sessionResponsePolicy`, `sessionAwareFetch`, the user provider (`user.test.tsx`), the client
  option (`client.test.ts`), the proxies (`sessionFailureStatus`, `route.helpers`, datasource session
  recovery) and, in the module, `BearerTokenGuardFilterTest` and `BaseWebServiceGuardTest`.
- End to end: `playwright-tests/e2e/smoke/12_Session/SESbServerErrorKeepsSessionTest.spec.ts` (`@smoke`, about
  20 s). It simulates a 500 and a 401 on one request (`answerWithStatus`), also on a request made outside the API
  clients (the email configuration), forges an expired token, and checks the grid's own error replaces the toast.
  Making a 500 close the session again makes it fail.
- End to end: `playwright-tests/e2e/smoke/10_Grid/GRDkToolbarPrintTest.spec.ts` (`@smoke`, about 15 s). Print
  goes to the ERP proxy and downloads the PDF (simulated: generating it depends on the server compiling the
  Jasper report), and a failed print shows the toast. Calling the ERP host directly again makes both fail.
- In each migrated call site, a unit test checks the `handlesOwnError` flag it sends, through the shared mock
  `utils/tests/sessionAwareFetchMock.ts`.

## Main files

| File | Role |
|---|---|
| `MainUI/utils/session/sessionResponsePolicy.ts` | The rule: classification, handler registry, client interceptor |
| `MainUI/utils/session/sessionAwareFetch.ts` | The same rule for requests made outside the API clients |
| `MainUI/hooks/useAuthenticatedImage.ts`, `ImageSelector.tsx` | Failed state of a record image and its missing-image placeholder |
| `MainUI/components/window/Tab.tsx` | Print through the ERP proxy |
| `MainUI/contexts/user.tsx` | Registers the handler: logout with its message, or the toast |
| `api-client/src/api/client.ts` | `handlesOwnError` request option and client setting, passed to the interceptor |
| `MainUI/app/api/_utils/sessionFailureStatus.ts` | Keeps the 401 in `/api/datasource` |
| `MainUI/app/api/erp/[...slug]/route.helpers.ts` | `resolveErpErrorStatus`: Copilot keeps the 401 |
| `com.etendoerp.metadata/http/BearerTokenGuardFilter.java` | 401 for an unusable Bearer token on Classic servlets |
| `com.etendoerp.metadata/http/BaseWebService.java` | 401 JSON for a revoked token and an expired password |

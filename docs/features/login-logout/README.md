# Login and Logout: Clean Session Start, Classic Default Role and Login Protections

Three guarantees of the New UI around login and logout:

1. **A new session never shows anything of the previous one.** After a logout, voluntary or forced,
   logging in again in the same browser tab (without reloading) starts with no windows, records,
   form state or cached data of the previous user.
2. **The initial role is the same as in Classic.** A user who logs in without choosing a role gets
   the role, organization, client and warehouse the Classic login would select.
3. **The login is protected and audited like in Classic.** Failed attempts delay the next answer and
   can lock the user, and every attempt is recorded in the Classic session registry (`AD_Session`).

Jira: ETP-6019, ETP-6005.

## Logout: session reset

### Behavior

`logout()` in [`contexts/user.tsx`](../../../packages/MainUI/contexts/user.tsx) runs on every logout
path: the user menu, an expired session (keep-alive), the 401/500 interceptor, a failed save and the
expired-password screen. Besides clearing the user store and the client tokens, it now:

- calls `resetSessionState()` ([`utils/session/resetSessionState.ts`](../../../packages/MainUI/utils/session/resetSessionState.ts));
- sends the token it held to `/api/auth/logout`, so the backend revokes it.

`resetSessionState()` clears:

| State | How |
|---|---|
| Open windows, tabs, form mode/record, selection, dirty flags | `useWindowStore.cleanState()` |
| Live tab values, unsaved-changes request, toolbar state, dashboard | the store goes back to its initial state (`getInitialState()`) |
| Form personalization, process monitor | their own `reset()` |
| Datasource response cache, prefetched responses | `datasource.clearCache()`, `prefetchStore.clear()` |
| Windows kept in the URL (`wi_N`, `ti_N`, `ri_N`) | the query string is dropped; the route is kept |
| Module-level caches: toolbar buttons, tab graph, restored column configurations, grid configurations and their pending saves | each module registers its cleanup with `registerSessionReset()` |

The login screen messages written after a forced logout ("session expired", "logged out") are kept:
they live in the user store and are written right after `logout()`.

### Decisions

- **Explicit reset instead of a full page reload.** A reload would also drop the login screen
  messages of a forced logout and is more abrupt. Every logout already goes through `logout()`, so a
  single reset there covers all of them.
- **Self-registered cleanups.** Caches that live in hooks or contexts register their own cleanup, so
  `resetSessionState` does not import those modules (no circular imports with the user context), and
  a new cache only needs one `registerSessionReset(() => cache.clear())` line next to it.
- **What is kept:** metadata caches keyed by role and language, and per-browser UI preferences
  (density, drawer state, expanded menu items). They hold no data of the previous user.
- **Token revocation.** `logout()` clears the clients' token before calling the backend, so the token
  is captured first and passed to `logout(token)` in the api-client. Before this change the request
  carried an empty Bearer header and `/api/auth/logout` answered 401 without revoking anything.

## Login: Classic default role

### The Classic rule

`LoginUtils.getLoginDefaults(userId, "", connectionProvider)` (core):

| Value | Rule |
|---|---|
| Role | the user's default role when active and assigned to the user; otherwise the lowest role id among the user's active roles (`isrestrictbackend = 'N'`) |
| Organization | the user's default organization when the role has access to it; otherwise the highest organization id the role has access to |
| Client | the user's default client when valid for the role; otherwise the role's client |
| Warehouse | the user's default warehouse; otherwise the lowest warehouse id of the organization (empty if it has none) |

### Why the New UI differed

The password login goes Next `/api/auth/login` → core `/sws/login` (`com.smf.securewebservices`).
Without a role in the request it takes the first entry of `user.getADUserRolesList()`, a list with
no defined order, and the first role organization the same way. `com.smf.securewebservices` is part
of the core, so it is not modified.

### Behavior

- **Backend** (`com.etendoerp.metadata`): `LoginDefaultsResolver` resolves the Classic defaults by
  calling `LoginUtils.getLoginDefaults`. It is used by:
  - `GET /meta/login-defaults` (`LoginDefaultsService`): returns
    `{ role, organization, warehouse, client, current }` for the caller's token, where `current`
    tells whether the token already uses them. `warehouse` is omitted when there is none.
  - `/meta/login` (`LoginService`) when the request has no role (it used to fail without a default
    role). An organization or warehouse in the request still wins.
  - the SSO callback (`SSOService`), which used the raw user defaults.
- **Next API** ([`app/api/auth/login/route.ts`](../../../packages/MainUI/app/api/auth/login/route.ts)):
  after a successful username/password login **without a role**, it calls `/meta/login-defaults`
  with the new token. When `current` is `false`, it switches the token through `/sws/login` with
  `{ role, organization, warehouse }` (the same role switch the profile modal uses, which keeps the
  classic `JSESSIONID` in sync) and hands the ERP session over to the new token. If the default
  organization has no warehouse (`SMFSWS_OrgHasNoRole`), it falls back to `/meta/change-profile`, as
  role switches already do.
- **Best-effort:** any failure while aligning keeps the original login, so it can never block a login.
  Profile changes always send a role and are not affected.

### Differences with Classic

- Secure Web Services' "Default WS Role" of the user is ignored by the New UI login; the Classic rule
  applies, so both UIs always start with the same role.
- The alignment costs one extra request per login, and a role switch only when the role differs.

## Login: failed attempts and session registry

### The Classic behavior

The Classic login checks the password through `LoginUtils.getValidUserId`, which uses `UserLock`:

- the answer is delayed by `login.trial.delay.increment` seconds per failed attempt of the username
  since its last successful login, up to `login.trial.delay.max`;
- a locked user (`AD_User.ISLOCKED`) is refused even with the right password;
- after `login.trial.user.lock` failed attempts the user is locked.

Every attempt is recorded in `AD_Session`: `F` for a failure (wrong password or locked user), `S`
for a success. `UserLock` counts the `F` rows of the username, so the records are what makes the
delay and the lock work. The session is marked inactive when it ends.

### Why the New UI differed

`/sws/login` (`com.smf.securewebservices`, core) only checks the password: no delay, no lock, no
record. `/meta/login` and the SSO callback did not record anything either.

### Behavior

- **Backend** (`com.etendoerp.metadata`):
  - `LoginAttemptGuard` applies `LoginUtils.getValidUserId` and records a failed attempt as `F`.
    The refusal carries the Classic message: `LOCKED_USER_MSG` when the password alone is right,
    `IDENTIFICATION_FAILURE_TITLE` otherwise.
  - `LoginSessionRegistry` records an attempt (the logic of the `protected`
    `AuthenticationManager#createDBSession`) and closes a session of the caller's user.
  - `POST /meta/login-guard` (no token) runs the guard on `{ username, password }`.
  - `POST /meta/login-session` (token) records the `S` session of the token's user and returns its id.
  - `/meta/login` runs the guard and records the `S` session; the SSO callback records it too. Both
    return the `sessionId` next to the token.
  - `/meta/logout` closes the session named by `{ sessionId }`, if the session belongs to the token's
    user.
- **Next API**:
  - [`app/api/auth/login/route.ts`](../../../packages/MainUI/app/api/auth/login/route.ts): a request
    with credentials goes through `/meta/login-guard` first. A 401 answers the login with the guard
    message (shown under "Login failed") and `/sws/login` is not called. After the login (and the
    Classic defaults alignment) the final token gets its session: the `sessionId` of `/meta/login`,
    or a new one from `/meta/login-session` for a `/sws/login` token. A role switch keeps the session
    of the token it replaces.
  - [`app/api/auth/sso/[...slug]/route.ts`](../../../packages/MainUI/app/api/auth/sso/[...slug]/route.ts)
    keeps the `sessionId` of the SSO callback.
  - The session id is kept on the server, next to the ERP session material of the token
    ([`app/api/_utils/sessionStore.ts`](../../../packages/MainUI/app/api/_utils/sessionStore.ts)), and
    moves with it on renewal and role switches (`handOffErpSession`). It is never sent to the browser.
  - [`app/api/auth/logout/route.ts`](../../../packages/MainUI/app/api/auth/logout/route.ts) sends it
    to `/meta/logout` with the token revocation.

### Decisions

- **A guard call before `/sws/login`.** `/sws/login` belongs to the core and is not modified. It is
  still the endpoint that issues the token and syncs the classic `JSESSIONID`, so the protections run
  in a separate call made right before it.
- **Only an explicit refusal blocks the login.** If the guard is unreachable or answers anything but
  401 (for example an older `com.etendoerp.metadata`), the login goes on: `/sws/login` stays
  reachable on its own, so failing closed would add no protection and would lock everyone out on a
  version mismatch.
- **The successful session is recorded once the final token exists**, not by the guard, so a login
  that fails afterwards, or the `/meta/login` fallback, does not leave an extra active session.
- **Recording the session never blocks a login or a logout** (best-effort), as in Classic.
- **SSO does not check the lock**, like the Classic SSO login.

### Differences with Classic

- A direct call to `/sws/login` (outside the New UI) is not protected: it is a core endpoint.
- `REMOTE_ADDR`/`REMOTE_HOST` of the New UI sessions are the ones of the Next server, which is who
  calls the ERP; the user's address is not trusted from a header on an unauthenticated endpoint.
- Classic closes a session when its HTTP session ends. A New UI session is closed on logout; one that
  is never logged out (closed tab, expired token) stays active until Classic's own cleanup of stale
  sessions.
- With an expired password Classic records the attempt as `F`; the New UI records no session until
  the password is changed and the user logs in again.
- The `/meta/login` fallback (organization without warehouses) runs the guard again, so the delay of
  previous failed attempts applies twice in that rare case.

## Configuration

The failed-attempt protections use the Classic configuration in `Openbravo.properties`; nothing
specific to the New UI:

| Property | Meaning | Default in the template |
|---|---|---|
| `login.trial.delay.increment` | seconds added to the answer per failed attempt | `0.2` |
| `login.trial.delay.max` | maximum delay in seconds (`0`: no limit) | `3` |
| `login.trial.user.lock` | failed attempts before locking the user (`0`: never) | `0` |

A locked user is unlocked from the User window in Classic (the "Locked" flag). The properties are
read once, so changing them needs a Tomcat restart.

## Main files

| Repository | File |
|---|---|
| client | `packages/MainUI/contexts/user.tsx` (`logout`) |
| client | `packages/MainUI/utils/session/resetSessionState.ts` |
| client | `packages/api-client/src/api/authentication.ts` (`logout(token)`) |
| client | `packages/MainUI/app/api/auth/login/route.ts` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/auth/LoginDefaultsResolver.java` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/service/LoginDefaultsService.java` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/service/LoginService.java`, `SSOService.java` |
| client | `packages/MainUI/app/api/auth/logout/route.ts`, `packages/MainUI/app/api/auth/sso/[...slug]/route.ts` |
| client | `packages/MainUI/app/api/_utils/sessionStore.ts`, `packages/MainUI/app/api/_utils/erpSession.ts` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/auth/LoginAttemptGuard.java`, `LoginSessionRegistry.java` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/service/LoginGuardService.java`, `LoginSessionService.java`, `LogoutService.java` |
| com.etendoerp.metadata | `src/com/etendoerp/metadata/http/UnauthenticatedLoginServlet.java` |

## Related documentation

- [UserContext](../../contexts/user-context.md)
- [URL State Recovery](../url-state-recovery.md)
- [Session keep-alive](../session-keep-alive.md)
- [Session recovery](../session-recovery/README.md)

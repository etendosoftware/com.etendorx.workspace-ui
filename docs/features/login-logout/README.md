# Login and Logout: Clean Session Start and Classic Default Role

Two guarantees of the New UI around login and logout:

1. **A new session never shows anything of the previous one.** After a logout, voluntary or forced,
   logging in again in the same browser tab (without reloading) starts with no windows, records,
   form state or cached data of the previous user.
2. **The initial role is the same as in Classic.** A user who logs in without choosing a role gets
   the role, organization, client and warehouse the Classic login would select.

Jira: ETP-6019.

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

## Configuration

None.

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

## Related documentation

- [UserContext](../../contexts/user-context.md)
- [URL State Recovery](../url-state-recovery.md)
- [Session keep-alive](../session-keep-alive.md)
- [Session recovery](../session-recovery/README.md)

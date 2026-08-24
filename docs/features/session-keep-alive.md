# Session Keep-Alive (ETP-4618)

How the new UI keeps a session alive while the user is working, and lets it expire when they are not.

## Problem

The JWT issued to the new UI never expired: the ERP only adds the `exp` claim when
`SMFSWS_Config.Expirationtime > 0`, and that value shipped as `0`. A logged-in user was therefore
never logged out and the token was never renewed. Turning expiration on without anything else would
swing to the opposite failure: an active user would be evicted mid-task the moment the fixed
lifetime elapsed.

## The model, and where it comes from

Etendo Classic already solves this, and the new UI mirrors it:

| Piece | Classic | New UI |
|---|---|---|
| Window | `<session-timeout>60</session-timeout>` in `WebContent/WEB-INF/web.xml` | The JWT's own `exp`, from `SMFSWS_Config.Expirationtime` |
| Sliding | `SessionExpirationFilter` pushes `session.expirationDate` forward on every request | The token is re-issued shortly before `exp` |
| Background opt-out | The 50 s alert ping sends `IsAjaxCall=1&ignoreForSessionTimeout=1`, so it does **not** extend the session | Activity is measured from DOM input events, never from network traffic |
| Expiry | `AuthenticationManager` redirects to the login page | `logout()` plus a "session expired due to inactivity" message on the login screen |

The Javadoc of `SessionExpirationFilter` states the intent directly: *"There are requests such as
alert ping that should not be taken into account as active request to prevent session expiration."*
That is exactly the requirement of ETP-4618.

## There is no polling

The mechanism runs a `setInterval` every `SESSION_CHECK_INTERVAL_MS` (15 s), but **that tick makes no
network request**. It only compares three numbers already held in memory: the current time, the
token's `exp` (readable straight out of the JWT, no server round-trip), and the timestamp of the last
user interaction.

One network call happens, and only when both conditions hold: the token is within
`SESSION_REFRESH_LEAD_MS` of expiring **and** the user interacted since the current token was issued.
In practice a user working an eight-hour day with a 60-minute token produces about eight renewal
requests all day; a user who walked away produces none.

A short repeating tick is used instead of one long `setTimeout` because browsers throttle timers in
background tabs and a suspended laptop fires long timers arbitrarily late. A tick that re-reads
`Date.now()` on every pass handles sleep, tab throttling and clock jumps with no extra logic: on
wake, the first tick observes that the deadline has passed and closes the session.

## Flow

```
[DOM input events] ──► lastActivityAt (ref, no re-render)
                            │
        tick (15 s, no I/O) ─► decideSessionAction(...)
                            │
          ┌─────────────────┼──────────────────┐
       "none"           "refresh"           "expire"
                            │                   │
              POST /api/auth/refresh     logout() + message
                            │
       Next.js API ──► ERP POST /sws/login (Bearer, empty body)
                            │
              hand the ERP session over to the new token
                            │
              applySilentToken(newToken)  ← does not re-verify the session
```

## Files

| File | Role |
|---|---|
| `packages/MainUI/utils/session/token.ts` | Reads `exp` out of the JWT. Returns `null` when there is none — the master switch. |
| `packages/MainUI/utils/session/activity.ts` | Subscribes to real user input events. |
| `packages/MainUI/utils/session/decideSessionAction.ts` | Pure decision function: `none` / `refresh` / `expire`. |
| `packages/MainUI/hooks/useSessionKeepAlive.ts` | Wires the above together; one renewal in flight at a time; cross-tab sync. |
| `packages/MainUI/contexts/user.tsx` | Applies the renewed token silently, and handles expiry. |
| `packages/MainUI/app/api/auth/refresh/route.ts` | Proxies the renewal to the ERP. |
| `packages/MainUI/app/api/_utils/erpSession.ts` | Moves the ERP JSESSIONID/CSRF across to the new token. |
| `packages/MainUI/constants/config.ts` | `SESSION_CHECK_INTERVAL_MS`, `SESSION_REFRESH_LEAD_MS`. |

## Two things that are easy to get wrong

**The renewal must not re-verify the session.** `verifySession` in `contexts/user.tsx` is keyed on
`[token]` and raises the full-screen `SessionLoading` gate, which replaces the app tree. A naive
`setToken(newToken)` would therefore unmount everything the user was working on. `applySilentToken`
records the token in `lastVerifiedTokenRef` *before* storing it, so the effect returns early. Login,
boot and role switches are untouched, because only the keep-alive sets that ref.

**The ERP session store is keyed by the JWT.** `app/api/_utils/sessionStore.ts` maps the token to the
ERP `JSESSIONID` and CSRF token. A renewal produces a new token, so the entry must be moved across
(`handOffErpSession`) or every later `/api/datasource` and `/api/erp` call silently loses its ERP
session. Note that `setErpSessionCookie` mints a *new* CSRF token when handed a null one, so the
existing value has to be carried over explicitly.

## Configuration

| Setting | Where | Suggested |
|---|---|---|
| Token lifetime | `SMFSWS_Config.Expirationtime`, in the *Secure web services configuration* tab of the *Client* window (System Administrator) | `60` minutes, matching Classic's `session-timeout`. Range 0–99. |
| Evaluation cadence | `SESSION_CHECK_INTERVAL_MS` | 15 000 ms |
| Renewal lead time | `SESSION_REFRESH_LEAD_MS` | 60 000 ms |

With `Expirationtime = 0` the token carries no `exp`, `getTokenExpiration` returns `null`, and the
mechanism registers no listeners, no interval and makes no request. Shipping the code changes nothing
until an administrator turns expiration on.

Two operational notes: `Expirationtime` is instance-wide, so it also affects mobile apps, EtendoRX and
any other SWS consumer — coordinate before changing it. And tokens issued before the change carry no
`exp`, so users already logged in keep a non-expiring token until they log in again.

Do not set a lifetime below roughly 5 minutes: the renewal lead time is a fixed 60 seconds, so a very
short lifetime would leave almost no window in which a renewal is not already due.

## Note for whoever implements the alerts badge (SEC-32)

Its polling **cannot** keep a session alive and needs no coordination with this feature. Activity is
read from DOM input events (`pointerdown`, `keydown`, `wheel`, `touchstart`) and never from network
traffic, so background requests — the Copilot SSE stream, dashboard widget auto-refresh, process
polling, the health check, alerts polling — are structurally incapable of extending the window. This
is the same guarantee Classic gets from `ignoreForSessionTimeout`, obtained by construction instead of
by remembering to flag each caller.

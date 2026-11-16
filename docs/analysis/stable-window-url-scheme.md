# Stable window identifiers in the URL (idea, not scheduled)

Status: idea, not started. Written while implementing ETP-6001 (browser Back/Forward).

## Problem

The URL mirrors the open windows by **position**: `wi_0`, `ti_0`, `ri_0`, `wi_1`, ... When a window is
closed, the windows after it move down one position, so the URL of the same window changes
(`wi_0=SO&wi_1=PROD` becomes `wi_0=PROD`).

The browser history entries written earlier keep the URL they had when they were created, so they
point to a layout that no longer exists. When the user goes Back or Forward to one of them:

1. The browser restores the old URL (it mentions the closed window, or no window at all).
2. Next.js applies it, then `WindowProvider` rewrites it with the windows that really exist.

Result: the address bar flickers for 100 to 300 ms per step. It was recorded in the "close a window in
the middle of the history" case of ETP-6001:

| Action | URL changes seen |
|---|---|
| Open Sales Order, Home, open Product | `wi0:SO`, `wi0:SO`, `wi0:SO \| wi1:PROD` |
| Close Sales Order | `wi0:PROD` |
| Back 1 | `wi0:SO` for ~150 ms, then `wi0:PROD` |
| Back 2 | `wi0:SO` (skipped step), `/window` with no windows, then `wi0:PROD` |
| Forward 1 and 2 | pass through `wi0:SO` and `wi0:PROD`, end on `wi0:PROD` |

## Impact

Cosmetic only. The final URL is always right, the closed window does not come back, nothing is lost,
and navigation does not get stuck. It is only visible if the address bar is watched during the step.

The only real (very unlikely) risk is a reload (F5) in that instant; the reload still restores the real
windows.

## Real fix

Identify each window in the URL by a stable id instead of by position, for example
`w=143_1794837707811` (window id plus the identifier the store already uses), with its tab and record
tied to that id. An old history entry would then still be valid after another window is closed, and
there would be nothing to rewrite.

## What it touches (measured on `main` at 66afa6748)

About 21 files use the positional scheme:

- `contexts/window.tsx` (URL sync and history writes)
- `hooks/useGlobalUrlStateRecovery.ts` (the one-time recovery that rebuilds windows from the URL)
- `utils/url/utils.ts`, `utils/url/constants.ts` (`URL_PREFIXS`, `buildWindowsUrlParams`, `appendWindowToUrl`)
- `components/Form/FormView/Sections/LinkedItemsSection.tsx`
- `components/ProcessModal/hooks/useProcessExecution.ts`
- `components/ProcessModal/Custom/GenericWarehouseProcess/GenericWarehouseProcess.tsx`
- `utils/session/resetSessionState.ts`
- about ten unit test files, plus the Playwright flows `support/flows/navigation.ts` and
  `ADMdClientWindowSRFormViewTest.spec.ts`

## Risks

- **Existing links:** deep links and bookmarks with `wi_0=...` must keep working. Accept both formats
  for a while (read the old one, write the new one).
- **Recovery runs once** and rebuilds the windows from the URL: a mistake there breaks the initial load.
- **Linked Items and the process modals build URLs by hand.** They already broke once when their idea of
  the URL differed from the real one (ETP-6001: Next's `useSearchParams` went stale because history writes
  copied `__NA`), so they need their own tests.

## Estimate

Roughly 2 to 4 days with tests and the compatibility with the old format. This is an estimate, not
measured.

## Suggested approach if it is ever done

1. Own ticket, not part of ETP-6001.
2. Add a parser that accepts both formats and keep the writer on the old one; ship that first.
3. Switch the writer to the stable ids; keep reading the old format for a few releases.
4. Update the Playwright navigation specs and re-record the mocked recordings if their requests change.

## Related

- ETP-6001: Browser back/forward navigation between windows and records.
- `utils/window/browserHistory.ts` and `contexts/window.tsx`: the history markers this idea would simplify.

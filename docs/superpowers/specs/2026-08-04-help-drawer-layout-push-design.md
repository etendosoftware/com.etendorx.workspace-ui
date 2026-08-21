# Help drawer — layout-push architecture

> Builds on `docs/superpowers/specs/2026-08-03-help-widget-frontend-design.md` and
> `docs/superpowers/plans/2026-08-03-help-widget-frontend.md` (Tasks 1-8, already
> implemented and committed on `hotfix/ETP-4620` through commit `edddfe01d`). This doc
> covers ONLY the architecture change described below — everything else already built
> (types, `buildHelpContent`, `HelpButton`, the tab-index sidebar + scroll-spy inside
> `HelpDrawer`, translations, sanitization) stays as-is.

## Problem

`HelpDrawer` (Task 4/8) is currently overlay-based: portal-rendered via `Modal`
(`position: fixed`, `createPortal` to `document.body`), with a full-screen click-catching
backdrop (`fixed inset-0 bg-black/20`, `onClick={onClose}`). This **contradicts the original
intent** ("background UI stays usable while Help is open" — design doc, Part 2): the
backdrop currently captures every click behind the drawer, so a user can *see* the
table/grid but cannot *click into it* while Help is open — the opposite of "read Help and
work at the same time."

**User request (2026-08-04):** make the Help panel behave like the app's existing left-hand
navigation `Drawer` (`packages/ComponentLibrary/src/components/Drawer`) — a panel that
takes real layout space and **pushes** the main content area to shrink, rather than floating
on top of it. This lets the user navigate/read Help and interact with the grid/table
simultaneously, matching how the left nav drawer already behaves.

## Investigation findings (informs the design below)

- The left-nav Drawer's push mechanism is a plain flex row, not CSS Grid: the drawer is a
  real (non-`fixed`, non-portal) flex child with an animated `width`
  (`DRAWER_OPEN_WIDTH = 16.25rem` / `DRAWER_CLOSED_WIDTH = 3.5rem`,
  `transition-all duration-500`), and its sibling has `flex-1` — the browser's box model
  does the "pushing" for free (`packages/ComponentLibrary/src/components/Drawer/index.tsx:124-128`).
- That Drawer is rendered from `packages/MainUI/components/layout.tsx` (`LayoutContent`), as
  a **direct sibling** of the flex-col wrapper containing `Navigation` + `{children}`
  (the window/table content):
  ```tsx
  <div className="flex w-full h-full relative overflow-hidden">
    <Sidebar /> {/* renders <Drawer> */}
    <div className="flex flex-1 flex-col ...">
      <div className="w-full h-14 ..."><Navigation /></div>
      <div className="flex flex-1 ...">{children}</div>
    </div>
    <ProcessStackHost />
  </div>
  ```
- **`HelpAccess`/`HelpDrawer` currently render from deep inside `Navigation`**, which is
  nested *inside* the content-column wrapper — not a sibling of `Sidebar`/`{children}`. A
  component that deep cannot make a non-adjacent tree branch resize via plain CSS/flexbox.
  Achieving the same push effect requires **moving where `HelpDrawer` actually renders** —
  up into `LayoutContent`, as a new sibling — while the trigger button stays in `Navigation`.
- The left-nav Drawer's open/closed flag is local `useState` in `Drawer` itself (persisted
  only to `localStorage`, not reactive elsewhere) — there is **no existing shared
  store/context** for "is a panel open" that a new Help panel could reuse. One needs to be
  created.
- No existing responsive/mobile fallback exists for the left-nav Drawer (it always pushes,
  never becomes an overlay on narrow viewports) — this design intentionally does not invent
  one for Help either, for consistency with the existing accepted tradeoff.

## Solution

### Part 1: New Zustand store — `useHelpPanelStore`

**Location (new file):** `packages/MainUI/stores/helpPanelStore.ts`

```ts
interface HelpPanelState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

Wrap with the `devtools` middleware, matching the existing convention (e.g.
`packages/MainUI/stores/loadingStore.ts` uses `devtools(...)` from `zustand/middleware`) —
for consistency, not because this store needs debugging beyond what any other store gets.

Necessary because `HelpAccess` (trigger, stays inside `Navigation`) and the panel itself
(moves to `LayoutContent`) are in non-adjacent branches of the tree — local state or prop
drilling can't bridge that, and this app has no layout-level React Context to reuse. A small
dedicated Zustand store matches the codebase's own established pattern for this kind of
cross-tree UI state (see `windowStore`, `userStore`, `preferencesStore`, etc. — all small,
single-purpose stores, not one mega-store).

### Part 2: `HelpDrawer` moves into `LayoutContent`, becomes a real layout element

**Modify:** `packages/MainUI/components/layout.tsx` — add `HelpDrawer` as a third sibling,
after the content column:

```tsx
<div className="flex w-full h-full relative overflow-hidden">
  <Sidebar />
  <div className="flex flex-1 flex-col ...">
    <div className="w-full h-14 ..."><Navigation /></div>
    <div className="flex flex-1 ...">{children}</div>
  </div>
  <HelpDrawer /> {/* new: reads useHelpPanelStore + useMetadataContext itself */}
  <ProcessStackHost />
</div>
```

**Rewrite `HelpDrawer.tsx`:** no more `Modal`, no portal, no `position: fixed`, no backdrop.
Instead, a real flex child with an animated `width` — same mechanical pattern as the
left-nav `Drawer` (`width: isOpen ? "42rem" : "0"`, `transition-all duration-500`,
`overflow-hidden` while closed so content doesn't leak/reflow oddly during the collapse).
`HelpDrawer` now reads `isOpen` from `useHelpPanelStore` and `window` from
`useMetadataContext()` directly (previously these were passed down as props from
`HelpAccess` — now there's no parent-child relationship between them, so `HelpDrawer`
becomes self-sufficient, the same way the left-nav `Drawer`/`Sidebar` don't need window
metadata piped in from `Navigation` either).

All internal content (header, window help, tab-index sidebar, scroll-spy content pane,
sanitization) is **unchanged** — only the outer wrapper changes from
`fixed`/portal/backdrop to a real, width-animated flex child.

`HelpDrawer`'s own X-button and Escape handler now call `useHelpPanelStore().close()`
directly — it no longer receives `onClose` as a prop (there's no longer a parent-child
relationship with `HelpAccess` to pass one down from).

**Behavior change from today, worth calling out explicitly:** `HelpDrawer` now mounts
unconditionally in `layout.tsx` (previously it only rendered as a child when `HelpAccess`'s
own `shouldShowHelp` gate passed). This is safe — `buildHelpSections`/`windowHelp` already
null-guard a missing/helpless window — but a fresh implementer should know this is an
intentional shift, not an oversight: the panel itself always exists in the tree now (at
`width: 0` when closed or when there's nothing to show), only the *trigger button* in
`Navigation` is conditionally rendered.

### Part 3: `HelpAccess` becomes trigger-only

**Modify:** `packages/MainUI/components/Header/HelpAccess.tsx` — drops `HelpDrawer`
rendering and its own `open`/`useEffect` close-on-window-change logic entirely (the panel no
longer lives here, so there's nothing local left to own). Keeps: reading `window` from
`useMetadataContext()` to gate whether `HelpButton` renders at all (`shouldShowHelp`), and
now calls `useHelpPanelStore().toggle()` on click instead of local `setOpen(true)`.

**Toggle behavior (user confirmed 2026-08-04):** clicking the Help icon again closes the
panel — it's a toggle, not just an "open" trigger. `HelpButton` itself doesn't need to
change (it's still a dumb `onClick` prop); `HelpAccess` just wires that click to
`toggle()` instead of `open()`.

**Close-on-window-change:** the original rule ("if the active window changes while Help is
open, close it") still applies. Home it in `HelpDrawer` (a `windowId`-keyed effect, same
shape as the current `HelpAccess` one, just moved) — per Part 2, `HelpDrawer` is now the
component with direct access to both `isOpen` (via the store) and the active window (via
`useMetadataContext()`), so it's the natural, sole owner of this rule; no other component
needs to be involved.

**Close affordances now:** the explicit close (X) button, Escape key, and the toggle button
itself. **Click-outside-to-close is intentionally dropped** — there is no more "outside"
being covered once the panel takes real layout space instead of floating over content; this
mirrors the left-nav Drawer's own behavior (it has no click-outside-to-close either, since
nothing is covered).

### Part 4: Escape-to-close

Since `Modal` is no longer reused, `HelpDrawer` needs its own minimal Escape-key handling
(a small `useEffect` with a `document.addEventListener("keydown", ...)`, scoped to only
attach while `isOpen` is true). This is a few lines — not worth extracting a shared
hook/primitive for a single consumer (same YAGNI reasoning as the original decision not to
build a generic `Drawer` primitive).

## What is NOT changed

- `buildHelpContent.ts` (ordering/filtering logic) — untouched.
- `HelpButton` (ComponentLibrary presentational component) — untouched, still a dumb
  `onClick` wrapper.
- The tab-index sidebar, scroll-spy (`onScroll`/`getBoundingClientRect`), and all
  sanitization (`sanitizeMessageHtml`, all 3 call sites) inside `HelpDrawer` — unchanged,
  just re-parented into the new non-portal wrapper.
- The existing left-nav `Drawer` component itself — not modified; only its *pattern* is
  mirrored for the new Help panel.
- No responsive/mobile fallback added (consistent with the existing Drawer's own lack of
  one).
- Translation keys (`common.help`, `common.helpFor`) — untouched.
- No backend changes (still 0, unaffected by this frontend-only architecture shift).

## Test cases

### `useHelpPanelStore` (new, unit)
- `open()` sets `isOpen: true`; `close()` sets `isOpen: false`; `toggle()` flips it either
  direction.
- Initial state is `isOpen: false`.

### `HelpAccess` (rewritten)
- Still renders nothing when `shouldShowHelp(window)` is false (unchanged rule).
- Clicking the button calls `useHelpPanelStore().toggle()` (not `open()`).
- No longer owns/tests any drawer-open local state or close-on-window-change effect (moved
  out — those tests move to wherever that logic now lives, per Part 3).

### `HelpDrawer` (rewritten)
- Renders with `width: 0`-equivalent (collapsed) when `useHelpPanelStore().isOpen` is false;
  expanded width when true. (Adjust the concrete assertion to however "collapsed" is
  expressed in the implementation — e.g. a class name or inline style — once decided in the
  plan.)
- All existing content-rendering tests from Tasks 4/8 (title, sanitization, tab ordering,
  field filtering, sidebar index, scroll-spy) continue to apply unchanged in substance —
  only the mocking setup changes (mock `useHelpPanelStore` and `useMetadataContext` instead
  of receiving `open`/`window`/`onClose` as props).
- Escape key closes the panel (new: no longer inherited for free from `Modal`, must be
  directly tested here).
- **Removed**: "calls onClose when clicking the overlay" / "does not call onClose when
  clicking inside the panel" — these tested backdrop/click-catching behavior that no longer
  exists.
- Close-on-window-change (wherever it ends up living per Part 3) still has a test proving
  the panel closes when the active window changes while open.

### `layout.tsx` (integration, if this repo has layout-level tests — check before writing new
ones; may only be verifiable via the manual QA step given the file's existing test coverage)
- `HelpDrawer` renders as a sibling of the content column, not inside `Navigation`.
- Opening Help visibly shrinks the content column's available width (manual/visual
  verification — not easily unit-testable without a real browser layout engine; jsdom
  doesn't compute real layout).

## Manual QA (blocking before considering this done, same caveat as the original plan)

- Open a window with help configured, click the Help icon: panel opens by pushing the grid
  content over (not floating on top with a dimmed background).
- Click a row/cell in the grid while Help is open: it responds normally (this is the whole
  point of this rework — confirm it actually works, not just that nothing crashes).
- Click the Help icon again: panel closes (toggle).
- Press Escape: panel closes.
- Change the active window while Help is open: panel closes.
- Left nav Drawer open + Help panel open at the same time: confirm the three-way layout
  (nav Drawer | content | Help panel) doesn't visually break (content column doesn't
  collapse to zero/negative width on a typical viewport).

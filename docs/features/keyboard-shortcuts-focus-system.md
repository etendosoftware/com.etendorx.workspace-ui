# Focus System for Keyboard Shortcuts — PRD

**Date:** 2026-03-25
**Status:** Pending / Not yet implemented
**Related:** `docs/superpowers/specs/2026-03-20-keyboard-shortcuts-design.md`, branch `epic/ETP-3595`

---

## Problem

The current keyboard shortcut system (`useKeyboardShortcuts`) registers handlers at the `document` level. Every mounted component that registers a shortcut will fire simultaneously when the key is pressed.

This is benign today because FormView and Table are mutually exclusive within a single tab (the design spec explicitly relies on this). However, Etendo windows support **header + lines** layouts where both a header FormView and a lines FormView (or a lines Table) can be mounted at the same time. In that scenario:

- Pressing `Escape` triggers the escape handler on **both** the header and the lines view simultaneously.
- Pressing `Ctrl+S` saves **both** forms at once.
- Pressing `↑/↓` fires row navigation in every mounted Table.

The correct behavior is that only the **focused** view should receive and act on keyboard events.

---

## Goal

Introduce a **Focus System** — a lightweight mechanism that tracks which UI region is currently "in focus" and ensures keyboard shortcuts are only dispatched to the active (focused) region.

---

## Concepts

### Focus Region

A named, discrete area of the UI that can receive keyboard focus. Each region maps to one mounted view instance. Examples:

| Region ID | Description |
|---|---|
| `header-form` | FormView for the header/parent record |
| `lines-form` | FormView for a lines/child record |
| `header-table` | Table grid for the header tab |
| `lines-table` | Table grid for a lines tab |

Region IDs are logical identifiers — the actual naming convention is TBD during implementation.

### Active Focus

At any moment, at most **one** region is active. Only the active region's keyboard shortcut handlers execute. All other registered handlers are silenced.

### Focus Transfer

Focus moves to a region when the user interacts with it (click, touch, or programmatic focus via navigation). Navigating from a grid row into a FormView should automatically transfer focus to that FormView.

---

## Proposed Behavior

### Escape

| Situation | Current behavior | Expected behavior with Focus System |
|---|---|---|
| Header FormView + Lines FormView both open | Both exit edit mode | Only the focused FormView exits edit mode |
| Lines FormView focused | — | Only lines FormView is exited; header FormView is unaffected |

### Ctrl+S

| Situation | Expected behavior |
|---|---|
| Header FormView focused | Only the header record is saved |
| Lines FormView focused | Only the lines record is saved |

### Arrow Up / Arrow Down

| Situation | Expected behavior |
|---|---|
| Lines Table focused | Row navigation applies only to the lines table |
| Header Table focused | Row navigation applies only to the header table |

---

## Proposed Architecture

### FocusContext

A React context (`FocusContext`) that holds:

```typescript
interface FocusContextValue {
  /** ID of the currently focused region, or null if none */
  activeFocusId: string | null;
  /** Register a region and obtain a ref-setter to detect DOM focus */
  registerRegion: (id: string) => void;
  /** Programmatically transfer focus to a region */
  setFocus: (id: string) => void;
}
```

A single `FocusProvider` wraps the window layout (above the tab/view level).

### Region Registration

Each view (FormView, Table) calls a hook like `useFocusRegion(regionId)` on mount:

```typescript
// Inside FormView for the header
useFocusRegion('header-form');

// Inside FormView for the lines
useFocusRegion('lines-form');
```

`useFocusRegion` attaches a `onFocus`/`onClick` handler to the view's root DOM node. When the user clicks or focuses within that node, `setFocus(regionId)` is called, making it the active region.

### useKeyboardShortcuts — Focus-Aware Extension

The existing hook signature gains an optional `focusId` parameter:

```typescript
useKeyboardShortcuts(
  shortcuts: Record<string, ShortcutConfig>,
  enabled: boolean,
  focusId?: string   // <-- new optional param
);
```

When `focusId` is provided, the hook checks `activeFocusId === focusId` before executing any handler. If the region is not active, the event is ignored.

This is **backwards compatible** — callers that omit `focusId` retain the current global behavior.

### Focus Transfer on Navigation

When the user opens a record from a Table (navigates into a FormView), the navigation handler should call `setFocus('header-form')` or `setFocus('lines-form')` as appropriate. When the user presses Escape and returns to a grid, focus transfers back to the corresponding Table region.

---

## Out of Scope for This PRD

- Visual focus indicators (border highlight, etc.) — pure UX concern, separate ticket.
- Focus trapping within modals — modals already handle this via MUI/`FocusLock`.
- Keyboard shortcut for switching focus between regions (e.g., `Tab` between header and lines) — future enhancement.
- Multi-window / multi-tab scenarios beyond header+lines layout.

---

## Acceptance Criteria

1. When header FormView and lines FormView are both mounted, pressing `Escape` only exits the **focused** FormView.
2. When header FormView and lines FormView are both mounted, pressing `Ctrl+S` only saves the **focused** FormView.
3. When header Table and lines Table are both mounted, `↑/↓` only navigates within the **focused** Table.
4. Clicking anywhere within a view region transfers focus to that region.
5. Navigating from a Table row into a FormView automatically sets focus to that FormView.
6. Pressing `Escape` from a FormView (returning to grid) transfers focus back to the corresponding Table.
7. Views that do not pass a `focusId` to `useKeyboardShortcuts` continue to work as before (no regression).
8. Unit tests cover: focus transfer on click, shortcut suppression for non-focused regions, backwards-compatible path.

---

## Dependencies / Blockers

- Requires the header+lines layout to be sufficiently stable to test against.
- The `regionId` naming convention needs to be agreed upon — it likely maps to `tab.id` or a combination of `windowId + tabLevel`.
- Must not break the existing FormView↔Table mutual-exclusion assumption for single-tab windows (those continue to work without focus IDs).

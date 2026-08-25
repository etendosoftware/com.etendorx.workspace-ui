# Help widget — frontend design

> Data contract and backend verification: see the `com.etendoerp.metadata` repo,
> `docs/superpowers/plans/2026-08-03-help-widget-data-contract.md`. Backend requires
> **0 changes** (verified live against a running instance: `helpComment` already present at
> window/tab/field levels).

## Problem

Classic Openbravo shows contextual Help for the active window via a navbar widget
(`OBHelpAbout`) that opens `DisplayHelp.html`: window description + per-tab description +
per-tab field list, all pre-translated. WorkspaceUI (the new UI) has no equivalent — users
lose this documentation access when moving off Classic.

The window metadata JSON the frontend already fetches carries all three levels of
`helpComment` (window/tab/field), so no new endpoint is needed. What's missing is purely
frontend: a trigger and a view.

## Solution

### Part 1: Trigger — navbar icon, not the toolbar

**Location:** `packages/MainUI/components/navigation.tsx`, as a new standalone icon button,
sibling to `CopilotButton` / `ConfigurationSection` / `ProfileModal` (around line 209-248).
**Not** nested inside `ConfigurationModal`'s gear menu (where `About` currently lives).

**Why navbar over toolbar:**
- Help's trigger/content are window-level (once per active window). The Toolbar is
  mounted once per visible tab level, and two instances can coexist simultaneously
  (parent grid + expanded child) — putting Help there would need dedup logic for no gain.
- The Toolbar is already visually packed (8-12 icon buttons in tight 32px pills). The
  navbar has room.
- Semantically Help is documentation/meta content, same category as About — not a
  record/grid action like Save/Delete/Filter.

**Why navbar icon over nesting inside the gear/config menu (like About):**
- Help is used more frequently than About; burying it inside a settings dropdown adds a
  click and visibility cost that doesn't match its usage frequency.

**Icon:** reuse the existing `help-circle.svg` from `packages/ComponentLibrary/src/assets/icons`
(no new asset needed), via the same `IconButton` + SVG pattern `CopilotButton` already uses
for its own standalone navbar icon.

**Visibility rule (spec §3 of the data-contract doc):**
```ts
const showHelp = Boolean(window?.helpComment?.trim());
```
Render nothing (not a disabled button) when false — including on Home/no-window screens.
Source: `useMetadataContext().window` (Zustand-backed hook, callable directly from the
navbar with no extra Provider wiring).

**Click:** opens `HelpDrawer` with the active `window` metadata.

### Part 2: Content — `HelpDrawer` component

**Location (new file):** `packages/MainUI/components/HelpDrawer/HelpDrawer.tsx`

Self-contained component: portal-based, overlay, slides in from the right, closes on
Escape or overlay click. Modeled after `packages/MainUI/components/Modal.tsx`'s
portal/Escape-handling approach, but implemented as its own component rather than a new
generic `Drawer` primitive — there's a single consumer today; extract a shared primitive
only if a second drawer use case shows up.

**Why drawer over modal:** background UI stays usable/visible while Help is open — you can
read a field's help text side-by-side with the form, instead of Help blocking the screen.

**Content, in order:**
1. Title: `Help for <window.name>`.
2. `window.helpComment`, sanitized via the existing
   `packages/MainUI/utils/processes/definition/sanitizeHtml.ts` (`sanitizeMessageHtml`) —
   **not** `RichTextSelector.tsx`'s bare `DOMPurify.sanitize()`. The two are not
   interchangeable: `sanitizeMessageHtml` locks down to `b/i/em/strong/br/span/p/ul/ol/li/code`
   and forbids `<a>`; the bare call uses DOMPurify's default allowlist (links, images,
   tables, headings all pass). Help text is system/admin-authored documentation prose
   (mirrors Classic's `AD_*.HELP` columns, observed live content is plain `<p>` text) —
   the locked-down allowlist is the safer default. **Links and images are out of scope**
   for Help content in this version; if a real need for links surfaces later, extend
   `sanitizeMessageHtml`'s allowlist deliberately rather than switching to the permissive
   default.
3. Per tab, **ordered by `tab.sequenceNumber`** (flatten across `tabLevel`, matching
   Classic): tab name + sanitized `tab.helpComment`, then its field list.
4. Per field within a tab, **ordered by `field.sequenceNumber`**: only fields where help
   text exists — `field.helpComment || field.column?.helpComment` — non-help fields are
   omitted (see rationale below). Audit synthetic fields (`isAuditField: true`) are
   omitted entirely.
5. No per-tab index/anchors in this version (optional per data-contract spec) — single
   scrollable column.
6. If the active window changes while the drawer is open (e.g. user opens a new window
   from a link/menu), the drawer closes rather than silently swapping to the new window's
   content — avoids showing stale or mismatched help without warning.

**Why omit fields without help text:** Classic lists every field regardless of whether it
has help. Replicating that here would pad the drawer with entries like "Delivered" (no
help text) for every checkbox/flag field, adding noise without adding documentation value.
The data-contract spec explicitly allows either choice for audit fields and treats the
regular-field fallback as optional/front's call — showing only fields that actually carry
help content keeps this a useful reference instead of a full field manifest.

**Why the `field.column.helpComment` fallback:** confirmed against a live instance (Sales
Order window, fields `taxableAmount` and `businessPartner`) that some fields have no
`AD_FIELD.HELP` but do have `AD_COLUMN.HELP`. One extra `||` recovers real content that
would otherwise silently disappear.

### Part 3: Types

**Location:** `packages/api-client/src/api/types.ts`

- `WindowMetadata` (currently lines 513-521): add `helpComment?: string | null;`
- `Tab` (currently lines 452-511): add `helpComment?: string | null;` **and**
  `sequenceNumber: number;` — `Tab` currently has neither field typed, and tab ordering
  (Part 2, item 3) depends on it. Verified live (Sales Order window, `etendo_26`) that the
  backend sends `sequenceNumber` per tab already (e.g. Header tab → `10`, Lines → `20`) —
  same as the already-confirmed `helpComment`, just not yet reflected in the type.
- `Field` and `ADColumn` already have `helpComment` (and `Field` already has
  `sequenceNumber`) — no change needed there.
- `WindowMetadata.helpComment`/`Tab.helpComment` use `string | null` (not just
  `string | undefined`) because the backend contract confirms the converter always writes
  the key, valued JSON `null` when empty — it's never omitted. `window?.helpComment?.trim()`
  works unchanged either way (optional chaining short-circuits on `null` same as
  `undefined`). `Field.helpComment` (required `string`) and `ADColumn.helpComment`
  (`string?`) are left as-is — pre-existing, intentional non-change, not an oversight;
  existing `field.helpComment || ...` fallback call sites already tolerate either shape at
  runtime.

No backend change. No new API call — this data already arrives on the existing
`Metadata.getWindow()` response; the fields were simply untyped/unused until now.

## What is NOT changed

- Backend / `com.etendoerp.metadata` module (0 changes, verified live).
- `About`'s existing iframe-based modal (`AboutModal`, `ConfigurationModal`) — untouched,
  Help does not reuse or modify that flow.
- No generic `Drawer` primitive extracted from `HelpDrawer` — single consumer for now.
- No tab-level or field-level trigger (spec §3: trigger is window-level only for this
  version; extending to "help exists at any level" needs no backend work if done later).
- No edit-help capability (out of scope, lives in Classic's compatibility module).

## Test Cases

### Trigger visibility (navbar icon)
- `window.helpComment` = non-empty string → icon renders.
- `window.helpComment` = `""` or whitespace-only → icon does not render.
- `window.helpComment` = `null`/`undefined` → icon does not render.
- No active window (Home screen) → icon does not render.
- Clicking the icon opens `HelpDrawer` scoped to the currently active window's metadata
  (end-to-end: trigger click → drawer open → content matches `window.name`/`helpComment`).

### HelpDrawer content ordering
- Tabs render ordered by `sequenceNumber`, regardless of `tabLevel` or original array order.
- Fields within a tab render ordered by `sequenceNumber`.

### HelpDrawer content filtering
- Field with `helpComment` set → rendered with its own text.
- Field with `helpComment` empty but `column.helpComment` set → rendered with the column's
  text (fallback).
- Field with neither → omitted from the list.
- Field with `isAuditField: true` → omitted regardless of help content.
- Tab with empty `helpComment` → tab name still renders as a section header; no empty
  paragraph shown; its field list (if any qualifying fields) still renders.

### Sanitization
- `helpComment` containing `<script>` or on* attributes → stripped before render.
- `helpComment` containing allowed formatting tags (e.g. `<p>`, `<b>`) → preserved.
- `helpComment` containing `<a href="...">` → tag stripped (out of scope per `sanitizeMessageHtml`'s allowlist), text content preserved.

### Drawer interaction
- Escape key closes the drawer.
- Click outside (overlay) closes the drawer.
- Background UI (grid/form) remains interactive while drawer is open.
- Switching the active window while the drawer is open closes it (no stale content shown).

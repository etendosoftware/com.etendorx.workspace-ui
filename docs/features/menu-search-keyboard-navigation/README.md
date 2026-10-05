# Menu search keyboard navigation

How the drawer's menu list is driven from the keyboard, and the DOM contract that makes
it work.

Etendo Classic exposes the menu through **Quick Launch**, a *command palette*: type three
letters, press Enter, the window opens. The drawer of the new UI filtered in real time but
answered to a single key — Tab, to accept the autocomplete suggestion. Everything else
needed the mouse.

**Related:** [`form-keyboard-navigation`](../form-keyboard-navigation/README.md) covers
the keyboard **inside a form**. Note that the two contracts assign Tab opposite roles: in
a form it walks from field to field, here it completes the search term. They are different
surfaces and the difference is deliberate.

---

## The keys

| Key | Action | Classic equivalent |
|---|---|---|
| `↓` / `↑` | Moves the highlight through the menu entries | `pickList` of `OBQuickLaunch` |
| `Enter` | Opens the highlighted entry, or expands/collapses it when it is a folder | `pickValue` |
| `Escape` | Clears the search term, restoring the whole menu | `handleKeyPress` → `doHide` |
| `Tab` | Completes the autocomplete suggestion — unchanged | — |

The arrows **stop at both edges** instead of wrapping around, as the grids of Classic do.

`Escape` on an already empty search does nothing. Classic closes the whole popup at that
point, but the drawer is a fixed sidebar rather than a popup: collapsing it is a separate
gesture, and doing it here would strand the focus.

---

## What the arrows stop on

One rule: **an entry takes part in the navigation when clicking it does something.**

- **Without a search term** a folder can be expanded, so it *is* a stop and `Enter`
  toggles it. This is not a detail — without it, everything inside a closed folder would
  be unreachable from the keyboard, since the highlight would never pass through the only
  control that opens it.
- **With a search term** the folders are rendered as context of the matches, but
  `isExpandable` is false while searching: they can neither be collapsed nor opened —
  clicking one only logs `Invalid item type` in `useItemActions`. So they are skipped,
  which is exactly what `getQuickMenuItems` does in Classic, where the pickList is flat
  and holds no folders at all.

The rule lives in one place, `MenuTitle`:

```ts
const canToggle = Boolean(isExpandable && item.children?.length);
const isNavigable = canToggle || isOpenableMenuItem(item);
```

`isExpandable` already reaches `MenuTitle` as `isExpandable && !isSearchActive`, so the
search case falls out of the same expression with no extra condition.

`isOpenableMenuItem` mirrors the dispatch of `useItemActions`: the type must be one of
`OPENABLE_MENU_ITEM_TYPES`, a `Window` needs its `windowId`, everything else its `id`.
Both read that list from the same constant so they cannot drift apart.

---

## Why the visible order is read from the DOM

To stop on folders you have to know **what is actually expanded**, and that state is
fragmented:

- the top level lives in `expandedItems`, owned by `Sidebar`;
- the nested levels live in the local state of each `DrawerSection` (`localExpanded`,
  `expandedSections`), which also expands itself when the active window falls inside the
  branch.

The `Drawer` has no way to know what is open three levels down. Lifting that state would
mean rewriting the part of `DrawerSection` that the active-window auto-expansion, the
nested toggle and the collapsed-drawer flyout all depend on — a large regression surface
for a navigation feature.

So the order is read from the DOM instead, which is the only consistent view of what is on
screen, and is re-read on every key press. Two consequences fall out for free: after
expanding a folder the next `↓` walks into the children that just appeared, and the order
matches what the user sees because it *is* what the user sees.

`Enter` follows the same principle — it calls `.click()` on the highlighted entry, so it
runs the very handler the mouse runs (`DrawerSection.handleClick`), which already decides
between expanding a folder and opening a leaf, and routes a leaf through
`useItemActions` → `onClick` → `Sidebar.handleClick`, the single dispatch per item type.
No opening logic is duplicated, and keyboard and mouse cannot diverge.

### DOM contract

Both attributes are defined in
[`utils/drawerUtils.tsx`](../../packages/ComponentLibrary/src/utils/drawerUtils.tsx).

| Constant | Rendered on | Meaning |
|---|---|---|
| `MENU_ITEM_ID_ATTRIBUTE` (`data-menu-item-id`) | The `MenuTitle` of a navigable entry | This entry is a stop, and this is its id |
| `MENU_COLLAPSED_ATTRIBUTE` (`data-menu-collapsed`) | The children container of a collapsed `DrawerSection` | Everything inside is out of reach |

A collapsed section keeps its children in the DOM — they are only clipped with
`max-h-0 overflow-hidden` — which is why the marker is needed. Visibility is decided by
attribute rather than by layout (`offsetParent`, `getBoundingClientRect`), which jsdom
does not compute, so the rules stay testable.

Every lookup is scoped to the menu list container. That is what keeps *Recently viewed*,
which renders its own `DrawerSection`s over the same items, out of the navigation.

---

## The highlight

The highlighted id lives in `Drawer` and reaches the entries through
`DrawerHighlightContext`, mirroring the existing `FavoritesDrawerContext`.

A context rather than a prop because `DrawerSection` is recursive and memoised: threading
the id down would invalidate the memo of every section on each arrow press, while a
context only re-renders the entries. The provider wraps the menu list alone, so
*Recently viewed* never highlights a duplicate of an entry.

**With a search term the first result is highlighted automatically**, mirroring the
pickList of Classic, so typing and pressing Enter is enough. **Without a term nothing is
highlighted** until the first `↓`: Enter must never open something the user did not pick.
This is the one effect in the feature, and it exists because the visible set is only
knowable after the list has rendered.

Opening an entry **keeps the term and the results on screen**, so several can be opened in
a row. Classic resets its field instead; this is a deliberate divergence.

---

## Where the handler lives

On the container that wraps the search input, not on the input.

`TextInputAutocomplete` spreads `{...textFieldProps}` *after* setting its own `onKeyDown`,
so passing it an `onKeyDown` replaces its handler rather than composing with it — which is
what silently disables Tab completion in `SearchPortal` today. Key events from the input
bubble up to the container, so handling them there leaves the component untouched and
guarantees Tab keeps working.

---

## Out of scope

- **`ArrowRight` / `ArrowLeft` to expand and collapse** (the `treeview` pattern). Enter
  already toggles; adding them is additive on top of this same base.
- **`role="combobox"` + `role="listbox"` + `aria-activedescendant`.** It would need unique
  ids across a tree that renders the same items more than once (list, collapsed-drawer
  flyout, *Recently viewed*) and a rewrite of the drawer markup. The highlighted entry
  carries `aria-current` instead, which is valid on any element.

---

## Files

| File | Role |
|---|---|
| `utils/drawerUtils.tsx` | Navigability rule, DOM lookup, adjacent-entry navigation |
| `components/Drawer/index.tsx` | Highlight state, key handling, auto-highlight |
| `components/Drawer/DrawerHighlightContext.tsx` | Carries the highlighted id to the entries |
| `components/Drawer/MenuTitle/index.tsx` | Marks a navigable entry, paints the highlight, scrolls it into view |
| `components/Drawer/DrawerSection/index.tsx` | Marks a collapsed subtree |
| `hooks/useItemType.ts` | Dispatch per item type; shares the openable-types constant |

## Tests

| Test | Covers |
|---|---|
| `utils/__tests__/drawerUtils.test.tsx` | Navigability rule, DOM order, collapsed subtrees, edge stops |
| `components/Drawer/__tests__/Drawer.keyboard.test.tsx` | The whole contract, with and without a search term |
| `components/Drawer/DrawerSection/index.test.tsx` | The DOM markers and the highlight |

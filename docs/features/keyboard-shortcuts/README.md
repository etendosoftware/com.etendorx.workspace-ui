# Keyboard shortcuts

How the new UI recognizes the classic keyboard shortcuts, where their keys come from and
which action each one runs.

Etendo Classic defines its shortcuts as data: the `OBUIAPP_KeyboardShortcuts` preference holds
one entry per shortcut, `{ "id": "ToolBar_Refresh", "keyComb": { "ctrl": true, "shift": true, "key": "R" } }`,
and `OB.KeyboardManager` binds each id to an action of the component that owns it. The new UI
follows the same model. The ids, the default keys and the preference are the classic ones.

**Related:**
- [`form-keyboard-navigation`](../form-keyboard-navigation/README.md): Tab order, focus and the
  dropdown keys inside a form.
- [`keyboard-shortcuts-focus-system.md`](../keyboard-shortcuts-focus-system.md): the focus regions
  that decide which tab owns the keyboard.

---

## Where the keys come from

1. **Preference.** `/meta/preferences` already publishes every visible `AD_Preference`, and the
   client stores them at login (`utils/propertyStore.ts`). `getEffectiveShortcuts()` reads
   `OBUIAPP_KeyboardShortcuts` from there.
2. **Classic default.** When the preference is missing or malformed, the client uses
   `DEFAULT_KEYBOARD_SHORTCUTS`, a copy of the System value seeded by
   `org.openbravo.client.application` (43 entries).

As in classic, **the preference replaces the whole list**. An id left out of a user or role
override has no keys. The table is rebuilt only when the stored value changes, so a new value
takes effect at the next login without touching code. No backend change was needed.

## Grammar

| Element | Rule |
|---|---|
| Modifiers | `ctrl`, `alt`, `shift` must be **exactly** in the requested state (a missing flag means "not pressed"). `Meta` (Cmd) counts as `Ctrl`. |
| `space: true` | The Ctrl+Space chord: Space held down while the key is pressed (`spaceChordTracker.ts`). While Ctrl is down, Space does not type a blank. |
| Key names | Classic SmartClient names are translated: `Arrow_Up` → `ArrowUp`, `Page_Down` → `PageDown`, `f2` → `F2`, letters upper-cased. |
| Letters and digits | Read from `event.key` (the user's layout decides, as in classic). When a modifier changed the character (`Shift+1` → `!`, `Alt+A` → `å` on macOS), the physical `event.code` is used. |
| `_Alternative` | `TabSet_SelectNextTab_Alternative` is a second combination for `TabSet_SelectNextTab`. Both fire the same binding. |

## Firing rules (`useShortcutBindings`)

- **Owner.** A binding fires only while its owner is enabled (the focused tab, the visible grid...)
  **and** its window is the active one. Hidden windows stay mounted, so this check is required.
- **Text fields.** A shortcut does not fire from `input`, `textarea`, `select` or `contenteditable`,
  unless the binding allows it. Allowed: Save (`Ctrl+S`), Save and close (`Ctrl+Shift+X`),
  Undo (`Ctrl+Shift+Z`), New (`Ctrl+D`, `Ctrl+I`, as the previous `Ctrl+N`), and the grid filter-row
  shortcuts.
- **Portals.** The layout is marked with `data-shortcut-root`. Key presses coming from outside it
  (modals, menus and popovers rendered in portals) never fire shortcuts of the screen underneath.
- **Scope.** A binding can narrow itself to a surface (`isInScope`), as classic `execLevel` does:
  the grid rows, the grid filter row. A key press out of scope is not consumed, so another binding
  of the same keys can take it.
- **Single action.** A binding calls `preventDefault()` (this also blocks the browser default, such
  as `Ctrl+D` bookmarking). Bindings ignore an already prevented event, so one key press runs one
  shortcut.

Field-local shortcuts (picker, link out, tree) are handled on the field with `matchesShortcut(event, id)`.

## Shortcut map

| Id | Default keys | Surface | Action |
|---|---|---|---|
| `ToolBar_NewDoc` | `Ctrl+D` | Focused tab | Presses the toolbar NEW button (new record in the form) |
| `ToolBar_NewRow` | `Ctrl+I` | Visible grid | New inline row (needs the parent record of a child tab) |
| `ToolBar_Save` | `Ctrl+S` | Form | Saves |
| `ToolBar_SaveClose` | `Ctrl+Shift+X` | Form | Saves and returns to the grid. Stays in the form when the save fails. The status bar close button runs the same action |
| `ToolBar_Undo` | `Ctrl+Shift+Z` | Focused tab | Presses CANCEL |
| `ToolBar_Eliminate` | `Ctrl+Delete` | Focused tab | Presses DELETE (asks for confirmation) |
| `ToolBar_Refresh` | `Ctrl+Shift+R` | Focused tab | Presses REFRESH |
| `ToolBar_Export` | `Ctrl+Shift+E` | Focused tab | Presses EXPORT_CSV |
| `ToolBar_Attachments` | `Ctrl+Shift+A` | Focused tab | Presses ATTACHMENT |
| `ToolBar_Clone` | `Ctrl+Shift+K` | Focused tab | Presses COPY_RECORD (asks for confirmation) |
| `ToolBar_Print` | `Ctrl+Shift+P` | Focused tab | Presses PRINT_RECORD |
| `ToolBar_Email` | `Ctrl+Shift+M` | Focused tab | Presses SEND_MAIL |
| `ToolBar_Audit` | `Ctrl+Shift+Y` | Focused tab | Presses SHOW_AUDIT_TRAIL |
| `ToolBar_Link` | `Ctrl+Shift+U` | Focused tab | Presses SHARE_LINK |
| `StatusBar_Previous` / `StatusBar_Next` | `Alt+Shift+PgUp` / `PgDn` | Form | Same handlers as the status bar arrows |
| `StatusBar_Close` | `Escape` | Form | Back to the grid, through the unsaved-changes guard |
| `Grid_FocusFilter` | `Ctrl+Shift+F` | Grid | Focuses the first filter field |
| `Grid_FocusGrid` | `Escape` | Grid filter row | Back to the rows, selecting the first one if none is selected |
| `Grid_ClearFilter` | `Alt+Delete` | Grid | Clears the column filters, keeping the implicit filter |
| `Grid_SelectAll` / `Grid_UnselectAll` | `Alt+Shift+A` / `N` | Grid rows | Selects / unselects every loaded row |
| `ViewGrid_EditInGrid` | `F2` | Grid rows | Inline edit of the single selected row |
| `ViewGrid_EditInForm` | `Ctrl+F2` | Grid rows | Opens the single selected row in the form |
| `ViewGrid_DeleteSelectedRecords` | `Delete` | Grid rows | Presses DELETE (asks for confirmation) |
| `ViewGrid_CancelEditing` | `Escape` | Grid | Existing inline-edit cancel listener (unchanged) |
| `TabSet_CloseSelectedTab` | `Alt+Shift+W` | Window tab bar | Closes the active window through the unsaved-changes prompt |
| `TabSet_SelectPreviousTab` / `TabSet_SelectNextTab` | `Alt+Shift+←` / `→`, `Ctrl+Space+←` / `→` | Window tab bar | Previous / next window. The Workspace is the first position; no wrap around |
| `TabSet_SelectWorkspaceTab` | `Alt+Shift+1` | Window tab bar | Workspace (Home) |
| `TabSet_SelectParentTab` / `TabSet_SelectChildTab` | `Alt+Shift+↑` / `↓`, `Ctrl+Space+↑` / `↓` | Active window | Focus to the parent / rendered child tab |
| `Selector_ShowPopup`, `SelectorLink_ShowPopup`, `TreeItem_ShowPopup` | `Ctrl+Enter` | Field | Opens the record picker |
| `ViewForm_OpenLinkOut` | `Ctrl+Alt+Enter` | Field | Opens the referenced record, as a click on the field label |
| `TreeItem_ShowTree` | `Alt+↓` | Tree field | Opens the tree |
| `TreeItem_MoveToTree` | `↓` | Open tree field | Moves the keyboard into the tree |

Toolbar shortcuts **press the button**: a hidden or disabled button does nothing, and the button's
own confirmations and modals are reused. Their tooltips show the keys, e.g. `Refresh (Ctrl+Shift+R)`,
read from the same table, so they follow the preference. The status bar previous / next / close
buttons show theirs too.

The status bar close button (X) and `Ctrl+Shift+X` are one action: `FormActions` registers it as the
`saveAndClose` toolbar action and the button calls `onSaveAndClose`, so both wait for running saves
and callouts, save only when there are changes and stay in the form when the save fails. Its
tooltip shows `Ctrl+Shift+X`.

Confirmation modals (`ConfirmModal`, e.g. the delete confirmation) focus their confirm button, so
`Enter` confirms, as the classic confirm dialog does. `Enter` on a modal button stays in the modal:
it never reaches the page shortcuts (the grid `Enter` listener would otherwise cancel the click).
`ActionModal` (e.g. the clone confirmation) is a modal dialog too: it focuses its first action, keeps
`Tab` / `Shift+Tab` inside, closes with `Escape` (not while loading) and shows a focus ring. It stops
the immediate propagation of its keys, because the Next app router hydrates React on `document`,
the same node the page shortcuts listen on.
Tooltips are kept inside the viewport and wrap when wider than it.

## Decisions

- **Ctrl+N is gone.** New is now classic `Ctrl+D` (form) and `Ctrl+I` (inline row). Chrome also
  reserves `Ctrl+N` for a new browser window and never delivers it to the page.
- **New UI shortcuts outside the classic list stay as they were.** `Ctrl+M` (split view) and `F6`
  (switch pane) still use `useKeyboardShortcuts`. Its only change: with Shift held it matches only
  `ctrl+shift+<key>`, so `ctrl+m` no longer takes `Ctrl+Shift+M` (Email) away from the toolbar.
- **Previous / next tab always moves between windows.** Classic moves between sibling sub-tabs
  inside a window and only changes window at the top level. Here, `←` / `→` always change window,
  and `↑` / `↓` move between parent and child tabs.
- **Alt+Delete is classic `clearFilter(true)`.** It clears the column filters and keeps the implicit
  filter. It is not the FILTER toolbar button: that button is a toggle that re-applies the
  implicit filter when nothing is filtered.
- **Reactivating a window focuses its header tab.** Hidden windows stay mounted, so their tabs never
  re-acquire the focus. When a window becomes active while the focus belongs to another one, its
  active header tab takes the focus, so its shortcuts work without a click.

## Differences with Classic

| Classic | New UI |
|---|---|
| `NavBar_*` shortcuts (`UINAVBA_KeyboardShortcuts`) | Only `F8` (alerts) is implemented. See [Navigation bar shortcuts (pending)](#navigation-bar-shortcuts-pending) |
| `StatusBar_Maximize-Restore` (`Alt+Shift+Enter`) | Not bound: there is no maximize/restore action for the form. `SHOW_TABLE_AND_FORM` only opens the split |
| Toolbar shortcuts fire from inside text fields (`Canvas` scope) | Only Save, Save and close, Undo and New fire from a text field |
| `ToolBar_SaveClose` closes even when the save fails | Stays in the form, so the error can be fixed |
| RTL swaps previous and next tab | Not handled |
| Process buttons get generated `Ctrl+Alt+Shift+<char>` shortcuts | Not implemented |

Some browser combinations can never reach a web page (`Ctrl+N`, `Ctrl+T`, `Ctrl+W` in Chrome).
None of the classic defaults use them. A preference that does will not work.

### Navigation bar shortcuts (pending)

Classic defines the navigation bar shortcuts in the System preference `UINAVBA_KeyboardShortcuts`, a
separate list from `OBUIAPP_KeyboardShortcuts`. Each navbar widget registers its entry through its
`keyboardShortcutId`. Only the alerts shortcut is implemented in the new UI
(`utils/alerts/resolveAlertShortcut.ts`); the rest is pending and was postponed:

| Classic default | Opens in Classic | New UI today |
|---|---|---|
| `Ctrl+Q` | Quick Create | Nothing |
| `Ctrl+O` | Quick Launch | Browser "open file" dialog |
| `Ctrl+M` | Application menu | Toggles the grid/form split view (new UI shortcut) |
| `F8` | Alerts | Implemented |
| `Ctrl+H` | Help / About | Browser history |
| `Ctrl+P` | User profile | Browser print dialog |
| `Ctrl+Alt+Shift+End` | Logout | Nothing |

Points to settle before implementing them:

- **`Ctrl+M` conflict.** The new UI uses it for the split view, which does not exist in Classic.
  Following Classic means moving the split view to another combination; otherwise `Ctrl+M` stays
  as it is and only the other entries are implemented. This is a product decision.
- **Browser defaults.** `Ctrl+O`, `Ctrl+P` and `Ctrl+H` have a browser action that must be
  prevented when the shortcut is handled (check `Ctrl+H` in Firefox).
- **Reuse.** `useShortcutBindings` can read this second preference as another source, with the same
  grammar and the same per-role / per-user resolution.
- **Logout.** It must go through the unsaved-changes guard, like the logout button.

## Main files

| File | Role |
|---|---|
| `utils/keyboard/shortcutIds.ts` | Classic ids, preference name, `KeyCombination` |
| `utils/keyboard/defaultShortcuts.ts` | Classic default list |
| `utils/keyboard/shortcutGrammar.ts` | Key normalization, matching, preference parsing, display text |
| `utils/keyboard/shortcutRegistry.ts` | Effective table, `matchesShortcut`, `withShortcutHint` |
| `utils/keyboard/spaceChordTracker.ts` | Ctrl+Space chord state |
| `hooks/useShortcutBindings.ts` | Binds ids to handlers with the firing rules above |
| `hooks/Toolbar/useToolbarShortcuts.ts`, `utils/toolbar/shortcuts.ts` | Toolbar shortcuts, grid Delete, tooltip ids |
| `components/Form/FormView/FormActions.tsx` | Save, Save and close, Escape |
| `hooks/useRecordNavigationShortcuts.ts` | Status bar previous / next |
| `components/Table/hooks/useGridShortcuts.ts`, `utils/table/gridShortcutScope.ts` | Grid shortcuts and their scopes |
| `hooks/navigation/useWindowTabShortcuts.ts` | Window tab bar |
| `hooks/navigation/useTabLevelShortcuts.ts`, `utils/window/tabNavigation.ts` | Parent / child tab, focus on window activation |
| `utils/form/keyboard.ts` | Field-level picker, link-out and tree shortcuts |

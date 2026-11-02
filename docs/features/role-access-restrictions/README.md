# Role Access Restrictions: Tab Access, Field Access and Process Access

A role's window access in Classic can restrict what the role may change. The New UI applies the
same restrictions, computed with the same rules:

| Classic configuration (Role › Window Access) | Effect in the New UI |
|---|---|
| **Tab Access** with *Editable* unchecked | The tab is read-only: no New, Save, Delete or Copy; no inline editing; no "New record" in the grid context menu |
| **Field Access** with *Editable* unchecked | The field is read-only in the form and in inline editing |
| Fields without a Field Access row | They keep the editability of the Tab Access |
| **Process Access** missing for a secured process | The process button is shown **disabled** in the process menu |

The access configuration never hides a tab, a field or a button.

Jira: ETP-6003.

## Behavior

### Read-only tabs

The backend serves a read-only tab with `uIPattern: "RO"` (and `readOnly: true`). Every read-only
check of the client already keys on that pattern (toolbar, inline editing, empty state, form view; see
[components/toolbar.md](../../components/toolbar.md)), so a role restriction behaves exactly like a
dictionary read-only tab.

A tab is read-only for the role when Classic's own rule says so
(`WindowAccessData.hasReadOnlyAccess`, the rule Classic's `WindowSettingsActionHandler` applies):

1. the tab's table has a read-only Table Access, or the tab itself is read-only by dictionary;
2. the Window Access is not editable and no active Tab Access of the tab is editable (or has an
   editable Field Access);
3. the active Tab Access is not editable and none of its active Field Access rows is editable.

A role without any Window Access for the window keeps the existing implicit read-only fallback
(`isWindowAccessible: false`).

### Read-only fields

When the tab has an active Tab Access, the backend applies Field Access on top of the **complete**
field list of the tab, as `WindowSettingsActionHandler.getFieldLevelRoles` does:

- only fields editable by dictionary are affected (not read-only, not in the status bar, with an
  updatable column);
- a field with an active Field Access takes its *Editable* value;
- any other field takes the *Editable* value of the Tab Access.

A restricted field is served with `isReadOnly: true` and `isEditable: false`, which the form
selectors (`BaseSelector`) and inline editing (`isFieldReadOnly`) already honor.

### Disabled process buttons

Each button field carries `isProcessAccessible`. A process requires an explicit grant when the process
is marked *Requires Explicit Access* or the `SecuredProcess` preference is `Y` for the role/window;
without an active Process Access row the flag is `false`:

| Button process | Check |
|---|---|
| Process Definition (`OBUIAPP_Process`) | `BaseProcessActionHandler.hasAccess` |
| Classic process (`AD_Process`) | explicit or secured → active `AD_Process_Access` row for the role |
| Legacy button without process | always accessible |

The process menu keeps such a button in its place, disabled (`aria-disabled`, no hover, no click),
and the toolbar refuses to run it.

## Decisions

- **Disable, not hide, process buttons.** Classic disables them (`readOnlyIf = alwaysReadOnly`).
  Process Definition buttons without access used to be dropped from the metadata; they are now kept
  and flagged, so both process types behave as in Classic.
- **Reuse Classic's read-only query.** Using `WindowAccessData.hasReadOnlyAccess` keeps exact parity,
  including two cases a simplified rule misses: an editable Tab Access makes a tab editable under a
  read-only Window Access, and a read-only Table Access makes the tab read-only.
- **Overlay instead of a restricted field list.** Field Access is applied on a copy of the cached
  complete field list. The previous code would have reduced the tab to the fields listed in Field
  Access, which hides fields.
- **`/meta/tab/{id}` without Window Access stays as before.** That endpoint also feeds the Pick and
  Execute grids, whose referenced windows are usually not granted to the role. The restrictions are
  applied there only when the role has an active Window Access for the tab's window.
- **No new server-side enforcement.** Saves go through Classic's `DataSourceServlet`, whose
  `DefaultDataSourceService.testAccessPermissions` already rejects changes to non-editable fields
  (`OBSERDS_RoleHasNoFieldAccess`, for Field Access rows with *Check on Save*).

## Configuration

Classic configuration only, in General Setup › Security › Role › Window Access:

- *Tab Access* subtab: *Editable Tab*.
- *Field Access* subtab of a Tab Access: *Editable Field* and *Check on Save*.
- Role › *Process Access* (classic processes) and *Process Definition Access*.
- Preference `SecuredProcess` = `Y` to require an explicit grant for every process.

Changes to these records, and to the `SecuredProcess` preference, invalidate the metadata caches.
Users see them after reopening the window; as in Classic, a new login is the safe way to pick them up.

## Differences with Classic

- Classic also forces RO on view-based tables of Transaction/Maintenance windows; that rule is not
  role-based and is out of the scope of this feature.
- Delete on a read-only tab is prevented by the UI (no Delete button), as in Classic; neither Classic
  nor the New UI has a separate server-side check for it.

## Main files

Backend (`com.etendoerp.metadata`):

- `builders/RoleAccessResolver.java`: Window/Tab/Field Access lookups and Classic's read-only rule.
- `builders/FieldAccessOverlay.java`: Field Access applied on the complete field list.
- `builders/WindowBuilder.java`, `builders/TabBuilder.java`, `service/TabService.java`: apply them.
- `data/ProcessAccessChecker.java`, `builders/FieldBuilderWithColumn.java`: `isProcessAccessible`.
- `cache/MetadataCacheInvalidationObserver.java`: cache invalidation on Process Access and
  `SecuredProcess` changes.

Client:

- [`utils/toolbar/process-button/utils.tsx`](../../../packages/MainUI/utils/toolbar/process-button/utils.tsx): `isProcessButtonAccessible`.
- [`components/Toolbar/Menus/ProcessMenu.tsx`](../../../packages/MainUI/components/Toolbar/Menus/ProcessMenu.tsx), [`components/Toolbar/Toolbar.tsx`](../../../packages/MainUI/components/Toolbar/Toolbar.tsx): disabled buttons.
- [`components/Table/utils/uiPatternPermissions.ts`](../../../packages/MainUI/components/Table/utils/uiPatternPermissions.ts), [`components/Table/index.tsx`](../../../packages/MainUI/components/Table/index.tsx): grid context menu on read-only tabs.

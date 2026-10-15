# Saved views and grid configuration

Saved views store the grid and window state of a tab under a name, and the grid column configuration is also kept per user without saving a view. Both reproduce the classic UI: saved views (`ob-manage-views.js`, `OBUIAPP_UIPersonalization`) and the automatic grid configuration (`ob-standard-window.js` `storeViewState`, preference `OBUIAPP_GridConfiguration`).

## Behavior

### What a view stores

| Part | Stored in `gridConfiguration` | Default when the view lacks it |
|------|-------------------------------|--------------------------------|
| Filters, sorting, implicit filter | `filters`, `sorting`, `implicitFilterApplied` | Always present |
| Column visibility and order | `visibility`, `order` | Always present |
| Grouping | `grouping` ([grid grouping](../grid-grouping.md)) | Ungrouped |
| Column widths | `sizing` (column id → px) | Metadata widths |
| Pinned columns | `pinning` (`left` / `right`, only the columns the user pinned) | Selection and actions columns only |
| Window layout | `layout.splitHeights` (tab level → % of the viewport) and `layout.maximizedLevel` | 50% split, nothing maximized |

The format stays `version: 1`: new parts are optional keys that are only written when they differ from the default. Views saved before them keep applying, with the defaults above.

### Saving, applying and resetting

- **Saving** captures the current state of the tab. Saving under the name of an existing view overwrites that view, as in classic, instead of creating a duplicate.
- **Applying** a view replaces the table state of the tab. Visibility is replaced, not merged, so the columns the view does not list fall back to the metadata. It then restores:
  - the split heights;
  - the maximized level. A level deeper than the open ones is skipped, because it has no parent record selected. A view without a maximized level brings a maximized child back to the parent/child split.
- **Standard view** (reset) does three things:
  - unsets the default view;
  - restores the metadata grid (visibility, order, widths, pinning, sorting, no grouping) and the default layout;
  - deletes the stored grid configuration of the tab. Classic does the same in `clearLastViewPersonalization`.

### Grid configuration per user

- Changes the user makes to visibility, order, width or pinning are stored per user, window and tab:
  - hiding or showing a column;
  - dragging a column;
  - resizing;
  - pin / unpin from the column menu, which also offers "Reset column size".
- Saves are debounced (1 s per tab), so a drag makes a single request.
- The order MRT sets by itself when the number of columns changes is never stored. Neither is the visibility seeded from the metadata.
- The configuration is restored when the window opens and survives a reload or a new session. While the window stays open, the window store is the source of truth.

### What applies when a tab opens

1. **The default view, when there is one.** It takes precedence over the stored grid configuration, as in classic `getDefaultGridViewState`. It is skipped on a direct link (linked items), as before.
2. **Otherwise, the stored grid configuration** (columns only). It also applies on a direct link, because it never filters records.

Each tab is restored once per opened window. A tab that remounts while its window is open, such as a child tab after the parent record changes, keeps the columns of the session.

An auto-applied default view restores the split heights but never the maximized level, because moving the active levels on open would override the navigation the user or the URL set up.

### Parent/child split

- The height of each child tab level lives in the window store (`navigation.splitHeights`). It is written when a drag ends.
- It is kept when switching between sibling tabs; the previous behavior reset it to 50%. Double-clicking the handle still resets it to 50%.

## Configuration

No setup is needed. The grid configuration uses the `/meta/grid-configuration` endpoint of `com.etendoerp.metadata`, which stores the AD_Preference attribute `ETMETA_GridConfiguration`: one row per client, user and window, valued `{<tabId>: {...}}`. See the module's technical reference.

## Differences with classic

- **The grid configuration uses its own preference attribute** instead of `OBUIAPP_GridConfiguration`. The classic value is a SmartClient view state (an `eval` string) that the new UI cannot write without breaking classic.
- **The preference follows the user across roles and organizations** (client + user + window).
- **Views are per tab** (`ETMETA_SAVEDVIEW`), so the layout stored in a view is the window layout at the moment that tab's view was saved.
- **The grid + form side-by-side split is not stored**, as in classic. It stays session-only; see `SplitViewState` in `utils/window/constants.ts`.
- **The stored grid configuration does not include sorting or grouping.** Those come from saved views.

## Main files

| File | Role |
|------|------|
| `utils/savedViews/types.ts` | View config (`MRTViewConfig`), `ViewStateSnapshot`, `AppliedViewState`, `WindowLayout` |
| `utils/savedViews/transform.ts` | `buildGridConfiguration`, `toAppliedViewState` (defaults for older views) |
| `utils/savedViews/layout.ts` | Capture the window layout, resolve the active levels to apply |
| `utils/savedViews/gridConfiguration.ts` | Per-user grid configuration: load (one request per window), debounced save, clear |
| `utils/table/columnState.ts` | Fixed pinned columns, pinning normalization, user reorder detection |
| `components/Table/hooks/useColumnLayout.ts` | Controlled widths, pinning and order of the grid; schedules the save on user changes |
| `hooks/useSavedViews.ts` | Saved views CRUD, including `updateView` |
| `hooks/useAutoApplyDefaultView.ts` | Default view on open, else the stored grid configuration |
| `hooks/useApplyViewState.ts` | Applies views / standard view / stored columns to the store; captures the layout |
| `components/Toolbar/Menus/SaveViewMenu.tsx` | Save (overwrite by name), apply, default, reset |
| `components/window/Tabs.tsx` | Parent/child split height per level |
| `packages/api-client/src/api/gridConfiguration.ts` | `fetchGridConfiguration` / `saveGridConfiguration` (proxied uncached through `/api/erp`) |

The window store fields (`table.sizing`, `table.pinning`, `navigation.splitHeights`) and their setters are in `stores/windowStore.ts`. For the session store itself see [table state persistence](../table-state-persistence/README.md).

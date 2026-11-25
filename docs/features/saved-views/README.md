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
| Window layout | `layout.splitHeights` (tab level → % of the viewport) and `layout.activeLevels` (tab levels shown) | 50% split, levels unchanged |
| Summary functions | `summaries` (column id → `sum` / `avg` / `count` / `min` / `max`), classic `summaryFunctions` | No summaries |
| Tree view | `treeView: true` (classic `viewMode: 'tree'`), only on tabs with a tree | Flat grid |

The format stays `version: 1`: new parts are optional keys that are only written when they differ from the default. Views saved before them keep applying, with the defaults above.

### Saving, applying and resetting

- **Saving** captures the current state of the tab. Saving under the name of an existing view overwrites that view, as in classic, instead of creating a duplicate. Only a view of the chosen scope that the user can edit is overwritten: a shared view (role, organization, client or system) the user cannot edit, or a view of another scope, keeps its own copy and a new view is created.
- **Applying** a view replaces the table state of the tab. Visibility is replaced, not merged, so the columns the view does not list fall back to the metadata. It then restores:
  - the split heights;
  - the tab levels shown. As in classic, at most two levels are on screen (parent and child tab sets): `[parent, child]` is the split, a single level is that level maximized. The levels are only restored when their shallowest level is already open, because a deeper level needs a record selected in its parent level; a collapsed child panel is reopened at the saved height. A view without saved levels brings a maximized child back to the parent/child split.
- **Standard view** (reset) does three things:
  - unsets the default view;
  - restores the metadata grid (visibility, order, widths, pinning, sorting, no grouping, no summaries, flat grid) and the default layout;
  - deletes the stored grid configuration of the tab. Classic does the same in `clearLastViewPersonalization`.

### Grid configuration per user

- Changes the user makes to visibility, order, width, pinning or sorting are stored per user, window and tab:
  - hiding or showing a column;
  - dragging a column;
  - resizing;
  - pin / unpin from the column menu, which also offers "Reset column size";
  - sorting from a column header. A tab without a stored sort keeps the default sort of its metadata (see [grid default sort](../grid-default-sort/README.md)).
- Saves are debounced (1 s per tab), so a drag makes a single request.
- The order MRT sets by itself when the number of columns changes is never stored. Neither is the visibility seeded from the metadata, the default sort, or the sort set by grouping.
- The configuration is restored when the window opens and survives a reload or a new session. While the window stays open, the window store is the source of truth.

### What applies when a tab opens

1. **The default view, when there is one.** It takes precedence over the stored grid configuration, as in classic `getDefaultGridViewState`. It is skipped on a direct link (linked items), as before.
2. **Otherwise, the stored grid configuration** (columns and sort). It also applies on a direct link, because it never filters records.

Each tab is restored once per opened window. A tab that remounts while its window is open, such as a child tab after the parent record changes, keeps the columns of the session.

### First load of the grid

The grid of a tab loads its records once when the window opens, already with the default view or the stored columns, as classic, which gets them with the window settings before showing the grid (`WindowSettingsActionHandler` → `PersonalizationHandler.getPersonalizationForWindow`). Before, the grid loaded without them and again when they arrived, so a view with filters could show, for a moment, records outside the view.

- **Requested with the window.** When a window is opened, it asks for the default views of all its tabs in one request (`GET /meta/saved-views?window=<id>&isdefault=true`) and for its stored grid configuration (already one request per window), in parallel with the window metadata. The requests start where the window is opened (`showWindow`: menu, links, favorites, recent items, start page, process monitor) and where the URL recovers it (reload), not when the window component mounts, which is about 800 ms later; the window component asks too, as a fallback for any other way in (each opened window makes them once). By the time the tabs mount they are there, so the wait is not noticeable.
- **The grid waits only when something stored changes its first request.** That is a default view, or stored columns that sort the grid. Visibility, order, width and pinning do not change the request, so a tab whose window settings already answered with nothing else loads on its first render, as before, and its stored columns are applied after it without a new request. Otherwise the first load of each grid, header and child tabs, waits until its tab is resolved: the default view applied, or the stored columns applied, or neither exists. While it waits the grid shows as loading. The answers are kept per opened window (`getSettledTabDefaultView`, `getSettledTabColumnConfiguration`), so the grid knows this when it mounts; while they have not answered it waits.
- **Never blocked.** If the views cannot be read (an error or a non-zero status), the tab is resolved at once and the grid loads without them, as before. A request that does not answer within 2 s (`INITIAL_VIEW_WAIT_MS`) also lets the grid load; a view that arrives later is still applied and its load replaces the first one.
- **One request when the wait ends.** The datasource shows as loading from the very render that stops skipping, so nothing (e.g. filling the grid height, see [grid paging](../grid-paging-and-record-count/README.md)) asks for a next page before the first one; and every request uses the page size of the current params, so a view in tree mode asks for the tree fetch limit at once instead of loading with the flat page size and again with the tree one. Both also apply to a child tab whose parent gets a record and to switching the tree view on.
- **Also when a record is restored from the URL or a link.** The header loads on mount without the context of its own record, as classic's first direct-link fetch, and does not load again when that record arrives: the record selected in a tab travels with each request but never triggers one. The child tabs wait for the parent record (not only its id) before their first load, so they load once and already with its session properties. See [parent–child datasource filtering](../parent-child-datasource-filtering.md).
- **Answers out of order.** The datasource sends one request at a time and drops the rows of a request a newer query superseded while it was in flight (`useDatasource.fetchData`), so the grid always ends up with the records of the view.

An auto-applied default view restores the split heights but never the tab levels shown, because moving the active levels on open would override the navigation the user or the URL set up.

### Parent/child split

- The height of each child tab level lives in the window store (`navigation.splitHeights`). It is written when a drag ends.
- It is kept when switching between sibling tabs; the previous behavior reset it to 50%. Double-clicking the handle still resets it to 50%.

## Configuration

No setup is needed. The grid configuration uses the `/meta/grid-configuration` endpoint of `com.etendoerp.metadata`, which stores the AD_Preference attribute `ETMETA_GridConfiguration`: one row per client, user and window, valued `{<tabId>: {...}}`. See the module's technical reference.

## Differences with classic

- **`OBUIAPP_WindowPersonalization_Override` set to No** leaves a regular user picking existing views only, as in classic; see [Classic interface preferences](../classic-preferences/README.md).

- **The grid configuration uses its own preference attribute** instead of `OBUIAPP_GridConfiguration`. The classic value is a SmartClient view state (an `eval` string) that the new UI cannot write without breaking classic.
- **The preference follows the user across roles and organizations** (client + user + window).
- **A personal default view applies in every client of the user**, as in classic: classic stores a user-level view with the user only (`visibleAtClient` empty, `ob-manage-views-popups.js`), and the new UI resolves personal views by user. Views shared at role, organization or client level only apply in their own target.
- **Views are per tab** (`ETMETA_SAVEDVIEW`), so the layout stored in a view is the window layout at the moment that tab's view was saved.
- **The grid + form side-by-side split is not stored**, as in classic. It stays session-only; see `SplitViewState` in `utils/window/constants.ts`.
- **The stored grid configuration does not include summary functions.** As in classic, a summary survives a reload only through a saved view (classic stores `summaryFunctions` but does not save them when a summary changes). While the window is open the summaries live in the window store (`table.summaries`), so a remounted tab keeps them.
- **The stored grid configuration does not include the tree view.** As in classic, it survives a reload only through a saved view. While the window is open it lives in the window store (`table.treeView`).
- **The stored grid configuration does not include grouping.** Classic stores it in `OBUIAPP_GridConfiguration` but does not restore it on reload (the grouping it defers until data arrives is never reapplied), so in both UIs grouping only survives a reload through a saved view. Sorting is stored and restored, as in classic.

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
| `hooks/useAutoApplyDefaultView.ts` | Default view on open, else the stored grid configuration; then marks the tab resolved |
| `utils/savedViews/defaultViews.ts` | Default views of every tab of a window (one request per opened window, answers kept for the first render), prefetch with the window |
| `utils/window/showWindow.ts` | Opens a window and starts the prefetch of its view settings |
| `stores/initialViewStore.ts` | Tabs whose initial view is resolved, so their grid can make its first load |
| `hooks/table/useParentRecordPending.ts` | First load of a child tab waiting for the parent record of a restored window (2 s safety limit) |
| `hooks/table/useInitialViewPending.ts` | Wait of the grid for its initial view (`tabNeedsInitialView`: only a default view or a stored sort), with the 2 s safety limit (used by `useTableData`) |
| `components/window/Window.tsx` | Starts the prefetch when the window opens |
| `hooks/useApplyViewState.ts` | Applies views / standard view / stored columns to the store; captures the layout |
| `components/Toolbar/Menus/SaveViewMenu.tsx` | Save (overwrite by name), apply, default, reset |
| `components/window/Tabs.tsx` | Parent/child split height per level |
| `packages/api-client/src/api/gridConfiguration.ts` | `fetchGridConfiguration` / `saveGridConfiguration` (proxied uncached through `/api/erp`) |

The window store fields (`table.sizing`, `table.pinning`, `navigation.splitHeights`) and their setters are in `stores/windowStore.ts`. For the session store itself see [table state persistence](../table-state-persistence/README.md).

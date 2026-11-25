# Entries that can no longer be opened (ETP-6431)

What the Home lists and the drawer do when an entry points to something the user can no longer open: a recent
document whose record was deleted, or a favorite or recently visited entry whose window or process does not exist
or is not available to the current role. The entry is never opened as an empty or broken page.

## Behavior

| List | Where | Case | Result |
|------|-------|------|--------|
| Recent documents | Home widget | The record was deleted | Warning message, no form is opened, the document leaves the list (also server-side) |
| Recent documents | Home widget | The window is not accessible to the role | Not listed: the server already filters them by `AD_Window_Access` |
| Recently visited | Home widget and drawer | The entry is not in the role's menu | Not listed |
| Recently visited | Home widget and drawer | Clicked after the menu changed (stale list) | Warning message, nothing is opened, the entry leaves the list |
| Favorites | Home widget | The window is not in the role's menu | Not listed; the favorite is kept |
| Favorites | Home widget | Clicked after the menu changed | Warning message, nothing is opened |

Entries that can be opened open exactly as before.

### Recent documents

Before opening a recent document, its record is looked up by id in the datasource of its tab (`recordExists`):

- the implicit filter of the tab is not applied, so a closed or old document is still found;
- inactive records are included, so only a deleted record answers no rows;
- when the answer is unknown (the window metadata or the datasource cannot be read) the record is taken as
  existing and opened as before, and the window reports its own error.

When the record does not exist, the message `ETMETA_RecordNoLongerExists` is shown and the document is removed from
the store and from `ETMETA_RECENT_DOCUMENT` (`DELETE meta/recent-documents?tabId=…&recordId=…`).

Without this check the window opened in edit mode on a missing id: the record fetch answered nothing and the form
initialization built an empty row, which looked like a new record.

### Favorites and recently visited

An entry is available when the menu of the current role has a menu entry of the same type: windows are matched by
window id, the other types by menu id (`findStoredMenuEntry`, the lookup the drawer already used). The lists are
filtered with the role's menu; while the menu is not loaded yet every entry is shown, so the lists are not emptied
meanwhile. On click the entry is checked again against the cached menu, which may be newer than the list. A
missing entry shows `OBUIAPP_NoAccess`.

The Home widgets get the menu with `useLiveMenu`, which reuses the cached menu or the request the drawer already
sent, so no request is added.

## Decisions

- **Hide and check on click.** Hiding avoids offering what cannot be opened; the click check covers a menu that
  changed after the list was drawn (agreed with the team).
- **Recently visited entries are removed, favorites are not.** Recently visited is a history that the next visits
  rebuild. A favorite was added on purpose, and the window may become available again (the role's access is
  restored), so it is only hidden; the user can still remove it from the star.
- **Deleted record checked at click time.** Checking every recent document when the list loads would need one
  lookup per entry and per table on every login; a click needs one lookup, on the record the user wants to open.
- **Texts from the database.** `ETMETA_RecordNoLongerExists` (module `com.etendoerp.metadata`) and Classic's
  `OBUIAPP_NoAccess`, read from `/meta/labels`. Local keys (`dashboard.recentDocuments.recordNoLongerExists`,
  `dashboard.entryUnavailable`) are only used when the catalog does not have the message.

## Configuration

The message `ETMETA_RecordNoLongerExists` must exist in the database: it is part of the module source data
(`AD_MESSAGE.xml`) and arrives with `update.database`. The module ships only its English text; other languages need
a row in its translation (`AD_MESSAGE_TRL`). The local text in the user's language is used only while the message
itself is missing from the catalog.

## Differences with Classic

- Classic opens a recent document whose record was deleted as an empty grid filtered by its id ("0 results"),
  without a message, and keeps the entry in the list.
- Classic does not check recent views or favorites against the role: it opens the view and fails later when its
  data is read.

## Main files

- `packages/MainUI/utils/window/recordExists.ts`: record lookup by id.
- `packages/MainUI/hooks/navigation/useOpenRecentDocument.ts`: click of a recent document.
- `packages/MainUI/utils/menu/menuAvailability.ts`: stored entry lookup in the menu, availability, favorite entry.
- `packages/MainUI/hooks/useLiveMenu.ts`, `packages/MainUI/hooks/useEntryUnavailableNotice.ts`.
- `packages/MainUI/stores/recentDocumentsStore.ts` (`remove`), `packages/MainUI/stores/recentItemsStore.ts`
  (`remove`), `packages/api-client/src/api/dashboard.ts` (`removeRecentDocument`).
- `packages/MainUI/screens/Home/widgets/renderers/RecentDocsRenderer.tsx`, `FavoritesRenderer.tsx`,
  `RecentlyViewedRenderer.tsx`, and `packages/MainUI/hooks/useRecentItems.ts` (drawer).
- `com.etendoerp.metadata`: `RecentDocumentsService` (`DELETE`), `src-db/database/sourcedata/AD_MESSAGE.xml`.

Related: [recently viewed items](../recent-items/README.md), [role access restrictions](../role-access-restrictions/README.md).

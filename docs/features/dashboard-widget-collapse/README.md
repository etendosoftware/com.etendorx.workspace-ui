# Dashboard Widget Collapse

> Last updated: 2026-10-20 · Jira: ETP-4630

## Behavior

Every dashboard widget card has a **Collapse** button (a chevron) in its header, before the refresh,
configure and remove buttons.

- **Collapsed:** only the header is shown. The body is not mounted and the refresh button is hidden.
  The card shrinks to one half-row (54px), so the widgets below move up.
- **Expanded:** the card goes back to its previous height and reloads its data.
- **No data requests while collapsed:** a collapsed widget is skipped by the initial load, the silent
  layout refresh, its auto-refresh interval and the favorites refresh. It fetches again only when it
  is expanded.
- **Layout:** a collapsed widget can be dragged but not resized. Dragging or resizing other widgets
  keeps its collapsed state and its stored height.
- **Persistence:** the state is saved per instance, per user and role, together with position and
  size, so it survives reloads and new sessions.

## Persistence (metadata module)

`com.etendoerp.metadata` adds `ISCOLLAPSED CHAR(1) DEFAULT 'N'` to `ETMETA_DASHBOARD_WIDGET`.

| Endpoint | Change |
|----------|--------|
| `GET /meta/dashboard/layout` | Each widget includes `collapsed` (boolean). |
| `PUT /meta/dashboard/layout` | Each widget accepts `isCollapsed` (boolean, default `false`). It is saved through the same paths as position and size, including the USER-layer override for SYSTEM/CLIENT widgets. |

## Design decisions

| Decision | Reason |
|----------|--------|
| The grid runs on half-rows (`ROW_UNITS = 2`, `ROW_HEIGHT = 54`) | A collapsed card must fit just its header. Two half-rows plus one margin are 120px, the previous row height, so expanded widgets look the same. |
| Persisted `row` and `height` can be halves (e.g. `1.5`) | A widget below a collapsed one can sit on a half-row. The columns are `DECIMAL`, so the value is stored without rounding and reloads in the same place. Widths stay integers. |
| A collapsed widget persists its expanded height | The grid item is 1 unit tall while collapsed, but `toUpdatePayload` sends `position.height`, so expanding restores the size. |
| Skip fetches in the store (`fetchUnlessCollapsed`) | One check covers every path that loads data in the background. `fetchWidgetPage` is not affected because pagination needs the body, which a collapsed card does not render. |
| Persist with the existing `updateLayout` (optimistic) | The toggle reuses the layout PUT, so it follows the same per-user+role rules as moving or resizing. |

## Grid interaction fixes

- The resize handle is drawn as an arc inside the card's rounded corner and shows on hover
  (`app/styles/global.css`). The selectors are prefixed with `.react-grid-layout` because the library
  stylesheets are imported after `global.css`.
- Text selection is turned off on the grid while an item is dragged or resized, and any selection is
  cleared when the interaction starts.

## Configuration

None. The new labels are `dashboard.widget.collapse` and `dashboard.widget.expand` ("Collapse" /
"Expand" in English, "Contraer" / "Expandir" in Spanish).

## Differences from Classic

Classic (`org.openbravo.client.myob`) can minimize a widget to its header from the widget header and
keeps that state in the user's workspace layout. The new UI has the same action as a header button.

## Main files

- `packages/MainUI/screens/Home/widgets/WidgetCard.tsx` — collapse button, header-only rendering
- `packages/MainUI/screens/Home/widgets/DashboardGrid.tsx` — half-row grid, collapsed item size, update payload
- `packages/MainUI/stores/dashboardStore.ts` — `toggleCollapsed`, fetch skipping for collapsed widgets
- `packages/api-client/src/api/dashboard.ts` — `collapsed` / `isCollapsed` fields, half-row serialization
- `packages/MainUI/app/styles/global.css` — resize handle and selection styles
- `packages/ComponentLibrary/src/locales/{en,es}.ts` — labels
- Tests: `screens/Home/widgets/__tests__/WidgetCard.test.tsx`, `screens/Home/widgets/__tests__/DashboardGrid.test.tsx`, `stores/__tests__/dashboardStore.test.ts`, `api-client/src/api/__tests__/dashboard.test.ts`

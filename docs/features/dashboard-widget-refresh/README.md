# Dashboard Widget Manual Refresh

> Last updated: 2026-10-08 · Jira: ETP-4632 (SEC-21)

## Behavior

Every dashboard widget card has a **Refresh** button in its header, before the configure and remove
buttons. Clicking it re-requests that widget's data only.

- **While loading:** the refresh icon spins and the button is disabled, so repeated clicks are ignored.
  The current content stays visible but dimmed (`opacity-50`). The card does not show a skeleton and
  does not flicker.
- **On success:** the new data replaces the old content. Any previous error for that widget is
  cleared.
- **On failure:** the card shows the error message in its body. The header stays usable, so the user
  can click Refresh again to retry.
- **Paginated widgets** (`QUERY_LIST`) go back to page 1 after a manual refresh, which matches the
  data the refresh returns.

## Design decisions

| Decision | Reason |
|----------|--------|
| Reuse the store's `refreshWidget(instanceId)` | It already existed and was used by the FAVORITES toggle. It re-fetches page 1, stores the result in `widgetData`, and records failures in `widgetErrors` without rejecting. |
| Keep the loading state local to `WidgetCard` (`isRefreshing`) | Only the manual action needs a visual cue. Leaving the store unchanged guarantees that auto-refresh, pagination and favorites refreshes behave exactly as before. |
| Remount `WidgetRenderer` after each manual refresh (`key={refreshCount}`) | `QueryListRenderer` keeps its page number in local state. The refresh always returns page 1, so a remount resets the page indicator to match. Auto-refresh and pagination do not bump the counter. |
| Optional `onRefresh` prop on `DashboardGrid` and `WidgetCard` | The change is additive: the button is rendered only when a handler is wired. |
| `catch` and log in the click handler | `refreshWidget` never rejects, but an unexpected rejection must not escape the click handler as an unhandled promise. |

## Interaction with auto-refresh

Periodic refresh (`WidgetInstance.refreshInterval`, in seconds) is scheduled in
`stores/dashboardStore.ts` (`setupAutoRefresh`). The intervals call the internal fetch directly. A
manual refresh does not create, clear or reschedule them.

The Next.js proxy (`app/api/erp/[...slug]/route.ts`) excludes `meta/widget/` routes from
`unstable_cache`, so a manual refresh always reaches the ERP. It never returns cached data.

A click on Refresh is user input, so it counts as activity for the session keep-alive. Background
auto-refresh does not count. See [Session keep-alive](../session-keep-alive.md).

## Configuration

None. The button is always available. The only new label is `dashboard.widget.refresh`, which is
"Refresh" in English and "Actualizar" in Spanish.

## Differences from Classic

Classic (`org.openbravo.client.myob/js/ob-widget.js`) exposes **Refresh** (`OBKMO_WMO_Refresh`) as an
item in the widget's header menu. That item calls the widget's `refresh()` method. The new UI has
the same action as a dedicated header button, with a loading indicator.

## Main files

- `packages/MainUI/screens/Home/widgets/WidgetCard.tsx` — refresh button, loading state, renderer remount
- `packages/MainUI/screens/Home/widgets/DashboardGrid.tsx` — passes `onRefresh` to each card
- `packages/MainUI/screens/Home/index.tsx` — wires the store's `refreshWidget`
- `packages/MainUI/stores/dashboardStore.ts` — `refreshWidget` and the auto-refresh intervals (unchanged)
- `packages/ComponentLibrary/src/locales/{en,es}.ts` — `dashboard.widget.refresh` label
- Tests: `screens/Home/widgets/__tests__/WidgetCard.test.tsx`, `screens/Home/widgets/__tests__/DashboardGrid.test.tsx`, `stores/__tests__/dashboardStore.test.ts`

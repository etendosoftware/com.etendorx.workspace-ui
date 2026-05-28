# Request Flow Optimization — Design Spec

**Date:** 2026-05-22
**Branch:** epic/ETP-3931
**Scope:** Optimize how Next.js frontend dispatches and resolves HTTP requests to Etendo Classic backend. No caching changes.

---

## Problem Statement

Performance profiling shows the frontend spends ~5.5s in scripting on the epic branch. A significant portion of this time is wasted in **sequential request waterfalls** — metadata and datasource requests that could run in parallel or start earlier are instead chained through `useEffect` dependencies and sequential awaits.

The current navigation flow has these bottlenecks:

```
User clicks menu item
  → setWindowActive() updates Zustand store
    → React re-renders Window component
      → MetadataSynchronizer useEffect fires
        → loadWindowData() clears cache + fetches from backend  ← WATERFALL START
          → Window renders Loading spinner
            → Tabs load sequentially
              → Each tab triggers its own datasource fetch  ← SEQUENTIAL
```

**Every step waits for the previous one.** The user sees a loading spinner while requests that could overlap are serialized.

---

## Scope

### In scope (implement now)
1. Add in-flight deduplication for metadata requests **(prerequisite for 2, 3, and 4)**
2. Introduce `prefetchWindowData` action (non-destructive fetch, no cache clearing)
3. Eliminate navigation waterfall via eager metadata fetch
4. Prefetch metadata on menu hover/focus
5. Parallelize tab datasource requests

### Out of scope (future feature — caching)
5. HTTP Cache-Control headers in `com.etendoerp.metadata` backend
6. Frontend response caching (localStorage TTL, `unstable_cache`, SWR)
7. ETag / conditional request support
8. Datasource response caching

These are documented in the [Future Work](#future-work-caching-strategy) section for a dedicated caching feature.

---

## Optimization 1: In-Flight Deduplication for Metadata Requests

> **This is a prerequisite for Optimizations 3 and 4.** Without deduplication, eager fetch and hover prefetch would cause duplicate HTTP requests.

### Current behavior
`datasource.ts` has a `pendingRequests` Map that deduplicates identical in-flight requests. The `Metadata` class in `metadata.ts` has **no such mechanism** — if two components request the same window metadata simultaneously, two HTTP requests fire.

### Problem
`loadWindowData` in `metadataStore.ts:42-46` guards against re-fetching by checking `windowsData[windowId]` (resolved data). But it does NOT guard against concurrent in-flight requests: two calls to `loadWindowData` for the same `windowId` will both pass the guard (both see empty `windowsData`), both set `loadingWindows = true`, and both call `Metadata.forceWindowReload()` — firing two identical HTTP requests.

This race condition exists today but is rare because only `MetadataSynchronizer` triggers the fetch. Once we add eager fetch (Opt 3) and hover prefetch (Opt 4), overlapping calls become the common case.

### Solution
Add an in-flight request Map to the `Metadata` class, following the same pattern as `Datasource.pendingRequests`.

**Where to implement:**
- `packages/api-client/src/api/metadata.ts` — add `pendingRequests: Map<string, Promise>` static field
- Wrap `_getWindow()`, `_getToolbar()`, `_getMenu()` with deduplication check

**Mechanism:**
```typescript
private static pendingRequests = new Map<string, Promise<unknown>>();

private static async _getWindow(windowId: string) {
  const key = `window-${windowId}`;
  const existing = Metadata.pendingRequests.get(key);
  if (existing) return existing;

  const promise = Metadata.client.get(`/meta/window/${windowId}`)
    .finally(() => Metadata.pendingRequests.delete(key));

  Metadata.pendingRequests.set(key, promise);
  return promise;
}
```

Additionally, add a promise-level guard in `metadataStore.ts:loadWindowData`:
```typescript
// Store the loading promise so concurrent calls can reuse it
if (loadingPromises[windowId]) return loadingPromises[windowId];
```

### Estimated improvement
**Prevents wasted requests** rather than speeding up individual ones. Saves ~100-200ms per duplicate request avoided and reduces backend load.

**End-user impact: ~5% improvement** in edge cases (rapid navigation, slow connections). Primary value is **correctness** — it makes Optimizations 3 and 4 safe.

---

## Optimization 2: Non-Destructive Prefetch Action (`prefetchWindowData`)

### Problem
The current `loadWindowData` in `metadataStore.ts:62` calls `Metadata.clearWindowCache(windowId)` then `Metadata.forceWindowReload(windowId)` — it **always clears localStorage cache and re-fetches from the backend**. This is correct for explicit navigation (ensures fresh data) but destructive for prefetch scenarios: if the user hovers a menu item, `loadWindowData` clears the existing cache, and if the backend request fails, the user loses their cached data with no navigation intent.

### Solution
Introduce a separate `prefetchWindowData(windowId)` action in `metadataStore.ts` that:
1. Returns immediately if `windowsData[windowId]` exists (already in Zustand)
2. Returns immediately if `loadingWindows[windowId]` is true (already fetching)
3. Calls `Metadata.getWindow(windowId)` (which checks localStorage cache first) instead of `forceWindowReload`
4. Stores the result in `windowsData` on success
5. Does NOT clear the localStorage cache
6. Silently swallows errors (prefetch failure should not affect UX)

**Where to implement:**
- `packages/MainUI/stores/metadataStore.ts` — new `prefetchWindowData` action

**Usage:**
- Hover prefetch (Opt 4) uses `prefetchWindowData` — safe, non-destructive
- Click navigation continues using `loadWindowData` — forces fresh data as before
- `MetadataSynchronizer` continues using `loadWindowData` — unchanged behavior

### Estimated improvement
No direct performance gain. This is an **enabler** that makes hover prefetch safe.

---

## Optimization 3: Eliminate Navigation Waterfall (Eager Metadata Fetch)

### Current behavior
`Sidebar.tsx:286` calls `setWindowActive()` which updates Zustand state. Then React re-renders, `MetadataSynchronizer` (`metadata.tsx:37-54`) detects the new active window in a `useEffect`, and *only then* starts fetching metadata. This adds 1-2 React render cycles (~16-32ms) plus the `useEffect` scheduling delay before any network request starts.

### Problem
The metadata fetch is **reactive** (triggered by state change → render → effect) when it could be **imperative** (triggered directly on click).

### Solution
Call `loadWindowData(item.windowId)` directly in the `handleClick` handler in `Sidebar.tsx`, alongside `setWindowActive()`. The metadata fetch starts immediately on click instead of waiting for the render cycle.

**Where to implement:**
- `packages/MainUI/components/Sidebar.tsx` — in `handleClick` (lines 273-289), add `loadWindowData(item.windowId)` call

**Mechanism:**
```
User clicks menu item
  → PARALLEL:
    ├── setWindowActive(windowIdentifier)  // Update UI state
    └── loadWindowData(item.windowId)      // Start fetch immediately
  → MetadataSynchronizer fires useEffect, sees loadingWindows[windowId] = true → skips
  → Window component renders with data arriving sooner
```

**Why this is safe with Optimization 1:**
- Deduplication in `Metadata._getWindow()` ensures that even if `MetadataSynchronizer` fires before `loadWindowData` resolves, no duplicate HTTP request occurs
- The promise-level guard in `loadWindowData` means concurrent calls return the same promise

### Estimated improvement
**~50-100ms** saved by eliminating the render-cycle delay. The fetch starts on the same event loop tick as the click instead of 1-2 frames later.

**End-user impact: ~5-10% faster perceived navigation.** Small but compounds with other optimizations.

---

## Optimization 4: Prefetch Metadata on Menu Hover

### Current behavior
Zero prefetch. Metadata fetch starts only after the user clicks a menu item.

### Problem
Users typically hover over a menu item for 100-500ms before clicking. This is wasted time that could overlap with the network request.

### Solution
Add an `onItemHover` callback prop to the `Drawer` and `DrawerSection` components in ComponentLibrary, threaded down to leaf menu items. In `Sidebar.tsx`, pass a handler that calls `prefetchWindowData(windowId)` (from Optimization 2) after a 150ms debounce.

**Where to implement:**
- `packages/ComponentLibrary/` — add `onItemHover?: (item) => void` prop to `Drawer` and `DrawerSection` components, wired to `onMouseEnter` on leaf menu items
- `packages/MainUI/components/Sidebar.tsx` — pass `onItemHover` callback with debounced `prefetchWindowData`

**Mechanism:**
```
User hovers menu item (Window type)
  → onMouseEnter fires on leaf item in DrawerSection
  → Calls onItemHover(item) prop
  → Sidebar handler: 150ms debounce → prefetchWindowData(item.windowId)
    → Checks: in Zustand store? loading? → safe to call multiple times
    → Uses Metadata.getWindow() (checks localStorage first, non-destructive)
  → User clicks → loadWindowData() (forces fresh fetch)
    → If prefetch already resolved: Zustand store has data → MetadataSynchronizer skips
    → If prefetch in-flight: deduplication ensures single HTTP request
```

**Safeguards:**
- Uses `prefetchWindowData` (non-destructive) — never clears existing cache
- Only prefetch for Window-type menu items (not reports, processes, external links)
- Debounce prevents rapid hover-scanning from firing N requests
- Deduplication (Opt 1) prevents double-fetch if user clicks before prefetch resolves
- Errors are silently swallowed — failed prefetch has zero user impact

**Note on effort:** This requires a new prop in the ComponentLibrary `Drawer`/`DrawerSection` components, making this a **Medium** effort item rather than Low.

### Estimated improvement
**~200-800ms** depending on user behavior and network latency. If the user hovers for 300ms and the request takes 400ms, the window appears 300ms sooner than without prefetch.

**End-user impact: ~20-40% faster perceived navigation** for typical usage patterns. This is the highest-impact optimization because it hides network latency behind user intent signals.

---

## Optimization 5: Parallelize Tab Datasource Requests

### Current behavior
When window metadata arrives, the `Window` component renders `TabsContainer`, which renders individual tab components. Each tab mounts its own `useDatasource` hook, which triggers a `useEffect` to fetch data.

### Problem
React batches `useEffect` calls within the same commit, so tab datasource fetches fire in rapid succession (microseconds apart) rather than truly sequentially. The real sequential delay comes from **conditional rendering**: if Tab 2 only renders after Tab 1's data resolves, or if the component tree depth causes staggered mounts across multiple render cycles.

The actual bottleneck needs to be verified via profiling. However, even if `useEffect` batching makes tabs fire near-simultaneously, there's still value in starting datasource fetches **before** tab components mount — overlapping with the render cycle.

### Solution
After `loadWindowData(windowId)` resolves, immediately fire off datasource requests for all visible root-level tabs in parallel using `Promise.allSettled()`. Store the resulting promises in an in-memory prefetch Map. When each `useDatasource` hook mounts, it checks the Map before making its own request.

**Where to implement:**
- `packages/MainUI/stores/metadataStore.ts` — after `loadWindowData()` resolves, call `prefetchTabDatasources()`
- `packages/MainUI/hooks/useDatasource.ts` — check prefetch Map before fetching
- `packages/MainUI/utils/prefetchStore.ts` — new file (~40 lines)

**Mechanism:**
```
loadWindowData(windowId) resolves with metadata
  → Extract root-level tab entityNames from metadata.tabs
  → Promise.allSettled(tabs.map(tab => datasource.get(tab.entityName, defaultParams)))
  → Store promises in prefetchStore keyed by entityName
  → When useDatasource(entityName) mounts:
    → Check prefetchStore.get(entityName)
    → If found: await that promise, use result, delete from Map
    → If not found: fetch normally
```

**Prefetch store cleanup:**
- Entries are consumed (deleted) when `useDatasource` reads them
- A 30-second TTL auto-clears unconsumed entries (user hovered but never clicked)
- `resetForRole()` clears the entire Map
- Map is module-level, not Zustand — no persistence, no reactivity overhead

### Estimated improvement
**~100-300ms** on windows with 3+ tabs, depending on whether the current rendering is truly sequential or already near-parallel via `useEffect` batching. The improvement is most significant when tab components render conditionally (waterfall) rather than all at once.

**End-user impact: ~10-20% faster window load** on multi-tab windows. This estimate is lower than initially projected because `useEffect` batching already provides some parallelism. Profiling will determine the actual gain.

---

## Combined Impact Estimate

> **Note:** Optimizations 3 and 4 partially overlap — if hover prefetch succeeds, eager fetch provides minimal additional benefit because the data is already loaded. The combined estimate uses `max(Opt 3, Opt 4)` not `Opt 3 + Opt 4`.

| # | Optimization | Isolated improvement | End-user perceived | Effort | Dependencies |
|---|---|---|---|---|---|
| 1 | Metadata deduplication | Prevents waste | Correctness | Low | None |
| 2 | Non-destructive prefetch action | Enabler | None directly | Low | Opt 1 |
| 3 | Eager metadata fetch | 50-100ms | 5-10% faster nav | Low | Opt 1 |
| 4 | Hover prefetch | 200-800ms | 20-40% faster perceived nav | Medium | Opt 1, 2 |
| 5 | Parallel tab datasources | 100-300ms | 10-20% faster window load | Medium | None |
| **Combined** | | **~300-1000ms** | **~25-40% faster perceived navigation** | **Medium** | |

**Typical scenario (user hovers 300ms, clicks, window has 4 tabs, 150ms network latency):**
- Hover prefetch starts metadata fetch 300ms early → saves ~300ms
- Tab datasources start in parallel instead of staggered → saves ~150ms
- Deduplication prevents double-fetch from MetadataSynchronizer → saves 1 wasted request
- Total: **~450ms faster** perceived window load

---

## Implementation Notes

### Dependency order

```
Opt 1 (deduplication) → Opt 2 (prefetch action) → Opt 3 (eager fetch) + Opt 4 (hover prefetch)
                                                  → Opt 5 (parallel tabs) [independent]
```

Opt 1 and 2 must ship before 3 and 4. Opt 5 is independent and can be implemented in parallel.

### Files to modify

| File | Changes | Optimizations |
|---|---|---|
| `packages/api-client/src/api/metadata.ts` | Add `pendingRequests` Map, wrap `_getWindow`, `_getToolbar`, `_getMenu` | 1 |
| `packages/MainUI/stores/metadataStore.ts` | Add promise-level guard in `loadWindowData`; add `prefetchWindowData` action; trigger parallel tab prefetch after load | 1, 2, 5 |
| `packages/MainUI/hooks/useDatasource.ts` | Check prefetch Map before fetching | 5 |
| `packages/MainUI/utils/prefetchStore.ts` | New file: in-memory Map with TTL cleanup | 5 |
| `packages/MainUI/components/Sidebar.tsx` | Call `loadWindowData` in `handleClick`; pass `onItemHover` for debounced prefetch | 3, 4 |
| `packages/ComponentLibrary/.../Drawer` | Add `onItemHover` prop threaded to leaf items | 4 |
| `packages/ComponentLibrary/.../DrawerSection` | Wire `onMouseEnter` on leaf items to `onItemHover` | 4 |

### Testing strategy

- **Deduplication:** Concurrent calls to `Metadata._getWindow(same_id)` return the same promise instance
- **Prefetch action:** `prefetchWindowData` does not call `clearWindowCache`; returns existing data if available
- **Eager fetch race:** `loadWindowData` called twice concurrently → only one HTTP request
- **Hover debounce:** Rapid hover across 5 items → at most 1-2 requests (debounce cancels intermediate)
- **Prefetch store lifecycle:** Set → get (consumed) → get again returns null; TTL expiry; role change clears all
- **Error handling:** Failed prefetch does not prevent normal fetch on click
- **Manual profiling:** Compare Chrome Performance traces before/after on a window with 4+ tabs

### Rollout

Optimizations 1-2 are safe prerequisites with no UX-visible changes. Optimizations 3-5 add new behavior.

Recommended rollout: ship 1+2 first, then 3+4+5 together. Each optimization modifies different concerns, but **3 and 4 share `Sidebar.tsx`** and **3+4 depend on 1+2**, so they are not independently revertible without care.

---

## Future Work: Caching Strategy

> **This section documents planned work for a separate feature. Do not implement as part of this spec.**

### Backend: HTTP Cache Headers (`com.etendoerp.metadata`)

**Problem:** The metadata module (`MetadataService.java`) sets only `Content-Type` and `Character-Encoding` on responses. No `Cache-Control`, `ETag`, or `Last-Modified` headers. Every request hits the full Java processing pipeline even for data that hasn't changed.

**Recommended approach:**

1. **Static metadata** (window definitions, field definitions, toolbar config):
   - Add `Cache-Control: public, max-age=3600` (1 hour)
   - Generate `ETag` from a hash of the JSON response
   - Support `If-None-Match` → return `304 Not Modified`
   - **Invalidation:** The existing `MetadataCacheInvalidationObserver` already watches for Application Dictionary changes. When triggered, increment a version counter used in ETag generation.

2. **Semi-static metadata** (menu, labels, preferences):
   - Add `Cache-Control: private, max-age=300` (5 minutes)
   - Include role ID in ETag to prevent cross-role cache hits

3. **Dynamic data** (datasource, saved views, process execution):
   - `Cache-Control: no-store`
   - These should never be cached at HTTP level

**Files to modify in `com.etendoerp.metadata`:**
- `MetadataService.java` — add cache header methods
- `WindowService.java`, `ToolbarService.java`, `LabelsService.java` — set appropriate cache policies
- `MetadataCacheManager.java` — expose version counter for ETag generation

**Estimated improvement:** ~40-60% reduction in backend load for metadata endpoints. Browser and CDN caching would eliminate most repeat requests entirely.

### Frontend: Response Caching Layer

**Problem:** The current `CacheStore` (localStorage) has issues with stale data — sometimes caches things that shouldn't be cached, and doesn't refresh data that should be refreshed. This needs careful design.

**Recommended approach:**

1. **SWR (stale-while-revalidate) pattern** for metadata:
   - Return cached data immediately, revalidate in background
   - If backend supports `ETag`, use conditional requests for revalidation
   - Much better UX than cache-or-fetch: user sees content instantly, gets updates silently

2. **Enable `shouldCacheDatasource()`** selectively:
   - Start with read-only reference data (countries, currencies, UOMs)
   - Use short TTL (15-30 seconds)
   - Never cache user-editable entities

3. **Leverage Next.js `unstable_cache`** on API routes:
   - The infrastructure already exists in `datasource/route.ts` and `erp/route.ts`
   - Just needs `shouldCacheDatasource()` to return `true` for safe entities

**Key design constraints:**
- Cache invalidation must be role-aware (different roles see different data)
- Must handle mid-session role changes (already implemented: `resetForRole()`)
- Datasource cache must invalidate on write operations (create/update/delete)
- Need clear logging when serving cached vs fresh data for debugging

**Estimated improvement:** ~50-70% reduction in network requests for repeat window visits. Combined with backend cache headers, could reduce total API latency by 60-80%.

---

## Success Criteria

For the current implementation (optimizations 1-4):

1. **Chrome Performance profile** shows reduced scripting time on window navigation (~15-25% reduction)
2. **Network tab** shows parallel tab datasource requests instead of sequential
3. **No regressions** in data correctness — all windows load with correct data
4. **Hover prefetch** works without visible side effects (no flash of loading states for non-navigated windows)

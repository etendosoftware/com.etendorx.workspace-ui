# Request Flow Optimization — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce perceived navigation latency by 25-40% through request parallelization, waterfall elimination, and hover prefetch — without any caching changes.

**Architecture:** Add in-flight deduplication to the `Metadata` class (api-client), introduce a non-destructive `prefetchWindowData` action in the metadata Zustand store, trigger eager metadata fetches from click/hover handlers in Sidebar, and prefetch tab datasources in parallel after window metadata resolves.

**Tech Stack:** TypeScript, Zustand 5, React 19, Next.js (App Router), Jest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-05-22-request-flow-optimization-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `packages/api-client/src/api/metadata.ts` | Modify | Add `pendingRequests` Map for in-flight deduplication |
| `packages/api-client/src/api/__tests__/metadata.dedup.test.ts` | Create | Tests for metadata deduplication |
| `packages/MainUI/stores/metadataStore.ts` | Modify | Add promise guard in `loadWindowData`, add `prefetchWindowData` action, add `prefetchTabDatasources` call |
| `packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts` | Create | Tests for store-level deduplication and prefetch |
| `packages/MainUI/utils/prefetchStore.ts` | Create | In-memory Map with TTL for prefetched datasource responses |
| `packages/MainUI/utils/__tests__/prefetchStore.test.ts` | Create | Tests for prefetch store lifecycle |
| `packages/MainUI/hooks/useDatasource.ts` | Modify | Check prefetch store before fetching |
| `packages/MainUI/components/Sidebar.tsx` | Modify | Eager fetch on click, debounced prefetch on hover |
| `packages/ComponentLibrary/src/components/Drawer/types.ts` | Modify | Add `onItemHover` to `DrawerProps` and `DrawerSectionProps` |
| `packages/ComponentLibrary/src/components/Drawer/index.tsx` | Modify | Thread `onItemHover` to DrawerItems |
| `packages/ComponentLibrary/src/components/Drawer/DrawerSection/index.tsx` | Modify | Fire `onItemHover` on leaf item mouseenter |

---

## Task 1: In-Flight Deduplication in Metadata Class

**Files:**
- Modify: `packages/api-client/src/api/metadata.ts:28-34` (add static field), `:133-146` (wrap `_getWindow`), `:110-115` (wrap `_getToolbar`), `:174-180` (wrap `_getLabels`)
- Create: `packages/api-client/src/api/__tests__/metadata.dedup.test.ts`

- [ ] **Step 1: Write failing tests for deduplication**

Create `packages/api-client/src/api/__tests__/metadata.dedup.test.ts`:

```typescript
import { Metadata } from "../metadata";

jest.mock("../cache", () => ({
  CacheStore: jest.fn().mockImplementation(() => {
    const store = new Map();
    return {
      get: jest.fn((key) => store.get(key)),
      set: jest.fn((key, value) => store.set(key, value)),
      clear: jest.fn(() => store.clear()),
      delete: jest.fn((key) => store.delete(key)),
    };
  }),
}));

describe("Metadata in-flight deduplication", () => {
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (Metadata as any).currentRoleId = null;
    (Metadata as any).cache.clear();
    // Clear pending requests between tests
    (Metadata as any).pendingRequests?.clear();

    postSpy = jest.spyOn(Metadata.client, "post").mockResolvedValue({
      data: { tabs: [] },
      ok: true,
    });

    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn(() => "test-role"),
        setItem: jest.fn(),
        clear: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it("should return the same promise for concurrent _getWindow calls with same windowId", async () => {
    const promise1 = Metadata.forceWindowReload("win-1");
    const promise2 = Metadata.forceWindowReload("win-1");

    expect(promise1).toBe(promise2);
    expect(postSpy).toHaveBeenCalledTimes(1);

    await Promise.all([promise1, promise2]);
  });

  it("should make separate requests for different windowIds", async () => {
    const promise1 = Metadata.forceWindowReload("win-1");
    const promise2 = Metadata.forceWindowReload("win-2");

    expect(promise1).not.toBe(promise2);
    expect(postSpy).toHaveBeenCalledTimes(2);

    await Promise.all([promise1, promise2]);
  });

  it("should allow a new request after the previous one resolves", async () => {
    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(1);

    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it("should clean up pending request on error", async () => {
    postSpy.mockRejectedValueOnce(new Error("Network error"));

    await expect(Metadata.forceWindowReload("win-1")).rejects.toThrow("Network error");

    // A new call should make a fresh request
    postSpy.mockResolvedValueOnce({ data: { tabs: [] }, ok: true });
    await Metadata.forceWindowReload("win-1");
    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it("should deduplicate concurrent getToolbar calls", async () => {
    postSpy.mockResolvedValue({
      data: { response: { data: [{ id: "t1", windows: ["w1"] }] } },
    });

    const promise1 = Metadata.getToolbar();
    const promise2 = Metadata.getToolbar();

    // Both should resolve to same data — only 1 HTTP call
    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toEqual(r2);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/api-client test -- --testPathPattern="metadata.dedup" --no-coverage`
Expected: FAIL — `pendingRequests` does not exist, concurrent calls make separate HTTP requests

- [ ] **Step 3: Implement deduplication in Metadata class**

In `packages/api-client/src/api/metadata.ts`, add a static field after line 36:

```typescript
private static pendingRequests = new Map<string, Promise<unknown>>();
```

Replace `_getWindow` (lines 133-146) with:

```typescript
private static async _getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
  const key = `window-${windowId}`;
  const existing = Metadata.pendingRequests.get(key);
  if (existing) return existing as Promise<Etendo.WindowMetadata>;

  const promise = (async () => {
    const { data, ok } = await Metadata.client.post(`meta/window/${windowId}`);

    if (!ok) {
      throw new Error("Window not found");
    }

    Metadata.cache.set(Metadata.getWindowCacheKey(windowId), data);
    for (const tab of data.tabs) {
      Metadata.cache.set(Metadata.getTabCacheKey(tab.id), tab);
    }

    return data as Etendo.WindowMetadata;
  })().finally(() => {
    Metadata.pendingRequests.delete(key);
  });

  Metadata.pendingRequests.set(key, promise);
  return promise;
}
```

Replace `_getToolbar` (lines 110-115) with:

```typescript
private static async _getToolbar(): Promise<Etendo.ToolbarButton[]> {
  const key = "toolbar";
  const existing = Metadata.pendingRequests.get(key);
  if (existing) return existing as Promise<Etendo.ToolbarButton[]>;

  const promise = (async () => {
    const response = await Metadata.client.post("meta/toolbar");
    const data = response.data.response.data;
    Metadata.cache.set("toolbar", data);
    return data;
  })().finally(() => {
    Metadata.pendingRequests.delete(key);
  });

  Metadata.pendingRequests.set(key, promise);
  return promise;
}
```

Replace `_getLabels` (lines 174-180) with:

```typescript
private static async _getLabels(): Promise<Etendo.Labels> {
  const key = `labels-${Metadata.language}`;
  const existing = Metadata.pendingRequests.get(key);
  if (existing) return existing as Promise<Etendo.Labels>;

  const promise = (async () => {
    const { data } = await Metadata.client.request("meta/labels");
    Metadata.cache.set(`labels-${Metadata.language}`, data);
    return data;
  })().finally(() => {
    Metadata.pendingRequests.delete(key);
  });

  Metadata.pendingRequests.set(key, promise);
  return promise;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/api-client test -- --testPathPattern="metadata.dedup" --no-coverage`
Expected: PASS

- [ ] **Step 5: Run existing metadata tests to verify no regressions**

Run: `pnpm --filter @workspaceui/api-client test -- --testPathPattern="metadata" --no-coverage`
Expected: All existing tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/api-client/src/api/metadata.ts packages/api-client/src/api/__tests__/metadata.dedup.test.ts
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add in-flight deduplication to Metadata class

Concurrent calls to _getWindow, _getToolbar, and _getLabels now
return the same promise instead of firing duplicate HTTP requests.
This is a prerequisite for eager fetch and hover prefetch optimizations.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Promise-Level Guard in metadataStore.loadWindowData

**Files:**
- Modify: `packages/MainUI/stores/metadataStore.ts:23-33` (add to interface), `:42-90` (wrap loadWindowData)
- Create: `packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts`

- [ ] **Step 1: Write failing test for store-level deduplication**

Create `packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts`:

```typescript
import { useMetadataZustandStore } from "../metadataStore";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

describe("metadataStore loadWindowData deduplication", () => {
  beforeEach(() => {
    useMetadataZustandStore.getState().resetForRole();
    jest.clearAllMocks();
  });

  it("should return the same promise for concurrent loadWindowData calls", async () => {
    const mockWindowData = { id: "win-1", tabs: [] };
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockResolvedValue(mockWindowData as any);

    const { loadWindowData } = useMetadataZustandStore.getState();

    const promise1 = loadWindowData("win-1");
    const promise2 = loadWindowData("win-1");

    expect(promise1).toBe(promise2);

    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toEqual(mockWindowData);
    expect(r2).toEqual(mockWindowData);
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(1);
  });

  it("should allow a new request after the previous one completes", async () => {
    const mockWindowData = { id: "win-1", tabs: [] };
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockResolvedValue(mockWindowData as any);

    const store = useMetadataZustandStore.getState();

    await store.loadWindowData("win-1");
    // Reset store to clear cached data so second call actually fetches
    store.resetForRole();

    await useMetadataZustandStore.getState().loadWindowData("win-1");
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(2);
  });

  it("should clean up loading promise on error", async () => {
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockRejectedValueOnce(new Error("fail"));

    const { loadWindowData } = useMetadataZustandStore.getState();

    await expect(loadWindowData("win-1")).rejects.toThrow("fail");

    // Next call should try again
    mockMetadata.forceWindowReload.mockResolvedValueOnce({ id: "win-1", tabs: [] } as any);
    await useMetadataZustandStore.getState().loadWindowData("win-1");
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="metadataStore.dedup" --no-coverage`
Expected: FAIL — concurrent calls create separate promises

- [ ] **Step 3: Add promise-level guard to loadWindowData**

In `packages/MainUI/stores/metadataStore.ts`, add a module-level Map before the store creation (after line 22):

```typescript
const loadingPromises = new Map<string, Promise<Etendo.WindowMetadata>>();
```

Replace the `loadWindowData` action (lines 42-90) with:

```typescript
loadWindowData: async (windowId: string): Promise<Etendo.WindowMetadata> => {
  const { windowsData } = get();

  // If already loaded, return cached
  if (windowsData[windowId]) {
    return windowsData[windowId];
  }

  // If already fetching, return the in-flight promise
  const existing = loadingPromises.get(windowId);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      set(
        (state) => ({
          loadingWindows: { ...state.loadingWindows, [windowId]: true },
          errors: { ...state.errors, [windowId]: undefined },
        }),
        false,
        "metadata/loadWindowData:start",
      );

      logger.info(`[MetadataStore] Loading metadata for window ${windowId}`);

      Metadata.clearWindowCache(windowId);
      const newWindowData = await Metadata.forceWindowReload(windowId);

      set(
        (state) => ({
          windowsData: { ...state.windowsData, [windowId]: newWindowData },
          loadingWindows: { ...state.loadingWindows, [windowId]: false },
        }),
        false,
        "metadata/loadWindowData:success",
      );

      return newWindowData;
    } catch (err) {
      const error = err as Error;
      logger.warn(`[MetadataStore] Error loading window ${windowId}:`, error);

      set(
        (state) => ({
          errors: { ...state.errors, [windowId]: error },
          loadingWindows: { ...state.loadingWindows, [windowId]: false },
        }),
        false,
        "metadata/loadWindowData:error",
      );

      throw error;
    } finally {
      loadingPromises.delete(windowId);
    }
  })();

  loadingPromises.set(windowId, promise);
  return promise;
},
```

Also add to the `resetForRole` action (lines 104-109), clear the loading promises:

```typescript
resetForRole: () => {
  loadingPromises.clear();
  set(
    { windowsData: {}, loadingWindows: {}, errors: {} },
    false,
    "metadata/resetForRole",
  );
},
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="metadataStore.dedup" --no-coverage`
Expected: PASS

- [ ] **Step 5: Run existing metadataStore tests for regressions**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="metadataStore" --no-coverage`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/MainUI/stores/metadataStore.ts packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add promise-level guard to loadWindowData

Concurrent calls to loadWindowData for the same windowId now
return the same promise. Prevents duplicate HTTP requests when
MetadataSynchronizer and eager fetch overlap.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Non-Destructive prefetchWindowData Action

**Files:**
- Modify: `packages/MainUI/stores/metadataStore.ts:23-33` (add to interface), add new action
- Add tests to: `packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts`

- [ ] **Step 1: Write failing tests for prefetchWindowData**

Append to `packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts`:

```typescript
describe("metadataStore prefetchWindowData", () => {
  beforeEach(() => {
    useMetadataZustandStore.getState().resetForRole();
    jest.clearAllMocks();
  });

  it("should return immediately if window data already exists in store", async () => {
    const mockWindowData = { id: "win-1", tabs: [] };
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    mockMetadata.forceWindowReload.mockResolvedValue(mockWindowData as any);

    // Load first via loadWindowData
    await useMetadataZustandStore.getState().loadWindowData("win-1");

    // prefetchWindowData should NOT trigger any new API call
    mockMetadata.getWindow.mockResolvedValue(mockWindowData as any);
    await useMetadataZustandStore.getState().prefetchWindowData("win-1");

    expect(mockMetadata.getWindow).not.toHaveBeenCalled();
  });

  it("should use Metadata.getWindow (non-destructive) instead of forceWindowReload", async () => {
    const mockWindowData = { id: "win-2", tabs: [] };
    mockMetadata.getWindow.mockResolvedValue(mockWindowData as any);

    await useMetadataZustandStore.getState().prefetchWindowData("win-2");

    expect(mockMetadata.getWindow).toHaveBeenCalledWith("win-2");
    expect(mockMetadata.clearWindowCache).not.toHaveBeenCalled();
    expect(mockMetadata.forceWindowReload).not.toHaveBeenCalled();
  });

  it("should store result in windowsData on success", async () => {
    const mockWindowData = { id: "win-3", tabs: [] };
    mockMetadata.getWindow.mockResolvedValue(mockWindowData as any);

    await useMetadataZustandStore.getState().prefetchWindowData("win-3");

    expect(useMetadataZustandStore.getState().windowsData["win-3"]).toEqual(mockWindowData);
  });

  it("should silently swallow errors", async () => {
    mockMetadata.getWindow.mockRejectedValue(new Error("network fail"));

    // Should NOT throw
    await expect(
      useMetadataZustandStore.getState().prefetchWindowData("win-4")
    ).resolves.toBeUndefined();

    expect(useMetadataZustandStore.getState().windowsData["win-4"]).toBeUndefined();
  });

  it("should skip if window is already loading", async () => {
    mockMetadata.clearWindowCache.mockImplementation(() => {});
    // Make forceWindowReload hang
    mockMetadata.forceWindowReload.mockReturnValue(new Promise(() => {}));

    // Start a loadWindowData (will hang, setting loadingWindows)
    useMetadataZustandStore.getState().loadWindowData("win-5");

    // prefetchWindowData should bail out
    mockMetadata.getWindow.mockResolvedValue({ id: "win-5", tabs: [] } as any);
    await useMetadataZustandStore.getState().prefetchWindowData("win-5");

    expect(mockMetadata.getWindow).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="metadataStore.dedup" --no-coverage`
Expected: FAIL — `prefetchWindowData` does not exist

- [ ] **Step 3: Implement prefetchWindowData**

In `packages/MainUI/stores/metadataStore.ts`, add to the interface (after line 32):

```typescript
prefetchWindowData: (windowId: string) => Promise<void>;
```

Add the action inside the store (after the `loadWindowData` action, before `getWindowMetadata`):

```typescript
prefetchWindowData: async (windowId: string): Promise<void> => {
  const { windowsData, loadingWindows } = get();

  // Skip if already loaded or currently loading
  if (windowsData[windowId] || loadingWindows[windowId]) {
    return;
  }

  try {
    // Use getWindow (checks localStorage cache first, non-destructive)
    const data = await Metadata.getWindow(windowId);

    set(
      (state) => ({
        windowsData: { ...state.windowsData, [windowId]: data },
      }),
      false,
      "metadata/prefetchWindowData:success",
    );
  } catch {
    // Silently swallow — prefetch failure should not affect UX
  }
},
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="metadataStore.dedup" --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/stores/metadataStore.ts packages/MainUI/stores/__tests__/metadataStore.dedup.test.ts
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add non-destructive prefetchWindowData action

Uses Metadata.getWindow (checks localStorage first) instead of
forceWindowReload. Does not clear cache. Silently swallows errors.
Safe for hover prefetch scenarios.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Eager Metadata Fetch on Click (Sidebar)

**Files:**
- Modify: `packages/MainUI/components/Sidebar.tsx:219-289` (handleClick)

- [ ] **Step 1: Add eager metadata fetch to handleClick**

In `packages/MainUI/components/Sidebar.tsx`, add the import at the top (after line 18):

```typescript
import { useMetadataZustandStore } from "@/stores/metadataStore";
```

Inside the `Sidebar` component (after line 178, near other store hooks):

```typescript
const loadWindowData = useMetadataZustandStore((s) => s.loadWindowData);
```

In the `handleClick` callback, after line 285 (`const newWindowIdentifier = getNewWindowIdentifier(windowId);`), add the eager fetch call before `setWindowActive`:

```typescript
// Eager fetch: start metadata loading immediately on click, don't wait for MetadataSynchronizer useEffect
// Fire-and-forget — errors are handled by MetadataSynchronizer's own .catch()
loadWindowData(windowId).catch(() => {});
```

Update the dependency array of `handleClick` (line 288) to include `loadWindowData`:

```typescript
[token, ETENDO_BASE_URL, setWindowActive, loadWindowData]
```

- [ ] **Step 2: Verify manually that MetadataSynchronizer doesn't double-fetch**

The `MetadataSynchronizer` at `contexts/metadata.tsx:38` checks `!isWindowLoading(activeWindow.windowId)`. Since `loadWindowData` sets `loadingWindows[windowId] = true` synchronously before the async fetch, the synchronizer will see it as loading and skip. This is safe thanks to the promise-level guard from Task 2.

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Sidebar.tsx
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Eager metadata fetch on menu click

Start loading window metadata immediately on click instead of
waiting for MetadataSynchronizer useEffect to fire. Eliminates
1-2 render cycles (~16-32ms) of delay before the network request starts.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Hover Prefetch — ComponentLibrary Props

**Files:**
- Modify: `packages/ComponentLibrary/src/components/Drawer/types.ts:21,33-52,65-80,106-118`
- Modify: `packages/ComponentLibrary/src/components/Drawer/index.tsx`
- Modify: `packages/ComponentLibrary/src/components/Drawer/DrawerSection/index.tsx`

- [ ] **Step 1: Add onItemHover to DrawerProps, DrawerSectionProps, DrawerItemsProps**

In `packages/ComponentLibrary/src/components/Drawer/types.ts`:

Add to `DrawerProps` (after line 39, after `onClick: NavigateFn;`):

```typescript
onItemHover?: NavigateFn;
```

Add to `DrawerSectionProps` (after line 67, after `onClick: NavigateFn;`):

```typescript
onItemHover?: NavigateFn;
```

Add to `DrawerItemsProps` (after line 108, after `onClick: NavigateFn;`):

```typescript
onItemHover?: NavigateFn;
```

- [ ] **Step 2: Thread onItemHover through Drawer → DrawerItems → DrawerSection**

In `packages/ComponentLibrary/src/components/Drawer/index.tsx`, destructure `onItemHover` from props and pass it to `DrawerItems`. Find where `DrawerItems` is rendered and add `onItemHover={onItemHover}`.

In the DrawerItems component (find the file under `Drawer/` — likely `Search/index.tsx` or similar), destructure `onItemHover` and pass it to each `DrawerSection`.

In `packages/ComponentLibrary/src/components/Drawer/DrawerSection/index.tsx`:

Destructure `onItemHover` from props (add after `onClick` on line 29):

```typescript
onItemHover,
```

Add a `handleMouseEnterLeaf` callback (after `handleItemClick` around line 63):

```typescript
const handleMouseEnterLeaf = useCallback(() => {
  if (!hasChildren && onItemHover) {
    onItemHover(item);
  }
}, [hasChildren, onItemHover, item]);
```

On the root `<div>` (line 200-205), update the `onMouseEnter` handler:

Add a combined mouse enter handler (wrap in `useCallback` to preserve `React.memo` optimization):

```typescript
const handleCombinedMouseEnter = useCallback(
  (event: React.MouseEvent<HTMLElement>) => {
    handleMouseEnter(event);
    handleMouseEnterLeaf();
  },
  [handleMouseEnter, handleMouseEnterLeaf]
);
```

Then replace `onMouseEnter={handleMouseEnter}` on the root div with:

```typescript
onMouseEnter={handleCombinedMouseEnter}
```

Also pass `onItemHover` to recursive `DrawerSection` children (lines 220-233 and lines 258-271):

```typescript
onItemHover={onItemHover}
```

- [ ] **Step 3: Verify ComponentLibrary builds**

Run: `cd packages/ComponentLibrary && pnpm build`
Expected: Build succeeds with no type errors

- [ ] **Step 4: Commit**

```bash
git add packages/ComponentLibrary/src/components/Drawer/types.ts packages/ComponentLibrary/src/components/Drawer/index.tsx packages/ComponentLibrary/src/components/Drawer/DrawerSection/index.tsx
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add onItemHover prop to Drawer components

Thread onItemHover callback from Drawer → DrawerItems → DrawerSection.
Fires on mouseenter for leaf menu items (items without children).
This enables hover prefetch in consuming components like Sidebar.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Precise threading path:**

1. `Drawer` (`packages/ComponentLibrary/src/components/Drawer/index.tsx`):
   - Destructure `onItemHover` from props (line 50 area, after `searchContext`)
   - Pass to `DrawerItems` at line 152: add `onItemHover={onItemHover}`

2. `DrawerItems` (`packages/ComponentLibrary/src/components/Drawer/Search/index.tsx`):
   - Destructure `onItemHover` from props (line 26 area)
   - Pass to each `DrawerSection` at line 48: add `onItemHover={onItemHover}`

3. `DrawerSection` already handled above (destructure prop, fire on leaf mouseenter, pass to recursive children)

---

## Task 6: Hover Prefetch — Sidebar Integration

**Files:**
- Modify: `packages/MainUI/components/Sidebar.tsx`

- [ ] **Step 1: Add debounced hover handler in Sidebar**

In `packages/MainUI/components/Sidebar.tsx`, add import at top:

```typescript
import { useRef } from "react";
```

(Update the existing `import { useCallback, useEffect, useMemo, useState } from "react"` to include `useRef`)

Inside the `Sidebar` component, add after the `loadWindowData` hook (from Task 4):

```typescript
const prefetchWindowData = useMetadataZustandStore((s) => s.prefetchWindowData);
const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleItemHover = useCallback(
  (item: Menu) => {
    if (item.type !== "Window" || !item.windowId) {
      return;
    }

    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
    }

    hoverDebounceRef.current = setTimeout(() => {
      prefetchWindowData(item.windowId);
    }, 150);
  },
  [prefetchWindowData]
);
```

Pass `onItemHover` to the `Drawer` component (around line 387):

```typescript
onItemHover={handleItemHover}
```

- [ ] **Step 2: Verify no visual side effects**

Start dev server (`pnpm dev`) and verify:
- Hovering over menu items does NOT show loading spinners in the main area
- Hovering quickly across many items does NOT cause visible flicker
- Clicking a previously-hovered window loads faster (metadata already in Zustand store)

- [ ] **Step 3: Commit**

```bash
git add packages/MainUI/components/Sidebar.tsx
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add hover prefetch for menu window items

Debounced (150ms) metadata prefetch on menu item hover using the
non-destructive prefetchWindowData action. Only triggers for
Window-type items. Errors are silently swallowed.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Prefetch Store for Tab Datasources

**Files:**
- Create: `packages/MainUI/utils/prefetchStore.ts`
- Create: `packages/MainUI/utils/__tests__/prefetchStore.test.ts`

- [ ] **Step 1: Write failing tests for prefetch store**

Create `packages/MainUI/utils/__tests__/prefetchStore.test.ts`:

```typescript
import { prefetchStore } from "../prefetchStore";

describe("prefetchStore", () => {
  beforeEach(() => {
    prefetchStore.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should store and retrieve a promise", () => {
    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    expect(prefetchStore.get("entity-1")).toBe(promise);
  });

  it("should return undefined for non-existent keys", () => {
    expect(prefetchStore.get("missing")).toBeUndefined();
  });

  it("should consume (delete) on get", () => {
    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    prefetchStore.get("entity-1"); // first get consumes
    expect(prefetchStore.get("entity-1")).toBeUndefined();
  });

  it("should auto-expire entries after TTL", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    const promise = Promise.resolve({ data: "test" });
    prefetchStore.set("entity-1", promise);

    // Advance Date.now past the 30s TTL
    (Date.now as jest.Mock).mockReturnValue(now + 30_001);

    expect(prefetchStore.get("entity-1")).toBeUndefined();
  });

  it("should clear all entries", () => {
    prefetchStore.set("a", Promise.resolve(1));
    prefetchStore.set("b", Promise.resolve(2));
    prefetchStore.clear();

    expect(prefetchStore.get("a")).toBeUndefined();
    expect(prefetchStore.get("b")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="prefetchStore" --no-coverage`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement prefetch store**

Create `packages/MainUI/utils/prefetchStore.ts`:

```typescript
const PREFETCH_TTL_MS = 30_000;

interface PrefetchEntry {
  promise: Promise<unknown>;
  timestamp: number;
}

const store = new Map<string, PrefetchEntry>();

export const prefetchStore = {
  set(key: string, promise: Promise<unknown>): void {
    store.set(key, { promise, timestamp: Date.now() });
  },

  get(key: string): Promise<unknown> | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;

    // Auto-expire stale entries
    if (Date.now() - entry.timestamp > PREFETCH_TTL_MS) {
      store.delete(key);
      return undefined;
    }

    // Consume on read
    store.delete(key);
    return entry.promise;
  },

  clear(): void {
    store.clear();
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @workspaceui/mainui test -- --testPathPattern="prefetchStore" --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/MainUI/utils/prefetchStore.ts packages/MainUI/utils/__tests__/prefetchStore.test.ts
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Add in-memory prefetch store for tab datasources

Simple Map with consume-on-read semantics and 30s TTL.
Used by useDatasource to check for prefetched responses
before making network requests.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Parallel Tab Datasource Prefetch

**Files:**
- Modify: `packages/MainUI/stores/metadataStore.ts` (add prefetch call after loadWindowData resolves)
- Modify: `packages/MainUI/hooks/useDatasource.ts` (check prefetch store)

- [ ] **Step 1: Add tab datasource prefetch trigger in metadataStore**

In `packages/MainUI/stores/metadataStore.ts`, add import:

```typescript
import { prefetchStore } from "@/utils/prefetchStore";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
```

Add `resetForRole` cleanup — in the `resetForRole` action, add `prefetchStore.clear()`:

```typescript
resetForRole: () => {
  loadingPromises.clear();
  prefetchStore.clear();
  set(
    { windowsData: {}, loadingWindows: {}, errors: {} },
    false,
    "metadata/resetForRole",
  );
},
```

In `loadWindowData`, after the line that sets success state (`"metadata/loadWindowData:success"`), add:

```typescript
// Prefetch datasources for root-level tabs in parallel
if (newWindowData.tabs?.length) {
  const rootTabs = newWindowData.tabs.filter((tab) => !tab.parentTabId);
  for (const tab of rootTabs) {
    if (tab.entityName) {
      const prefetchPromise = datasource.get(tab.entityName, {
        _textMatchStyle: "substring",
        startRow: 0,
        endRow: 1000,
        pageSize: 1000,
      });
      prefetchStore.set(`ds-${tab.entityName}`, prefetchPromise);
    }
  }
}
```

- [ ] **Step 2: Consume prefetch store in useDatasource**

In `packages/MainUI/hooks/useDatasource.ts`, add import:

```typescript
import { prefetchStore } from "@/utils/prefetchStore";
```

In the `fetchData` callback (around line 224-265), after `const safePageSize = pageSize ?? 1000;` (line 232) and before the `try` block (line 234), add prefetch store check. Use `targetPage` (the function parameter) instead of `page` (the state variable) for clarity:

```typescript
// Check if a prefetched response exists for this entity
const prefetchKey = `ds-${entity}`;
const prefetchedPromise = targetPage === 1 ? prefetchStore.get(prefetchKey) : undefined;

if (prefetchedPromise) {
  try {
    const prefetchedResult = await prefetchedPromise as {
      ok: boolean;
      data: { response: { data: EntityData[] } };
    };

    if (prefetchedResult.ok && prefetchedResult.data?.response?.data) {
      const safePageSize = pageSize ?? 1000;
      setHasMoreRecords(prefetchedResult.data.response.data.length >= safePageSize);
      setRecords(prefetchedResult.data.response.data);
      setLoaded(true);
      setLoading(false);
      fetchInProgressRef.current = false;
      return;
    }
  } catch {
    // Prefetch failed — fall through to normal fetch
  }
}
```

- [ ] **Step 3: Run all tests**

Run: `pnpm test --no-coverage`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/MainUI/stores/metadataStore.ts packages/MainUI/hooks/useDatasource.ts
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Parallel tab datasource prefetch

After window metadata loads, immediately fire datasource requests
for all root-level tabs in parallel. useDatasource checks the
prefetch store before making its own request.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Lint + Full Test Suite

- [ ] **Step 1: Run linter**

Run: `pnpm check`
Fix any issues found.

- [ ] **Step 2: Run full test suite**

Run: `pnpm test --no-coverage`
Expected: All PASS

- [ ] **Step 3: Fix any failures, commit if needed**

Stage only the files modified by lint fixes (check `git status` first), then:

```bash
git commit -m "$(cat <<'EOF'
Feature ETP-3931: Fix lint and test issues from request flow optimization

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Manual Performance Verification

- [ ] **Step 1: Start dev server and open Chrome DevTools Performance tab**

Run: `pnpm dev`

Navigate to a window with 4+ tabs. Record a Performance profile covering:
1. Click on a menu item (cold load)
2. Navigate to a different window
3. Hover over a third window item, wait 200ms, then click

- [ ] **Step 2: Compare against baseline**

Check:
- Network tab shows parallel datasource requests (overlapping bars, not sequential)
- Hovering a menu item triggers a `/meta/window/` request before clicking
- No duplicate requests for the same window
- Scripting time reduced compared to pre-optimization baseline

- [ ] **Step 3: Document results**

Note any measured improvements or issues for the PR description.

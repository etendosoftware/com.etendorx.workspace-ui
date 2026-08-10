import { useToolbarStore } from "@/stores/toolbarStore";
import { TOOLBAR_ACTION_OWNERS, resolveToolbarActions } from "@/utils/toolbar/actionOwnership";

const TAB_ID = "tab_1";
const OTHER_TAB_ID = "tab_2";

const getActionsByOwner = (tabId: string) => useToolbarStore.getState().byTabId[tabId]?.actionsByOwner;

const resolveFor = (tabId: string) => {
  const byOwner = getActionsByOwner(tabId);
  if (!byOwner) throw new Error(`Tab ${tabId} is not initialized`);
  return resolveToolbarActions(byOwner);
};

describe("toolbarStore — owner-scoped action registration", () => {
  beforeEach(() => {
    useToolbarStore.setState({ byTabId: {} });
    useToolbarStore.getState().initTab(TAB_ID);
  });

  it("starts with an empty bucket per owner", () => {
    expect(getActionsByOwner(TAB_ID)).toEqual({
      [TOOLBAR_ACTION_OWNERS.FORM]: {},
      [TOOLBAR_ACTION_OWNERS.GRID]: {},
      [TOOLBAR_ACTION_OWNERS.TAB]: {},
    });
  });

  it("writes only into the owner's own bucket", () => {
    const gridRefresh = jest.fn(async () => {});
    useToolbarStore.getState().registerRawActions(TAB_ID, { refresh: gridRefresh }, TOOLBAR_ACTION_OWNERS.GRID);

    expect(getActionsByOwner(TAB_ID)?.[TOOLBAR_ACTION_OWNERS.GRID]).toEqual({ refresh: gridRefresh });
    expect(getActionsByOwner(TAB_ID)?.[TOOLBAR_ACTION_OWNERS.FORM]).toEqual({});
    expect(getActionsByOwner(TAB_ID)?.[TOOLBAR_ACTION_OWNERS.TAB]).toEqual({});
  });

  it("merges successive registrations of the same owner", () => {
    const store = useToolbarStore.getState();
    const filter = jest.fn();
    const columnFilters = jest.fn();
    store.registerRawActions(TAB_ID, { filter }, TOOLBAR_ACTION_OWNERS.GRID);
    store.registerRawActions(TAB_ID, { columnFilters }, TOOLBAR_ACTION_OWNERS.GRID);

    expect(getActionsByOwner(TAB_ID)?.[TOOLBAR_ACTION_OWNERS.GRID]).toEqual({ filter, columnFilters });
  });

  // The regression that motivated owner scoping: the grid re-registers on every
  // refetch, which used to overwrite the form's save with a no-op.
  it("keeps the form's save intact when the grid re-registers", async () => {
    const store = useToolbarStore.getState();
    const formSave = jest.fn(async () => true);
    store.registerRawActions(TAB_ID, { save: formSave }, TOOLBAR_ACTION_OWNERS.FORM);
    store.registerRawActions(TAB_ID, { refresh: jest.fn(async () => {}) }, TOOLBAR_ACTION_OWNERS.GRID);

    const resolved = resolveFor(TAB_ID);
    expect(resolved.save).toBe(formSave);
    await expect(resolved.save({})).resolves.toBe(true);
  });

  // React runs child effects before parent effects, which used to let the tab
  // overwrite the form's unsaved-changes-aware back handler.
  it("keeps the form's back handler when the tab re-registers afterwards", () => {
    const store = useToolbarStore.getState();
    const formBack = jest.fn();
    const tabBack = jest.fn();
    store.registerRawActions(TAB_ID, { back: formBack }, TOOLBAR_ACTION_OWNERS.FORM);
    store.registerRawActions(TAB_ID, { back: tabBack }, TOOLBAR_ACTION_OWNERS.TAB);

    expect(resolveFor(TAB_ID).back).toBe(formBack);
  });

  describe("clearOwnerActions", () => {
    it("empties only the requested bucket", () => {
      const store = useToolbarStore.getState();
      const formBack = jest.fn();
      const tabBack = jest.fn();
      const gridFilter = jest.fn();
      store.registerRawActions(TAB_ID, { back: formBack }, TOOLBAR_ACTION_OWNERS.FORM);
      store.registerRawActions(TAB_ID, { back: tabBack }, TOOLBAR_ACTION_OWNERS.TAB);
      store.registerRawActions(TAB_ID, { filter: gridFilter }, TOOLBAR_ACTION_OWNERS.GRID);

      store.clearOwnerActions(TAB_ID, TOOLBAR_ACTION_OWNERS.FORM);

      expect(resolveFor(TAB_ID).back).toBe(tabBack);
      expect(resolveFor(TAB_ID).filter).toBe(gridFilter);
    });

    it("is a no-op for an unknown tab", () => {
      expect(() =>
        useToolbarStore.getState().clearOwnerActions(OTHER_TAB_ID, TOOLBAR_ACTION_OWNERS.FORM)
      ).not.toThrow();
      expect(getActionsByOwner(OTHER_TAB_ID)).toBeUndefined();
    });
  });

  it("does not leak registrations across tabs", () => {
    const store = useToolbarStore.getState();
    store.initTab(OTHER_TAB_ID);
    const formSave = jest.fn(async () => true);
    store.registerRawActions(TAB_ID, { save: formSave }, TOOLBAR_ACTION_OWNERS.FORM);

    expect(getActionsByOwner(OTHER_TAB_ID)?.[TOOLBAR_ACTION_OWNERS.FORM]).toEqual({});
  });
});

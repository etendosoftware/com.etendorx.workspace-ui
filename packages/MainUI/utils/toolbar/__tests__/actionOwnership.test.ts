import { defaultActions } from "@/stores/toolbarStore";
import {
  TOOLBAR_ACTION_OWNERS,
  TOOLBAR_OWNER_PRIORITY,
  type ToolbarActionsByOwner,
  createEmptyActionsByOwner,
  resolveToolbarActions,
} from "../actionOwnership";

const makeByOwner = (overrides: Partial<ToolbarActionsByOwner> = {}): ToolbarActionsByOwner => ({
  ...createEmptyActionsByOwner(),
  ...overrides,
});

/** Action names in a stable order, so two sets of keys can be compared. */
const sortedActionNames = (actions: object): string[] => Object.keys(actions).sort((a, b) => a.localeCompare(b));

describe("createEmptyActionsByOwner", () => {
  it("creates one empty bucket per owner", () => {
    expect(createEmptyActionsByOwner()).toEqual({
      [TOOLBAR_ACTION_OWNERS.FORM]: {},
      [TOOLBAR_ACTION_OWNERS.GRID]: {},
      [TOOLBAR_ACTION_OWNERS.TAB]: {},
    });
  });

  it("returns a fresh object each call so buckets are not shared between tabs", () => {
    const first = createEmptyActionsByOwner();
    const second = createEmptyActionsByOwner();
    expect(first).not.toBe(second);
    expect(first[TOOLBAR_ACTION_OWNERS.FORM]).not.toBe(second[TOOLBAR_ACTION_OWNERS.FORM]);
  });
});

describe("TOOLBAR_OWNER_PRIORITY", () => {
  it("ranks the form pane above the grid, and the grid above the tab", () => {
    expect(TOOLBAR_OWNER_PRIORITY).toEqual([
      TOOLBAR_ACTION_OWNERS.FORM,
      TOOLBAR_ACTION_OWNERS.GRID,
      TOOLBAR_ACTION_OWNERS.TAB,
    ]);
  });
});

describe("resolveToolbarActions", () => {
  it("falls back to the defaults when nothing is registered", () => {
    const resolved = resolveToolbarActions(createEmptyActionsByOwner());
    expect(resolved).toEqual(defaultActions);
  });

  it("returns the no-op save default when no form pane is mounted", async () => {
    const resolved = resolveToolbarActions(createEmptyActionsByOwner());
    await expect(resolved.save({})).resolves.toBe(false);
  });

  it("prefers the form pane over the grid for a shared action", () => {
    const formRefresh = jest.fn(async () => {});
    const gridRefresh = jest.fn(async () => {});
    const resolved = resolveToolbarActions(
      makeByOwner({
        [TOOLBAR_ACTION_OWNERS.FORM]: { refresh: formRefresh },
        [TOOLBAR_ACTION_OWNERS.GRID]: { refresh: gridRefresh },
      })
    );
    expect(resolved.refresh).toBe(formRefresh);
  });

  it("prefers the grid over the tab for a shared action", () => {
    const gridFilter = jest.fn();
    const tabFilter = jest.fn();
    const resolved = resolveToolbarActions(
      makeByOwner({
        [TOOLBAR_ACTION_OWNERS.GRID]: { filter: gridFilter },
        [TOOLBAR_ACTION_OWNERS.TAB]: { filter: tabFilter },
      })
    );
    expect(resolved.filter).toBe(gridFilter);
  });

  it("keeps each owner's exclusive actions", () => {
    const formSave = jest.fn(async () => true);
    const gridColumnFilters = jest.fn();
    const tabShowTableAndForm = jest.fn();
    const resolved = resolveToolbarActions(
      makeByOwner({
        [TOOLBAR_ACTION_OWNERS.FORM]: { save: formSave },
        [TOOLBAR_ACTION_OWNERS.GRID]: { columnFilters: gridColumnFilters },
        [TOOLBAR_ACTION_OWNERS.TAB]: { showTableAndForm: tabShowTableAndForm },
      })
    );
    expect(resolved.save).toBe(formSave);
    expect(resolved.columnFilters).toBe(gridColumnFilters);
    expect(resolved.showTableAndForm).toBe(tabShowTableAndForm);
  });

  it("restores the tab's back handler once the form bucket is released", () => {
    const formBack = jest.fn();
    const tabBack = jest.fn();
    const withForm = makeByOwner({
      [TOOLBAR_ACTION_OWNERS.FORM]: { back: formBack },
      [TOOLBAR_ACTION_OWNERS.TAB]: { back: tabBack },
    });
    expect(resolveToolbarActions(withForm).back).toBe(formBack);

    const withoutForm = { ...withForm, [TOOLBAR_ACTION_OWNERS.FORM]: {} };
    expect(resolveToolbarActions(withoutForm).back).toBe(tabBack);
  });

  it("resolves every known action key", () => {
    const resolved = resolveToolbarActions(createEmptyActionsByOwner());
    expect(sortedActionNames(resolved)).toEqual(sortedActionNames(defaultActions));
  });
});

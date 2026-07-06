import { useWindowStore } from "../windowStore";

beforeEach(() => {
  useWindowStore.setState({
    windows: {},
    dirtyWindows: {},
    isRecoveryLoading: false,
    recoveryError: null,
    triggerRecovery: () => {},
  });
});

describe("windowStore dirty registry", () => {
  it("marks a window dirty when a source is set", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toEqual({ "form:tab1": true });
  });

  it("removes a source key when set to false", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win1", "form:tab1", false);

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toEqual({});
  });

  it("tracks multiple sources per window", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win1", "table:tab2", true);

    const state = useWindowStore.getState();
    expect(Object.values(state.dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(true);

    store.setWindowDirtySource("win1", "form:tab1", false);
    expect(Object.values(useWindowStore.getState().dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(true);

    store.setWindowDirtySource("win1", "table:tab2", false);
    expect(Object.values(useWindowStore.getState().dirtyWindows["win1"] ?? {}).some(Boolean)).toBe(false);
  });

  it("cleanupWindow removes dirtyWindows entry", () => {
    const store = useWindowStore.getState();
    store.setWindowActive({ windowIdentifier: "win1", windowData: { title: "Test" } });
    store.setWindowDirtySource("win1", "form:tab1", true);

    store.cleanupWindow("win1");

    const state = useWindowStore.getState();
    expect(state.dirtyWindows["win1"]).toBeUndefined();
  });

  it("cleanState clears all dirtyWindows", () => {
    const store = useWindowStore.getState();
    store.setWindowDirtySource("win1", "form:tab1", true);
    store.setWindowDirtySource("win2", "table:tab2", true);

    store.cleanState();

    const state = useWindowStore.getState();
    expect(state.dirtyWindows).toEqual({});
  });
});

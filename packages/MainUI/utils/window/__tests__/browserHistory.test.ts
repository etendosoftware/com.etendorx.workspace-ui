import {
  HISTORY_STATE_KEY,
  applyNavigationStep,
  buildNavigationStep,
  isSameStep,
  planRestore,
  readNavigationEntry,
  resolveHistoryWrite,
  withNavigationEntry,
  wouldDiscardUnsavedForm,
  type NavigationEntry,
} from "../browserHistory";
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import { useWindowStore } from "@/stores/windowStore";
import type { WindowState } from "@/utils/window/constants";

const ORDER = "143_1";
const PARTNER = "123_2";
const PRODUCT = "140_3";
const HEADER_TAB = "headerTab";
const LINES_TAB = "linesTab";

const formTab = (level: number, recordId: string) => ({
  level,
  selectedRecord: recordId,
  form: { mode: TAB_MODES.FORM, recordId, formMode: FORM_MODES.EDIT },
});

const makeWindow = (windowIdentifier: string, isActive: boolean, tabs: Record<string, unknown> = {}): WindowState =>
  ({ windowId: windowIdentifier.split("_")[0], windowIdentifier, isActive, tabs }) as unknown as WindowState;

const entry = (step: Partial<NavigationEntry>): NavigationEntry => ({
  index: 0,
  activeWindowIdentifier: null,
  form: null,
  ...step,
});

const seed = (windows: WindowState[]) =>
  useWindowStore.setState({ windows: Object.fromEntries(windows.map((w) => [w.windowIdentifier, w])) });

const windowsOf = () => Object.values(useWindowStore.getState().windows);

beforeEach(() => {
  useWindowStore.setState({ windows: {}, dirtyWindows: {} });
});

describe("buildNavigationStep", () => {
  it("is home when no window is active", () => {
    expect(buildNavigationStep([makeWindow(ORDER, false)])).toEqual({ activeWindowIdentifier: null, form: null });
  });

  it("describes the active window and its deepest open record form", () => {
    const step = buildNavigationStep([
      makeWindow(ORDER, false),
      makeWindow(PARTNER, true, { [HEADER_TAB]: formTab(0, "r1"), [LINES_TAB]: formTab(1, "r2") }),
    ]);

    expect(step).toEqual({
      activeWindowIdentifier: PARTNER,
      form: { tabId: LINES_TAB, recordId: "r2", level: 1 },
    });
  });

  it("has no form while the active window only shows grids", () => {
    const step = buildNavigationStep([makeWindow(ORDER, true, { [HEADER_TAB]: { level: 0, selectedRecord: "r1" } })]);

    expect(step.form).toBeNull();
  });
});

describe("resolveHistoryWrite", () => {
  const order = entry({ activeWindowIdentifier: ORDER });

  it("only tags the first entry", () => {
    expect(resolveHistoryWrite(null, { activeWindowIdentifier: ORDER, form: null }, 1, 0)).toBe("replace");
  });

  it("does nothing while the step is the same", () => {
    expect(resolveHistoryWrite(order, { activeWindowIdentifier: ORDER, form: null }, 1, 1)).toBe("none");
  });

  it("pushes when another window is opened or activated", () => {
    expect(resolveHistoryWrite(order, { activeWindowIdentifier: PARTNER, form: null }, 2, 1)).toBe("push");
    expect(resolveHistoryWrite(order, { activeWindowIdentifier: PARTNER, form: null }, 2, 2)).toBe("push");
  });

  it("pushes when a record form is opened or left", () => {
    const opened = { activeWindowIdentifier: ORDER, form: { tabId: HEADER_TAB, recordId: "r1", level: 0 } };

    expect(resolveHistoryWrite(order, opened, 1, 1)).toBe("push");
    expect(resolveHistoryWrite(entry({ ...opened }), { activeWindowIdentifier: ORDER, form: null }, 1, 1)).toBe("push");
  });

  it("rewrites the current entry when a window is closed", () => {
    expect(resolveHistoryWrite(order, { activeWindowIdentifier: PARTNER, form: null }, 1, 2)).toBe("replace");
  });

  it("ignores the level of the form when comparing steps", () => {
    const a = { activeWindowIdentifier: ORDER, form: { tabId: HEADER_TAB, recordId: "r1", level: 0 } };
    expect(isSameStep(a, { ...a, form: { ...a.form, level: 5 } })).toBe(true);
  });
});

describe("history.state marker", () => {
  it("is read back from what withNavigationEntry wrote, keeping other fields", () => {
    const written = withNavigationEntry({ other: 1 }, entry({ index: 3, activeWindowIdentifier: ORDER }));

    expect(written.other).toBe(1);
    expect(readNavigationEntry(written)).toMatchObject({ index: 3, activeWindowIdentifier: ORDER });
  });

  it("does not copy the keys that make Next.js skip its router sync", () => {
    const written = withNavigationEntry({ __NA: true, _N: true, other: 1 }, entry({ index: 1 }));

    expect(written).not.toHaveProperty("__NA");
    expect(written).not.toHaveProperty("_N");
    expect(written.other).toBe(1);
  });

  it("is not found in entries written by someone else", () => {
    expect(readNavigationEntry(null)).toBeNull();
    expect(readNavigationEntry({ __NA: true })).toBeNull();
    expect(readNavigationEntry({ [HISTORY_STATE_KEY]: { activeWindowIdentifier: ORDER } })).toBeNull();
  });
});

describe("planRestore", () => {
  it("goes home for a step without a window", () => {
    expect(planRestore(entry({}), {})).toEqual({ kind: "home" });
  });

  it("skips a window that was closed in the meantime", () => {
    expect(planRestore(entry({ activeWindowIdentifier: PRODUCT }), {})).toEqual({ kind: "skip" });
  });

  it("restores an open window", () => {
    seed([makeWindow(ORDER, false)]);

    expect(planRestore(entry({ activeWindowIdentifier: ORDER }), useWindowStore.getState().windows).kind).toBe(
      "restore"
    );
  });
});

describe("wouldDiscardUnsavedForm", () => {
  const leavingForm = entry({ activeWindowIdentifier: ORDER });

  it("is true when the form of a window with unsaved changes would be left", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: formTab(0, "r1") })]);

    expect(
      wouldDiscardUnsavedForm(leavingForm, useWindowStore.getState().windows, {
        [ORDER]: { [`form:${HEADER_TAB}`]: true },
      })
    ).toBe(true);
  });

  it("is false when the window has no unsaved changes", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: formTab(0, "r1") })]);

    expect(wouldDiscardUnsavedForm(leavingForm, useWindowStore.getState().windows, {})).toBe(false);
  });

  it("is false when another window is only brought to the front", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: formTab(0, "r1") }), makeWindow(PARTNER, false)]);

    expect(
      wouldDiscardUnsavedForm(entry({ activeWindowIdentifier: PARTNER }), useWindowStore.getState().windows, {
        [ORDER]: { [`form:${HEADER_TAB}`]: true },
      })
    ).toBe(false);
  });
});

describe("applyNavigationStep", () => {
  it("brings another window to the front", () => {
    seed([makeWindow(ORDER, true), makeWindow(PARTNER, false)]);

    applyNavigationStep({ activeWindowIdentifier: PARTNER, form: null });

    expect(useWindowStore.getState().windows[PARTNER].isActive).toBe(true);
    expect(useWindowStore.getState().windows[ORDER].isActive).toBe(false);
  });

  it("goes home without closing any window", () => {
    seed([makeWindow(ORDER, true)]);

    applyNavigationStep({ activeWindowIdentifier: null, form: null });

    expect(windowsOf()).toHaveLength(1);
    expect(buildNavigationStep(windowsOf()).activeWindowIdentifier).toBeNull();
  });

  it("leaves the record form when the step shows the grid", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: formTab(0, "r1") })]);

    applyNavigationStep({ activeWindowIdentifier: ORDER, form: null });

    expect(buildNavigationStep(windowsOf()).form).toBeNull();
    expect(useWindowStore.getState().windows[ORDER].tabs[HEADER_TAB].selectedRecord).toBe("r1");
  });

  it("opens the record form the step shows", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: { level: 0 } })]);

    applyNavigationStep({ activeWindowIdentifier: ORDER, form: { tabId: HEADER_TAB, recordId: "r9", level: 0 } });

    expect(buildNavigationStep(windowsOf()).form).toEqual({ tabId: HEADER_TAB, recordId: "r9", level: 0 });
  });

  it("closes only the forms deeper than the one the step shows", () => {
    seed([makeWindow(ORDER, true, { [HEADER_TAB]: formTab(0, "r1"), [LINES_TAB]: formTab(1, "r2") })]);

    applyNavigationStep({ activeWindowIdentifier: ORDER, form: { tabId: HEADER_TAB, recordId: "r1", level: 0 } });

    expect(buildNavigationStep(windowsOf()).form).toEqual({ tabId: HEADER_TAB, recordId: "r1", level: 0 });
  });
});

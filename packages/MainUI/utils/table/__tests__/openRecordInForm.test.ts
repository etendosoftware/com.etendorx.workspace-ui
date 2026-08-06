/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Unit tests for the shared "open a grid record in form view" transition.
 *
 * The behaviour under test is what makes a double click (and the Enter shortcut, and the actions
 * column button) leave the grid row selected: the row selection is applied before the navigation,
 * and it replaces any previous selection so the highlighted row always matches the opened record.
 * The child tab parent guard and the deferred parent selection restore are covered too, since all
 * three entry points now share them.
 */

import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import {
  isParentSelectionMissing,
  openRecordInForm,
  PARENT_SELECTION_RESTORE_DELAY_MS,
  resolveRecordId,
  type OpenRecordInFormParams,
} from "../openRecordInForm";

const WINDOW_IDENTIFIER = "win1_1";
const CHILD_TAB_ID = "childTab";
const PARENT_TAB_ID = "parentTab";
const RECORD_A_ID = "recordA";
const RECORD_B_ID = "recordB";
const PARENT_RECORD_ID = "parentRecord";

const SELECT_ROW = "selectRow";
const SET_SELECTED = "graph.setSelected";
const SET_SELECTED_MULTIPLE = "graph.setSelectedMultiple";
const SET_RECORD_ID = "setRecordId";
const GET_SELECTED = "graph.getSelected";

const makeTab = (id: string): Tab => ({ id, window: "window1" }) as unknown as Tab;

const makeRecord = (id: EntityData["id"]): EntityData => ({ id }) as EntityData;

const childTab = makeTab(CHILD_TAB_ID);
const parentTab = makeTab(PARENT_TAB_ID);
const recordB = makeRecord(RECORD_B_ID);
const parentRecord = makeRecord(PARENT_RECORD_ID);

interface HarnessOptions {
  /** Parent tab returned by the graph, undefined for a root tab. */
  parent?: Tab;
  /** Graph selection currently held by the parent tab. */
  parentGraphSelection?: EntityData;
  /** Selected record id the window store holds for the parent tab. */
  parentStoreSelection?: string;
  /** Simulates a window instance whose identifier is not resolved yet. */
  unresolvedWindow?: boolean;
  /** Row ids selected in the grid before the transition. */
  initialSelection?: Record<string, boolean>;
}

/**
 * Builds the collaborators `openRecordInForm` needs, recording every interaction in a shared
 * `calls` array so the order of operations can be asserted, and keeping a realistic `selection`
 * object that `selectRow` replaces the same way the grid does.
 *
 * @param options - Graph hierarchy, store state and initial grid selection to simulate
 * @returns The spies, the mutable grid selection and a ready to use params factory
 */
const makeHarness = ({
  parent,
  parentGraphSelection,
  parentStoreSelection,
  unresolvedWindow = false,
  initialSelection = {},
}: HarnessOptions = {}) => {
  const calls: string[] = [];
  let selection: Record<string, boolean> = { ...initialSelection };
  const windowIdentifier = unresolvedWindow ? undefined : WINDOW_IDENTIFIER;

  const graph = {
    getParent: jest.fn(() => parent),
    getSelected: jest.fn(() => {
      calls.push(GET_SELECTED);
      return parentGraphSelection;
    }),
    setSelected: jest.fn(() => {
      calls.push(SET_SELECTED);
    }),
    setSelectedMultiple: jest.fn(() => {
      calls.push(SET_SELECTED_MULTIPLE);
    }),
  };

  const getSelectedRecord = jest.fn(() => parentStoreSelection);

  const selectRow = jest.fn((recordId: string) => {
    calls.push(SELECT_ROW);
    selection = { [recordId]: true };
  });

  const setRecordId = jest.fn(() => {
    calls.push(SET_RECORD_ID);
  });

  const buildParams = (record: EntityData, tab: Tab = childTab): OpenRecordInFormParams => ({
    record,
    tab,
    graph,
    windowIdentifier,
    getSelectedRecord,
    selectRow,
    setRecordId,
  });

  return {
    calls,
    graph,
    getSelectedRecord,
    selectRow,
    setRecordId,
    buildParams,
    getSelection: () => selection,
  };
};

/** Asserts that the transition left no trace at all, used by every blocked case. */
const expectNoSideEffects = (harness: ReturnType<typeof makeHarness>) => {
  expect(harness.selectRow).not.toHaveBeenCalled();
  expect(harness.setRecordId).not.toHaveBeenCalled();
  expect(harness.graph.setSelected).not.toHaveBeenCalled();
  expect(harness.graph.setSelectedMultiple).not.toHaveBeenCalled();
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("openRecordInForm", () => {
  it("selects the row and navigates to the record, reporting success", () => {
    const harness = makeHarness();

    const result = openRecordInForm(harness.buildParams(recordB));

    expect(result).toBe(true);
    expect(harness.selectRow).toHaveBeenCalledWith(RECORD_B_ID);
    expect(harness.setRecordId).toHaveBeenCalledWith(RECORD_B_ID);
  });

  it("selects the row before writing the graph and before navigating", () => {
    const harness = makeHarness();

    openRecordInForm(harness.buildParams(recordB));

    expect(harness.calls).toEqual([SELECT_ROW, SET_SELECTED, SET_SELECTED_MULTIPLE, SET_RECORD_ID]);
  });

  it("writes both the single and the multiple graph selection for the record", () => {
    const harness = makeHarness();

    openRecordInForm(harness.buildParams(recordB));

    expect(harness.graph.setSelected).toHaveBeenCalledWith(childTab, recordB);
    expect(harness.graph.setSelectedMultiple).toHaveBeenCalledWith(childTab, [recordB]);
  });

  it("does not schedule a parent restore when the tab has no parent", () => {
    const harness = makeHarness();

    openRecordInForm(harness.buildParams(recordB));
    jest.runAllTimers();

    expect(harness.graph.setSelected).toHaveBeenCalledTimes(1);
  });

  it("coerces a numeric record id to the string form used by the grid and the store", () => {
    const harness = makeHarness();

    openRecordInForm(harness.buildParams(makeRecord(42)));

    expect(harness.selectRow).toHaveBeenCalledWith("42");
    expect(harness.setRecordId).toHaveBeenCalledWith("42");
  });

  it.each([
    ["an undefined id", makeRecord(undefined)],
    ["a null id", makeRecord(null as unknown as string)],
  ])("reports failure and does nothing for a record with %s", (_label, record) => {
    const harness = makeHarness();

    const result = openRecordInForm(harness.buildParams(record));

    expect(result).toBe(false);
    expectNoSideEffects(harness);
  });

  it("replaces the previously selected row instead of merging it", () => {
    const harness = makeHarness({ initialSelection: { [RECORD_A_ID]: true } });

    openRecordInForm(harness.buildParams(recordB));

    expect(harness.getSelection()).toEqual({ [RECORD_B_ID]: true });
  });

  it("keeps the highlighted row and the navigation target on the same record", () => {
    const harness = makeHarness({ initialSelection: { [RECORD_A_ID]: true } });

    openRecordInForm(harness.buildParams(recordB));

    expect(Object.keys(harness.getSelection())).toEqual([harness.setRecordId.mock.calls[0][0]]);
  });

  it("is blocked when a child tab's parent has no selected record", () => {
    const harness = makeHarness({ parent: parentTab, parentStoreSelection: undefined });

    const result = openRecordInForm(harness.buildParams(recordB));

    expect(result).toBe(false);
    expectNoSideEffects(harness);
  });

  it("is blocked for a child tab while the window identifier is not resolved yet", () => {
    const harness = makeHarness({
      parent: parentTab,
      parentStoreSelection: PARENT_RECORD_ID,
      unresolvedWindow: true,
    });

    const result = openRecordInForm(harness.buildParams(recordB));

    expect(result).toBe(false);
    expect(harness.getSelectedRecord).not.toHaveBeenCalled();
    expectNoSideEffects(harness);
  });

  it("proceeds on a root tab even while the window identifier is not resolved yet", () => {
    const harness = makeHarness({ unresolvedWindow: true });

    const result = openRecordInForm(harness.buildParams(recordB));

    expect(result).toBe(true);
    expect(harness.selectRow).toHaveBeenCalledWith(RECORD_B_ID);
  });

  it("restores the parent graph selection once the restore delay elapses", () => {
    const harness = makeHarness({
      parent: parentTab,
      parentGraphSelection: parentRecord,
      parentStoreSelection: PARENT_RECORD_ID,
    });

    openRecordInForm(harness.buildParams(recordB));
    expect(harness.graph.setSelected).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(PARENT_SELECTION_RESTORE_DELAY_MS - 1);
    expect(harness.graph.setSelected).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    expect(harness.graph.setSelected).toHaveBeenCalledTimes(2);
    expect(harness.graph.setSelected).toHaveBeenLastCalledWith(parentTab, parentRecord);
  });

  it("reads the parent selection before overwriting the selection of this tab", () => {
    const harness = makeHarness({
      parent: parentTab,
      parentGraphSelection: parentRecord,
      parentStoreSelection: PARENT_RECORD_ID,
    });

    openRecordInForm(harness.buildParams(recordB));

    expect(harness.calls).toEqual([GET_SELECTED, SELECT_ROW, SET_SELECTED, SET_SELECTED_MULTIPLE, SET_RECORD_ID]);
  });

  it("does not schedule a restore when the parent holds no graph selection", () => {
    const harness = makeHarness({
      parent: parentTab,
      parentGraphSelection: undefined,
      parentStoreSelection: PARENT_RECORD_ID,
    });

    openRecordInForm(harness.buildParams(recordB));
    jest.runAllTimers();

    expect(harness.graph.setSelected).toHaveBeenCalledTimes(1);
  });
});

describe("isParentSelectionMissing", () => {
  const getSelectedRecord = jest.fn(() => PARENT_RECORD_ID);

  it("never blocks a root tab", () => {
    expect(isParentSelectionMissing(undefined, WINDOW_IDENTIFIER, getSelectedRecord)).toBe(false);
  });

  it("blocks a child tab while the window identifier is not resolved yet", () => {
    expect(isParentSelectionMissing(parentTab, undefined, getSelectedRecord)).toBe(true);
  });

  it("allows a child tab whose parent has a selected record", () => {
    expect(isParentSelectionMissing(parentTab, WINDOW_IDENTIFIER, getSelectedRecord)).toBe(false);
  });

  it("blocks a child tab whose parent selection is an empty string", () => {
    expect(isParentSelectionMissing(parentTab, WINDOW_IDENTIFIER, () => "")).toBe(true);
  });
});

describe("resolveRecordId", () => {
  it.each([
    ["a string id", makeRecord(RECORD_A_ID), RECORD_A_ID],
    ["a numeric id", makeRecord(42), "42"],
    ["an undefined id", makeRecord(undefined), ""],
    ["a null id", makeRecord(null as unknown as string), ""],
  ])("resolves %s", (_label, record, expected) => {
    expect(resolveRecordId(record)).toBe(expected);
  });
});

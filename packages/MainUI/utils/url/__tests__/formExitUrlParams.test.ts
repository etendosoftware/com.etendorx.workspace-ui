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
 * Integration tests for the URL parameters derived from the window store when a tab enters and
 * leaves form view.
 *
 * The URL is derived state: WindowProvider rebuilds it from the store with buildWindowsUrlParams.
 * Every exit path (toolbar Cancel, the form close button, Escape, the auto close of a child form)
 * ends in clearTabFormState, so these tests exercise that store transition instead of each handler,
 * and assert both halves of the fix: the tab and record identifiers leave the URL, while the grid
 * selection is kept so the row stays highlighted when the user is back on the grid.
 */

import { buildWindowsUrlParams } from "../utils";
import { FORM_MODES, NEW_RECORD_ID, TAB_MODES } from "../constants";
import { useWindowStore } from "@/stores/windowStore";

const WINDOW_IDENTIFIER = "143_123456";
const PARENT_TAB_ID = "parentTab";
const CHILD_TAB_ID = "childTab";
const PARENT_RECORD_ID = "parentRecord";
const CHILD_RECORD_ID = "childRecord";
const WINDOW_ONLY_PARAMS = `wi_0=${WINDOW_IDENTIFIER}`;

/** Opens a record in form view the way Tab.handleSetRecordId does: selection plus form state. */
const openFormOnTab = (tabId: string, recordId: string, tabLevel: number) => {
  const store = useWindowStore.getState();
  store.setSelectedRecord(WINDOW_IDENTIFIER, tabId, recordId, tabLevel);
  store.setTabFormState(
    WINDOW_IDENTIFIER,
    tabId,
    { recordId, mode: TAB_MODES.FORM, formMode: FORM_MODES.EDIT },
    tabLevel
  );
};

/** Selects a grid row without opening the form, as a single click does. */
const selectRowOnTab = (tabId: string, recordId: string, tabLevel: number) => {
  useWindowStore.getState().setSelectedRecord(WINDOW_IDENTIFIER, tabId, recordId, tabLevel);
};

/** Exits form view, which is what toolbar Cancel, the close button and Escape end up doing. */
const leaveFormView = (tabId: string) => {
  useWindowStore.getState().clearTabFormState(WINDOW_IDENTIFIER, tabId);
};

/** Rebuilds the URL parameters the same way the WindowProvider effect does. */
const currentUrlParams = (): string => buildWindowsUrlParams(Object.values(useWindowStore.getState().windows));

const selectedRecordOf = (tabId: string): string | undefined =>
  useWindowStore.getState().windows[WINDOW_IDENTIFIER]?.tabs[tabId]?.selectedRecord;

beforeEach(() => {
  useWindowStore.setState({ windows: {} });
});

describe("URL params when leaving form view", () => {
  it("encodes the tab and the record while the form is open", () => {
    openFormOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);

    expect(currentUrlParams()).toBe(`${WINDOW_ONLY_PARAMS}&ti_0=${PARENT_TAB_ID}&ri_0=${PARENT_RECORD_ID}`);
  });

  it("drops the tab and the record when the form is left", () => {
    openFormOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);

    leaveFormView(PARENT_TAB_ID);

    expect(currentUrlParams()).toBe(WINDOW_ONLY_PARAMS);
  });

  it("keeps the grid selection after the form is left, so the row stays highlighted", () => {
    openFormOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);

    leaveFormView(PARENT_TAB_ID);

    expect(selectedRecordOf(PARENT_TAB_ID)).toBe(PARENT_RECORD_ID);
  });

  it("encodes the child tab when a child record is open under a selected parent", () => {
    selectRowOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);
    openFormOnTab(CHILD_TAB_ID, CHILD_RECORD_ID, 1);

    expect(currentUrlParams()).toBe(`${WINDOW_ONLY_PARAMS}&ti_0=${CHILD_TAB_ID}&ri_0=${CHILD_RECORD_ID}`);
  });

  it("drops the tab and the record when a child form is left, even though the parent stays selected", () => {
    selectRowOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);
    openFormOnTab(CHILD_TAB_ID, CHILD_RECORD_ID, 1);

    leaveFormView(CHILD_TAB_ID);

    expect(currentUrlParams()).toBe(WINDOW_ONLY_PARAMS);
    expect(selectedRecordOf(PARENT_TAB_ID)).toBe(PARENT_RECORD_ID);
  });

  it("does not encode the previously selected row while a new record is being created", () => {
    selectRowOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);

    useWindowStore.getState().setTabFormState(WINDOW_IDENTIFIER, PARENT_TAB_ID, {
      recordId: NEW_RECORD_ID,
      mode: TAB_MODES.FORM,
      formMode: FORM_MODES.NEW,
    });

    expect(currentUrlParams()).toBe(WINDOW_ONLY_PARAMS);
  });

  it("does not encode a tab that only has a grid row selected", () => {
    selectRowOnTab(PARENT_TAB_ID, PARENT_RECORD_ID, 0);

    expect(currentUrlParams()).toBe(WINDOW_ONLY_PARAMS);
  });
});

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

import type { WindowContextState } from "@/utils/window/constants";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey, type DirtyWindows } from "@/utils/window/dirtyState";
import { buildDirtyWindowRows } from "../dirtyWindowRows";
import { UNTITLED_WINDOW_TITLE } from "../windowTitle";

const ORDER_WINDOW = "143_1000";
const PARTNER_WINDOW = "180_2000";
const ORDER_TITLE = "Sales Order";
const HEADER_TAB = "header";
const LINES_TAB = "lines";

const FORM_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, HEADER_TAB);
const TABLE_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.TABLE, LINES_TAB);

/** Window state carrying only what the row builder reads. */
const createWindows = (): WindowContextState =>
  ({
    [ORDER_WINDOW]: { windowIdentifier: ORDER_WINDOW, title: ORDER_TITLE, tabs: {} },
    [PARTNER_WINDOW]: { windowIdentifier: PARTNER_WINDOW, title: "", tabs: {} },
  }) as unknown as WindowContextState;

describe("buildDirtyWindowRows", () => {
  const windows = createWindows();

  const buildRows = (dirtyWindows: DirtyWindows) => buildDirtyWindowRows(dirtyWindows, windows, {});

  it("returns nothing when no window is dirty", () => {
    expect(buildRows({})).toEqual([]);
  });

  it("marks a window with a dirty form as savable", () => {
    expect(buildRows({ [ORDER_WINDOW]: { [FORM_KEY]: true } })).toEqual([
      { windowIdentifier: ORDER_WINDOW, title: ORDER_TITLE, hasSavableForm: true, hasGridEditing: false },
    ]);
  });

  it("marks a window with inline grid edits as not savable", () => {
    expect(buildRows({ [ORDER_WINDOW]: { [TABLE_KEY]: true } })).toEqual([
      { windowIdentifier: ORDER_WINDOW, title: ORDER_TITLE, hasSavableForm: false, hasGridEditing: true },
    ]);
  });

  it("reports both kinds when the window holds each of them", () => {
    const [row] = buildRows({ [ORDER_WINDOW]: { [FORM_KEY]: true, [TABLE_KEY]: true } });

    expect(row).toMatchObject({ hasSavableForm: true, hasGridEditing: true });
  });

  it("skips flags left behind by a window that was already closed", () => {
    expect(buildRows({ "999_1": { [FORM_KEY]: true } })).toEqual([]);
  });

  it("falls back to the untitled label when neither state nor metadata names the window", () => {
    const [row] = buildRows({ [PARTNER_WINDOW]: { [FORM_KEY]: true } });

    expect(row.title).toBe(UNTITLED_WINDOW_TITLE);
  });
});

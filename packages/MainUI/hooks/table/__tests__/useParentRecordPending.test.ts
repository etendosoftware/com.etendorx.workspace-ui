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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, renderHook } from "@testing-library/react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { useWindowStore } from "@/stores/windowStore";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { PARENT_RECORD_WAIT_MS, useParentRecordPending } from "../useParentRecordPending";

const WINDOW = "143_1";
const PARENT_TAB = "186";
const PARENT_ID = "order-1";
const OTHER_PARENT_ID = "order-2";
const RECOVERED = { initializedWithDirectLink: true };

type Props = { parentId: string; parentRecord: EntityData | null; parentTabId?: string };

/** The state of the parent tab in the window store. */
const givenParentTab = (tabState: Record<string, unknown>) =>
  useWindowStore.setState({ windows: { [WINDOW]: { tabs: { [PARENT_TAB]: tabState } } } } as never);

const renderPending = (props: Partial<Props> = {}) =>
  renderHook((current: Props) => useParentRecordPending({ windowIdentifier: WINDOW, ...current }), {
    initialProps: { parentId: PARENT_ID, parentRecord: null, parentTabId: PARENT_TAB, ...props },
  });

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.useRealTimers();
  useWindowStore.setState({ windows: {} } as never);
});

describe("useParentRecordPending", () => {
  it("waits for the record of a parent rebuilt from a link or the URL, until it arrives", () => {
    givenParentTab(RECOVERED);
    const { result, rerender } = renderPending();

    expect(result.current).toBe(true);

    rerender({ parentId: PARENT_ID, parentRecord: { id: PARENT_ID }, parentTabId: PARENT_TAB });
    expect(result.current).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("waits for the record the form of the parent is loading", () => {
    givenParentTab({ form: { recordId: PARENT_ID } });

    expect(renderPending().result.current).toBe(true);
  });

  it("does not wait when the record of the parent is not on its way", () => {
    // The id is in the store but nothing is loading the record: the child loads with the id, as before
    givenParentTab({ selectedRecord: PARENT_ID });

    expect(renderPending().result.current).toBe(false);
  });

  it.each([
    ["the record is already there", { parentRecord: { id: PARENT_ID } }],
    ["the tab has no parent", { parentTabId: undefined }],
    ["there is no parent id", { parentId: "" }],
    ["the parent is a new record", { parentId: NEW_RECORD_ID }],
  ])("does not wait when %s", (_case, props) => {
    givenParentTab(RECOVERED);

    expect(renderPending(props).result.current).toBe(false);
  });

  it("keeps waiting for an empty parent record, which is no record", () => {
    givenParentTab(RECOVERED);

    expect(renderPending({ parentRecord: {} as EntityData }).result.current).toBe(true);
  });

  it("stops waiting after the longest wait, and waits again for another parent", () => {
    givenParentTab(RECOVERED);
    const { result, rerender } = renderPending();

    act(() => jest.advanceTimersByTime(PARENT_RECORD_WAIT_MS - 1));
    expect(result.current).toBe(true);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);

    rerender({ parentId: OTHER_PARENT_ID, parentRecord: null, parentTabId: PARENT_TAB });
    expect(result.current).toBe(true);
  });

  it("cancels the wait when the grid unmounts", () => {
    givenParentTab(RECOVERED);
    const { unmount } = renderPending();

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});

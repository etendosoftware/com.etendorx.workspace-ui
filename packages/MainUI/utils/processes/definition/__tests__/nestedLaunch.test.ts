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

import type { Tab } from "@workspaceui/api-client/src/api/types";
import { buildNestedLaunch, refreshLauncherView } from "../nestedLaunch";
import type { ViewData } from "../scriptProxies";

const PROCESS_ID = "154CB4F9274A479CB38A285E16984539";
const OWNER_TAB = { id: "TAB-1", window: "WIN-1" } as Tab;
const OWNER_RECORD = { id: "FA-1" };
const LAUNCHER_FIELD = { id: "FIELD-1", record: { id: "FA-1" } };

const launcher = (overrides: Record<string, unknown> = {}) => ({
  windowId: "WIN-1",
  viewData: { callerField: LAUNCHER_FIELD } as ViewData,
  ownerTab: OWNER_TAB,
  ownerRecord: OWNER_RECORD,
  ...overrides,
});

describe("buildNestedLaunch", () => {
  it("runs the nested process in the launcher's tab and record and keeps the script params", () => {
    const launch = buildNestedLaunch(
      { processId: PROCESS_ID, externalParams: { bankStatementLineId: "BSL-1" } },
      launcher()
    );

    expect(launch).toEqual(
      expect.objectContaining({
        processId: PROCESS_ID,
        windowId: "WIN-1",
        externalParams: { bankStatementLineId: "BSL-1" },
        ownerTab: OWNER_TAB,
        ownerRecord: OWNER_RECORD,
      })
    );
  });

  it("keeps the script's own windowId", () => {
    expect(buildNestedLaunch({ processId: PROCESS_ID, windowId: "OTHER" }, launcher()).windowId).toBe("OTHER");
  });

  it("uses the script's callerField and its view (Classic `callerField: me`)", () => {
    const rowView = { onRefreshFunction: jest.fn() };
    const row = { id: "BSL-1", amount: 10 };

    const launch = buildNestedLaunch(
      { processId: PROCESS_ID, callerField: { record: row, view: rowView } },
      launcher()
    );

    expect(launch.callerField).toEqual({ record: row, view: rowView });
  });

  it("falls back to the launcher's callerField, with the view data as its view", () => {
    const launch = buildNestedLaunch({ processId: PROCESS_ID }, launcher());

    expect(launch.callerField).toEqual({ ...LAUNCHER_FIELD, view: { callerField: LAUNCHER_FIELD } });
  });

  it("refreshes the caller view on success", () => {
    const rowView = { onRefreshFunction: jest.fn() };
    const launch = buildNestedLaunch({ processId: PROCESS_ID, callerField: { view: rowView } }, launcher());

    launch.onSuccess?.();

    expect(rowView.onRefreshFunction).toHaveBeenCalledWith(rowView);
    expect(launch.onClose).toBeUndefined();
  });
});

describe("refreshLauncherView", () => {
  it("prefers the view's own onRefreshFunction", () => {
    const view = { onRefreshFunction: jest.fn() };
    const fallback = jest.fn();

    refreshLauncherView(view, fallback);

    expect(view.onRefreshFunction).toHaveBeenCalledWith(view);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back to the launching modal's hook for a view without one", () => {
    const view = { windowId: "WIN-1" };
    const fallback = jest.fn();

    refreshLauncherView(view, fallback);

    expect(fallback).toHaveBeenCalledWith(view);
  });

  it("does nothing without any hook", () => {
    expect(() => refreshLauncherView(undefined)).not.toThrow();
  });
});

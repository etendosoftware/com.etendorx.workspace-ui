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

/**
 * @fileoverview Unit tests for shouldRunProcessLifecycleHooks.
 *
 * Covers the gate that decides whether onLoad/onProcess run for a modal open:
 * any top-level open (window tab or standalone menu) yes; nested script-launched
 * modals (which forward a callerField) no. This is the fix for the standalone
 * "VAT Regularization" process whose onLoad never ran (no tab) and so never hid
 * its Accounts grid.
 */

import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { CallerField } from "../scriptProxies";
import { shouldRunProcessLifecycleHooks } from "../processLifecycle";

const TAB = { id: "tab-1" } as Tab;
const CALLER_FIELD: CallerField = { id: "field-1", name: "EM_Aprm_Funds_Trans" };

describe("shouldRunProcessLifecycleHooks", () => {
  it("runs when a window tab is present (with or without a callerField)", () => {
    expect(shouldRunProcessLifecycleHooks({ tab: TAB, callerField: undefined })).toBe(true);
    expect(shouldRunProcessLifecycleHooks({ tab: TAB, callerField: CALLER_FIELD })).toBe(true);
  });

  it("runs for a standalone menu open (no tab, no callerField)", () => {
    expect(shouldRunProcessLifecycleHooks({ tab: undefined, callerField: undefined })).toBe(true);
  });

  it("does not run for a nested modal (no tab, callerField forwarded)", () => {
    expect(shouldRunProcessLifecycleHooks({ tab: undefined, callerField: CALLER_FIELD })).toBe(false);
  });
});

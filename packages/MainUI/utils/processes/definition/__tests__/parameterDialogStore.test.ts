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

import {
  clearParameterDialogs,
  type DynamicFormField,
  openParameterDialog,
  peekParameterDialog,
  resolveParameterDialog,
  subscribeParameterDialogs,
} from "../parameterDialogStore";

const FIELDS: DynamicFormField[] = [
  { id: "p1", name: "Reference", inputType: "TEXT", defaultText: "abc" },
  { id: "p2", name: "Confirm", inputType: "CHECK", defaultCheck: "Y" },
];

describe("parameterDialogStore", () => {
  afterEach(() => {
    clearParameterDialogs();
  });

  it("auto-resolves to null when no host is mounted", async () => {
    await expect(openParameterDialog({ fields: FIELDS })).resolves.toBeNull();
  });

  it("queues a request a mounted host can peek, and resolves with collected values", async () => {
    const unsubscribe = subscribeParameterDialogs(() => {});
    const promise = openParameterDialog({ title: "Pick", fields: FIELDS });

    const pending = peekParameterDialog();
    expect(pending?.title).toBe("Pick");
    expect(pending?.fields).toEqual(FIELDS);

    const collected = [{ id: "p1", name: "Reference", inputType: "TEXT" as const, value: "xyz" }];
    resolveParameterDialog(pending?.id ?? -1, collected);

    await expect(promise).resolves.toEqual(collected);
    expect(peekParameterDialog()).toBeUndefined();
    unsubscribe();
  });

  it("resolves with null when the dialog is cancelled", async () => {
    const unsubscribe = subscribeParameterDialogs(() => {});
    const promise = openParameterDialog({ fields: FIELDS });
    resolveParameterDialog(peekParameterDialog()?.id ?? -1, null);
    await expect(promise).resolves.toBeNull();
    unsubscribe();
  });

  it("clearParameterDialogs resolves every pending dialog with null", async () => {
    const unsubscribe = subscribeParameterDialogs(() => {});
    const promise = openParameterDialog({ fields: FIELDS });
    clearParameterDialogs();
    await expect(promise).resolves.toBeNull();
    expect(peekParameterDialog()).toBeUndefined();
    unsubscribe();
  });

  it("notifies subscribers when a request is enqueued and resolved", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeParameterDialogs(listener);
    openParameterDialog({ fields: FIELDS });
    expect(listener).toHaveBeenCalledTimes(1);
    resolveParameterDialog(peekParameterDialog()?.id ?? -1, null);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

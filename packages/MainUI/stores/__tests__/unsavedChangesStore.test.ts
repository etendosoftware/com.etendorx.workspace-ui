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

import { useUnsavedChangesStore } from "../unsavedChangesStore";

describe("unsavedChangesStore", () => {
  const onProceed = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useUnsavedChangesStore.setState({ request: null, bypassUnloadWarning: false });
  });

  it("starts with nothing pending and the unload warning active", () => {
    const state = useUnsavedChangesStore.getState();

    expect(state.request).toBeNull();
    expect(state.bypassUnloadWarning).toBe(false);
  });

  it("stores the held-back action without running it", () => {
    useUnsavedChangesStore.getState().openRequest({ onProceed, onCancel });

    expect(useUnsavedChangesStore.getState().request).toEqual({ onProceed, onCancel });
    expect(onProceed).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("clears the pending action", () => {
    useUnsavedChangesStore.getState().openRequest({ onProceed });
    useUnsavedChangesStore.getState().closeRequest();

    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("replaces a pending action when a new one is opened", () => {
    const secondProceed = jest.fn();

    useUnsavedChangesStore.getState().openRequest({ onProceed });
    useUnsavedChangesStore.getState().openRequest({ onProceed: secondProceed });

    expect(useUnsavedChangesStore.getState().request?.onProceed).toBe(secondProceed);
  });

  it("toggles the unload-warning bypass", () => {
    useUnsavedChangesStore.getState().setBypassUnloadWarning(true);
    expect(useUnsavedChangesStore.getState().bypassUnloadWarning).toBe(true);

    useUnsavedChangesStore.getState().setBypassUnloadWarning(false);
    expect(useUnsavedChangesStore.getState().bypassUnloadWarning).toBe(false);
  });
});

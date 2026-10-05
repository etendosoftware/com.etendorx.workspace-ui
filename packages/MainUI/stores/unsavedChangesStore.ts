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

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * An app-level action (logout, role change, language change) that was held back
 * because some window still has unsaved changes.
 */
export interface UnsavedChangesRequest {
  /** Runs once the user has saved, discarded or explicitly chosen to discard everything. */
  onProceed: () => void;
  /** Runs when the user backs out and keeps working. */
  onCancel?: () => void;
}

interface UnsavedChangesStore {
  /** The action waiting for the user's decision, or `null` when nothing is pending. */
  request: UnsavedChangesRequest | null;
  /**
   * While true the native beforeunload warning is skipped.
   *
   * Needed for the in-app hard reloads (language change): the user already answered
   * the custom modal, so chaining the browser dialog behind it would ask twice.
   */
  bypassUnloadWarning: boolean;
  openRequest: (request: UnsavedChangesRequest) => void;
  closeRequest: () => void;
  setBypassUnloadWarning: (value: boolean) => void;
}

export const useUnsavedChangesStore = create<UnsavedChangesStore>()(
  devtools(
    (set) => ({
      request: null,
      bypassUnloadWarning: false,
      openRequest: (request) => set({ request }, false, "unsavedChanges/openRequest"),
      closeRequest: () => set({ request: null }, false, "unsavedChanges/closeRequest"),
      setBypassUnloadWarning: (value) =>
        set({ bypassUnloadWarning: value }, false, "unsavedChanges/setBypassUnloadWarning"),
    }),
    { name: "UnsavedChangesStore" }
  )
);

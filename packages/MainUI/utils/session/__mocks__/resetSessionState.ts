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
 * Manual mock: keeps the cleanups the modules register, and `resetSessionState` runs only them, so a
 * test can check one module's cleanup without the stores the real reset also clears.
 * Enable with `jest.mock("@/utils/session/resetSessionState")`.
 */

const sessionResets = new Set<() => void>();

export const registerSessionReset = jest.fn((reset: () => void) => {
  sessionResets.add(reset);
});

export const resetSessionState = jest.fn(() => {
  for (const reset of sessionResets) {
    reset();
  }
});

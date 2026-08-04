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

import { useHelpPanelStore } from "../helpPanelStore";

describe("useHelpPanelStore", () => {
  beforeEach(() => {
    useHelpPanelStore.setState({ isOpen: false });
  });

  it("starts closed", () => {
    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });

  it("open() sets isOpen to true", () => {
    useHelpPanelStore.getState().open();
    expect(useHelpPanelStore.getState().isOpen).toBe(true);
  });

  it("close() sets isOpen to false", () => {
    useHelpPanelStore.setState({ isOpen: true });
    useHelpPanelStore.getState().close();
    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });

  it("toggle() flips isOpen in either direction", () => {
    useHelpPanelStore.getState().toggle();
    expect(useHelpPanelStore.getState().isOpen).toBe(true);
    useHelpPanelStore.getState().toggle();
    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });
});

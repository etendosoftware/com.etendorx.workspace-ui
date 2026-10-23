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

import { render, screen } from "@testing-library/react";
import ToolbarSection from "../index";

const SAVE_TOOLTIP = "Save Changes (Ctrl+S)";

describe("ToolbarSection", () => {
  it("shows the tooltip, with its shortcut, on the buttons that carry a text", () => {
    render(
      <ToolbarSection
        buttons={[{ key: "save", iconText: "Save Changes", tooltip: SAVE_TOOLTIP, icon: null, onClick: jest.fn() }]}
      />
    );

    expect(screen.getByRole("button", { name: "Save Changes" })).toHaveAttribute("title", SAVE_TOOLTIP);
  });
});

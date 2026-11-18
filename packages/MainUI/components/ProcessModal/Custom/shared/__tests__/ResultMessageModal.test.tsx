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
import { RESULT_CARD_CLASSES, ResultMessageModal } from "../ProcessModalShared";

describe("ResultMessageModal", () => {
  it.each(["success", "warning", "error"] as const)("shows a %s result on the flat card surface", (type) => {
    render(
      <ResultMessageModal
        result={{ type, title: "Done", text: "Finished" }}
        closeLabel="Close"
        onClose={jest.fn()}
        testIdPrefix="t"
      />
    );

    const card = screen.getByText("Done").closest("div.rounded-2xl") as HTMLElement;
    expect(card).toHaveClass(...RESULT_CARD_CLASSES.split(" "));
    expect(card.getAttribute("style") ?? "").not.toContain("gradient");
  });
});

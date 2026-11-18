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
import { WIDGET_TYPE_COLOR, WidgetTypeIcon } from "../widgetTypeVisuals";

describe("WidgetTypeIcon", () => {
  it.each(["RECENTLY_VIEWED", "RECENT_DOCS", "FAVORITES"] as const)("draws the %s icon in its type colour", (type) => {
    render(<WidgetTypeIcon type={type} />);

    const chip = screen.getByTestId(`WidgetTypeIcon__${type}`);
    expect(chip).toHaveClass(...WIDGET_TYPE_COLOR[type].split(" "));
    expect(chip.querySelector("svg")).toBeInTheDocument();
  });

  it("gives each of the default widgets its own colour", () => {
    const colours = new Set([
      WIDGET_TYPE_COLOR.RECENTLY_VIEWED,
      WIDGET_TYPE_COLOR.RECENT_DOCS,
      WIDGET_TYPE_COLOR.FAVORITES,
    ]);

    expect(colours.size).toBe(3);
  });
});

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

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LevelIndicatorCell } from "../LevelIndicatorCell";

/** Renders the indicator and counts its filled / empty bars. */
const renderBars = (level: number, max: number) => {
  render(<LevelIndicatorCell level={level} max={max} />);
  const svg = screen.getByRole("img");
  return {
    svg,
    filled: svg.querySelectorAll('rect[data-filled="true"]').length,
    empty: svg.querySelectorAll('rect[data-filled="false"]').length,
  };
};

describe("LevelIndicatorCell", () => {
  it.each([
    [4, 4, 4, 0],
    [3, 4, 3, 1],
    [0, 4, 0, 4],
  ])("fills %p of %p bars", (level, max, filled, empty) => {
    expect(renderBars(level, max)).toEqual(expect.objectContaining({ filled, empty }));
  });

  it("labels the level for assistive technologies", () => {
    expect(renderBars(3, 4).svg).toHaveAttribute("aria-label", "3/4");
  });

  it("draws bars of increasing height", () => {
    const heights = Array.from(renderBars(2, 4).svg.querySelectorAll("rect")).map((bar) =>
      Number(bar.getAttribute("height"))
    );

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(heights.length);
  });
});

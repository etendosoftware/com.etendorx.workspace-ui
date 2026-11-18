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
import OptionItem, { SELECTED_OPTION_TEXT_CLASSES } from "../OptionItem";
import { SELECTED_CHECK_CLASSES } from "@/utils/iconClasses";

const OPTION_ID = "opt-1";
const OPTION_LABEL = "Standard Order";
/** The check icon; the SVG mock replaces its test id, so it is found by its `alt`. */
const getCheck = () => document.querySelector('svg[alt="Selected Item"]');

const renderOption = (isSelected: boolean) =>
  render(
    <ul>
      <OptionItem
        id={OPTION_ID}
        label={OPTION_LABEL}
        index={0}
        isSelected={isSelected}
        isHighlighted={false}
        onOptionClick={jest.fn()}
        onMouseEnter={jest.fn()}
      />
    </ul>
  );

describe("OptionItem", () => {
  it("paints the selected check with the accent colour of the palette", () => {
    renderOption(true);

    expect(getCheck()).toHaveClass(SELECTED_CHECK_CLASSES);
  });

  it("keeps the selected option text readable in dark mode", () => {
    renderOption(true);

    expect(screen.getByText(OPTION_LABEL)).toHaveClass(...SELECTED_OPTION_TEXT_CLASSES.split(" "));
  });

  it("shows no check on an option that is not selected", () => {
    renderOption(false);

    expect(getCheck()).toBeNull();
  });
});

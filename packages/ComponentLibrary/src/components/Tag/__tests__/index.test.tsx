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

import { render, fireEvent } from "@testing-library/react";
import Tag from "../index";

// Mock the styles to isolate the component testing
jest.mock("../styles", () => ({
  useStyle: () => ({
    getColoredIcon: (icon: any) => <div data-testid="colored-icon">{icon}</div>,
    getChipStyles: () => ({ backgroundColor: "#123456" }),
    sx: {
      chipLabel: () => ({ margin: 0 }),
    },
  }),
}));

describe("Tag Component", () => {
  it("renders correctly with label", () => {
    const { getByText } = render(<Tag label="Test Label" />);
    expect(getByText("Test Label")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(<Tag label="Clickable" onClick={onClickMock} />);

    fireEvent.click(getByText("Clickable"));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("renders with icon if provided", () => {
    const CustomIcon = <span data-testid="custom-icon" />;
    const { getByTestId, getByText } = render(<Tag label="With Icon" icon={CustomIcon} />);

    expect(getByText("With Icon")).toBeInTheDocument();
    expect(getByTestId("colored-icon")).toBeInTheDocument();
    expect(getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies mocked chip styles", () => {
    const { container } = render(<Tag label="Styled Tag" tagColor="#f00" textColor="#fff" />);

    const chipElement = container.querySelector(".MuiChip-root");
    expect(chipElement).toHaveStyle("background-color: #123456");
  });
});

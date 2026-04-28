import { render, fireEvent } from "@testing-library/react";
import ToggleChip from "../ToggleChip";

jest.mock("../styles", () => ({
  useStyle: () => ({
    sx: {
      switch: {
        // dummy styles for testing
      },
    },
  }),
}));

describe("ToggleChip Component", () => {
  it("renders correctly", () => {
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox");
    expect(switchElement).toBeInTheDocument();
  });

  it("reflects the isActive state when false", () => {
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox") as HTMLInputElement;
    expect(switchElement.checked).toBe(false);
  });

  it("reflects the isActive state when true", () => {
    const { getByRole } = render(<ToggleChip isActive={true} onToggle={() => {}} />);
    const switchElement = getByRole("checkbox") as HTMLInputElement;
    expect(switchElement.checked).toBe(true);
  });

  it("calls onToggle when clicked", () => {
    const onToggleMock = jest.fn();
    const { getByRole } = render(<ToggleChip isActive={false} onToggle={onToggleMock} />);
    const switchElement = getByRole("checkbox");

    fireEvent.click(switchElement);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import CustomExpandButton from "../customExpandButton";

const makeRow = (overrides = {}) =>
  ({
    getIsExpanded: jest.fn().mockReturnValue(false),
    getCanExpand: jest.fn().mockReturnValue(true),
    getToggleExpandedHandler: jest.fn().mockReturnValue(jest.fn()),
    ...overrides,
  }) as any;

describe("CustomExpandButton", () => {
  it("renders expand button when row can expand and is not expanded", () => {
    const row = makeRow();
    render(<CustomExpandButton row={row} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders disabled button when row cannot expand", () => {
    const row = makeRow({ getCanExpand: jest.fn().mockReturnValue(false) });
    render(<CustomExpandButton row={row} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders a button element when not expanded", () => {
    const row = makeRow({ getIsExpanded: jest.fn().mockReturnValue(false) });
    render(<CustomExpandButton row={row} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("renders an enabled button when expanded", () => {
    const row = makeRow({ getIsExpanded: jest.fn().mockReturnValue(true) });
    render(<CustomExpandButton row={row} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });
});

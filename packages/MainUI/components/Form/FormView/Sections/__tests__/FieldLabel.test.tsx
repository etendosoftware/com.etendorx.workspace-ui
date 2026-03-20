import { render, screen, fireEvent } from "@testing-library/react";
import { FieldLabel } from "../FieldLabel";

jest.mock("../../styles", () => ({
  useStyle: () => ({
    styles: {
      labelText: { color: "#000" },
      requiredAsterisk: { color: "red" },
      dottedSpacing: {},
    },
    sx: {
      labelWrapper: {},
      linkStyles: {},
    },
  }),
}));

describe("FieldLabel", () => {
  it("renders the label text", () => {
    render(<FieldLabel label="Field Name" />);
    expect(screen.getByText("Field Name")).toBeInTheDocument();
  });

  it("renders as a span when not an entity reference", () => {
    render(<FieldLabel label="Regular Field" isEntityReference={false} />);
    expect(screen.getByText("Regular Field").tagName).toBe("SPAN");
  });

  it("renders as a link when isEntityReference is true", () => {
    render(<FieldLabel label="Entity Ref" isEntityReference={true} onLinkClick={jest.fn()} />);
    expect(screen.getByText("Entity Ref").closest("a")).toBeTruthy();
  });

  it("calls onLinkClick when link is clicked", () => {
    const onLinkClick = jest.fn();
    render(<FieldLabel label="Entity" isEntityReference={true} onLinkClick={onLinkClick} />);
    fireEvent.click(screen.getByText("Entity"));
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });

  it("renders required asterisk when required is true", () => {
    render(<FieldLabel label="Required Field" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render required asterisk when required is false", () => {
    render(<FieldLabel label="Optional Field" required={false} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});

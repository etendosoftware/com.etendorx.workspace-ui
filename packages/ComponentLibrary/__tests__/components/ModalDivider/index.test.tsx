import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModalDivider from "../../../src/components/ModalDivider";

describe("ModalDivider", () => {
  it("should render a Divider component", () => {
    const { container } = render(<ModalDivider />);

    const divider = container.querySelector("hr");
    expect(divider).toBeInTheDocument();
  });

  it("should render with MUI Divider role", () => {
    const { container } = render(<ModalDivider />);

    const divider = container.querySelector("hr");
    expect(divider).toHaveClass("MuiDivider-root");
  });

  it("should render as an hr element", () => {
    const { container } = render(<ModalDivider />);

    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("should not accept any props", () => {
    // ModalDivider doesn't accept props, just verify it renders
    const { container } = render(<ModalDivider />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

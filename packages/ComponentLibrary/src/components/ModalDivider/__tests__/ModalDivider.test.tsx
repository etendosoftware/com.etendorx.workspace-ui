import { render } from "@testing-library/react";
import ModalDivider from "../index";

describe("ModalDivider", () => {
  it("renders without crashing", () => {
    const { container } = render(<ModalDivider />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders a horizontal rule or divider element", () => {
    const { container } = render(<ModalDivider />);
    // MUI Divider renders an <hr> by default
    const divider = container.querySelector("hr");
    expect(divider).toBeInTheDocument();
  });
});

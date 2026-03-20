import { render, screen } from "@testing-library/react";
import RightButtons from "../RightButtons";

jest.mock("../../Nav.styles", () => ({
  useStyle: () => ({
    styles: {
      boxStyles: {},
      childBox: {},
    },
  }),
}));

describe("RightButtons", () => {
  it("renders children", () => {
    render(
      <RightButtons>
        <button>Action</button>
      </RightButtons>
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("renders without children", () => {
    const { container } = render(<RightButtons />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders multiple children", () => {
    render(
      <RightButtons>
        <span data-testid="child-1">One</span>
        <span data-testid="child-2">Two</span>
      </RightButtons>
    );
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import IconButtonWithText from "../index";
import { FILLED_BUTTON_TYPE, OUTLINED_BUTTON_TYPE } from "../constants";

describe("IconButtonWithText", () => {
  it("renders the button text", () => {
    render(<IconButtonWithText buttonType={FILLED_BUTTON_TYPE} text="Save" leftIcon={<span>★</span>} />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders the left icon", () => {
    render(
      <IconButtonWithText
        buttonType={FILLED_BUTTON_TYPE}
        text="Save"
        leftIcon={<span data-testid="left-icon">★</span>}
      />
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders the right icon when provided", () => {
    render(
      <IconButtonWithText
        buttonType={FILLED_BUTTON_TYPE}
        text="Save"
        leftIcon={<span>★</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      />
    );
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("renders as a button element with type button", () => {
    render(<IconButtonWithText buttonType={FILLED_BUTTON_TYPE} text="Action" leftIcon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("renders as disabled", () => {
    render(<IconButtonWithText buttonType={FILLED_BUTTON_TYPE} text="Action" leftIcon={<span>★</span>} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <IconButtonWithText buttonType={FILLED_BUTTON_TYPE} text="Action" leftIcon={<span>★</span>} onClick={onClick} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders with outlined button type", () => {
    render(<IconButtonWithText buttonType={OUTLINED_BUTTON_TYPE} text="Action" leftIcon={<span>★</span>} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with aria-label", () => {
    render(
      <IconButtonWithText
        buttonType={FILLED_BUTTON_TYPE}
        text="Action"
        leftIcon={<span>★</span>}
        ariaLabel="save-action"
      />
    );
    expect(screen.getByRole("button", { name: "save-action" })).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import Input from "../Input";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../../hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("Forms Input accessibility (ETP-6304)", () => {
  it("names the button that shows the password and tells whether it is shown", () => {
    render(<Input type="password" value="secret" onChange={jest.fn()} />);

    const toggle = screen.getByRole("button", { name: "navigation.profile.showPassword" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    const hide = screen.getByRole("button", { name: "navigation.profile.hidePassword" });
    expect(hide).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the password toggle in the Tab order", () => {
    render(<Input type="password" value="secret" onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "navigation.profile.showPassword" })).not.toHaveAttribute(
      "tabindex",
      "-1"
    );
  });

  it("names the button that clears a text field", () => {
    render(<Input type="text" value="abc" onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "common.clearField" })).toBeInTheDocument();
  });
});

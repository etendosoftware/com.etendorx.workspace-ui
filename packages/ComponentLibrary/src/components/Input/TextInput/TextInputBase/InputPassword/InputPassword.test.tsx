import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputPassword from "./index";
import ThemeProvider from "../../../../ThemeProvider";
import "@testing-library/jest-dom";

const LABEL = "Current Password";
const SHOW = "Show password";
const HIDE = "Hide password";

/**
 * Renders the password input with the default toggle labels unless overridden.
 *
 * @param props extra props for the input
 * @returns the password text box
 */
const renderInput = (props: Partial<React.ComponentProps<typeof InputPassword>> = {}) => {
  render(
    <ThemeProvider>
      <InputPassword value="secret" setValue={jest.fn()} label={LABEL} name="pwd" {...props} />
    </ThemeProvider>
  );
  return screen.getByLabelText(new RegExp(LABEL), { selector: "input" });
};

describe("InputPassword", () => {
  it("hides the password and offers to show it", () => {
    const input = renderInput();
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: SHOW })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the visibility with a click", async () => {
    const input = renderInput();
    await userEvent.click(screen.getByRole("button", { name: SHOW }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: HIDE })).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the visibility from the keyboard (Tab + Enter, then Space)", async () => {
    const input = renderInput();
    await userEvent.click(input);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: SHOW })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(input).toHaveAttribute("type", "text");

    await userEvent.keyboard(" ");
    expect(input).toHaveAttribute("type", "password");
  });

  it("uses the given labels for the toggle", () => {
    renderInput({ showPasswordLabel: "Mostrar contraseña", hidePasswordLabel: "Ocultar contraseña" });
    expect(screen.getByRole("button", { name: "Mostrar contraseña" })).toBeInTheDocument();
  });
});

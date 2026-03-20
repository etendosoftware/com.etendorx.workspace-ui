import { render, screen, fireEvent } from "@testing-library/react";
import TextInputAutoComplete from "../TextInputAutocomplete";

jest.mock("../SuggestionBox", () => ({
  __esModule: true,
  default: ({ suggestion, value }: { suggestion: string; value: string }) => (
    <div data-testid="suggestion-box">
      <span>{suggestion}</span>
    </div>
  ),
}));

describe("TextInputAutoComplete", () => {
  it("renders the input", () => {
    render(<TextInputAutoComplete value="" setValue={jest.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows the placeholder text", () => {
    render(<TextInputAutoComplete value="" setValue={jest.fn()} placeholder="Search here..." />);
    expect(screen.getByPlaceholderText("Search here...")).toBeInTheDocument();
  });

  it("displays the current value", () => {
    render(<TextInputAutoComplete value="test value" setValue={jest.fn()} />);
    expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
  });

  it("calls setValue when input changes", () => {
    const setValue = jest.fn();
    render(<TextInputAutoComplete value="" setValue={setValue} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new input" } });
    expect(setValue).toHaveBeenCalledWith("new input");
  });

  it("renders as disabled when disabled prop is true", () => {
    render(<TextInputAutoComplete value="" setValue={jest.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("does not show suggestion box when no suggestion exists", () => {
    render(<TextInputAutoComplete value="" setValue={jest.fn()} />);
    expect(screen.queryByTestId("suggestion-box")).not.toBeInTheDocument();
  });

  it("shows suggestion box when suggestion matches", () => {
    render(<TextInputAutoComplete value="he" setValue={jest.fn()} autoCompleteTexts={["hello", "help", "world"]} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(screen.getByTestId("suggestion-box")).toBeInTheDocument();
  });

  it("clears suggestion when input is blurred", () => {
    render(<TextInputAutoComplete value="he" setValue={jest.fn()} autoCompleteTexts={["hello"]} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(screen.queryByTestId("suggestion-box")).not.toBeInTheDocument();
  });
});

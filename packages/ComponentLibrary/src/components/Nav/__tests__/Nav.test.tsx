import { render, screen } from "@testing-library/react";
import Nav from "../Nav";

jest.mock("../RigthComponents/RightButtons", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="right-buttons">{children}</div>,
}));

jest.mock("../../Input/TextInput/TextInputAutocomplete/SearchInputWithVoice", () => ({
  __esModule: true,
  default: ({ placeholder, disabled }: { placeholder?: string; disabled?: boolean }) => (
    <input data-testid="search-input" placeholder={placeholder} disabled={disabled} />
  ),
}));

describe("Nav", () => {
  it("renders without crashing", () => {
    const { container } = render(<Nav />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders children via RightButtons", () => {
    render(
      <Nav>
        <button data-testid="nav-child">Action</button>
      </Nav>
    );
    expect(screen.getByTestId("nav-child")).toBeInTheDocument();
  });

  it("renders as nav element", () => {
    render(<Nav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import ProviderIconButtons from "../ProviderIconButtons";

const providers = [
  { id: "google-oauth2", name: "google" },
  { id: "windowslive", name: "microsoft" },
  { id: "github", name: "github" },
  { id: "unknown-id", name: "customprov" },
];

describe("ProviderIconButtons", () => {
  it("renders a button per provider with a capitalized accessible name", () => {
    render(<ProviderIconButtons providers={providers} onSelect={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Microsoft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Customprov" })).toBeInTheDocument();
  });

  it("falls back to a text label when no icon exists for the provider", () => {
    render(<ProviderIconButtons providers={providers} onSelect={jest.fn()} />);
    // customprov has no icon → its label text is rendered
    expect(screen.getByText("Customprov")).toBeInTheDocument();
  });

  it("calls onSelect with the provider id (not the name) when clicked", () => {
    const onSelect = jest.fn();
    render(<ProviderIconButtons providers={providers} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Google" }));
    expect(onSelect).toHaveBeenCalledWith("google-oauth2");
  });

  it("renders nothing but the container for an empty provider list", () => {
    const { container } = render(<ProviderIconButtons providers={[]} onSelect={jest.fn()} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});

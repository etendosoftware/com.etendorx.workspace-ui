import { render, screen } from "@testing-library/react";
import DragModal from "../DragModal";

jest.mock("../../BasicModal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="basic-modal">{children}</div>,
}));

jest.mock("../../ModalDivider", () => ({
  __esModule: true,
  default: () => <hr data-testid="modal-divider" />,
}));

jest.mock("../DragModalContent", () => ({
  __esModule: true,
  default: ({ items, activateAllText, deactivateAllText, buttonText, backButtonText }: any) => (
    <div data-testid="drag-modal-content">
      <span data-testid="activate-text">{activateAllText}</span>
      <span data-testid="deactivate-text">{deactivateAllText}</span>
      <span data-testid="button-text">{buttonText}</span>
      <span data-testid="back-text">{backButtonText}</span>
      <span data-testid="items-count">{items.length}</span>
    </div>
  ),
}));

describe("DragModal", () => {
  it("renders modal container", () => {
    render(<DragModal />);
    expect(screen.getByTestId("basic-modal")).toBeInTheDocument();
  });

  it("renders modal divider", () => {
    render(<DragModal />);
    expect(screen.getByTestId("modal-divider")).toBeInTheDocument();
  });

  it("renders drag modal content", () => {
    render(<DragModal />);
    expect(screen.getByTestId("drag-modal-content")).toBeInTheDocument();
  });

  it("passes initialItems to content", () => {
    const items = [
      { id: "1", label: "Item 1", active: true },
      { id: "2", label: "Item 2", active: false },
    ];
    render(<DragModal initialItems={items} />);
    expect(screen.getByTestId("items-count").textContent).toBe("2");
  });

  it("passes text props to content", () => {
    render(
      <DragModal
        activateAllText="Activate All"
        deactivateAllText="Deactivate All"
        buttonText="Save"
        backButtonText="Back"
      />
    );
    expect(screen.getByTestId("activate-text").textContent).toBe("Activate All");
    expect(screen.getByTestId("deactivate-text").textContent).toBe("Deactivate All");
    expect(screen.getByTestId("button-text").textContent).toBe("Save");
    expect(screen.getByTestId("back-text").textContent).toBe("Back");
  });

  it("defaults to empty initialItems", () => {
    render(<DragModal />);
    expect(screen.getByTestId("items-count").textContent).toBe("0");
  });
});

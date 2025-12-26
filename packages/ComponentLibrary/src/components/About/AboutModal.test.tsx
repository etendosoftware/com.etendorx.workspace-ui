import { render } from "@testing-library/react";
import AboutModal from "./AboutModal";

// Mock CustomModal since we're testing AboutModal's integration
jest.mock("../Modal/CustomModal", () => {
  return function MockCustomModal(props: any) {
    return (
      <div data-testid="custom-modal">
        <div data-testid="modal-title">{props.title}</div>
        <div data-testid="modal-url">{props.url}</div>
        <div data-testid="modal-open">{String(props.isOpen)}</div>
        <div data-testid="close-button-text">{props.texts?.closeButton}</div>
      </div>
    );
  };
});

describe("AboutModal", () => {
  const defaultProps = {
    aboutUrl: "https://example.com/about",
    title: "About Us",
    isOpen: true,
    onClose: jest.fn(),
    closeButtonText: "Close",
  };

  it("renders CustomModal with correct props", () => {
    const { getByTestId } = render(<AboutModal {...defaultProps} />);

    expect(getByTestId("custom-modal")).toBeInTheDocument();
    expect(getByTestId("modal-title")).toHaveTextContent("About Us");
    expect(getByTestId("modal-url")).toHaveTextContent("https://example.com/about");
    expect(getByTestId("modal-open")).toHaveTextContent("true");
    expect(getByTestId("close-button-text")).toHaveTextContent("Close");
  });

  it("renders with isOpen false", () => {
    const { getByTestId } = render(<AboutModal {...defaultProps} isOpen={false} />);

    expect(getByTestId("modal-open")).toHaveTextContent("false");
  });
});

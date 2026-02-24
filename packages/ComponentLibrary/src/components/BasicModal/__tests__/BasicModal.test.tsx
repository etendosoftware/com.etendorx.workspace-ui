import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../index";

jest.mock("../../../assets/icons/x.svg", () => ({
  __esModule: true, default: (props: any) => <svg data-testid="close-icon" {...props} />
}));
jest.mock("../../../assets/icons/maximize-2.svg", () => ({
  __esModule: true, default: (props: any) => <svg data-testid="maximize-icon" {...props} />
}));
jest.mock("../../../assets/icons/minimize-2.svg", () => ({
  __esModule: true, default: (props: any) => <svg data-testid="minimize-icon" {...props} />
}));

jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useTheme: () => ({
    palette: {
      baselineColor: {
        neutral: { "0": "#FFF", "90": "#111" },
        transparentNeutral: { "10": "rgba(0,0,0,0.1)" },
        etendoPrimary: { main: "blue" },
      },
      dynamicColor: {
        contrastText: "#000",
      }
    },
    spacing: (f: number) => `${f * 8}px`,
  }),
}));

describe("BasicModal", () => {
  it("renders trigger button when not open and no custom trigger", () => {
    render(<Modal>Test Content</Modal>);
    expect(screen.getByText("Modal")).toBeInTheDocument();
  });

  it("renders custom trigger if provided", () => {
    render(
      <Modal customTrigger={<button data-testid="custom-trigger">Open</button>}>
        Test Content
      </Modal>
    );
    expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
  });

  it("opens modal and displays content when trigger is clicked", () => {
    render(<Modal>Test Content</Modal>);
    fireEvent.click(screen.getByText("Modal"));
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("displays header and description when provided", () => {
    render(
      <Modal open={true} showHeader={true} tittleHeader="Test Title" descriptionText="Test Description">
        Test Content
      </Modal>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("calls onClose and onCancel when close button is clicked", () => {
    const handleClose = jest.fn();
    const handleCancel = jest.fn();

    render(
      <Modal open={true} onClose={handleClose} onCancel={handleCancel}>
        Test Content
      </Modal>
    );

    const closeButtons = screen.getAllByRole("button", { name: "close" });
    fireEvent.click(closeButtons[0]);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSave when save button is clicked", () => {
    const handleSave = jest.fn();
    const SaveIcon = (props: any) => <svg data-testid="save-icon" {...props} />;

    render(
      <Modal
        open={true}
        onSave={handleSave}
        secondaryButtonLabel="Cancel"
        saveButtonLabel="Save"
        SaveIcon={SaveIcon}
      >
        Test Content
      </Modal>
    );

    fireEvent.click(screen.getByText("Save"));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it("toggles fullscreen mode when enabled", () => {
    render(
      <Modal open={true} isFullScreenEnabled={true}>
        Test Content
      </Modal>
    );

    const fullscreenButton = screen.getAllByRole("button").find(b => b.getAttribute("aria-label") === "fullscreen");
    expect(fullscreenButton).toBeInTheDocument();

    fireEvent.click(fullscreenButton!);
  });
});


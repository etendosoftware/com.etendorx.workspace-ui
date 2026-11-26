import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock missing MainUI and API dependencies that are leaked via index.ts
jest.mock(
  "@workspaceui/mainui/hooks/useTranslation",
  () => ({
    useTranslation: () => ({ t: (k: string) => k }),
  }),
  { virtual: true }
);

jest.mock(
  "@workspaceui/mainui/hooks/useMetadataContext",
  () => ({
    useMetadataContext: () => ({}),
  }),
  { virtual: true }
);

jest.mock(
  "@workspaceui/api-client/src/api/copilot",
  () => ({
    CONTEXT_CONSTANTS: {},
  }),
  { virtual: true }
);

const mockModalProps = jest.fn(() => true);

// Mock Modal component from the parent directory
jest.mock("../../index", () => ({
  Modal: ({ children, open, saveButtonLabel, secondaryButtonLabel, onSave, onCancel, autoFocusSave, ...rest }: any) =>
    mockModalProps(rest) && open ? (
      <div data-testid="mock-modal" data-autofocus-save={String(Boolean(autoFocusSave))}>
        <button onClick={onSave}>{saveButtonLabel}</button>
        <button onClick={onCancel}>{secondaryButtonLabel}</button>
        {children}
      </div>
    ) : null,
}));

import ConfirmModal from "../ConfirmModal";

// Mock MUI useTheme
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useTheme: () => ({
    palette: {
      baselineColor: { neutral: { 0: "#fcfcfd" } },
      specificColor: {
        warning: {
          light: "#fff5f5",
        },
      },
    },
  }),
}));

// Mock useStyle
jest.mock("../../StatusModal/styles", () => ({
  useStyle: () => ({
    sx: {
      statusModalContainer: {},
      statusText: {},
      statusIcon: {},
    },
  }),
}));

// Mock SVG
jest.mock("../../../assets/icons/trash.svg", () => () => <div data-testid="trash-icon" />);

describe("ConfirmModal", () => {
  const defaultProps = {
    confirmText: "Are you sure?",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    open: true,
  };

  it("renders with confirm text", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(<ConfirmModal {...defaultProps} saveLabel="Yes" />);
    const confirmButton = screen.getByText("Yes");
    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConfirmModal {...defaultProps} secondaryButtonLabel="No" />);
    const cancelButton = screen.getByText("No");
    fireEvent.click(cancelButton);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    render(<ConfirmModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });

  it("focuses the confirm button so Enter confirms", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByTestId("mock-modal")).toHaveAttribute("data-autofocus-save", "true");
  });

  it("shows the trash icon on the confirm button by default", () => {
    mockModalProps.mockClear();
    render(<ConfirmModal {...defaultProps} />);

    expect(mockModalProps).toHaveBeenCalledWith(expect.objectContaining({ SaveIcon: expect.anything() }));
  });

  it("leaves the confirm button without icon when the confirmation deletes nothing", () => {
    mockModalProps.mockClear();
    render(<ConfirmModal {...defaultProps} showConfirmIcon={false} />);

    expect(mockModalProps).toHaveBeenCalledWith(expect.objectContaining({ SaveIcon: undefined }));
  });

  it("shows a warning badge on a flat surface instead of a tinted gradient", () => {
    mockModalProps.mockClear();
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByTestId("StatusIconBadge__confirm")).toBeInTheDocument();
    expect(mockModalProps).toHaveBeenCalledWith(expect.not.objectContaining({ backgroundGradient: expect.anything() }));
  });
});

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

// Mock Modal component from the parent directory
jest.mock("../../index", () => ({
  Modal: ({ children, open, saveButtonLabel, secondaryButtonLabel, onSave, onCancel }: any) =>
    open ? (
      <div data-testid="mock-modal">
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
});

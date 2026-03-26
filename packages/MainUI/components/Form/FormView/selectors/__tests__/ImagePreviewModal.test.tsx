import { render, screen, fireEvent } from "@testing-library/react";
import ImagePreviewModal from "../ImagePreviewModal";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";

jest.mock("@/hooks/useTranslation");

describe("ImagePreviewModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (k: string) => k });
  });

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    imageUrl: "http://example.com/image.png",
    isReadOnly: false,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it("should not render when not open", () => {
    render(<ImagePreviewModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("ImagePreviewModal__backdrop")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    render(<ImagePreviewModal {...defaultProps} />);
    expect(screen.getByTestId("ImagePreviewModal__backdrop")).toBeInTheDocument();
    expect(screen.getByTestId("ImagePreviewModal__image")).toHaveAttribute("src", "http://example.com/image.png");
  });

  it("should call onClose when close button is clicked", () => {
    render(<ImagePreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ImagePreviewModal__closeBtn"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call onEdit when edit button is clicked", () => {
    render(<ImagePreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ImagePreviewModal__editBtn"));
    expect(defaultProps.onEdit).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should show delete confirm when delete button is clicked", () => {
    render(<ImagePreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ImagePreviewModal__deleteBtn"));
    expect(screen.getByTestId("ImagePreviewModal__deleteConfirm")).toBeInTheDocument();
  });

  it("should call onDelete when delete is confirmed", () => {
    render(<ImagePreviewModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ImagePreviewModal__deleteBtn"));
    fireEvent.click(screen.getByTestId("ImagePreviewModal__deleteConfirmBtn"));
    expect(defaultProps.onDelete).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should hide edit and delete if readOnly", () => {
    render(<ImagePreviewModal {...defaultProps} isReadOnly={true} />);
    expect(screen.queryByTestId("ImagePreviewModal__editBtn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ImagePreviewModal__deleteBtn")).not.toBeInTheDocument();
  });
});

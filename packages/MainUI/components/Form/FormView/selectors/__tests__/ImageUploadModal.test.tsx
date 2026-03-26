import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ImageUploadModal from "../ImageUploadModal";
import { useTranslation } from "@/hooks/useTranslation";

jest.mock("@/hooks/useTranslation");

describe("ImageUploadModal", () => {
  const mockUploadImage = jest.fn();
  const mockOnUploadComplete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (k: string) => k });
    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:test");
    global.URL.revokeObjectURL = jest.fn();
  });

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onUploadComplete: mockOnUploadComplete,
    uploadImage: mockUploadImage,
    isUploading: false,
    columnName: "col-1",
    tabId: "tab-1",
    orgId: "org-1",
  };

  it("should render when open", () => {
    render(<ImageUploadModal {...defaultProps} />);
    expect(screen.getByTestId("ImageUploadModal__container")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ImageUploadModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("ImageUploadModal__container")).not.toBeInTheDocument();
  });

  it("closes modal on cancel", () => {
    render(<ImageUploadModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ImageUploadModal__cancelBtn"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles image upload and calls onUploadComplete", async () => {
    mockUploadImage.mockResolvedValue({ imageId: "new-img-id" });
    render(<ImageUploadModal {...defaultProps} />);
    
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("ImageUploadModal__fileInput");
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByTestId("ImageUploadModal__preview")).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId("ImageUploadModal__uploadBtn"));
    expect(mockUploadImage).toHaveBeenCalledWith({
      file,
      columnName: "col-1",
      tabId: "tab-1",
      orgId: "org-1",
      existingImageId: undefined,
    });
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith("new-img-id");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles upload failure", async () => {
    render(<ImageUploadModal {...defaultProps} />);
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("ImageUploadModal__fileInput");
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    mockUploadImage.mockRejectedValue(new Error("Upload failed"));
    
    fireEvent.click(screen.getByTestId("ImageUploadModal__uploadBtn"));
    
    await waitFor(() => {
      expect(screen.getByTestId("ImageUploadModal__error")).toHaveTextContent("Upload failed");
    });
  });

  it("handles invalid file type", () => {
    render(<ImageUploadModal {...defaultProps} />);
    const file = new File(["dummy content"], "test.txt", { type: "text/plain" });
    const fileInput = screen.getByTestId("ImageUploadModal__fileInput");
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByTestId("ImageUploadModal__error")).toHaveTextContent("image.upload.errors.invalidFile");
  });
});

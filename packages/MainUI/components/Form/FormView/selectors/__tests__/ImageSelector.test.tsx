import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ImageSelector from "../ImageSelector";
import { useFormContext } from "react-hook-form";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

jest.mock("react-hook-form");
jest.mock("@/contexts/tab");
jest.mock("@/hooks/useUserContext");
jest.mock("@/hooks/useAuthenticatedImage");
jest.mock("@/hooks/useImageUpload");
jest.mock("@/hooks/useTranslation");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("../ImagePreviewModal", () => ({
  __esModule: true,
  default: ({
    open,
    onClose,
    onEdit,
    onDelete,
  }: {
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="ImagePreviewModal">
        <button type="button" onClick={() => onClose()} data-testid="ImagePreviewModal__close">
          Close Preview
        </button>
        <button type="button" onClick={() => onEdit()} data-testid="ImagePreviewModal__edit">
          Edit
        </button>
        <button type="button" onClick={() => onDelete()} data-testid="ImagePreviewModal__delete">
          Delete
        </button>
      </div>
    );
  },
}));

const mockField = {
  id: "col-1",
  hqlName: "imageId",
  columnName: "AD_Image_ID",
  name: "My Image",
} as any;

describe("ImageSelector", () => {
  let watchMock: jest.Mock;
  let setValueMock: jest.Mock;
  let uploadImageMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    watchMock = jest.fn();
    setValueMock = jest.fn();
    uploadImageMock = jest.fn();

    (useFormContext as jest.Mock).mockReturnValue({
      watch: watchMock,
      setValue: setValueMock,
    });

    (useTabContext as jest.Mock).mockReturnValue({
      tab: { id: "tab-123" },
    });

    (useUserContext as jest.Mock).mockReturnValue({
      session: { "#AD_Org_ID": "org-foo" },
      currentOrganization: null,
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: (k: string) => k,
    });

    (useImageUpload as jest.Mock).mockReturnValue({
      uploadImage: uploadImageMock,
      isUploading: false,
    });

    (useAuthenticatedImage as jest.Mock).mockReturnValue(null);
  });

  it("should render empty state if there is no imageId", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} />);

    expect(screen.getByTestId("ImageSelector__empty__col-1")).toBeInTheDocument();
  });

  it("should render preview state if there is an imageId", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhost/existing-img-id");

    render(<ImageSelector field={mockField} />);

    expect(screen.getByTestId("ImageSelector__filled__col-1")).toBeInTheDocument();
    const thumbnail = screen.getByTestId("ImageSelector__thumbnail__col-1") as HTMLImageElement;
    expect(thumbnail.src).toBe("blob:http://localhost/existing-img-id");
  });

  it("should call uploadImage and set value on valid file selection", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({ imageId: "new-img-id" });
    render(<ImageSelector field={mockField} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("ImageSelector__fileInput__col-1");
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadImageMock).toHaveBeenCalledWith({
        file,
        columnName: "AD_Image_ID",
        tabId: "tab-123",
        orgId: "org-foo",
        existingImageId: undefined,
      });
      expect(setValueMock).toHaveBeenCalledWith("imageId", "new-img-id", { shouldDirty: true });
      expect(toast.success).toHaveBeenCalledWith("image.upload.success");
    });
  });

  it("should show error toast on invalid file type", async () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} />);

    const file = new File(["dummy"], "test.txt", { type: "text/plain" });
    const fileInput = screen.getByTestId("ImageSelector__fileInput__col-1");
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("image.upload.errors.invalidFile");
    });
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("should show error toast on upload failure", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockRejectedValue(new Error("Upload failed"));
    render(<ImageSelector field={mockField} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const fileInput = screen.getByTestId("ImageSelector__fileInput__col-1");
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Upload failed");
    });
  });

  it("should open preview modal when clicking existing image thumbnail", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);

    fireEvent.click(screen.getByTestId("ImageSelector__thumbnail__col-1"));

    expect(screen.getByTestId("ImagePreviewModal")).toBeInTheDocument();
  });

  it("should close preview modal", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);
    fireEvent.click(screen.getByTestId("ImageSelector__thumbnail__col-1"));
    fireEvent.click(screen.getByTestId("ImagePreviewModal__close"));

    expect(screen.queryByTestId("ImagePreviewModal")).not.toBeInTheDocument();
  });

  it("should handle delete from overlay button", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);
    fireEvent.click(screen.getByTestId("ImageSelector__deleteBtn__col-1"));

    expect(setValueMock).toHaveBeenCalledWith("imageId", null, { shouldDirty: true });
  });

  it("should not render file input in readOnly mode", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} isReadOnly={true} />);

    expect(screen.queryByTestId("ImageSelector__fileInput__col-1")).not.toBeInTheDocument();
  });

  it("should hide action buttons in readOnly mode when a filled image is present", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} isReadOnly={true} />);
    expect(screen.queryByTestId("ImageSelector__editBtn__col-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ImageSelector__deleteBtn__col-1")).not.toBeInTheDocument();
  });
});

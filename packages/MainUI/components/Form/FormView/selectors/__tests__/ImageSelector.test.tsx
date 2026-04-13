import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: ({
    open,
    confirmText,
    onConfirm,
    onCancel,
    hideSecondaryButton,
  }: {
    open: boolean;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    hideSecondaryButton?: boolean;
  }) => {
    if (!open) return null;
    return (
      <div data-testid={hideSecondaryButton ? "ErrorModal" : "ConfirmModal"}>
        <span data-testid={hideSecondaryButton ? "ErrorModal__message" : "ConfirmModal__message"}>{confirmText}</span>
        <button
          type="button"
          onClick={onConfirm}
          data-testid={hideSecondaryButton ? "ErrorModal__close" : "ConfirmModal__confirm"}>
          {hideSecondaryButton ? "Close" : "Confirm"}
        </button>
        {!hideSecondaryButton && (
          <button type="button" onClick={onCancel} data-testid="ConfirmModal__cancel">
            Cancel
          </button>
        )}
      </div>
    );
  },
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
  let deleteUploadedImageMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    watchMock = jest.fn();
    setValueMock = jest.fn();
    uploadImageMock = jest.fn();
    deleteUploadedImageMock = jest.fn().mockResolvedValue(undefined);

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
      deleteUploadedImage: deleteUploadedImageMock,
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
    uploadImageMock.mockResolvedValue({
      imageId: "new-img-id",
      action: "N",
      oldWidth: 0,
      oldHeight: 0,
      newWidth: 0,
      newHeight: 0,
    });
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
        imageSizeAction: "N",
        imageWidth: 0,
        imageHeight: 0,
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

  // --- Size constraint branch tests ---

  const mockFieldWithConstraints = (action: string, width = 200, height = 100) =>
    ({
      ...mockField,
      column: {
        imageSizeValuesAction: action,
        imageWidth: width,
        imageHeight: height,
      },
    }) as any;

  // For ALLOWED*/RECOMMENDED*: oldWidth/oldHeight = configured dim (p3/p4), newWidth/newHeight = actual uploaded dim (p5/p6)

  it("action ALLOWED + dimensions violated → error modal shown and deleteUploadedImage called", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "bad-img",
      action: "ALLOWED",
      oldWidth: 200, // configured (= configW sent to backend)
      oldHeight: 100, // configured (= configH sent to backend)
      newWidth: 300, // actual uploaded image width
      newHeight: 200, // actual uploaded image height
    });

    render(<ImageSelector field={mockFieldWithConstraints("ALLOWED", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("ErrorModal")).toBeInTheDocument();
    });
    expect(deleteUploadedImageMock).toHaveBeenCalledWith("bad-img");
    expect(setValueMock).not.toHaveBeenCalled();
  });

  it("action ALLOWED + dimensions compliant → imageId saved silently, no toast.error", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "good-img",
      action: "ALLOWED",
      oldWidth: 200, // configured
      oldHeight: 100, // configured
      newWidth: 200, // actual matches configured → no violation
      newHeight: 100,
    });

    render(<ImageSelector field={mockFieldWithConstraints("ALLOWED", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith("imageId", "good-img", { shouldDirty: true });
    });
    expect(toast.error).not.toHaveBeenCalled();
    expect(deleteUploadedImageMock).not.toHaveBeenCalled();
  });

  it("action RECOMMENDED + dimensions violated → ConfirmModal shown", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "warn-img",
      action: "RECOMMENDED",
      oldWidth: 200, // configured
      oldHeight: 100, // configured
      newWidth: 500, // actual exceeds configured → violated
      newHeight: 400,
    });

    render(<ImageSelector field={mockFieldWithConstraints("RECOMMENDED", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("ConfirmModal")).toBeInTheDocument();
    });
    expect(setValueMock).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("action RESIZE_ASPECTRATIO → ConfirmModal shown (not saved yet)", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "resized-img",
      action: "RESIZE_ASPECTRATIO",
      oldWidth: 800, // original image dims
      oldHeight: 600,
      newWidth: 200, // resized result dims
      newHeight: 150,
    });

    render(<ImageSelector field={mockFieldWithConstraints("RESIZE_ASPECTRATIO", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("ConfirmModal")).toBeInTheDocument();
    });
    expect(setValueMock).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("action RESIZE_ASPECTRATIO, confirm accepted → imageId saved", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "resized-img",
      action: "RESIZE_ASPECTRATIO",
      oldWidth: 800,
      oldHeight: 600,
      newWidth: 200,
      newHeight: 150,
    });

    render(<ImageSelector field={mockFieldWithConstraints("RESIZE_ASPECTRATIO", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => screen.getByTestId("ConfirmModal__confirm"));
    fireEvent.click(screen.getByTestId("ConfirmModal__confirm"));

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith("imageId", "resized-img", { shouldDirty: true });
    });
  });

  it("action RESIZE_ASPECTRATIO, confirm cancelled → deleteUploadedImage called, imageId NOT saved", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "resized-img",
      action: "RESIZE_ASPECTRATIO",
      oldWidth: 800,
      oldHeight: 600,
      newWidth: 200,
      newHeight: 150,
    });

    render(<ImageSelector field={mockFieldWithConstraints("RESIZE_ASPECTRATIO", 200, 100)} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => screen.getByTestId("ConfirmModal__cancel"));
    fireEvent.click(screen.getByTestId("ConfirmModal__cancel"));

    await waitFor(() => {
      expect(deleteUploadedImageMock).toHaveBeenCalledWith("resized-img");
    });
    expect(setValueMock).not.toHaveBeenCalled();
  });

  it("action WRONGFORMAT → error modal shown and imageId NOT saved", async () => {
    watchMock.mockReturnValue(null);
    uploadImageMock.mockResolvedValue({
      imageId: "fmt-img",
      action: "WRONGFORMAT",
      oldWidth: 0,
      oldHeight: 0,
      newWidth: 0,
      newHeight: 0,
    });

    render(<ImageSelector field={mockField} />);

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("ImageSelector__fileInput__col-1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("ErrorModal")).toBeInTheDocument();
    });
    expect(deleteUploadedImageMock).toHaveBeenCalledWith("fmt-img");
    expect(setValueMock).not.toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ImageSelector from "../ImageSelector";
import { useFormContext } from "react-hook-form";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTranslation } from "@/hooks/useTranslation";

jest.mock("react-hook-form");
jest.mock("@/contexts/tab");
jest.mock("@/hooks/useUserContext");
jest.mock("@/hooks/useAuthenticatedImage");
jest.mock("@/hooks/useImageUpload");
jest.mock("@/hooks/useTranslation");

jest.mock("../ImageUploadModal", () => ({
  __esModule: true,
  default: ({ open, onClose, onUploadComplete }: any) => {
    if (!open) return null;
    return (
      <div data-testid="ImageUploadModal">
        <button onClick={() => onClose()} data-testid="ImageUploadModal__close">
          Close
        </button>
        <button onClick={() => onUploadComplete("new-img-id")} data-testid="ImageUploadModal__upload">
          Upload
        </button>
      </div>
    );
  },
}));

jest.mock("../ImagePreviewModal", () => ({
  __esModule: true,
  default: ({ open, onClose, onEdit, onDelete }: any) => {
    if (!open) return null;
    return (
      <div data-testid="ImagePreviewModal">
        <button onClick={() => onClose()} data-testid="ImagePreviewModal__close">
          Close Preview
        </button>
        <button onClick={() => onEdit()} data-testid="ImagePreviewModal__edit">
          Edit
        </button>
        <button onClick={() => onDelete()} data-testid="ImagePreviewModal__delete">
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

  beforeEach(() => {
    jest.clearAllMocks();

    watchMock = jest.fn();
    setValueMock = jest.fn();

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
      uploadImage: jest.fn(),
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

  it("should open upload modal from empty state", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} />);

    const emptyBtn = screen.getByTestId("ImageSelector__empty__col-1");
    fireEvent.click(emptyBtn);

    expect(screen.getByTestId("ImageUploadModal")).toBeInTheDocument();
  });

  it("should close upload modal when triggered", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} />);

    fireEvent.click(screen.getByTestId("ImageSelector__empty__col-1"));
    fireEvent.click(screen.getByTestId("ImageUploadModal__close"));

    expect(screen.queryByTestId("ImageUploadModal")).not.toBeInTheDocument();
  });

  it("should handle upload complete and set value", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} />);

    fireEvent.click(screen.getByTestId("ImageSelector__empty__col-1"));
    fireEvent.click(screen.getByTestId("ImageUploadModal__upload"));

    expect(setValueMock).toHaveBeenCalledWith("imageId", "new-img-id", { shouldDirty: true });
  });

  it("should open preview modal when clicking existing image thumbnail", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);

    const thumbnail = screen.getByTestId("ImageSelector__thumbnail__col-1");
    fireEvent.click(thumbnail);

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

  it("should handle delete from preview buttons", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);
    fireEvent.click(screen.getByTestId("ImageSelector__deleteBtn__col-1"));

    expect(setValueMock).toHaveBeenCalledWith("imageId", null, { shouldDirty: true });
  });

  it("should handle open upload modal from edit action overlay", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} />);
    fireEvent.click(screen.getByTestId("ImageSelector__editBtn__col-1"));

    expect(screen.getByTestId("ImageUploadModal")).toBeInTheDocument();
  });

  it("disabled in readOnly mode", () => {
    watchMock.mockReturnValue(null);
    render(<ImageSelector field={mockField} isReadOnly={true} />);

    const emptyBtn = screen.getByTestId("ImageSelector__empty__col-1");
    fireEvent.click(emptyBtn); // should not open modal

    expect(screen.queryByTestId("ImageUploadModal")).not.toBeInTheDocument();
  });

  it("hides action buttons in readOnly mode when a filled image is present", () => {
    watchMock.mockReturnValue("existing-img-id");
    (useAuthenticatedImage as jest.Mock).mockReturnValue("blob:http://localhostUrl");

    render(<ImageSelector field={mockField} isReadOnly={true} />);
    expect(screen.queryByTestId("ImageSelector__editBtn__col-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ImageSelector__deleteBtn__col-1")).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { UploadFileSelector } from "../UploadFileSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Build a minimal Field stub with the properties used by UploadFileSelector
const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    hqlName: "upload_param",
    columnName: "upload_col",
    ...overrides,
  }) as Field;

// Wrapper that provides the react-hook-form context
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

// Helper: simulate picking a file on the hidden input
const pickFile = (input: HTMLElement, file: File) => {
  Object.defineProperty(input, "files", {
    value: [file],
    configurable: true,
  });
  fireEvent.change(input);
};

const makeFile = (name = "report.pdf", size = 2048, type = "application/pdf") =>
  new File(["x".repeat(size)], name, { type });

describe("UploadFileSelector", () => {
  describe("initial render", () => {
    it("renders the select-file button when no file is selected", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      expect(screen.getByTestId("UploadFileSelector__select_button")).toBeInTheDocument();
      expect(screen.queryByTestId("UploadFileSelector__filename")).not.toBeInTheDocument();
    });

    it("renders the container element", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      expect(screen.getByTestId("UploadFileSelector__container")).toBeInTheDocument();
    });

    it("renders hidden file input", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      const input = screen.getByTestId("UploadFileSelector__input");
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveClass("hidden");
    });

    it("disables the select button when disabled prop is true", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} disabled />
        </Wrapper>
      );
      expect(screen.getByTestId("UploadFileSelector__select_button")).toBeDisabled();
    });

    it("disables the hidden file input when disabled prop is true", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} disabled />
        </Wrapper>
      );
      expect(screen.getByTestId("UploadFileSelector__input")).toBeDisabled();
    });
  });

  describe("file selection", () => {
    it("shows filename after file is selected", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      const input = screen.getByTestId("UploadFileSelector__input");
      pickFile(input, makeFile("invoice.pdf"));
      expect(screen.getByTestId("UploadFileSelector__filename")).toHaveTextContent("invoice.pdf");
    });

    it("hides the select button after file is selected", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile());
      expect(screen.queryByTestId("UploadFileSelector__select_button")).not.toBeInTheDocument();
    });

    it("calls onFileChange with columnName and the selected File", () => {
      const onFileChange = jest.fn();
      render(
        <Wrapper>
          <UploadFileSelector field={makeField({ columnName: "doc_col" })} onFileChange={onFileChange} />
        </Wrapper>
      );
      const file = makeFile("doc.xlsx");
      pickFile(screen.getByTestId("UploadFileSelector__input"), file);
      expect(onFileChange).toHaveBeenCalledTimes(1);
      expect(onFileChange).toHaveBeenCalledWith("doc_col", file);
    });

    it("does not throw when onFileChange is not provided", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      expect(() => pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile())).not.toThrow();
    });

    it("ignores change events with no files", () => {
      const onFileChange = jest.fn();
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} onFileChange={onFileChange} />
        </Wrapper>
      );
      const input = screen.getByTestId("UploadFileSelector__input");
      Object.defineProperty(input, "files", { value: [], configurable: true });
      fireEvent.change(input);
      expect(onFileChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId("UploadFileSelector__filename")).not.toBeInTheDocument();
    });
  });

  describe("file display", () => {
    it("displays the file size in bytes for small files", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile("tiny.txt", 500));
      expect(screen.getByTestId("UploadFileSelector__filesize")).toHaveTextContent("500 B");
    });

    it("displays the file size in KB for medium files", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile("medium.txt", 2048));
      expect(screen.getByTestId("UploadFileSelector__filesize")).toHaveTextContent("2.0 KB");
    });

    it("displays the file size in MB for large files", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile("big.zip", 1024 * 1024 * 3));
      expect(screen.getByTestId("UploadFileSelector__filesize")).toHaveTextContent("3.0 MB");
    });

    it("shows the remove button when a file is selected and not disabled", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile());
      expect(screen.getByTestId("UploadFileSelector__remove")).toBeInTheDocument();
    });

    it("hides the remove button when disabled", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} disabled />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile());
      expect(screen.queryByTestId("UploadFileSelector__remove")).not.toBeInTheDocument();
    });
  });

  describe("file removal", () => {
    it("clears the filename display after clicking remove", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile("to-remove.pdf"));
      fireEvent.click(screen.getByTestId("UploadFileSelector__remove"));
      expect(screen.queryByTestId("UploadFileSelector__filename")).not.toBeInTheDocument();
    });

    it("shows the select button again after removing the file", () => {
      render(
        <Wrapper>
          <UploadFileSelector field={makeField()} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile());
      fireEvent.click(screen.getByTestId("UploadFileSelector__remove"));
      expect(screen.getByTestId("UploadFileSelector__select_button")).toBeInTheDocument();
    });

    it("calls onFileChange with null when file is removed", () => {
      const onFileChange = jest.fn();
      render(
        <Wrapper>
          <UploadFileSelector field={makeField({ columnName: "my_col" })} onFileChange={onFileChange} />
        </Wrapper>
      );
      pickFile(screen.getByTestId("UploadFileSelector__input"), makeFile());
      onFileChange.mockClear();
      fireEvent.click(screen.getByTestId("UploadFileSelector__remove"));
      expect(onFileChange).toHaveBeenCalledTimes(1);
      expect(onFileChange).toHaveBeenCalledWith("my_col", null);
    });
  });
});

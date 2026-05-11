import { render, screen } from "@testing-library/react";
import { RichTextSelector } from "../RichTextSelector";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("react-hook-form");

jest.mock("dompurify", () => ({
  __esModule: true,
  default: {
    sanitize: (html: string) => html,
  },
}));

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "rt-1",
    name: "Description",
    hqlName: "description",
    columnName: "Description",
    column: { reference: "7CB371C13D204EB69BF370217F692999" },
    ...overrides,
  }) as unknown as Field;

describe("RichTextSelector", () => {
  const getValues = jest.fn();
  const setValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      getValues,
      setValue,
    });
    getValues.mockReturnValue("");
  });

  it("renders read-only view with sanitized HTML", () => {
    getValues.mockReturnValue("<b>Hello</b>");
    render(<RichTextSelector field={makeField()} isReadOnly={true} />);
    const container = screen.getByTestId("RichTextSelector__readonly__rt-1");
    expect(container).toBeInTheDocument();
    expect(container.innerHTML).toBe("<b>Hello</b>");
  });

  it("renders editable view with toolbar", () => {
    render(<RichTextSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByTestId("RichTextSelector__toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("RichTextSelector__editor__rt-1")).toBeInTheDocument();
  });

  it("renders all toolbar buttons", () => {
    render(<RichTextSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByTestId("RichTextSelector__toolbar__bold")).toBeInTheDocument();
    expect(screen.getByTestId("RichTextSelector__toolbar__italic")).toBeInTheDocument();
    expect(screen.getByTestId("RichTextSelector__toolbar__underline")).toBeInTheDocument();
    expect(screen.getByTestId("RichTextSelector__toolbar__insertOrderedList")).toBeInTheDocument();
    expect(screen.getByTestId("RichTextSelector__toolbar__insertUnorderedList")).toBeInTheDocument();
  });

  it("sets contentEditable on the editor div", () => {
    render(<RichTextSelector field={makeField()} isReadOnly={false} />);
    const editor = screen.getByTestId("RichTextSelector__editor__rt-1");
    expect(editor).toHaveAttribute("contenteditable", "true");
  });

  it("does not render toolbar in read-only mode", () => {
    render(<RichTextSelector field={makeField()} isReadOnly={true} />);
    expect(screen.queryByTestId("RichTextSelector__toolbar")).not.toBeInTheDocument();
  });
});

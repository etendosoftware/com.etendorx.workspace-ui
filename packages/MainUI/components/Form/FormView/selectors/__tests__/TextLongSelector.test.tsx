import { render, screen } from "@testing-library/react";
import { TextLongSelector } from "../TextLongSelector";
import { useFormContext, useWatch } from "react-hook-form";
import { createMockField } from "@/utils/tests/mockHelpers";

jest.mock("react-hook-form");

const field = createMockField({ id: "1086", name: "Description", hqlName: "description" });

describe("TextLongSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      register: (name: string) => ({ name, onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() }),
      setValue: jest.fn(),
    });
    (useWatch as jest.Mock).mockReturnValue("Some text");
  });

  it("renders a read-only textarea when readOnly is true", () => {
    render(<TextLongSelector field={field} readOnly={true} />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toBeDisabled();
  });

  it("renders an editable textarea when readOnly is false", () => {
    render(<TextLongSelector field={field} readOnly={false} />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea).not.toHaveAttribute("readonly");
    expect(textarea).toBeEnabled();
  });
});

import { render, screen } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { DateInput } from "../DateInput";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const FIELD = { name: "Invoice Date", isMandatory: false } as unknown as Field;

describe("DateInput accessibility (ETP-6304)", () => {
  it("names the button that opens the calendar after its field", () => {
    render(<DateInput name="invoiceDate" field={FIELD} />);

    expect(screen.getByRole("button", { name: "common.openDatePicker (Invoice Date)" })).toBeInTheDocument();
  });

  it("keeps the native date input that backs the field out of the accessibility tree", () => {
    const { container } = render(<DateInput name="invoiceDate" field={FIELD} />);

    const native = container.querySelector('input[type="date"]');
    expect(native).toHaveAttribute("aria-hidden", "true");
  });

  it("leaves the visible text field as the one a screen reader finds, named by the field", () => {
    render(<DateInput name="invoiceDate" field={FIELD} />);

    expect(screen.getByRole("textbox", { name: "Invoice Date" })).toBeInTheDocument();
  });
});

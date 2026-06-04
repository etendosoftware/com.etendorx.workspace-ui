import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { PasswordSelector } from "../PasswordSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "pwd-1",
    name: "Password",
    hqlName: "password",
    columnName: "password",
    isMandatory: false,
    column: { reference: "C5C21C28B39E4683A91779F16C112E40", length: "60" },
    ...overrides,
  }) as unknown as Field;

const Wrapper = ({ defaultValue = "" }: { defaultValue?: string }) => {
  const methods = useForm({ defaultValues: { password: defaultValue } });
  return (
    <FormProvider {...methods}>
      <PasswordSelector field={makeField()} />
    </FormProvider>
  );
};

describe("PasswordSelector", () => {
  it("should render as password type by default", () => {
    render(<Wrapper defaultValue="secret123" />);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should toggle to text type when eye icon is clicked", () => {
    render(<Wrapper defaultValue="secret123" />);
    const toggle = screen.getByTestId(/eye-toggle/);
    fireEvent.click(toggle);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "text");
  });

  it("should toggle back to password on second click", () => {
    render(<Wrapper defaultValue="secret123" />);
    const toggle = screen.getByTestId(/eye-toggle/);
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    const input = screen.getByDisplayValue("secret123");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should not show toggle when value is placeholder ***", () => {
    render(<Wrapper defaultValue="***" />);
    expect(screen.queryByTestId(/eye-toggle/)).not.toBeInTheDocument();
  });
});

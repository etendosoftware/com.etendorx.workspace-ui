/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { UnifiedNumericSelector } from "../NumericSelector";
import { createMockField, FIELD_REFERENCES } from "../test-utils/decimal-test-helpers";

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

let formMethods: UseFormReturn;

const Harness = ({ defaultValue, children }: { defaultValue: unknown; children: React.ReactNode }) => {
  formMethods = useForm({ defaultValues: { amount: defaultValue } });
  return <FormProvider {...formMethods}>{children}</FormProvider>;
};

const renderField = (value: unknown, reference: string = FIELD_REFERENCES.DECIMAL, props = {}) => {
  render(
    <Harness defaultValue={value}>
      <UnifiedNumericSelector field={createMockField(reference, "amount")} {...props} />
    </Harness>
  );
  return screen.getByRole("textbox") as HTMLInputElement;
};

describe("NumericSelector - thousands grouping", () => {
  it("shows thousands separators when the field is not focused", () => {
    expect(renderField(1234567.5)).toHaveValue("1,234,567.50");
  });

  it("does not add separators to values below one thousand", () => {
    expect(renderField(999.5)).toHaveValue("999.50");
  });

  it("switches to the ungrouped editable format on focus", () => {
    const input = renderField(1234567.5);
    fireEvent.focus(input);
    expect(input).toHaveValue("1234567.50");
  });

  it("lets the user type an ungrouped value and groups it again on blur", () => {
    const input = renderField(1234567.5);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "9876.5" } });
    expect(input).toHaveValue("9876.5");
    fireEvent.blur(input);
    expect(input).toHaveValue("9,876.50");
  });

  it("keeps the same value after focus and blur without edits", () => {
    const input = renderField(1234567.5);
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(input).toHaveValue("1,234,567.50");
    expect(formMethods.getValues("amount")).toBe(1234567.5);
  });

  it("stores a plain number, not the formatted text", () => {
    const input = renderField(1500);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2500000.25" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("2,500,000.25");
    expect(formMethods.getValues("amount")).toBe(2500000.25);
  });

  it("shows separators in a read-only field", () => {
    expect(renderField(1234567.5, FIELD_REFERENCES.DECIMAL, { readOnly: true })).toHaveValue("1,234,567.50");
  });

  it("groups quantity fields too", () => {
    expect(renderField(1234567, FIELD_REFERENCES.QUANTITY_22)).toHaveValue("1,234,567");
  });

  it("groups and ungroups negative values", () => {
    const input = renderField(-1234567.5);
    expect(input).toHaveValue("-1,234,567.50");
    fireEvent.focus(input);
    expect(input).toHaveValue("-1234567.50");
  });

  it("keeps the decimals of a rate field", () => {
    const input = renderField(1234567.123456, FIELD_REFERENCES.RATE);
    expect(input).toHaveValue("1,234,567.123456");
    fireEvent.focus(input);
    expect(input).toHaveValue("1234567.123456");
    fireEvent.blur(input);
    expect(formMethods.getValues("amount")).toBe(1234567.123456);
  });

  it("leaves an empty value empty", () => {
    const input = renderField(null);
    expect(input).toHaveValue("");
    fireEvent.focus(input);
    expect(input).toHaveValue("");
  });

  it("keeps integer fields without separators", () => {
    expect(renderField(1234567, FIELD_REFERENCES.INTEGER, { type: "integer" })).toHaveValue("1234567");
  });
});

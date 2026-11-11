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

import { fireEvent, screen } from "@testing-library/react";
import { QuantitySelector } from "../QuantitySelector";
import { createMockField, FIELD_REFERENCES, renderWithWrapper } from "../test-utils/decimal-test-helpers";

const mockField = createMockField(FIELD_REFERENCES.QUANTITY_22, "orderedQuantity");

const type = (input: HTMLElement, text: string) => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
};
const leave = (input: HTMLElement) => fireEvent.blur(input);
const valueOf = (input: HTMLElement) => (input as HTMLInputElement).value;

describe("QuantitySelector - arithmetic expressions", () => {
  it.each([
    ["=2*2", "4"],
    ["=10/4", "2.5"],
    ["=7/2", "3.5"],
    ["=2*(3+1)", "8"],
  ])("evaluates %s when the field is left", (expression, result) => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} />);
    type(input, expression);
    leave(input);
    expect(valueOf(input)).toBe(result);
  });

  it("keeps the expression as typed while the user is writing it", () => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} />);
    type(input, "=10/4");
    expect(valueOf(input)).toBe("=10/4");
  });

  it("keeps the typed text and shows an error when the expression is invalid", () => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} />);
    type(input, "=2*");
    leave(input);
    expect(valueOf(input)).toBe("=2*");
    expect(screen.getByText(/expression/i)).toBeInTheDocument();
  });

  it("refuses a negative result when the field does not allow negatives", () => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} allowNegative={false} />);
    type(input, "=2-5");
    leave(input);
    expect(valueOf(input)).toBe("=2-5");
    expect(screen.getByText(/expression/i)).toBeInTheDocument();
  });

  it("accepts a negative result when the field allows negatives", () => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} allowNegative />);
    type(input, "=2-5");
    leave(input);
    expect(valueOf(input)).toBe("-3");
  });

  it("clears the error once a plain number is typed", () => {
    const input = renderWithWrapper(<QuantitySelector field={mockField} />);
    type(input, "=2*");
    leave(input);
    type(input, "7");
    expect(screen.queryByText(/expression/i)).not.toBeInTheDocument();
  });
});

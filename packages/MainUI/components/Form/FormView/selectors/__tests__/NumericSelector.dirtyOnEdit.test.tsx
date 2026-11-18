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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { FormProvider, useForm, useFormContext, useFormState } from "react-hook-form";
import { UnifiedNumericSelector } from "../NumericSelector";
import { createMockField, FIELD_REFERENCES } from "../test-utils/decimal-test-helpers";

const FIELD_NAME = "actualPayment";
const field = createMockField(FIELD_REFERENCES.DECIMAL, FIELD_NAME);

/** Exposes whether the field is dirty. */
const DirtyProbe = () => {
  const { dirtyFields } = useFormState();
  return <span data-testid="dirty">{String(Boolean(dirtyFields[FIELD_NAME]))}</span>;
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: 0 } });
  return (
    <FormProvider {...methods}>
      {children}
      <DirtyProbe />
    </FormProvider>
  );
};

/** Types `value` in the selector and leaves the field. */
const typeAndLeave = (value: string) => {
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

describe("NumericSelector - dirtyOnEdit", () => {
  it("marks the typed value as edited, so a reset keeping dirty values keeps it", async () => {
    render(
      <Wrapper>
        <UnifiedNumericSelector field={field} dirtyOnEdit />
      </Wrapper>
    );

    typeAndLeave("10");

    expect(await screen.findByText("true")).toBeInTheDocument();
  });

  it("leaves the field clean without it, as forms expect", () => {
    render(
      <Wrapper>
        <UnifiedNumericSelector field={field} />
      </Wrapper>
    );

    typeAndLeave("10");

    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
  });

  describe("an entry that changes nothing (ETP-6338)", () => {
    /** The default values of the form, and what the form holds at the end. */
    const renderWith = (defaultValue: unknown, ui: React.ReactElement) => {
      let values: Record<string, unknown> = {};
      const Capture = () => {
        const { getValues } = useFormContext();
        values = getValues();
        return null;
      };
      const Form = () => {
        const methods = useForm({ defaultValues: { [FIELD_NAME]: defaultValue } });
        return (
          <FormProvider {...methods}>
            {ui}
            <Capture />
            <DirtyProbe />
          </FormProvider>
        );
      };
      render(<Form />);
      return () => values[FIELD_NAME];
    };

    it("does not mark the field as edited when it is entered and left", () => {
      renderWith(
        "2.64",
        // dirtyOnEdit makes a real edit visible in the dirty fields
        <UnifiedNumericSelector field={field} dirtyOnEdit />
      );
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(screen.getByTestId("dirty")).toHaveTextContent("false");
    });

    it("keeps what the form held when the same number is typed another way", () => {
      const held = renderWith("2.64", <UnifiedNumericSelector field={field} dirtyOnEdit />);

      typeAndLeave("2.640");

      expect(screen.getByTestId("dirty")).toHaveTextContent("false");
      expect(held()).toBe("2.64");
    });

    it("writes the number when it really changes", () => {
      const held = renderWith("2.64", <UnifiedNumericSelector field={field} dirtyOnEdit />);

      typeAndLeave("3");

      expect(screen.getByTestId("dirty")).toHaveTextContent("true");
      expect(held()).toBe(3);
    });
  });
});

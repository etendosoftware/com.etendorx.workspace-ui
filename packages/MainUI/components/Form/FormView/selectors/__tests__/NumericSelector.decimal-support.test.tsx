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

import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { UnifiedNumericSelector } from "../NumericSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

// Mock the language context to avoid Provider issues
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({
    language: "en_US",
  }),
}));

const mockField: Field = {
  hqlName: "amount",
  id: "test-field",
  name: "Amount",
  column: {
    reference: "800008", // DECIMAL
  },
  isMandatory: false,
} as Field;

interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
}

const TestWrapper = ({ children, defaultValues = {} }: TestWrapperProps) => {
  const methods = useForm({ defaultValues });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("NumericSelector - Decimal Separator Support", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic decimal support", () => {
    it("should accept decimal values with dot", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={mockField} type="decimal" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "123.45" } });

      expect(input).toHaveValue("123.45");
    });

    it("should accept comma input and normalize to dot", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={mockField} type="decimal" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "123,45" } });

      expect(input).toHaveValue("123.45");
    });

    it("should process intermediate values during typing", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={mockField} type="decimal" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      
      // Test intermediate state with trailing dot gets processed
      fireEvent.change(input, { target: { value: "123." } });
      expect(input).toHaveValue("123");
    });
  });

  describe("Integer fields", () => {
    const integerField: Field = {
      ...mockField,
      column: {
        reference: "11", // INTEGER
      },
    };

    it("should strip decimal separators for integer fields", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={integerField} type="integer" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "123.45" } });

      expect(input).toHaveValue("12345");
    });
  });

  describe("Validation edge cases", () => {
    it("should allow negative values", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={mockField} type="decimal" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "-123.45" } });

      expect(input).toHaveValue("-123.45");
    });

    it("should normalize values starting with decimal separator", () => {
      render(
        <TestWrapper>
          <UnifiedNumericSelector field={mockField} type="decimal" />
        </TestWrapper>
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: ".5" } });

      expect(input).toHaveValue("0.5");
    });
  });
});
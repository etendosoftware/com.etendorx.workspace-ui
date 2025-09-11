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

import { UnifiedNumericSelector } from "../NumericSelector";
import {
  createMockField,
  FIELD_REFERENCES,
  testBasicDecimalInputs,
  testEdgeCases,
  renderWithWrapper,
  testDecimalInput,
} from "../test-utils/decimal-test-helpers";

const mockField = createMockField(FIELD_REFERENCES.DECIMAL, "amount");

describe("NumericSelector - Decimal Separator Support", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic decimal support", () => {
    const component = <UnifiedNumericSelector field={mockField} type="decimal" />;
    const basicTests = testBasicDecimalInputs(component);

    it("should accept decimal values with dot", basicTests.testDotInput);

    it("should accept comma input and normalize to dot", () => basicTests.testCommaInput());

    it("should process intermediate values during typing", () => {
      basicTests.testIntermediateValues("123.", () => {
        const input = document.querySelector("input") as HTMLInputElement;
        expect(input).toHaveValue("123");
      });
    });
  });

  describe("Integer fields", () => {
    const integerField = createMockField(FIELD_REFERENCES.INTEGER, "integerAmount");

    it("should strip decimal separators for integer fields", () => {
      const input = renderWithWrapper(<UnifiedNumericSelector field={integerField} type="integer" />);
      testDecimalInput(input, "123.45", "12345");
    });
  });

  describe("Validation edge cases", () => {
    const component = <UnifiedNumericSelector field={mockField} type="decimal" />;
    const edgeCaseTests = testEdgeCases(component);

    it("should allow negative values", () => {
      edgeCaseTests.testNegativeValue("-123.45", () => {
        const input = document.querySelector("input") as HTMLInputElement;
        expect(input).toHaveValue("-123.45");
      });
    });

    it("should normalize values starting with decimal separator", () => {
      edgeCaseTests.testValueStartingWithDecimal("0.5");
    });
  });
});

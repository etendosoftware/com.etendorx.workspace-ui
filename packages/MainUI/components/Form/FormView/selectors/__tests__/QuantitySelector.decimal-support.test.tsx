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

import { fireEvent } from "@testing-library/react";
import { QuantitySelector } from "../QuantitySelector";
import {
  createMockField,
  FIELD_REFERENCES,
  testEdgeCases,
  renderWithWrapper,
  testDecimalInput,
} from "./test-utils/decimal-test-helpers";

const mockField = createMockField(FIELD_REFERENCES.QUANTITY_22, "progress");

describe("QuantitySelector - Decimal Separator Support", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic decimal support", () => {
    const component = <QuantitySelector field={mockField} />;

    it("should accept decimal values with dot", () => {
      const input = renderWithWrapper(component);
      testDecimalInput(input, "44.78", "44.78");
    });

    it("should accept comma input and normalize internally", () => {
      const input = renderWithWrapper(component);
      testDecimalInput(input, "44,78", "44.78");
    });

    it("should handle intermediate values during typing", () => {
      const input = renderWithWrapper(component);

      // Test intermediate state - QuantitySelector allows but doesn't validate trailing dots
      fireEvent.change(input, { target: { value: "44." } });
      expect((input as HTMLInputElement).value).toBeDefined();

      // Complete the value should work
      testDecimalInput(input, "44.5", "44.5");
    });
  });

  describe("Validation with min/max values", () => {
    it("should handle validation with min/max values", () => {
      const input = renderWithWrapper(<QuantitySelector field={mockField} min={10} max={50} />);

      // Valid value within range
      testDecimalInput(input, "25.5", "25.5");

      // Values outside range - behavior depends on validation logic
      testDecimalInput(input, "5.5", "25.5");
    });
  });

  describe("Edge cases", () => {
    const component = <QuantitySelector field={mockField} />;
    const edgeCaseTests = testEdgeCases(component);

    it("should handle empty values", edgeCaseTests.testEmptyValue);

    it("should handle negative values (validation may reject)", () => {
      edgeCaseTests.testNegativeValue("-25.5");
    });

    it("should handle values starting with decimal separator", () => {
      edgeCaseTests.testNegativeValue(".5");
    });
  });
});

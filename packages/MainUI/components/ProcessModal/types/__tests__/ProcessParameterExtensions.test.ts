import { isReferenceValue, isSimpleValue } from "../ProcessParameterExtensions";

describe("ProcessParameterExtensions Type Guards", () => {
  describe("isReferenceValue", () => {
    it("should return true for valid reference objects", () => {
      const referenceValue = {
        value: "E443A31992CB4635AFCAEABE7183CE85",
        identifier: "F&B España - Región Norte",
      };

      expect(isReferenceValue(referenceValue)).toBe(true);
    });

    it("should return false for simple string values", () => {
      expect(isReferenceValue("simple string")).toBe(false);
      expect(isReferenceValue("")).toBe(false);
    });

    it("should return false for numbers", () => {
      expect(isReferenceValue(123)).toBe(false);
      expect(isReferenceValue(0)).toBe(false);
    });

    it("should return false for booleans", () => {
      expect(isReferenceValue(true)).toBe(false);
      expect(isReferenceValue(false)).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isReferenceValue(null)).toBe(false);
      expect(isReferenceValue(undefined)).toBe(false);
    });

    it("should return false for objects missing required properties", () => {
      expect(isReferenceValue({ value: "123" })).toBe(false);
      expect(isReferenceValue({ identifier: "test" })).toBe(false);
      expect(isReferenceValue({ value: 123, identifier: "test" })).toBe(false);
      expect(isReferenceValue({ value: "123", identifier: 456 })).toBe(false);
    });
  });

  describe("isSimpleValue", () => {
    it("should return true for strings", () => {
      expect(isSimpleValue("test")).toBe(true);
      expect(isSimpleValue("")).toBe(true);
      expect(isSimpleValue("1.85")).toBe(true);
    });

    it("should return true for numbers", () => {
      expect(isSimpleValue(123)).toBe(true);
      expect(isSimpleValue(0)).toBe(true);
      expect(isSimpleValue(1.85)).toBe(true);
    });

    it("should return true for booleans", () => {
      expect(isSimpleValue(true)).toBe(true);
      expect(isSimpleValue(false)).toBe(true);
    });

    it("should return false for objects", () => {
      expect(isSimpleValue({ value: "123", identifier: "test" })).toBe(false);
      expect(isSimpleValue({})).toBe(false);
      expect(isSimpleValue([])).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isSimpleValue(null)).toBe(false);
      expect(isSimpleValue(undefined)).toBe(false);
    });
  });

  describe("Real world data", () => {
    it("should correctly identify real response values", () => {
      const realResponseData = {
        trxtype: "",
        ad_org_id: {
          value: "E443A31992CB4635AFCAEABE7183CE85",
          identifier: "F&B España - Región Norte",
        },
        bslamount: "",
        payment_documentno: "<1000373>",
        actual_payment: "1.85",
        issotrx: true,
        StdPrecision: "2",
      };

      // Simple values
      expect(isSimpleValue(realResponseData.trxtype)).toBe(true);
      expect(isSimpleValue(realResponseData.bslamount)).toBe(true);
      expect(isSimpleValue(realResponseData.payment_documentno)).toBe(true);
      expect(isSimpleValue(realResponseData.actual_payment)).toBe(true);
      expect(isSimpleValue(realResponseData.issotrx)).toBe(true);
      expect(isSimpleValue(realResponseData.StdPrecision)).toBe(true);

      // Reference values
      expect(isReferenceValue(realResponseData.ad_org_id)).toBe(true);

      // Cross-validation
      expect(isReferenceValue(realResponseData.trxtype)).toBe(false);
      expect(isSimpleValue(realResponseData.ad_org_id)).toBe(false);
    });
  });
});

import type { Field } from "@workspaceui/api-client/src/api/types";
import { buildTabExtraProperties, getPropertyFieldPaths } from "../extraProperties";

const PAYMENT_DATE_PATH = "paymentDetails.finPayment.paymentDate";
const PAYMENT_PATH = "paymentDetails.finPayment";

const buildField = (overrides: Partial<Field> = {}, propertyPath?: string): Field =>
  ({ hqlName: "field", columnName: "Field", column: { propertyPath }, ...overrides }) as unknown as Field;

describe("extraProperties", () => {
  describe("getPropertyFieldPaths", () => {
    it("returns the paths of the property fields that cross a related record", () => {
      const fields = {
        paymentDate: buildField({}, PAYMENT_DATE_PATH),
        payment: buildField({}, PAYMENT_PATH),
      };

      expect(getPropertyFieldPaths(fields)).toEqual([PAYMENT_DATE_PATH, PAYMENT_PATH]);
    });

    it("skips single-segment properties and fields without property", () => {
      const fields = { amount: buildField({}, "amount"), plain: buildField(), noColumn: { hqlName: "x" } as Field };

      expect(getPropertyFieldPaths(fields)).toEqual([]);
    });

    it("returns each path once", () => {
      const fields = { a: buildField({}, PAYMENT_PATH), b: buildField({}, PAYMENT_PATH) };

      expect(getPropertyFieldPaths(fields)).toEqual([PAYMENT_PATH]);
    });

    it("returns no path when the tab has no fields", () => {
      expect(getPropertyFieldPaths(undefined)).toEqual([]);
    });
  });

  describe("buildTabExtraProperties", () => {
    it("joins the color paths and the property field paths", () => {
      const fields = {
        status: buildField({ hqlName: "status", colorFieldName: "color" }),
        paymentDate: buildField({}, PAYMENT_DATE_PATH),
      };

      expect(buildTabExtraProperties(fields)).toBe(`status$color,${PAYMENT_DATE_PATH}`);
    });

    it("uses the column name of a colored field without hqlName", () => {
      const fields = { status: buildField({ hqlName: "", columnName: "Status", colorFieldName: "color" }) };

      expect(buildTabExtraProperties(fields)).toBe("Status$color");
    });

    it("returns an empty string when there is nothing to request", () => {
      expect(buildTabExtraProperties({ plain: buildField() })).toBe("");
      expect(buildTabExtraProperties(undefined)).toBe("");
    });
  });
});

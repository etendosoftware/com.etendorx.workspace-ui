import { expect, test } from "@playwright/test";
import { removalBatches } from "../flows/characteristics";
import { DATASOURCE } from "../registry/datasources";

const record = (target: (typeof DATASOURCE)[keyof typeof DATASOURCE], id: string) => ({ target, id });
const ids = (batches: { id: string }[][]) => batches.map((batch) => batch.map(({ id }) => id));

test.describe("removalBatches", () => {
  test("removes consecutive product records of one kind together, in the given order", () => {
    const batches = removalBatches([
      record(DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE, "value of B"),
      record(DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE, "value of A"),
      record(DATASOURCE.PRODUCT_CHARACTERISTIC, "characteristic of B"),
      record(DATASOURCE.PRODUCT, "B"),
      record(DATASOURCE.PRODUCT, "A"),
    ]);
    expect(ids(batches)).toEqual([["value of B", "value of A"], ["characteristic of B"], ["B", "A"]]);
  });

  test("keeps characteristic values and characteristics one at a time", () => {
    const batches = removalBatches([
      record(DATASOURCE.CHARACTERISTIC_VALUE, "child"),
      record(DATASOURCE.CHARACTERISTIC_VALUE, "group"),
      record(DATASOURCE.CHARACTERISTIC, "Envase"),
      record(DATASOURCE.CHARACTERISTIC, "Formato"),
    ]);
    expect(ids(batches)).toEqual([["child"], ["group"], ["Envase"], ["Formato"]]);
  });

  test("never batches records of different kinds", () => {
    const batches = removalBatches([
      record(DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE, "value of B"),
      record(DATASOURCE.PRODUCT_CHARACTERISTIC, "characteristic of B"),
      record(DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE, "value of A"),
    ]);
    expect(ids(batches)).toEqual([["value of B"], ["characteristic of B"], ["value of A"]]);
    expect(removalBatches([])).toEqual([]);
  });
});

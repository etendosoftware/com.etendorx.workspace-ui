import { expect, test } from "@playwright/test";
import { csvColumn, parseCsv, parseCsvLine } from "../csv";

const DOCUMENT_NO = "Document No.";
const BUSINESS_PARTNER = "Sleep Well Hotels, Co.";

test.describe("parseCsvLine", () => {
  test("splits plain and quoted values, keeping separators and escaped quotes inside quotes", () => {
    expect(parseCsvLine(`"1000349","${BUSINESS_PARTNER}",523635.00,""`)).toEqual([
      "1000349",
      BUSINESS_PARTNER,
      "523635.00",
      "",
    ]);
    expect(parseCsvLine('"Say ""hi""",x')).toEqual(['Say "hi"', "x"]);
  });
});

test.describe("parseCsv and csvColumn", () => {
  const csv = `"${DOCUMENT_NO}","Business Partner"\r\n"50017","${BUSINESS_PARTNER}"\n"50013","Other"\n`;

  test("reads every record and the values of a column by its header", () => {
    const rows = parseCsv(csv);

    expect(rows).toHaveLength(3);
    expect(csvColumn(rows, DOCUMENT_NO)).toEqual(["50017", "50013"]);
  });

  test("fails on a column the file does not have", () => {
    expect(() => csvColumn(parseCsv(csv), "Order Date")).toThrow(/no column "Order Date"/);
    expect(() => csvColumn([], DOCUMENT_NO)).toThrow(/no column/);
  });
});

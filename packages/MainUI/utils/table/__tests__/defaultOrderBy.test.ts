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

import {
  type DefaultSortField,
  type DefaultSortTab,
  findOrderByField,
  getIndicatorSorts,
  isDefaultSortingActive,
  parseOrderByToken,
  resolveOrderBySorts,
  resolveTabDefaultSorts,
  splitOrderByClause,
} from "../defaultOrderBy";

const ACCOUNTING_DATE = "accountingDate";
const LINE_NO = "lineNo";
const DOCUMENT_NO = "documentNo";
const CREDIT = "credit";
const SEQUENCE_NUMBER = "sequenceNumber";
const DATE_LABEL = "Accounting Date";
const LINE_LABEL = "Line No.";
const DOCUMENT_LABEL = "Document No.";
const CREDIT_LABEL = "Credit";
const ACCOUNTING_CLAUSE = "accountingSchema.name, accountingDate, abs(debit) desc, credit desc, lineNo";

/** Builds a field whose UI name differs from its property and column names. */
const makeField = (name: string, hqlName: string, extra: Partial<DefaultSortField> = {}): DefaultSortField => ({
  name,
  hqlName,
  columnName: `${hqlName}_col`,
  ...extra,
});

const FIELDS: DefaultSortField[] = [
  makeField(DATE_LABEL, ACCOUNTING_DATE),
  makeField(LINE_LABEL, LINE_NO),
  makeField(DOCUMENT_LABEL, DOCUMENT_NO),
  makeField(CREDIT_LABEL, CREDIT),
];

/** Builds a tab with the given fields (keyed by their names) and order-by clauses. */
const makeTab = (fields: DefaultSortField[], clauses: Partial<DefaultSortTab> = {}): DefaultSortTab => ({
  fields: Object.fromEntries(fields.map((field) => [field.name, field])),
  ...clauses,
});

const asc = (id: string) => ({ id, desc: false });
const desc = (id: string) => ({ id, desc: true });

describe("defaultOrderBy", () => {
  describe("splitOrderByClause", () => {
    it.each([
      { clause: "", expected: [] },
      { clause: LINE_NO, expected: [LINE_NO] },
      { clause: " dateAcct ,lineNo ", expected: ["dateAcct", LINE_NO] },
      { clause: "a,,b,", expected: ["a", "b"] },
      { clause: "obSelected desc, coalesce(a, b)", expected: ["obSelected desc", "coalesce(a, b)"] },
    ])('splits "$clause" by its top-level commas', ({ clause, expected }) => {
      expect(splitOrderByClause(clause)).toEqual(expected);
    });
  });

  describe("parseOrderByToken", () => {
    it.each([
      { token: LINE_NO, expected: asc(LINE_NO) },
      { token: "creationDate desc", expected: desc("creationDate") },
      { token: "creationDate DESC", expected: desc("creationDate") },
      { token: "lineNo ASC", expected: asc(LINE_NO) },
      { token: "-accountingDate", expected: desc(ACCOUNTING_DATE) },
      { token: "e.documentNo desc", expected: desc(DOCUMENT_NO) },
      { token: "e.invoice.documentNo", expected: asc("invoice.documentNo") },
      { token: "trx.movementDate", expected: asc("trx.movementDate") },
    ])('parses "$token"', ({ token, expected }) => {
      expect(parseOrderByToken(token)).toEqual(expected);
    });

    it.each(["abs(debit) desc", "coalesce(a, b)", "a + b", "lineNo desc nulls"])(
      'treats the expression "%s" as not mappable',
      (token) => {
        expect(parseOrderByToken(token)).toBeNull();
      }
    );
  });

  describe("findOrderByField", () => {
    it("matches the property, the column or the field name", () => {
      expect(findOrderByField(FIELDS, LINE_NO)?.name).toBe(LINE_LABEL);
      expect(findOrderByField(FIELDS, `${LINE_NO}_col`)?.name).toBe(LINE_LABEL);
      expect(findOrderByField(FIELDS, LINE_LABEL)?.name).toBe(LINE_LABEL);
      expect(findOrderByField(FIELDS, "unknown")).toBeUndefined();
    });
  });

  describe("resolveOrderBySorts", () => {
    it.each([
      { clause: LINE_NO, expected: [asc(LINE_LABEL)] },
      { clause: "accountingDate desc", expected: [desc(DATE_LABEL)] },
      { clause: "accountingDate, lineNo", expected: [asc(DATE_LABEL), asc(LINE_LABEL)] },
      { clause: "-accountingDate", expected: [desc(DATE_LABEL)] },
      { clause: "e.documentNo desc", expected: [desc(DOCUMENT_LABEL)] },
      { clause: ACCOUNTING_CLAUSE, expected: [asc(DATE_LABEL), desc(CREDIT_LABEL), asc(LINE_LABEL)] },
      { clause: "trx.movementDate, trx.transactionProcessDate", expected: [] },
      { clause: "lineNo, -lineNo", expected: [asc(LINE_LABEL)] },
    ])('resolves "$clause" to the grid columns', ({ clause, expected }) => {
      expect(resolveOrderBySorts(clause, FIELDS)).toEqual(expected);
    });
  });

  describe("resolveTabDefaultSorts", () => {
    it("returns no sort without a tab", () => {
      expect(resolveTabDefaultSorts(undefined)).toEqual([]);
    });

    it("resolves every column of the HQL order-by clause before the SQL one", () => {
      const tab = makeTab(FIELDS, { hqlorderbyclause: "-accountingDate, lineNo", sQLOrderByClause: DOCUMENT_NO });

      expect(resolveTabDefaultSorts(tab)).toEqual([desc(DATE_LABEL), asc(LINE_LABEL)]);
    });

    it("keeps the first token of a SQL order-by clause", () => {
      expect(resolveTabDefaultSorts(makeTab(FIELDS, { sQLOrderByClause: "lineNo_col DESC" }))).toEqual([
        desc(LINE_LABEL),
      ]);
      expect(resolveTabDefaultSorts(makeTab(FIELDS, { sQLOrderByClause: "Unknown" }))).toEqual([asc("Unknown")]);
    });

    it("falls back to the field with the lowest record sort number", () => {
      const fields = [
        makeField(DATE_LABEL, ACCOUNTING_DATE, { recordSortNo: 2 }),
        makeField(LINE_LABEL, LINE_NO, { recordSortNo: 1 }),
      ];

      expect(resolveTabDefaultSorts(makeTab(fields))).toEqual([asc(LINE_LABEL)]);
    });

    it("falls back to the first identifier field by sequence number", () => {
      const fields = [
        makeField(DATE_LABEL, ACCOUNTING_DATE, { sequenceNumber: 30, column: { identifier: true } }),
        makeField(DOCUMENT_LABEL, DOCUMENT_NO, { sequenceNumber: 10, column: { isIdentifier: "true" } }),
        makeField(LINE_LABEL, LINE_NO, { sequenceNumber: 5, column: null }),
        makeField(CREDIT_LABEL, CREDIT, { column: { identifier: false } }),
      ];

      expect(resolveTabDefaultSorts(makeTab(fields))).toEqual([asc(DOCUMENT_LABEL)]);
    });

    describe("with the backend default sort field", () => {
      const fields = [
        makeField(LINE_LABEL, LINE_NO, { recordSortNo: 1 }),
        makeField(DATE_LABEL, ACCOUNTING_DATE, { recordSortNo: 2 }),
      ];

      it("sorts by the field of the classic default sort property, over the record sort numbers", () => {
        expect(resolveTabDefaultSorts(makeTab(fields, { defaultSortField: ACCOUNTING_DATE }))).toEqual([
          asc(DATE_LABEL),
        ]);
      });

      it("sorts by a property the tab has no field for", () => {
        expect(resolveTabDefaultSorts(makeTab(fields, { defaultSortField: SEQUENCE_NUMBER }))).toEqual([
          asc(SEQUENCE_NUMBER),
        ]);
      });

      it("does not sort when classic does not, and the HQL clause still wins", () => {
        expect(resolveTabDefaultSorts(makeTab(fields, { defaultSortField: "" }))).toEqual([]);
        expect(
          resolveTabDefaultSorts(makeTab(fields, { defaultSortField: "", hqlorderbyclause: "-lineNo" }))
        ).toEqual([desc(LINE_LABEL)]);
      });
    });

    it("returns no sort when nothing defines one", () => {
      expect(resolveTabDefaultSorts(makeTab([makeField(LINE_LABEL, LINE_NO)]))).toEqual([]);
    });
  });

  describe("getIndicatorSorts", () => {
    it("keeps only the default sorts on a grid field", () => {
      expect(getIndicatorSorts([asc(SEQUENCE_NUMBER), desc(LINE_LABEL)], FIELDS)).toEqual([desc(LINE_LABEL)]);
      expect(getIndicatorSorts([], FIELDS)).toEqual([]);
    });
  });

  describe("isDefaultSortingActive", () => {
    const defaults = [asc(DATE_LABEL), desc(LINE_LABEL)];

    it.each([
      { name: "no sort", current: [], expected: true },
      { name: "the default sorts", current: [asc(DATE_LABEL), desc(LINE_LABEL)], expected: true },
      { name: "another order", current: [desc(LINE_LABEL), asc(DATE_LABEL)], expected: false },
      { name: "another direction", current: [asc(DATE_LABEL), asc(LINE_LABEL)], expected: false },
      { name: "a subset", current: [asc(DATE_LABEL)], expected: false },
      { name: "another column", current: [asc(DOCUMENT_LABEL), desc(LINE_LABEL)], expected: false },
    ])("is $expected with $name", ({ current, expected }) => {
      expect(isDefaultSortingActive(current, defaults)).toBe(expected);
    });
  });
});

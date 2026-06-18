/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { FieldType } from "@workspaceui/api-client/src/api/types";
import { applyNumericMandatoryDefaults, collectMissingMandatory, isEmptyValue } from "../validateMandatoryFields";

// DB column names
const COL_GL_ITEM = "c_glitem_id";
const COL_RECEIVED_IN = "received_in";
const COL_PAID_OUT = "paid_out";
const COL_PRODUCT = "M_Product_ID";

// HQL camelCase names (the shape `parseColumns` produces — and therefore the
// key `GridCellEditor.handleChange` writes to `row.original`).
const HQL_GL_ITEM = "g/LItem";
const HQL_RECEIVED_IN = "receivedIn";
const HQL_PAID_OUT = "paidOut";

// Field display names (the shape MRT uses for `column.id` and therefore for
// the keys in `values` passed to `onCreatingRowSave`).
const NAME_GL_ITEM = "G/L Item";
const NAME_RECEIVED_IN = "Received In";
const NAME_PAID_OUT = "Paid Out";

// Parent-map keys from `Object.entries(tab.fields)`.
const KEY_GL_ITEM = "gLItem";
const KEY_RECEIVED_IN = "receivedIn";
const KEY_PAID_OUT = "paidOut";

const mandatoryFields = [
  { columnName: COL_GL_ITEM, isMandatory: true },
  { columnName: COL_RECEIVED_IN, isMandatory: true },
  { columnName: COL_PAID_OUT, isMandatory: true },
  { columnName: COL_PRODUCT, isMandatory: false },
];

const richFields = [
  {
    columnName: COL_GL_ITEM,
    hqlName: HQL_GL_ITEM,
    name: NAME_GL_ITEM,
    _key: KEY_GL_ITEM,
    isMandatory: true,
  },
  {
    columnName: COL_RECEIVED_IN,
    hqlName: HQL_RECEIVED_IN,
    name: NAME_RECEIVED_IN,
    _key: KEY_RECEIVED_IN,
    isMandatory: true,
  },
  {
    columnName: COL_PAID_OUT,
    hqlName: HQL_PAID_OUT,
    name: NAME_PAID_OUT,
    _key: KEY_PAID_OUT,
    isMandatory: true,
  },
];

const numericFields = [
  {
    columnName: COL_RECEIVED_IN,
    hqlName: HQL_RECEIVED_IN,
    name: NAME_RECEIVED_IN,
    _key: KEY_RECEIVED_IN,
    isMandatory: true,
    type: FieldType.NUMBER,
  },
  {
    columnName: COL_PAID_OUT,
    hqlName: HQL_PAID_OUT,
    name: NAME_PAID_OUT,
    _key: KEY_PAID_OUT,
    isMandatory: true,
    type: FieldType.NUMBER,
  },
];

describe("isEmptyValue", () => {
  it.each([
    [null, true],
    [undefined, true],
    ["", true],
    ["abc", false],
    [0, false],
    [false, false],
    [{}, false],
  ])("returns %p for %p", (input, expected) => {
    expect(isEmptyValue(input)).toBe(expected);
  });
});

describe("collectMissingMandatory", () => {
  it("returns an empty set when all mandatory fields have values keyed by columnName", () => {
    const values = {
      [COL_GL_ITEM]: "ID1",
      [COL_RECEIVED_IN]: 10,
      [COL_PAID_OUT]: 0,
      [COL_PRODUCT]: "",
    };
    expect(collectMissingMandatory(mandatoryFields, values)).toEqual(new Set());
  });

  it("flags every empty mandatory field but skips optional empty fields", () => {
    const values = {
      [COL_GL_ITEM]: null,
      [COL_RECEIVED_IN]: "",
      [COL_PAID_OUT]: undefined,
      [COL_PRODUCT]: "",
    };
    const missing = collectMissingMandatory(mandatoryFields, values);
    expect(missing).toEqual(new Set([COL_GL_ITEM, COL_RECEIVED_IN, COL_PAID_OUT]));
    expect(missing.has(COL_PRODUCT)).toBe(false);
  });

  it("treats missing keys in the values object as empty", () => {
    const missing = collectMissingMandatory(mandatoryFields, {});
    expect(missing).toEqual(new Set([COL_GL_ITEM, COL_RECEIVED_IN, COL_PAID_OUT]));
  });

  it("returns an empty set when the fields list is empty", () => {
    expect(collectMissingMandatory([], { anything: 1 })).toEqual(new Set());
  });

  it("returns an empty set when no field is mandatory", () => {
    const onlyOptional = [{ columnName: COL_PRODUCT, isMandatory: false }];
    expect(collectMissingMandatory(onlyOptional, {})).toEqual(new Set());
  });

  it("treats values keyed by field.name (MRT _valuesCache shape) as filled", () => {
    const values = {
      [NAME_GL_ITEM]: "ID1",
      [NAME_RECEIVED_IN]: 1,
      [NAME_PAID_OUT]: 2,
    };
    expect(collectMissingMandatory(richFields, values)).toEqual(new Set());
  });

  it("treats values keyed by hqlName (row.original shape) as filled", () => {
    const values = {
      [HQL_GL_ITEM]: "ID1",
      [HQL_RECEIVED_IN]: 1,
      [HQL_PAID_OUT]: 2,
    };
    expect(collectMissingMandatory(richFields, values)).toEqual(new Set());
  });

  it("treats values keyed by the parent-map key as filled", () => {
    const values = {
      [KEY_GL_ITEM]: "ID1",
      [KEY_RECEIVED_IN]: 1,
      [KEY_PAID_OUT]: 2,
    };
    expect(collectMissingMandatory(richFields, values)).toEqual(new Set());
  });

  it("treats the real-world mixed shape (values + row.original + mrt-row-actions) as filled", () => {
    const values = {
      "mrt-row-actions": "",
      [NAME_GL_ITEM]: "F91A23A701F74F22BEBCED926DC0053D",
      [NAME_RECEIVED_IN]: 1,
      [NAME_PAID_OUT]: 2,
      [HQL_GL_ITEM]: "F91A23A701F74F22BEBCED926DC0053D",
      [`${HQL_GL_ITEM}$_identifier`]: "GL Item 1",
      [HQL_RECEIVED_IN]: 1,
      [HQL_PAID_OUT]: 2,
    };
    expect(collectMissingMandatory(richFields, values)).toEqual(new Set());
  });

  it("returns the DB column names when none of the candidate keys are filled", () => {
    expect(collectMissingMandatory(richFields, {})).toEqual(new Set([COL_GL_ITEM, COL_RECEIVED_IN, COL_PAID_OUT]));
  });

  it("treats `0` as filled for amount fields regardless of which key shape carries it", () => {
    const onlyReceivedIn = [richFields[1]];
    expect(collectMissingMandatory(onlyReceivedIn, { [HQL_RECEIVED_IN]: 0 })).toEqual(new Set());
    expect(collectMissingMandatory(onlyReceivedIn, { [NAME_RECEIVED_IN]: 0 })).toEqual(new Set());
    expect(collectMissingMandatory(onlyReceivedIn, { [KEY_RECEIVED_IN]: 0 })).toEqual(new Set());
  });
});

describe("applyNumericMandatoryDefaults", () => {
  it("fills 0 under every key shape when a numeric mandatory field is empty", () => {
    const out = applyNumericMandatoryDefaults(numericFields, {});
    expect(out).toEqual({
      [COL_RECEIVED_IN]: 0,
      [HQL_RECEIVED_IN]: 0,
      [NAME_RECEIVED_IN]: 0,
      [KEY_RECEIVED_IN]: 0,
      [COL_PAID_OUT]: 0,
      [HQL_PAID_OUT]: 0,
      [NAME_PAID_OUT]: 0,
      [KEY_PAID_OUT]: 0,
    });
  });

  it("preserves user-typed values and only defaults the empty side", () => {
    const out = applyNumericMandatoryDefaults(numericFields, { [NAME_RECEIVED_IN]: 100 });
    expect(out[NAME_RECEIVED_IN]).toBe(100);
    expect(out[COL_PAID_OUT]).toBe(0);
    expect(out[HQL_PAID_OUT]).toBe(0);
    expect(out[NAME_PAID_OUT]).toBe(0);
  });

  it("recognises any candidate key as 'already filled' and skips defaulting", () => {
    // value lives under hqlName only — must still be respected
    const out = applyNumericMandatoryDefaults(numericFields, { [HQL_RECEIVED_IN]: 5 });
    expect(out[HQL_RECEIVED_IN]).toBe(5);
    expect(out[NAME_RECEIVED_IN]).toBeUndefined(); // not back-filled, the field is already filled
    expect(out[COL_RECEIVED_IN]).toBeUndefined();
  });

  it("does NOT default non-numeric mandatory fields", () => {
    const mixed = [
      {
        columnName: COL_GL_ITEM,
        hqlName: HQL_GL_ITEM,
        name: NAME_GL_ITEM,
        _key: KEY_GL_ITEM,
        isMandatory: true,
        type: FieldType.TABLEDIR,
      },
      ...numericFields,
    ];
    const out = applyNumericMandatoryDefaults(mixed, {});
    expect(out[COL_GL_ITEM]).toBeUndefined();
    expect(out[HQL_GL_ITEM]).toBeUndefined();
    expect(out[NAME_GL_ITEM]).toBeUndefined();
    expect(out[COL_RECEIVED_IN]).toBe(0);
    expect(out[COL_PAID_OUT]).toBe(0);
  });

  it("leaves explicit 0 values untouched", () => {
    const out = applyNumericMandatoryDefaults(numericFields, { [HQL_RECEIVED_IN]: 0 });
    expect(out[HQL_RECEIVED_IN]).toBe(0);
    expect(out[COL_PAID_OUT]).toBe(0);
  });

  it("ignores non-mandatory numeric fields", () => {
    const optional = [{ ...numericFields[0], isMandatory: false }];
    const out = applyNumericMandatoryDefaults(optional, {});
    expect(out).toEqual({});
  });

  it("ignores numeric fields with no `type` resolved", () => {
    const noType = [{ ...numericFields[0], type: undefined }];
    const out = applyNumericMandatoryDefaults(noType, {});
    expect(out).toEqual({});
  });

  it("defaults QUANTITY fields the same way it defaults NUMBER fields", () => {
    const qty = [{ ...numericFields[0], type: FieldType.QUANTITY }];
    const out = applyNumericMandatoryDefaults(qty, {});
    expect(out[COL_RECEIVED_IN]).toBe(0);
    expect(out[HQL_RECEIVED_IN]).toBe(0);
  });

  it("returns a new object rather than mutating the input", () => {
    const input = {};
    const out = applyNumericMandatoryDefaults(numericFields, input);
    expect(out).not.toBe(input);
    expect(input).toEqual({});
  });
});

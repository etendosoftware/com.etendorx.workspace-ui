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

import { buildLocalGridRecord, generateLocalRecordId } from "../generateLocalRecordId";

const UPPERCASE_NODASH_RE = /^[0-9A-F]+$/;
const EXPECTED_LENGTH = 32;
const ORIGINAL_CRYPTO = globalThis.crypto;

const restoreCrypto = () => {
  Object.defineProperty(globalThis, "crypto", {
    value: ORIGINAL_CRYPTO,
    configurable: true,
  });
};

describe("generateLocalRecordId", () => {
  afterEach(() => {
    restoreCrypto();
  });

  it("returns an uppercase 32-char string without dashes when crypto.randomUUID is available", () => {
    const id = generateLocalRecordId();
    expect(id).toHaveLength(EXPECTED_LENGTH);
    expect(id).toMatch(UPPERCASE_NODASH_RE);
    expect(id).not.toContain("-");
  });

  it("returns a different id on each call", () => {
    const ids = new Set([generateLocalRecordId(), generateLocalRecordId(), generateLocalRecordId()]);
    expect(ids.size).toBe(3);
  });

  it("falls back to Math.random when crypto.randomUUID is undefined", () => {
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
    });

    const id = generateLocalRecordId();
    expect(id).toMatch(UPPERCASE_NODASH_RE);
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("buildLocalGridRecord", () => {
  it("attaches a fresh id and merges values without row.original", () => {
    const values = { glitemId: "100", description: "Sales discount" };
    const { id, record } = buildLocalGridRecord(values);
    expect(id).toMatch(UPPERCASE_NODASH_RE);
    expect(record.id).toBe(id);
    expect(record.glitemId).toBe("100");
    expect(record.description).toBe("Sales discount");
  });

  it("lets row.original override the MRT-tracked values when both are present", () => {
    const values = { description: "stale", amount: 10 };
    const rowOriginal = { description: "latest" };
    const { record } = buildLocalGridRecord(values, rowOriginal);
    expect(record.description).toBe("latest");
    expect(record.amount).toBe(10);
  });

  it("produces a different id on each call for the same input", () => {
    const values = { foo: 1 };
    const ids = new Set([
      buildLocalGridRecord(values).id,
      buildLocalGridRecord(values).id,
      buildLocalGridRecord(values).id,
    ]);
    expect(ids.size).toBe(3);
  });
});

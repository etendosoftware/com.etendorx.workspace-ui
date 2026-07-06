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

// Tests for the `applyFieldInteractions` helper extracted from
// `WindowReferenceGrid.handleRecordChange`. The helper reads the payscript
// rules registered for a process and zeroes any sibling column declared as
// mutually exclusive with the edited column, mutating `row.original` and
// returning the merged changes patch.

import type { PayScriptRules } from "@/payscript/engine/LogicEngine";

// Mock Next.js cache to avoid pulling in server-only imports through
// `WindowReferenceGrid.tsx`'s transitive imports.
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

// Replace the payscript registry with a controllable mock for each test.
const mockGetPayScriptRules = jest.fn<PayScriptRules | undefined, [string]>();
jest.mock("../callouts/genericPayScriptCallout", () => ({
  getPayScriptRules: (id: string) => mockGetPayScriptRules(id),
  registerPayScriptDSL: jest.fn(),
}));

import { applyFieldInteractions, expandKeyVariants } from "../WindowReferenceGrid";

// `_valuesCache` mirrors what MRT keeps on the row to back `cell.getValue()`.
// Tests opt in to it when they want to assert that the sibling cell will
// re-render after the field-interactions write.
const makeRow = (data: Record<string, unknown>, opts?: { withValuesCache?: boolean }) => ({
  id: data.id ?? "row-1",
  original: { ...data },
  ...(opts?.withValuesCache ? { _valuesCache: { ...data } } : {}),
});
const makeRules = (fieldInteractions?: PayScriptRules["fieldInteractions"]): PayScriptRules => ({
  id: "test-process",
  fieldInteractions,
});

beforeEach(() => {
  mockGetPayScriptRules.mockReset();
});

describe("applyFieldInteractions", () => {
  it("returns the original changes when no processId is provided", () => {
    const row = makeRow({ id: "r1", receivedIn: 0, paidOut: 0 });
    const result = applyFieldInteractions(undefined, "glitem", row, { receivedIn: 50 });

    expect(result).toEqual({ receivedIn: 50 });
    expect(row.original.paidOut).toBe(0);
    expect(mockGetPayScriptRules).not.toHaveBeenCalled();
  });

  it("returns the original changes when no rules are registered for the process", () => {
    mockGetPayScriptRules.mockReturnValue(undefined);
    const row = makeRow({ id: "r1", receivedIn: 0, paidOut: 0 });
    const result = applyFieldInteractions("proc-1", "glitem", row, { receivedIn: 50 });

    expect(result).toEqual({ receivedIn: 50 });
    expect(row.original.paidOut).toBe(0);
  });

  it("returns the original changes when the grid has no mutualExclusion entry", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: {} }));
    const row = makeRow({ id: "r1", receivedIn: 0, paidOut: 0 });
    const result = applyFieldInteractions("proc-1", "glitem", row, { receivedIn: 50 });

    expect(result).toEqual({ receivedIn: 50 });
    expect(row.original.paidOut).toBe(0);
  });

  it("returns the original changes when the gridName is not declared", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } }));
    const row = makeRow({ id: "r1", amount: 0 });
    const result = applyFieldInteractions("proc-1", "order_invoice", row, { amount: 100 });

    expect(result).toEqual({ amount: 100 });
  });

  it("zeroes the sibling column and mutates row.original on BOTH DB and HQL keys", () => {
    mockGetPayScriptRules.mockReturnValue(
      makeRules({
        glitem: {
          mutualExclusion: [
            ["received_in", "paid_out"],
            ["receivedIn", "paidOut"],
          ],
        },
      })
    );
    const row = makeRow(
      { id: "r1", receivedIn: 0, paidOut: 30, received_in: 0, paid_out: 30 },
      { withValuesCache: true }
    );
    const result = applyFieldInteractions("proc-1", "glitem", row, { receivedIn: 50 });

    // Patch carries both shapes so downstream merges stay consistent.
    expect(result).toEqual({ receivedIn: 50, paidOut: 0, paid_out: 0 });
    // Both DB and HQL keys are zeroed on row.original.
    expect(row.original.paidOut).toBe(0);
    expect(row.original.paid_out).toBe(0);
    // And MRT's per-cell cache picks up both, so the sibling cell re-renders.
    expect(row._valuesCache.paidOut).toBe(0);
    expect(row._valuesCache.paid_out).toBe(0);
  });

  it("zeroes the reciprocal sibling when paid_out is edited", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } }));
    const row = makeRow({ id: "r1", received_in: 80, paid_out: 0 });
    const result = applyFieldInteractions("proc-1", "glitem", row, { paid_out: 25 });

    expect(result).toEqual({ paid_out: 25, received_in: 0, receivedIn: 0 });
    expect(row.original.received_in).toBe(0);
    expect(row.original.receivedIn).toBe(0);
  });

  it("survives rows without an MRT _valuesCache (edit-in-place rows)", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } }));
    const row = makeRow({ id: "r1", received_in: 0, paid_out: 30 });
    // No `_valuesCache` set; helper must not throw.
    expect(() => applyFieldInteractions("proc-1", "glitem", row, { received_in: 5 })).not.toThrow();
    expect(row.original.paid_out).toBe(0);
    expect(row.original.paidOut).toBe(0);
  });

  it("does not touch the sibling when the edited value is 0", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } }));
    const row = makeRow({ id: "r1", received_in: 50, paid_out: 0 });
    const result = applyFieldInteractions("proc-1", "glitem", row, { paid_out: 0 });

    expect(result).toEqual({ paid_out: 0 });
    expect(row.original.received_in).toBe(50);
  });

  it("preserves identity of the changes object when no rule applies (avoids unnecessary spread)", () => {
    mockGetPayScriptRules.mockReturnValue(makeRules());
    const row = makeRow({ id: "r1" });
    const changes = { receivedIn: 50 };
    const result = applyFieldInteractions("proc-1", "glitem", row, changes);

    expect(result).toBe(changes);
  });

  it("mutates row.original even for the MRT create-row sentinel id", () => {
    // Regression: handleRecordChange used to early-return when row.id wasn't in
    // localRecords, which short-circuited applyFieldInteractions for newly
    // created P&E rows (MRT assigns id="mrt-row-create" while editing). The
    // helper itself must remain id-agnostic so the saved record gets the
    // sibling zeroed.
    mockGetPayScriptRules.mockReturnValue(makeRules({ glitem: { mutualExclusion: [["received_in", "paid_out"]] } }));
    const row = makeRow({ id: "mrt-row-create", received_in: 1, paid_out: 0 });
    const result = applyFieldInteractions("proc-1", "glitem", row, { paid_out: 2 });

    // Patch carries both shapes (received_in + receivedIn) because the helper
    // expands every emitted key to its case-variant so row state stays consistent.
    expect(result).toEqual({ paid_out: 2, received_in: 0, receivedIn: 0 });
    expect(row.original.received_in).toBe(0);
    expect(row.original.receivedIn).toBe(0);
  });

  it("mirrors the sibling zero into MRT's `_valuesCache` so the visual cell updates", () => {
    mockGetPayScriptRules.mockReturnValue(
      makeRules({
        glitem: {
          mutualExclusion: [
            ["received_in", "paid_out"],
            ["receivedIn", "paidOut"],
          ],
        },
      })
    );
    const row = {
      id: "r1",
      original: { receivedIn: 0, paidOut: 30, received_in: 0, paid_out: 30 },
      _valuesCache: { receivedIn: 0, paidOut: 30, received_in: 0, paid_out: 30 } as Record<string, unknown>,
    };
    applyFieldInteractions("proc-1", "glitem", row, { receivedIn: 50 });

    expect(row._valuesCache.paidOut).toBe(0);
  });

  it("mutates the create-row's mirror DB key so the visual cell updates", () => {
    // Reproduces the production bug: GridCellEditor notifies with HQL key
    // (paidOut), but the accessor uses DB key (paid_out). Both must be zeroed.
    mockGetPayScriptRules.mockReturnValue(
      makeRules({
        glitem: {
          mutualExclusion: [
            ["received_in", "paid_out"],
            ["receivedIn", "paidOut"],
          ],
        },
      })
    );
    const row = makeRow(
      { id: "mrt-row-create", received_in: 1, paid_out: 0, receivedIn: 1, paidOut: 0 },
      { withValuesCache: true }
    );
    applyFieldInteractions("proc-1", "glitem", row, { paidOut: 2 });

    expect(row.original.received_in).toBe(0);
    expect(row.original.receivedIn).toBe(0);
    expect(row._valuesCache.received_in).toBe(0);
    expect(row._valuesCache.receivedIn).toBe(0);
  });
});

describe("expandKeyVariants", () => {
  it("expands camelCase to its snake_case sibling", () => {
    expect(expandKeyVariants("paidOut")).toEqual(["paidOut", "paid_out"]);
    expect(expandKeyVariants("receivedIn")).toEqual(["receivedIn", "received_in"]);
  });

  it("expands snake_case to its camelCase sibling", () => {
    expect(expandKeyVariants("paid_out")).toEqual(["paid_out", "paidOut"]);
    expect(expandKeyVariants("received_in")).toEqual(["received_in", "receivedIn"]);
  });

  it("returns a single-element array for keys with no case variation", () => {
    expect(expandKeyVariants("amount")).toEqual(["amount"]);
    expect(expandKeyVariants("id")).toEqual(["id"]);
  });

  it("handles multi-segment snake_case", () => {
    expect(expandKeyVariants("some_long_name")).toEqual(["some_long_name", "someLongName"]);
  });
});

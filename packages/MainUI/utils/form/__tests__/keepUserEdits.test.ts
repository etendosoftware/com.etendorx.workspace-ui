import { isKeptUserEdit } from "../keepUserEdits";

const ORDER_REFERENCE = "orderReference";
const BUSINESS_PARTNER = "businessPartner";

describe("isKeptUserEdit", () => {
  it("keeps nothing when the user's edits are not kept", () => {
    expect(isKeptUserEdit(ORDER_REFERENCE)).toBe(false);
  });

  it("keeps a field the user changed", () => {
    expect(isKeptUserEdit(ORDER_REFERENCE, { [ORDER_REFERENCE]: true })).toBe(true);
  });

  it("refreshes a field the user did not change", () => {
    expect(isKeptUserEdit("grandTotalAmount", { [ORDER_REFERENCE]: true })).toBe(false);
  });

  it("keeps the derived keys of a changed field", () => {
    const dirtyFields = { [BUSINESS_PARTNER]: true };
    expect(isKeptUserEdit(`${BUSINESS_PARTNER}$_identifier`, dirtyFields)).toBe(true);
    expect(isKeptUserEdit(`${BUSINESS_PARTNER}$_entries`, dirtyFields)).toBe(true);
  });
});

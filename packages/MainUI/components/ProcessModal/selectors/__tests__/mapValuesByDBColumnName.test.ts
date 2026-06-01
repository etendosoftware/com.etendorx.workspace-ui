import { mapValuesByDBColumnName } from "../ProcessParameterSelector";

const buildParam = (name: string, dBColumnName: string | undefined) =>
  ({ id: `p-${dBColumnName ?? name}`, name, dBColumnName }) as any;

describe("mapValuesByDBColumnName", () => {
  it("remaps display-name keys to dBColumnName keys", () => {
    const parameters = {
      ad_org_id: buildParam("Invoice Organization", "ad_org_id"),
      payment_method: buildParam("Payment Method", "payment_method"),
      received_in: buildParam("Received In", "received_in"),
    };
    const values = {
      "Invoice Organization": "ORG_UUID",
      "Payment Method": "PM_UUID",
      "Received In": true,
    };

    expect(mapValuesByDBColumnName(values, parameters)).toEqual({
      ad_org_id: "ORG_UUID",
      payment_method: "PM_UUID",
      received_in: true,
    });
  });

  it("drops auxiliary RHF sub-keys (e.g. `_data`, `$_identifier`)", () => {
    const parameters = {
      payment_method: buildParam("Payment Method", "payment_method"),
    };
    const values = {
      "Payment Method": "PM_UUID",
      "Payment Method_data": { id: "PM_UUID", _identifier: "Cheque" },
      "Payment Method$_identifier": "Cheque",
    };

    expect(mapValuesByDBColumnName(values, parameters)).toEqual({
      payment_method: "PM_UUID",
    });
  });

  it("preserves falsy primitives (false, 0, empty string)", () => {
    const parameters = {
      paid_out: buildParam("Paid Out", "paid_out"),
      date_from: buildParam("Date From", "date_from"),
      count: buildParam("Count", "count"),
    };
    const values = {
      "Paid Out": false,
      "Date From": "",
      Count: 0,
    };

    expect(mapValuesByDBColumnName(values, parameters)).toEqual({
      paid_out: false,
      date_from: "",
      count: 0,
    });
  });

  it("skips parameters whose value is undefined in the form snapshot", () => {
    const parameters = {
      payment_method: buildParam("Payment Method", "payment_method"),
      financial_account: buildParam("Financial Account", "financial_account"),
    };
    const values = { "Payment Method": "PM_UUID" };

    const result = mapValuesByDBColumnName(values, parameters);
    expect(result).toEqual({ payment_method: "PM_UUID" });
    expect(result).not.toHaveProperty("financial_account");
  });

  it("skips parameters with no dBColumnName (defensive)", () => {
    const parameters = {
      ghost: buildParam("Ghost Param", undefined),
      payment_method: buildParam("Payment Method", "payment_method"),
    };
    const values = { "Ghost Param": "should-drop", "Payment Method": "PM" };

    expect(mapValuesByDBColumnName(values, parameters)).toEqual({
      payment_method: "PM",
    });
  });

  it("returns an empty object when parameters is undefined", () => {
    expect(mapValuesByDBColumnName({ a: 1 }, undefined)).toEqual({});
  });

  it("returns an empty object when parameters is empty", () => {
    expect(mapValuesByDBColumnName({ a: 1 }, {})).toEqual({});
  });
});

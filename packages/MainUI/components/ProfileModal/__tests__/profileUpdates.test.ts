import { computeProfileUpdates } from "../profileUpdates";

const opt = (id: string) => ({ title: id, value: id, id });

describe("computeProfileUpdates", () => {
  const currentRole = { id: "roleA", name: "Role A" } as never;
  const currentOrganization = { id: "orgSur", name: "Sur" } as never;
  const currentWarehouse = { id: "whSur", name: "WH Sur" } as never;

  it("returns an empty payload when nothing changed", () => {
    const params = computeProfileUpdates({
      selectedRole: opt("roleA"),
      selectedOrg: opt("orgSur"),
      selectedWarehouse: opt("whSur"),
      currentRole,
      currentOrganization,
      currentWarehouse,
    });

    expect(params).toEqual({});
  });

  it("sends role AND the displayed organization+warehouse on a role switch (Classic parity)", () => {
    // The user switched to roleB; the modal auto-filled roleB's first org/warehouse
    // for display. The payload MUST carry those explicit values, otherwise the
    // backend /sws/login backfills org/warehouse from the previous token and
    // silently keeps the stale Sur values.
    const params = computeProfileUpdates({
      selectedRole: opt("roleB"),
      selectedOrg: opt("orgNorte"),
      selectedWarehouse: opt("whNorte"),
      currentRole,
      currentOrganization,
      currentWarehouse,
    });

    expect(params).toEqual({
      role: "roleB",
      organization: "orgNorte",
      warehouse: "whNorte",
    });
  });

  it("includes the organization when only the org changed", () => {
    const params = computeProfileUpdates({
      selectedRole: opt("roleA"),
      selectedOrg: opt("orgNorte"),
      selectedWarehouse: opt("whNorte"),
      currentRole,
      currentOrganization,
      currentWarehouse,
    });

    expect(params.organization).toBe("orgNorte");
    expect(params.warehouse).toBe("whNorte");
  });

  it("omits the warehouse when none is selected", () => {
    const params = computeProfileUpdates({
      selectedRole: opt("roleB"),
      selectedOrg: opt("orgNorte"),
      selectedWarehouse: null,
      currentRole,
      currentOrganization,
      currentWarehouse,
    });

    expect(params).toEqual({ role: "roleB", organization: "orgNorte" });
    expect(params).not.toHaveProperty("warehouse");
  });
});

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { findMissingMandatoryParameters } from "../findMissingMandatoryParameters";

const ENTITY_NAME = "Entidad";
const ENTITY_COLUMN = "AD_Client_ID";
const ORG_NAME = "Organización";
const ORG_COLUMN = "AD_Org_ID";

const makeParam = (name: string, mandatory: boolean, dBColumnName: string): ProcessParameter =>
  ({ name, mandatory, dBColumnName }) as unknown as ProcessParameter;

const entityParam = makeParam(ENTITY_NAME, true, ENTITY_COLUMN);
const orgParam = makeParam(ORG_NAME, true, ORG_COLUMN);

describe("findMissingMandatoryParameters", () => {
  it("returns a mandatory parameter with no value", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, {});
    expect(missing).toEqual([entityParam]);
  });

  it("does not return a mandatory parameter that has a value (by name)", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, { [ENTITY_NAME]: "client-1" });
    expect(missing).toEqual([]);
  });

  it("reads the value from dBColumnName when not present under name", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, { [ENTITY_COLUMN]: "client-1" });
    expect(missing).toEqual([]);
  });

  it("ignores non-mandatory parameters even when empty", () => {
    const optional = makeParam("Optional", false, "Optional_ID");
    const params = { Optional: optional };
    const missing = findMissingMandatoryParameters(params, {});
    expect(missing).toEqual([]);
  });

  it("treats empty string and empty array as missing", () => {
    const params = { [ENTITY_NAME]: entityParam, [ORG_NAME]: orgParam };
    const missing = findMissingMandatoryParameters(params, { [ENTITY_NAME]: "", [ORG_NAME]: [] });
    expect(missing).toEqual([entityParam, orgParam]);
  });

  it("skips a mandatory parameter hidden by display logic keyed by dBColumnName", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, {}, { [`${ENTITY_COLUMN}.display`]: false });
    expect(missing).toEqual([]);
  });

  it("skips a mandatory parameter hidden by display logic keyed by name", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, {}, { [`${ENTITY_NAME}.display`]: false });
    expect(missing).toEqual([]);
  });

  it("still reports a displayed mandatory parameter (display logic true)", () => {
    const params = { [ENTITY_NAME]: entityParam };
    const missing = findMissingMandatoryParameters(params, {}, { [`${ENTITY_COLUMN}.display`]: true });
    expect(missing).toEqual([entityParam]);
  });

  it("returns only the empty mandatory parameters, in iteration order", () => {
    const params = { [ENTITY_NAME]: entityParam, [ORG_NAME]: orgParam };
    const missing = findMissingMandatoryParameters(params, { [ENTITY_NAME]: "client-1" });
    expect(missing).toEqual([orgParam]);
  });
});

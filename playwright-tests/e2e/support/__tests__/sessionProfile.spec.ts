import { expect, test } from "@playwright/test";
import { hasProfile, profileOfSession, SESSION_REQUEST } from "../sessionProfile";

const ROLE_NAME = "QA Testing Admin";
const ORGANIZATION_NAME = "Spain";
const WAREHOUSE_NAME = "Spain East warehouse";

const session = { role: ROLE_NAME, organization: ORGANIZATION_NAME, warehouse: WAREHOUSE_NAME };

test.describe("profileOfSession", () => {
  test("reads the names of the role, organization and warehouse", () => {
    const answer = {
      currentRole: { name: ROLE_NAME, _identifier: "ignored" },
      currentOrganization: { _identifier: ORGANIZATION_NAME },
      currentWarehouse: { name: WAREHOUSE_NAME },
    };
    expect(profileOfSession(answer)).toEqual(session);
  });

  test("leaves out what the answer does not have", () => {
    expect(profileOfSession({ currentRole: { name: ROLE_NAME }, currentWarehouse: null })).toEqual({
      role: ROLE_NAME,
      organization: undefined,
      warehouse: undefined,
    });
    expect(profileOfSession(null)).toEqual({ role: undefined, organization: undefined, warehouse: undefined });
  });
});

test.describe("hasProfile", () => {
  test("is true only with the same role and organization and a warehouse", () => {
    expect(hasProfile(session, ROLE_NAME, ORGANIZATION_NAME)).toBe(true);
    expect(hasProfile(session, "QA Testing Sales Admin", ORGANIZATION_NAME)).toBe(false);
    expect(hasProfile(session, ROLE_NAME, "USA")).toBe(false);
    expect(hasProfile({ ...session, warehouse: undefined }, ROLE_NAME, ORGANIZATION_NAME)).toBe(false);
    expect(hasProfile(undefined, ROLE_NAME, ORGANIZATION_NAME)).toBe(false);
  });
});

test("SESSION_REQUEST matches the session request only", () => {
  expect(SESSION_REQUEST.test("http://localhost:3000/api/erp/meta/session")).toBe(true);
  expect(SESSION_REQUEST.test("http://localhost:3000/api/erp/meta/session?language=en_US")).toBe(true);
  expect(SESSION_REQUEST.test("http://localhost:3000/api/erp/meta/sessions")).toBe(false);
});

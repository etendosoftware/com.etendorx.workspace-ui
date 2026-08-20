import {
  buildAuthState,
  buildAuthUrl,
  buildPopupFeatures,
  flattenScopeChoices,
  groupChoicesByProvider,
} from "../middlewareTokenUtils";
import type { MiddlewareProvider } from "../types";

/** The catalogue the middleware actually publishes, trimmed to the fields the dialog reads. */
const CATALOGUE: Record<string, MiddlewareProvider> = {
  google: {
    name: "google",
    scopes: [
      {
        name: "Google Drive - Edit Access Level",
        scope: "https://www.googleapis.com/auth/drive.file",
        description: "Allows you to upload and manage files in your Google Drive.",
      },
      {
        name: "Google Drive - Read Only Access Level",
        scope: "https://www.googleapis.com/auth/drive.readonly",
        description: "Allows read-only access to your Google Drive files and folders.",
      },
    ],
  },
};

describe("flattenScopeChoices", () => {
  it("produces one choice per scope, with the provider label capitalized as classic does", () => {
    const choices = flattenScopeChoices(CATALOGUE);

    expect(choices).toHaveLength(2);
    expect(choices[0]).toEqual({
      providerId: "google",
      providerLabel: "Google",
      scope: "https://www.googleapis.com/auth/drive.file",
      label: "Google Drive - Edit Access Level",
      description: "Allows you to upload and manage files in your Google Drive.",
    });
  });

  it("drops scopes with no scope value, which the middleware would reject anyway", () => {
    const choices = flattenScopeChoices({
      google: { name: "google", scopes: [{ name: "Broken" }, { name: "Fine", scope: "a/b" }] },
    });

    expect(choices.map((c) => c.label)).toEqual(["Fine"]);
  });

  it("falls back to the scope URL when the middleware sends no name", () => {
    const choices = flattenScopeChoices({ google: { scopes: [{ scope: "a/b" }] } });

    expect(choices[0].label).toBe("a/b");
  });

  it("tolerates an empty or malformed catalogue rather than throwing", () => {
    expect(flattenScopeChoices({})).toEqual([]);
    expect(flattenScopeChoices({ google: {} })).toEqual([]);
  });
});

describe("groupChoicesByProvider", () => {
  it("groups scopes under one card per provider, preserving order", () => {
    const groups = groupChoicesByProvider(flattenScopeChoices(CATALOGUE));

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Google");
    expect(groups[0].choices).toHaveLength(2);
  });

  it("keeps providers separate", () => {
    const groups = groupChoicesByProvider(
      flattenScopeChoices({
        google: { scopes: [{ scope: "a" }] },
        microsoft: { scopes: [{ scope: "b" }] },
      })
    );

    expect(groups.map((g) => g.label)).toEqual(["Google", "Microsoft"]);
  });
});

describe("buildPopupFeatures", () => {
  it("centres a half-screen popup, rounding like the classic handler", () => {
    expect(buildPopupFeatures({ width: 1920, height: 1080 })).toBe("width=960,height=540,left=480,top=270");
  });

  it("rounds odd dimensions instead of emitting fractional pixels", () => {
    expect(buildPopupFeatures({ width: 1365, height: 767 })).toBe("width=683,height=384,left=341,top=192");
  });
});

describe("buildAuthState", () => {
  it("encodes a fresh uuid and the user id, and carries no provider id", () => {
    const decoded = JSON.parse(atob(buildAuthState("100")));

    expect(decoded.userId).toBe("100");
    expect(typeof decoded.state).toBe("string");
    // Unlike ETRXGetToken, the middleware flow deliberately omits etrxOauthProviderId.
    expect(decoded).not.toHaveProperty("etrxOauthProviderId");
  });

  it("produces a different state on every call", () => {
    expect(buildAuthState("100")).not.toBe(buildAuthState("100"));
  });
});

describe("buildAuthUrl", () => {
  const params = {
    startEndpoint: "https://sso.etendo.cloud/oauth-integrations/start",
    providerId: "google",
    accountId: "c45c4946-714a-4e2d-8e30-5944fe2e3533",
    scope: "https://www.googleapis.com/auth/drive.file",
    redirectUri: "http://localhost:8080/etendo/saveTokenMiddleware",
    state: "ZW5jb2RlZA==",
  };

  it("sends every parameter the middleware expects, url-encoded", () => {
    const url = new URL(buildAuthUrl(params));

    expect(url.origin + url.pathname).toBe("https://sso.etendo.cloud/oauth-integrations/start");
    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("account_id")).toBe(params.accountId);
    expect(url.searchParams.get("scope")).toBe(params.scope);
    expect(url.searchParams.get("redirect_uri")).toBe(params.redirectUri);
    expect(url.searchParams.get("state")).toBe(params.state);
  });

  it("lowercases the provider, matching classic's name.toLowerCase() round trip", () => {
    const url = new URL(buildAuthUrl({ ...params, providerId: "Google" }));

    expect(url.searchParams.get("provider")).toBe("google");
  });
});
